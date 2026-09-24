// @ts-nocheck
import { n as e } from "./rolldown-runtime-2d059c5e81f4.js";
import { FX as t, IK as n, RI as r, oZ as i } from "./app-shared-7b9edc1bfb7f.js";
import { Ftn as a, wtn as o } from "./app-initial-51da50e6c6e3.js";
function s({ binding: e, currentTarget: t, currentWorkspaceRoots: n, dismissedTarget: r }) {
  return (
    e != null &&
    !c(e, t) &&
    !n.some((n) => c(e, { hostId: t.hostId, workspaceRoot: n })) &&
    !c(r, t)
  );
}
function c(e, t) {
  return e == null || (e.hostId != null && t.hostId != null && e.hostId !== t.hostId)
    ? !1
    : e.workspaceRoot == null || t.workspaceRoot == null
      ? e.workspaceRoot === t.workspaceRoot
      : n(e.workspaceRoot, t.workspaceRoot);
}
var l;
function u() {
  return (u = e(() => {
    (t(), a(), r(), (l = i(o, (e) => null)));
  }))();
}
export { s as n, l as r, u as t };
