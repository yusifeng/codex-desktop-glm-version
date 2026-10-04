export type OriginPattern = {
  canonicalPattern: string;
  hostnamePattern: string;
  kind: "exact" | "subdomains-only" | "apex-and-subdomains";
};

function countCharacter(value: string, character: string): number {
  let count = 0;
  for (const current of value) if (current === character) count += 1;
  return count;
}

function lowercaseHostname(value: string): string {
  return value.replace(/[A-Z]/g, (character) => character.toLowerCase());
}

function isValidIpLiteral(value: string): boolean {
  if (/^\d{1,3}(?:\.\d{1,3}){3}$/u.test(value)) {
    return value.split(".").every((part) => Number(part) <= 255 && String(Number(part)) === part);
  }
  if (!value.includes(":")) return false;
  try {
    return new URL(`http://[${value}]/`).hostname.length > 0;
  } catch {
    return false;
  }
}

function normalizeHostname(value: string): string {
  const normalized = lowercaseHostname(value).replace(/\.+$/u, "");
  for (const marker of ["%25", "%"]) {
    const index = normalized.indexOf(marker);
    if (index === -1) continue;
    const prefix = normalized.slice(0, index);
    if (isValidIpLiteral(prefix)) return `${prefix}%${normalized.slice(index + marker.length)}`;
  }
  return normalized;
}

function normalizeHost(value: string): string {
  const trimmed = value.trim();
  if (trimmed.startsWith("[")) {
    const close = trimmed.indexOf("]");
    if (close !== -1) return normalizeHostname(trimmed.slice(1, close));
  }
  return countCharacter(trimmed, ":") === 1
    ? normalizeHostname(trimmed.split(":")[0] ?? "")
    : normalizeHostname(trimmed);
}

function normalizePattern(value: string): string {
  const trimmed = value.trim();
  if (trimmed === "*") return "*";
  if (trimmed.startsWith("**.")) return `**.${normalizeHost(trimmed.slice(3))}`;
  if (trimmed.startsWith("*.")) return `*.${normalizeHost(trimmed.slice(2))}`;
  return normalizeHost(trimmed);
}

export function parseOriginPattern(value: string): OriginPattern | null {
  const pattern = normalizePattern(value);
  if (/[\[\]{}\\]/u.test(pattern)) return null;
  if (pattern.startsWith("**.")) {
    return { canonicalPattern: pattern, hostnamePattern: pattern.slice(3), kind: "apex-and-subdomains" };
  }
  if (pattern.startsWith("*.")) {
    return { canonicalPattern: pattern, hostnamePattern: pattern.slice(2), kind: "subdomains-only" };
  }
  return { canonicalPattern: pattern, hostnamePattern: pattern, kind: "exact" };
}
