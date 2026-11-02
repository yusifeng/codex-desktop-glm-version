import { execFile } from "node:child_process";
import { readFile, mkdir, writeFile, rm, readdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import { createHash } from "node:crypto";
import { EventEmitter } from "node:events";
import { promisify } from "node:util";

import { principalOfToken } from "./sql-git-registry";
import { sanitizedProcessEnv } from "./wsl-paths";

export const SSH_WEBSOCKET_TRANSPORT_KEY = "ssh_websocket_v0";
export function hostConfigWithSshKey(config: Record<string, unknown>): Record<string, unknown> { return { ...config, [SSH_WEBSOCKET_TRANSPORT_KEY]: config[SSH_WEBSOCKET_TRANSPORT_KEY] ?? null }; }
export function hostConfigKey(config: Record<string, any>, localWebsocketUrl = config.kind === "local" ? (config.websocket_url ?? null) : null): string {
  let identity: unknown[];
  switch (config.kind) {
    case "local": identity = [config.kind, config.id, localWebsocketUrl]; break;
    case "ssh": identity = [config.kind, config.id, config[SSH_WEBSOCKET_TRANSPORT_KEY]]; break;
    case "wsl": identity = [config.kind, config.id, config.distro]; break;
    case "remote-control": identity = [config.kind, config.id, config.env_id]; break;
    default: identity = [config.kind, config.id];
  }
  return `${config.id}:${createHash("sha256").update(JSON.stringify(identity)).digest("hex")}`;
}

export async function resolveAuthPrincipal(
  read: () => Promise<Record<string, any> | null>,
  subscribe: (onCancel: () => void) => (() => void),
): Promise<Record<string, unknown> | null> {
  let cancelled = false;
  const dispose = subscribe(() => { cancelled = true; });
  try {
    const auth = await read();
    if (cancelled || auth == null) return null;
    if (auth.authMethod === "chatgpt" || auth.authMethod === "chatgptAuthTokens") {
      const principal = principalOfToken(auth.authToken);
      return principal == null ? null : { kind: "chatgpt", accountId: principal.accountId, userId: principal.userId };
    }
    return auth.authMethod == null && auth.requiresOpenaiAuth !== false
      ? null
      : { kind: "execution-storage", authMode: auth.authMethod ?? "none" };
  } finally {
    dispose();
  }
}

export function unique<Value>(values: readonly Value[]): Value[] {
  return [...new Set(values)];
}

export function uniqueBy<Value, Key>(values: readonly Value[], iteratee: (value: Value) => Key): Value[] {
  const seen = new Set<Key>();
  const result: Value[] = [];
  for (const value of values) {
    const key = iteratee(value);
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(value);
  }
  return result;
}

export function chunk<Value>(values: readonly Value[], size = 1): Value[][] {
  const width = Math.max(1, Math.trunc(size) || 1);
  const result: Value[][] = [];
  for (let index = 0; index < values.length; index += width) result.push(values.slice(index, index + width));
  return result;
}

async function readStreamBytes(stream: BodyInit | ReadableStream<Uint8Array>): Promise<Uint8Array> {
  return new Uint8Array(await new Response(stream).arrayBuffer());
}

function decodeUtf8(value: Uint8Array): string {
  return new TextDecoder("utf-8", { ignoreBOM: true }).decode(value);
}

export async function readProcessResult(processHandle: {
  wait(): Promise<Record<string, unknown>>;
  stdout: ReadableStream<Uint8Array>;
  stderr: ReadableStream<Uint8Array>;
}): Promise<Record<string, unknown> & { stdout: string; stderr: string }> {
  const [result, stdout, stderr] = await Promise.all([
    processHandle.wait(), readStreamBytes(processHandle.stdout), readStreamBytes(processHandle.stderr),
  ]);
  return { ...result, stdout: decodeUtf8(stdout), stderr: decodeUtf8(stderr) };
}

export { readStreamBytes as readHostFile };

export interface ProcessListEntry {
  ageSeconds: number | null;
  command: string | null;
  cpuPercent: number | null;
  parentPid: number;
  pid: number;
  rssKb: number | null;
}

export interface DescendantProcessEntry extends ProcessListEntry {
  depth: number;
  rootChildPid: number;
  kind: "app_server" | "electron_renderer" | "electron_gpu" | "electron_network" | "electron_proxy" | "electron_utility" | "mcp" | "git" | "shell" | "other";
}

interface NativeProcessEntry {
  commandLine?: string | null;
  cpuTimeMs?: number | null;
  creationTimeMs?: number | null;
  executableName: string;
  executablePath?: string | null;
  parentPid: number;
  pid: number;
  rssBytes?: number | null;
}

interface ProcessListProvider {
  listProcesses(options?: { includeCommandLine?: boolean; rootPid?: number }): Promise<NativeProcessEntry[]> | NativeProcessEntry[];
}

const execFileAsync = promisify(execFile);
const PROCESS_TIMEOUT_MS = 2_000;
const PROCESS_MAX_BUFFER = 1024 * 1024;
const PROCESS_BATCH_SIZE = 200;
const CPU_SAMPLE_LIMIT = 4_096;
let processListProvider: ProcessListProvider | null = null;
const cpuSamples = new Map<number, { cpuTimeMs: number; creationTimeMs: number; observedAtMs: number }>();

export function registerProcessListProvider(provider: ProcessListProvider): void {
  processListProvider = provider;
  cpuSamples.clear();
}

function psExecutable(platform = process.platform): string {
  return platform === "darwin" ? "/bin/ps" : "ps";
}

function parseProcessParents(output: string): Array<{ pid: number; parentPid: number }> {
  const result: Array<{ pid: number; parentPid: number }> = [];
  for (const line of output.split("\n")) {
    const match = /^(\d+)\s+(\d+)$/.exec(line.trim());
    if (!match) continue;
    const pid = Number.parseInt(match[1], 10);
    const parentPid = Number.parseInt(match[2], 10);
    if (Number.isFinite(pid) && Number.isFinite(parentPid)) result.push({ pid, parentPid });
  }
  return result;
}

function parseProcessDetails(output: string): ProcessListEntry[] {
  const result: ProcessListEntry[] = [];
  for (const line of output.split("\n")) {
    const match = /^(\d+)\s+(\d+)\s+([\d.]+)\s+(\d+)\s+(\w{3}\s+\w{3}\s+\d{1,2}\s+\d{2}:\d{2}:\d{2}\s+\d{4})\s+(.+)$/.exec(line.trim());
    if (!match) continue;
    const pid = Number.parseInt(match[1], 10);
    const parentPid = Number.parseInt(match[2], 10);
    if (!Number.isFinite(pid) || !Number.isFinite(parentPid)) continue;
    const cpuPercent = Number.parseFloat(match[3]);
    const rssKb = Number.parseInt(match[4], 10);
    const createdAt = Date.parse(match[5]);
    result.push({
      ageSeconds: Number.isFinite(createdAt) ? Math.max(0, Math.floor((Date.now() - createdAt) / 1_000)) : null,
      command: match[6].trim(),
      cpuPercent: Number.isFinite(cpuPercent) ? Math.max(0, cpuPercent) : null,
      parentPid,
      pid,
      rssKb: Number.isFinite(rssKb) ? rssKb : null,
    });
  }
  return result;
}

function descendantPids(entries: Array<{ pid: number; parentPid: number }>, rootPid: number): Set<number> {
  const children = new Map<number, number[]>();
  for (const entry of entries) children.set(entry.parentPid, [...(children.get(entry.parentPid) ?? []), entry.pid]);
  const pending = [...(children.get(rootPid) ?? [])];
  const result = new Set<number>();
  for (let index = 0; index < pending.length; index += 1) {
    const pid = pending[index];
    if (pid == null || result.has(pid)) continue;
    result.add(pid);
    pending.push(...(children.get(pid) ?? []));
  }
  return result;
}

function projectDescendants(entries: ProcessListEntry[], rootPid: number): DescendantProcessEntry[] {
  const byPid = new Map(entries.map((entry) => [entry.pid, entry]));
  const children = new Map<number, number[]>();
  for (const entry of entries) children.set(entry.parentPid, [...(children.get(entry.parentPid) ?? []), entry.pid]);
  const pending = (children.get(rootPid) ?? []).map((pid) => ({ pid, depth: 1, rootChildPid: pid }));
  const visited = new Set<number>();
  const result: DescendantProcessEntry[] = [];
  for (let index = 0; index < pending.length; index += 1) {
    const current = pending[index];
    if (current == null || visited.has(current.pid)) continue;
    visited.add(current.pid);
    const entry = byPid.get(current.pid);
    if (entry) result.push({ ...entry, depth: current.depth, rootChildPid: current.rootChildPid, kind: classifyProcess(entry.command) });
    pending.push(...(children.get(current.pid) ?? []).map((pid) => ({ pid, depth: current.depth + 1, rootChildPid: current.rootChildPid })));
  }
  return result;
}

function sampleNativeCpu(entry: NativeProcessEntry, now: number): number | null {
  if (entry.cpuTimeMs == null || entry.creationTimeMs == null) return null;
  const previous = cpuSamples.get(entry.pid);
  if (previous == null && cpuSamples.size >= CPU_SAMPLE_LIMIT) {
    const oldest = cpuSamples.keys().next().value;
    if (oldest != null) cpuSamples.delete(oldest);
  }
  cpuSamples.set(entry.pid, { cpuTimeMs: entry.cpuTimeMs, creationTimeMs: entry.creationTimeMs, observedAtMs: now });
  return previous == null || previous.creationTimeMs !== entry.creationTimeMs || now <= previous.observedAtMs
    ? null
    : Math.max(0, ((entry.cpuTimeMs - previous.cpuTimeMs) / (now - previous.observedAtMs)) * 100);
}

function projectNativeProcesses(entries: NativeProcessEntry[], includeCommandLine: boolean): ProcessListEntry[] {
  const now = Date.now();
  return entries.map((entry) => ({
    ageSeconds: entry.creationTimeMs == null ? null : Math.max(0, Math.floor((now - entry.creationTimeMs) / 1_000)),
    command: includeCommandLine ? (entry.commandLine ?? entry.executablePath ?? entry.executableName) : entry.executableName,
    cpuPercent: sampleNativeCpu(entry, now),
    parentPid: entry.parentPid,
    pid: entry.pid,
    rssKb: entry.rssBytes == null ? null : Math.max(0, Math.floor(entry.rssBytes / 1_024)),
  }));
}

export async function listDescendantProcesses(rootPid: number): Promise<DescendantProcessEntry[]> {
  if (process.platform === "win32") {
    const entries = await processListProvider?.listProcesses({ includeCommandLine: true, rootPid });
    return projectDescendants(projectNativeProcesses(entries ?? [], true), rootPid);
  }
  const { stdout: parentOutput } = await execFileAsync(psExecutable(), ["-ax", "-o", "pid=,ppid="], {
    encoding: "utf8", env: sanitizedProcessEnv(process.env), timeout: PROCESS_TIMEOUT_MS, maxBuffer: PROCESS_MAX_BUFFER,
  });
  const pids = [...descendantPids(parseProcessParents(parentOutput), rootPid)].sort((left, right) => left - right);
  const details: ProcessListEntry[] = [];
  for (let index = 0; index < pids.length; index += PROCESS_BATCH_SIZE) {
    const batch = pids.slice(index, index + PROCESS_BATCH_SIZE);
    if (batch.length === 0) continue;
    const { stdout } = await execFileAsync(psExecutable(), ["-p", batch.join(","), "-o", "pid=,ppid=,%cpu=,rss=,lstart=,command="], {
      encoding: "utf8", env: { ...sanitizedProcessEnv(process.env), LC_ALL: "C" }, timeout: PROCESS_TIMEOUT_MS, maxBuffer: PROCESS_MAX_BUFFER,
    });
    details.push(...parseProcessDetails(stdout));
  }
  return projectDescendants(details, rootPid);
}

function classifyProcess(command: string | null): DescendantProcessEntry["kind"] {
  const value = command ?? "";
  if (/(?:^|[\\/'"-])codex(?:\.exe)?['"]?(?:\s+\S+)*\s+app-server(?:\s|$)/i.test(value)) return "app_server";
  if (/--type=renderer\b/i.test(value)) return "electron_renderer";
  if (/--type=gpu-process\b/i.test(value)) return "electron_gpu";
  if (/--utility-sub-type=network\.mojom\.NetworkService\b/i.test(value)) return "electron_network";
  if (/--utility-sub-type=proxy_resolver\.mojom\.ProxyResolverFactory\b/i.test(value)) return "electron_proxy";
  if (/--type=utility\b/i.test(value) || /\bElectron Helper\b/i.test(value)) return "electron_utility";
  if (/\bmcp(?:\b|[._/-])/i.test(value)) return "mcp";
  if (/\bgit\b/i.test(value)) return "git";
  if (/\b(?:bash|fish|sh|zsh|pwsh|powershell|cmd(?:\.exe)?)\b/i.test(value)) return "shell";
  return "other";
}

export function summarizeDescendantProcesses(entries: readonly DescendantProcessEntry[]) {
  const byKind = new Map<DescendantProcessEntry["kind"], { kind: DescendantProcessEntry["kind"]; count: number; cpuPercent: number; rssKb: number; directCount: number; directCpuPercent: number; directRssKb: number }>();
  let oldestAgeSeconds: number | null = null;
  let totalCpuPercent = 0;
  let totalRssKb = 0;
  let directCpuPercent = 0;
  let directRssKb = 0;
  for (const entry of entries) {
    const cpu = entry.cpuPercent ?? 0;
    const rss = entry.rssKb ?? 0;
    totalCpuPercent += cpu;
    totalRssKb += rss;
    if (entry.depth === 1) { directCpuPercent += cpu; directRssKb += rss; }
    if (entry.ageSeconds != null && (oldestAgeSeconds == null || entry.ageSeconds > oldestAgeSeconds)) oldestAgeSeconds = entry.ageSeconds;
    const bucket = byKind.get(entry.kind) ?? { kind: entry.kind, count: 0, cpuPercent: 0, rssKb: 0, directCount: 0, directCpuPercent: 0, directRssKb: 0 };
    bucket.count += 1; bucket.cpuPercent += cpu; bucket.rssKb += rss;
    if (entry.depth === 1) { bucket.directCount += 1; bucket.directCpuPercent += cpu; bucket.directRssKb += rss; }
    byKind.set(entry.kind, bucket);
  }
  return {
    totalCount: entries.length, totalCpuPercent, totalRssKb,
    directCount: entries.filter((entry) => entry.depth === 1).length, directCpuPercent, directRssKb, oldestAgeSeconds,
    byKind: [...byKind.values()].sort((left, right) => right.rssKb - left.rssKb || right.count - left.count || left.kind.localeCompare(right.kind)),
  };
}
export async function readExtensionIds(root: string): Promise<string[]> { const value = JSON.parse(await readFile(join(root, "scripts", "extension-ids.json"), "utf8")); return Array.isArray(value.extensionIds) && value.extensionIds.every((item) => typeof item === "string") ? value.extensionIds : []; }
export async function readProcessTable(): Promise<Array<{ pid: number; command: string }>> {
  const { execFile } = await import("node:child_process"); const { promisify } = await import("node:util");
  try { const { stdout } = await promisify(execFile)(process.platform === "darwin" ? "/bin/ps" : "ps", ["-ax", "-o", "pid=,comm="], { encoding: "utf8" }); return stdout.split(/\r?\n/).map((line) => { const match = line.trim().match(/^(\d+)\s+(.*)$/); return match ? { pid: Number(match[1]), command: match[2] } : null; }).filter((value): value is { pid: number; command: string } => value != null); } catch { return []; }
}
export function chromeNativeHostsV2Path(manifestPath: string): string[] { return [manifestPath, join(homedir(), ".config", "google-chrome", "NativeMessagingHosts")]; }
export function chromeNativeHostManifestPath(nativeHostName: string): string { return join(homedir(), ".config", "google-chrome", "NativeMessagingHosts", `${nativeHostName}.json`); }
export function chromeHostsConfigPath({ codexHome }: { codexHome: string }): string[] { return [join(codexHome, "browser", "chrome-hosts.json")]; }
export function getChromeNativeHostName(pluginName: string): string | null { return pluginName === "browser" ? "com.openai.codex.browser" : pluginName ? `com.openai.codex.${pluginName}` : null; }
export async function installChromeNativeHostManifest(options: { manifestPath: string; contents: string | Uint8Array }): Promise<void> { await mkdir(join(options.manifestPath, ".."), { recursive: true }); await writeFile(options.manifestPath, options.contents); }
export async function uninstallChromePluginRuntime(options: { root: string }): Promise<void> { await rm(options.root, { recursive: true, force: true }); }
export async function reconcileChromeNativeHost(options: { latestRoot: string; versionRoot: string; waitForVersionRoot?: boolean }): Promise<boolean> { if (options.waitForVersionRoot && !existsSync(options.versionRoot)) return false; await mkdir(join(options.latestRoot, ".."), { recursive: true }); await rm(options.latestRoot, { recursive: true, force: true }); await writeFile(join(options.latestRoot, ".version"), options.versionRoot); return true; }
export async function installChromePluginRuntime(options: { nativeHostName: string; [key: string]: unknown }): Promise<Record<string, unknown>> { return { nativeHostName: options.nativeHostName, installed: true, fingerprint: createHash("sha256").update(JSON.stringify(options)).digest("hex") }; }
export function chromePluginCachePath({ codexHome, marketplaceName, pluginName }: { codexHome: string; marketplaceName: string; pluginName: string }): string { return join(codexHome, "plugins", "cache", marketplaceName, pluginName); }
export function chromePluginNativeHostRoot({ codexHome }: { codexHome: string }): string { return join(codexHome, "plugins", "cache"); }
export function pointLatestCacheAtVersion(options: { latestRoot: string; versionRoot: string }): Promise<boolean> { return reconcileChromeNativeHost(options); }
export class WebSocketConnectionBase extends EventEmitter { readonly kind = "websocket"; supportsReconnect(): boolean { return true; } }
export function interruptResponse(action: string, meta: unknown = null, content: unknown = {}): Record<string, unknown> { return { type: "interrupt", action, meta, content }; }

export { installChromePluginRuntime as $t, uniqueBy as en, chromeNativeHostsV2Path as Gt, registerProcessListProvider as in, reconcileChromeNativeHost as Jt, getChromeNativeHostName as Kt, hostConfigKey as ln, installChromeNativeHostManifest as Qt, pointLatestCacheAtVersion as Yt, listDescendantProcesses as nn, readExtensionIds as on, resolveAuthPrincipal as sn, unique as tn, readStreamBytes as bc, readProcessResult as xc, chunk as xi, chromeHostsConfigPath as qt, readProcessTable as rn, WebSocketConnectionBase as Ut, summarizeDescendantProcesses as an, uninstallChromePluginRuntime as Xt, uninstallChromePluginRuntime as Zt, SSH_WEBSOCKET_TRANSPORT_KEY as cn };
