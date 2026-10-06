/** Pure browser-use origin normalization; config/state I/O remains in origin-state.ts. */
export function normalizeBrowserUseOrigin(value: string): string | null {
  const trimmed = value.trim();
  if (trimmed.length === 0) return null;
  const withProtocol = /^[a-zA-Z][a-zA-Z\d+.-]*:\/\//.test(trimmed) ? trimmed : `https://${trimmed}`;
  try {
    const url = new URL(withProtocol);
    return url.protocol !== "http:" && url.protocol !== "https:" ? null : url.origin;
  } catch {
    return null;
  }
}

export function dedupeBrowserUseStrings(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  const seen = new Set<string>();
  const result: string[] = [];
  for (const entry of value) {
    if (typeof entry !== "string") continue;
    const trimmed = entry.trim();
    if (trimmed === "" || seen.has(trimmed)) continue;
    seen.add(trimmed);
    result.push(trimmed);
  }
  return result;
}

export function oppositeBrowserUseRuleKind(kind: string): string {
  return kind === "allowed" ? "denied" : "allowed";
}

export function browserUseConfigPath(home: string, filename = "config.toml"): string {
  return join(home, filename);
}

export function isBrowserUsePlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function browserUseApprovalMode(value: unknown): "neverAsk" | "alwaysAsk" {
  return value === "never_ask" ? "neverAsk" : "alwaysAsk";
}

export function browserUseHistoryApprovalMode(value: unknown): "disabled" | "neverAsk" | "alwaysAsk" {
  return value === "disabled" ? "disabled" : browserUseApprovalMode(value);
}

export function browserUseApprovalModeToToml(value: string): "never_ask" | "always_ask" {
  return value === "neverAsk" ? "never_ask" : "always_ask";
}

export function browserUseHistoryApprovalModeToToml(value: string): "disabled" | "never_ask" | "always_ask" {
  return value === "disabled" ? "disabled" : browserUseApprovalModeToToml(value);
}

export function browserUseKindSet(section: unknown, kind: string): string[] {
  return isBrowserUsePlainObject(section) ? dedupeBrowserUseStrings(section[kind]) : [];
}

export function browserUseHasRule(section: unknown, kind: string, origin: string): boolean {
  return browserUseKindSet(section, kind).includes(origin);
}

export function browserUseRuleDecision(section: unknown, origin: string): "allow" | "deny" | null {
  return browserUseHasRule(section, "denied", origin)
    ? "deny"
    : browserUseHasRule(section, "allowed", origin)
      ? "allow"
      : null;
}

export function resolveBrowserUseOriginForAdd(
  section: unknown,
  origin: string,
  normalize: (value: string) => string | null,
): string {
  if (browserUseHasRule(section, "allowed", origin) || browserUseHasRule(section, "denied", origin)) return origin;
  const normalized = normalize(origin);
  if (normalized == null) throw new Error("Invalid Browser Use origin");
  return normalized;
}

export function browserUseResourceSectionKey(resource: "origin" | "download" | "upload" | "fullCdp"): string {
  return resource === "origin" ? "origins" : resource === "download" ? "downloads" : resource === "upload" ? "uploads" : "full_cdp";
}

export function browserUseTransferApprovalKey(resource: "download" | "upload"): string {
  return resource === "download" ? "download_approval_mode" : "upload_approval_mode";
}

export function browserUseGlobalPersistentApprovalAllowed(requirements: unknown): boolean {
  return (requirements as { allowGlobalPersistentApproval?: boolean } | undefined)?.allowGlobalPersistentApproval !== false;
}

if (typeof module !== "undefined") module.exports = { normalizeBrowserUseOrigin, dedupeBrowserUseStrings, oppositeBrowserUseRuleKind, browserUseConfigPath, isBrowserUsePlainObject, browserUseApprovalMode, browserUseHistoryApprovalMode, browserUseApprovalModeToToml, browserUseHistoryApprovalModeToToml, browserUseKindSet, browserUseHasRule, browserUseRuleDecision, resolveBrowserUseOriginForAdd, browserUseResourceSectionKey, browserUseTransferApprovalKey, browserUseGlobalPersistentApprovalAllowed };
import { join } from "node:path";
