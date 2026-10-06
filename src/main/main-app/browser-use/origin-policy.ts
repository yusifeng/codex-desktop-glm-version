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

if (typeof module !== "undefined") module.exports = { normalizeBrowserUseOrigin, dedupeBrowserUseStrings, oppositeBrowserUseRuleKind, browserUseConfigPath, isBrowserUsePlainObject };
import { join } from "node:path";
