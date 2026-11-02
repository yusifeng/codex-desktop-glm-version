// @ts-nocheck
import { n as e } from "@rchunk/rolldown-runtime";
function t({ currentBranch: e, storedThreadBranch: t }) {
  let n = e?.trim() ?? ``,
    r = t?.trim() ?? ``;
  return {
    currentBranchName: n,
    hasThreadBranchMismatch: n.length > 0 && r.length > 0 && n !== r,
    storedThreadBranchName: r,
  };
}
function n() {
  return (n = e(() => {}))();
}
export { n, t };
