const encoder = new TextEncoder();

function hostId(host: { id: string }): string {
  return host.id;
}

function gitQueryKey(root: string, host: { id: string }, operation: string, ...parts: string[]): string[] {
  return [`git`, hostId(host), root, operation, ...parts];
}

function utf8ByteLength(value: string): number {
  return encoder.encode(value).byteLength;
}

function matchesGitQuery(queryKey: unknown, host?: { id: string } | null): boolean {
  return Array.isArray(queryKey) && queryKey[0] === `git` && (host == null || queryKey[1] === hostId(host));
}

function fsmonitorCacheKey(cwd: string, host: { id: string }, env: Record<string, string>): string {
  return JSON.stringify([host.id, cwd, Object.entries(env).filter(([key]) => key !== `GIT_INDEX_FILE`).sort(([a], [b]) => a.localeCompare(b))]);
}

function hasFsmonitorDaemonFeature(output: string): boolean {
  return output.split(`\n`).some((line) => line.trim() === `feature: fsmonitor--daemon`);
}

function shouldCheckGitAvailability(method: string, isLocal: boolean, isMutation: boolean): boolean {
  return isLocal && !isMutation && isCancelableGitRequest(method);
}

export { fsmonitorCacheKey, gitQueryKey, hasFsmonitorDaemonFeature, hostId, isCacheableGitCommand, isCancelableGitRequest, isFsmonitorPlatformSupported, isGitRequestTracked, matchesGitQuery, normalizeGitPath, parseFsmonitorConfigValue, pathsOverlap, shouldCheckGitAvailability, utf8ByteLength };
if (typeof module !== `undefined`) module.exports = { fsmonitorCacheKey, gitQueryKey, hasFsmonitorDaemonFeature, hostId, isCacheableGitCommand, isCancelableGitRequest, isFsmonitorPlatformSupported, isGitRequestTracked, matchesGitQuery, normalizeGitPath, parseFsmonitorConfigValue, pathsOverlap, shouldCheckGitAvailability, utf8ByteLength };
import { isCancelableGitRequest, isGitRequestTracked } from "./git-request-classification-policy";
import { isFsmonitorPlatformSupported, parseFsmonitorConfigValue } from "./git-fsmonitor-policy";
import { isCacheableGitCommand } from "./git-cache-command-policy";
import { normalizeGitPath, pathsOverlap } from "./git-path-overlap-policy";
