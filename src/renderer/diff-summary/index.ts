// @ts-nocheck
import { n as e } from "@rchunk/rolldown-runtime";
function t(e) {
  let t = 0,
    n = 0;
  for (let r of e) ((t += r.additions), (n += r.deletions));
  return { fileCount: e.length, linesAdded: t, linesDeleted: n, hasChanges: t > 0 || n > 0 };
}
function n() {
  return (n = e(() => {}))();
}
export { n, t };
