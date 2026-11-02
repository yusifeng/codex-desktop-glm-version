import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

import {
  AMBIENT_SUGGESTIONS_FILENAME,
  EMPTY_AMBIENT_SUGGESTIONS,
  type AmbientSuggestionsState,
} from "./automation-settings";

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

export { subscribeAmbientSuggestionGeneration as bi, readAmbientSuggestions as pi, subscribeEphemeralGenerationTokenUsage as yi };
