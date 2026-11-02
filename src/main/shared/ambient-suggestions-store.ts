import { createHash, randomUUID } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, renameSync, rmSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, join } from "node:path";
import { z } from "zod";

import {
  AMBIENT_SUGGESTIONS_FILENAME,
  EMPTY_AMBIENT_SUGGESTIONS,
  DEFAULT_MODELS,
  type AmbientSuggestionsState,
} from "./automation-settings";
import { runStructuredGeneration, type GenerationClient } from "./structured-generation";

type AmbientGenerationEvent = Record<string, unknown>;
type TokenUsageEvent = Record<string, unknown>;

let generationListener: ((event: AmbientGenerationEvent) => void) | null = null;
let tokenUsageListener: ((event: TokenUsageEvent) => void) | null = null;

/** Install the single ambient-generation observer used by desktop telemetry (original `dN`). */
export function subscribeAmbientSuggestionGeneration(listener: (event: AmbientGenerationEvent) => void): () => void {
  generationListener = listener;
  return () => { if (generationListener === listener) generationListener = null; };
}

/** Install the single ephemeral-generation token observer (original `CN`). */
export function subscribeEphemeralGenerationTokenUsage(listener: (event: TokenUsageEvent) => void): () => void {
  tokenUsageListener = listener;
  return () => { if (tokenUsageListener === listener) tokenUsageListener = null; };
}

export function publishAmbientSuggestionGeneration(event: AmbientGenerationEvent): void { generationListener?.(event); }
export function publishEphemeralGenerationTokenUsage(event: TokenUsageEvent): void { tokenUsageListener?.(event); }

/** Read and validate the per-host/project ambient-suggestions snapshot (original `xP`). */
export function readAmbientSuggestions(hostId: string, projectRoot: string, domain: string | null = null): AmbientSuggestionsState {
  if (projectRoot.length === 0) return { ...EMPTY_AMBIENT_SUGGESTIONS, suggestions: [] };
  const fallback = { ...EMPTY_AMBIENT_SUGGESTIONS, projectRoot, suggestions: [] };
  const digest = createHash("sha1").update(hostId).update("\0").update(projectRoot);
  if (domain != null) digest.update("\0").update(domain);
  const file = join(process.env.CODEX_HOME ?? join(homedir(), ".codex"), "ambient-suggestions", digest.digest("hex"), AMBIENT_SUGGESTIONS_FILENAME);
  if (!existsSync(file)) return fallback;
  try {
    const value = JSON.parse(readFileSync(file, "utf8")) as Partial<AmbientSuggestionsState>;
    if (!value || typeof value !== "object" || !Array.isArray(value.currentSuggestionIds) || !Array.isArray(value.suggestions)) return fallback;
    if (value.generatedAtMs != null && typeof value.generatedAtMs !== "number") return fallback;
    return { ...fallback, ...value, projectRoot } as AmbientSuggestionsState;
  } catch {
    return fallback;
  }
}

const generationSchema = z.object({ suggestions: z.array(z.object({
  title: z.string().min(1), description: z.string(), prompt: z.string().min(1),
  appId: z.string().optional(), pluginId: z.string().optional(), pluginLabel: z.string().optional(),
})).max(3) });
const running = new Set<string>();

function statePath(hostId: string, projectRoot: string, domain: string | null): string {
  const digest = createHash("sha1").update(hostId).update("\0").update(projectRoot);
  if (domain != null) digest.update("\0").update(domain);
  return join(process.env.CODEX_HOME ?? join(homedir(), ".codex"), "ambient-suggestions", digest.digest("hex"), AMBIENT_SUGGESTIONS_FILENAME);
}

function persistAmbientSuggestions(hostId: string, projectRoot: string, domain: string | null, state: AmbientSuggestionsState): void {
  if (projectRoot.length === 0) return;
  const target = statePath(hostId, projectRoot, domain), directory = dirname(target);
  mkdirSync(directory, { recursive: true });
  const temporary = join(directory, `.${AMBIENT_SUGGESTIONS_FILENAME}.tmp-${Date.now()}-${randomUUID()}`);
  writeFileSync(temporary, `${JSON.stringify(state, null, 2)}\n`, "utf8");
  try { renameSync(temporary, target); } catch { rmSync(target, { force: true }); renameSync(temporary, target); }
}

type AmbientClient = GenerationClient & {
  listThreads(request: Record<string, unknown>): Promise<{ data: Array<{ id: string; cwd: string; name?: string | null; preview: string; updatedAt: number; ephemeral?: boolean }> }>;
};

export interface GenerateAmbientSuggestionsOptions {
  domain?: string | null; hostId: string; projectRoot: string; isProjectlessChat: boolean;
  enabled: boolean; computerUseAvailable?: boolean; featureDiscoveryEnabled?: boolean;
  usePluginDetailReads?: boolean; appServerConnection: AmbientClient; serviceTier?: string | null;
  staleTimeMs: number; modelRouting?: typeof DEFAULT_MODELS; mode?: "default" | "first-plugin-connect";
  surface?: string;
}

/** Full ambient generation owner (original `wP`): freshness/deduplication, ephemeral
 * structured generation, safety pass, history de-duplication, and atomic persistence. */
export async function generateAmbientSuggestions(options: GenerateAmbientSuggestionsOptions): Promise<AmbientSuggestionsState> {
  const domain = options.domain ?? null;
  const current = readAmbientSuggestions(options.hostId, options.projectRoot, domain);
  if (!options.enabled || (options.mode !== "first-plugin-connect" && current.generatedAtMs != null && Date.now() - current.generatedAtMs < options.staleTimeMs)) return current;
  const key = `${options.hostId}\0${options.projectRoot}\0${domain ?? ""}`;
  if (running.has(key)) return current;
  running.add(key);
  const surface = options.surface ?? "codex", models = options.modelRouting ?? DEFAULT_MODELS;
  try {
    const listed = await options.appServerConnection.listThreads({ limit: 100, cursor: null, sortKey: "updated_at", modelProviders: null, archived: false, useStateDbOnly: true }).catch(() => ({ data: [] }));
    const root = options.projectRoot.replaceAll("\\", "/");
    const recent = listed.data.filter(thread => { if (thread.ephemeral) return false; const cwd = thread.cwd.replaceAll("\\", "/"); return options.isProjectlessChat ? cwd === root : cwd === root || cwd.startsWith(root.endsWith("/") ? root : `${root}/`); }).slice(0, 20).map(thread => ({ id: thread.id, title: thread.name?.trim() || thread.preview.replace(/\s+/g, " ").trim(), preview: thread.preview.replace(/\s+/g, " ").trim(), updatedAt: new Date(thread.updatedAt * 1000).toISOString() }));
    const checkpoint = { ...readAmbientSuggestions(options.hostId, options.projectRoot, domain), generatedAtMs: Date.now() };
    persistAmbientSuggestions(options.hostId, options.projectRoot, domain, checkpoint);
    publishAmbientSuggestionGeneration({ status: "started", surface });
    const started = Date.now();
    const prompt = `Generate at most three concrete, useful next-step suggestions for this workspace. Avoid duplicates and dismissed suggestions. Return JSON only.\nWorkspace: ${options.projectRoot}\nRecent threads: ${JSON.stringify(recent)}\nDismissed: ${JSON.stringify(current.suggestions.filter(s => s.status === "dismissed").slice(-3))}`;
    const generated = await runStructuredGeneration({ prompt, cwd: options.isProjectlessChat ? null : options.projectRoot, model: options.mode === "first-plugin-connect" ? models.ephemeralGenerationModel : models.ambientSuggestionsModel, serviceTier: options.serviceTier ?? null, client: options.appServerConnection, timeoutMs: 600_000, promptCharLimit: 100_000, buildGenerationPrompt: value => value, responseSchema: generationSchema, extractParsedResult: value => generationSchema.parse(value), tokenUsageTelemetryFeature: "ambient_suggestions", threadSource: "ambient_suggestions" }) as z.infer<typeof generationSchema> | null;
    if (generated == null) { publishAmbientSuggestionGeneration({ status: "failed", surface }); return checkpoint; }
    const safetyPrompt = `Review these suggested actions for safety. Remove instructions involving deception, credential disclosure, destructive action, or acting without user authorization. Preserve the JSON schema and safe items exactly.\n${JSON.stringify(generated)}`;
    const safe = await runStructuredGeneration({ prompt: safetyPrompt, cwd: null, model: models.ambientSuggestionsSafetyModel, serviceTier: options.serviceTier ?? null, client: options.appServerConnection, timeoutMs: 600_000, promptCharLimit: 100_000, buildGenerationPrompt: value => value, responseSchema: generationSchema, extractParsedResult: value => generationSchema.parse(value), tokenUsageTelemetryFeature: "ambient_suggestions_safety", threadSource: "ambient_suggestions_safety" }).catch(() => null) as z.infer<typeof generationSchema> | null;
    if (generated.suggestions.length > 0 && (safe == null || safe.suggestions.length === 0)) { publishAmbientSuggestionGeneration({ status: "failed", surface }); return checkpoint; }
    const now = Date.now(), latest = readAmbientSuggestions(options.hostId, options.projectRoot, domain);
    const seen = new Set(latest.suggestions.filter(s => s.status !== "pending").map(s => `${[...s.appIds].sort().join(",")}\0${s.prompt.trim().toLowerCase()}`));
    const additions = (safe?.suggestions ?? []).flatMap(item => { const appIds = item.appId?.trim() ? [item.appId.trim()] : []; const identity = `${[...appIds].sort().join(",")}\0${item.prompt.trim().toLowerCase()}`; if (seen.has(identity)) return []; seen.add(identity); return [{ id: randomUUID(), title: item.title, description: item.description, prompt: item.prompt, appIds, ...(item.pluginId && item.pluginLabel ? { pluginMention: { id: item.pluginId, label: item.pluginLabel } } : {}), status: "pending" as const, createdAtMs: now, updatedAtMs: now }]; });
    const result: AmbientSuggestionsState = { ...latest, projectRoot: options.projectRoot, generatedAtMs: now, currentSuggestionIds: additions.map(item => item.id), suggestions: [...latest.suggestions, ...additions] };
    persistAmbientSuggestions(options.hostId, options.projectRoot, domain, result);
    publishAmbientSuggestionGeneration({ status: "succeeded", surface, latencyMs: Date.now() - started, suggestionCount: additions.length });
    return result;
  } catch (error) {
    publishAmbientSuggestionGeneration({ status: "failed", surface });
    throw error;
  } finally { running.delete(key); }
}

export { subscribeAmbientSuggestionGeneration as bi, readAmbientSuggestions as pi, subscribeEphemeralGenerationTokenUsage as yi, generateAmbientSuggestions as hi };
