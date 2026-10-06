export function normalizeComparisonRoot(path: string, normalize: (path: string) => string) {
  return normalize(path).replace(/\/+$/, ``);
}

export function isPathWithinManagedRoot(
  candidate: string,
  root: string,
  normalize: (path: string) => string,
) {
  const normalizedCandidate = normalizeComparisonRoot(candidate, normalize);
  const normalizedRoot = normalizeComparisonRoot(root, normalize);
  return normalizedRoot === `/`
    ? normalizedCandidate === `/`
    : normalizedCandidate === normalizedRoot || normalizedCandidate.startsWith(`${normalizedRoot}/`);
}

if (typeof module !== `undefined`) module.exports = { normalizeComparisonRoot, isPathWithinManagedRoot };
