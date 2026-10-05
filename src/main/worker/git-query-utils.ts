const encoder = new TextEncoder();

function utf8ByteLength(value: string): number {
  return encoder.encode(value).byteLength;
}

function matchesGitQuery(queryKey: unknown, host?: { id: string } | null): boolean {
  return Array.isArray(queryKey) && queryKey[0] === `git` && (host == null || queryKey[1] === hostId(host));
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
import { hasFsmonitorDaemonFeature } from "./git-fsmonitor-feature-policy";
import { fsmonitorCacheKey, gitQueryKey, hostId } from "./git-query-key-policy";
