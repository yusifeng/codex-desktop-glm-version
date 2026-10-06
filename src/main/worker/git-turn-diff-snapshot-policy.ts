export function normalizeTurnDiffTreeOutput(
  output: string,
  isObjectId: (value: string) => boolean,
  normalizeTreeSha: (value: string) => string,
) {
  const treeSha = output.trim();
  if (!isObjectId(treeSha)) throw Error(`Unexpected tree SHA: ${treeSha}`);
  return normalizeTreeSha(treeSha);
}
if (typeof module !== `undefined`) module.exports = { normalizeTurnDiffTreeOutput };
