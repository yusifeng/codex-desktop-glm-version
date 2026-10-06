const LOCAL_ID_PATTERN = /(?:^|[\s<])id\s*=\s*(["'])([^"']+)\1/g;

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, `\\$&`);
}

function assertIdPrefix(prefix: string): void {
  if (!/^[A-Za-z_][\w:.-]*$/.test(prefix)) throw new TypeError(`icon idPrefix must be a non-empty SVG identifier prefix`);
}

export function prefixSvgLocalIds(svg: string, idPrefix?: string | null): string {
  const ids = new Set<string>();
  for (const match of svg.matchAll(LOCAL_ID_PATTERN)) ids.add(match[2]);
  if (idPrefix == null) {
    if (ids.size > 0) throw new TypeError(`icon idPrefix is required when the SVG body contains local IDs`);
    return svg;
  }
  assertIdPrefix(idPrefix);
  let result = svg;
  for (const id of ids) {
    const escaped = escapeRegExp(id);
    const next = `${idPrefix}-${id}`;
    result = result
      .replace(new RegExp(`((?:^|[\\s<])id\\s*=\\s*)(["'])${escaped}\\2`, `g`), (_m, lead, quote) => `${lead}${quote}${next}${quote}`)
      .replace(new RegExp(`(url\\(\\s*)(["']?)#${escaped}\\2(\\s*\\))`, `g`), (_m, lead, quote, tail) => `${lead}${quote}#${next}${quote}${tail}`)
      .replace(new RegExp(`((?:^|[\\s<])(?:xlink:)?href\\s*=\\s*)(["'])#${escaped}\\2`, `g`), (_m, lead, quote) => `${lead}${quote}#${next}${quote}`);
  }
  return result;
}
