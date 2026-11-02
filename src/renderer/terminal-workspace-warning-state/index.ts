// @ts-nocheck
import { areEquivalentPaths as n } from "../app-shared/runtime/path-key-policy";
import { n as e } from "@rchunk/rolldown-runtime";
import {
  FX as t,
  RI as r,
  oZ as i,
} from "@rchunk/app-shared";
import {
  Ftn as a,
  wtn as o,
} from "@rchunk/app-initial";
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
