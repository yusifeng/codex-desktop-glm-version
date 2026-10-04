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

function matchesWildcard(pattern: string, value: string): boolean {
  let patternIndex = 0;
  let valueIndex = 0;
  let wildcardIndex = -1;
  let wildcardValueIndex = 0;
  while (valueIndex < value.length) {
    if (pattern[patternIndex] === "?" || pattern[patternIndex] === value[valueIndex]) {
      patternIndex += 1;
      valueIndex += 1;
    } else if (pattern[patternIndex] === "*") {
      wildcardIndex = patternIndex;
      patternIndex += 1;
      wildcardValueIndex = valueIndex;
    } else if (wildcardIndex !== -1) {
      patternIndex = wildcardIndex + 1;
      wildcardValueIndex += 1;
      valueIndex = wildcardValueIndex;
    } else {
      return false;
    }
  }
  while (pattern[patternIndex] === "*") patternIndex += 1;
  return patternIndex === pattern.length;
}

function matchesSubdomain(pattern: string, value: string): boolean {
  for (let index = value.indexOf("."); index > 0; index = value.indexOf(".", index + 1)) {
    if (matchesWildcard(pattern, value.slice(index + 1))) return true;
  }
  return false;
}

export function domainMatchesPattern(
  pattern: {
    hostnamePattern?: string;
    hostname?: string;
    kind?: OriginPattern["kind"];
  },
  hostname: string,
): boolean {
  const normalizedHostname = normalizeHost(hostname);
  const hostnamePattern = pattern.hostnamePattern ?? pattern.hostname ?? "";
  switch (pattern.kind ?? "exact") {
    case "exact":
      return matchesWildcard(hostnamePattern, normalizedHostname);
    case "subdomains-only":
      return matchesSubdomain(hostnamePattern, normalizedHostname);
    case "apex-and-subdomains":
      return matchesWildcard(hostnamePattern, normalizedHostname) ||
        matchesSubdomain(hostnamePattern, normalizedHostname);
  }
}
