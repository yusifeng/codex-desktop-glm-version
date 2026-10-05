function parseLeftRightCommitCounts(output: string) {
  const value = output.trim(); if (!value) return null;
  const fields = value.split(/\s+/); if (fields.length < 2) return null;
  const leftAhead = Number.parseInt(fields[0] ?? ``, 10); const rightAhead = Number.parseInt(fields[1] ?? ``, 10);
  return !Number.isFinite(leftAhead) || !Number.isFinite(rightAhead) ? null : { leftAhead, rightAhead };
}
function classifyBranchComparison(counts: { leftAhead: number; rightAhead: number }) {
  if (counts.leftAhead > 0 && counts.rightAhead > 0) return `diverged`;
  if (counts.leftAhead > 0) return `left-ahead`;
  if (counts.rightAhead > 0) return `right-ahead`;
  return `equal`;
}
export { classifyBranchComparison, parseLeftRightCommitCounts };
if (typeof module !== `undefined`) module.exports = { classifyBranchComparison, parseLeftRightCommitCounts };
