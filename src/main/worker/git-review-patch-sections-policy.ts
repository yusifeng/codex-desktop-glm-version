/** Pure review-patch section limits and whitespace projection policy. */

export const defaultMaxBytes = 64 * 1024 * 1024;
export const defaultMaxConcurrency = 8;

export function collectNonEmptySections(...groups: Array<Array<string | null | undefined>>) {
  const sections: string[] = [];
  for (const group of groups)
    for (const section of group) {
      const trimmed = section?.trim();
      if (trimmed) sections.push(trimmed);
    }
  return sections;
}

export function resolvePatchSectionLimits(dependencies: { maxBytes?: number; maxConcurrency?: number } = {}) {
  return {
    maxBytes: dependencies.maxBytes ?? defaultMaxBytes,
    maxConcurrency: dependencies.maxConcurrency ?? defaultMaxConcurrency,
  };
}

if (typeof module !== `undefined`)
  module.exports = { collectNonEmptySections, defaultMaxBytes, defaultMaxConcurrency, resolvePatchSectionLimits };
