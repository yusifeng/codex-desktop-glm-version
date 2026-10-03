import { readFile, mkdir, writeFile, rm, readdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import { createHash } from "node:crypto";
import { EventEmitter } from "node:events";

export const SSH_WEBSOCKET_TRANSPORT_KEY = "ssh_websocket_v0";
export function hostConfigWithSshKey(config: Record<string, unknown>): Record<string, unknown> { return { ...config, [SSH_WEBSOCKET_TRANSPORT_KEY]: config[SSH_WEBSOCKET_TRANSPORT_KEY] ?? null }; }
export async function resolveAuthPrincipal(value: unknown, cancelled: (onCancel: () => void) => (() => void)): Promise<Record<string, unknown> | null> {
  let cancelledFlag = false; const dispose = cancelled(() => { cancelledFlag = true; });
  try { if (cancelledFlag || value == null || typeof value !== "object") return null; const auth = value as Record<string, unknown>; return auth.authToken ? { kind: "chatgpt", accountId: auth.accountId, userId: auth.userId } : { kind: "execution-storage", authMode: auth.authMethod ?? "none" }; } finally { dispose(); }
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

export { installChromePluginRuntime as $t, chromeNativeHostsV2Path as Gt, reconcileChromeNativeHost as Jt, getChromeNativeHostName as Kt, installChromeNativeHostManifest as Qt, pointLatestCacheAtVersion as Yt, uninstallChromePluginRuntime as Xt, uninstallChromePluginRuntime as Zt, SSH_WEBSOCKET_TRANSPORT_KEY as cn, resolveAuthPrincipal as in, readExtensionIds as on, chromeHostsConfigPath as qt, readProcessTable as rn, WebSocketConnectionBase as Ut };
