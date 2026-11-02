// @ts-nocheck
import { getPathBasename as t } from "../app-shared/runtime/get-path-basename";
import { n as e } from "@rchunk/rolldown-runtime";
import {
  RI as n,
} from "@rchunk/app-shared";
import {
  BGt as r,
  HGt as i,
  bz as a,
} from "@rchunk/app-initial";
import {
  Qd as o,
  Yd as s,
  Zd as c,
} from "@rchunk/app-primary";
async function l(e, t) {
  return r(await s(e, { showInline: !0 }), t);
}
async function u(e, t) {
  return new TextDecoder().decode(await d(e, t));
}
async function d(e, t) {
  return new Uint8Array(await (await l(e, t)).arrayBuffer());
}
async function f(e) {
  let t = e.provider != null || a(e.file_id) != null ? await o(e) : e,
    n = await s(t);
  if (n.requestHeaders == null) {
    m(n.downloadUrl, p(t));
    return;
  }
  let i = URL.createObjectURL(await r(n));
  (m(i, p(t)), window.setTimeout(() => URL.revokeObjectURL(i), 0));
}
function p(e) {
  return t(e.file_name) || e.file_name;
}
function m(e, t) {
  let n = document.createElement(`a`);
  ((n.href = e),
    (n.download = t),
    (n.rel = `noopener`),
    document.body.appendChild(n),
    n.click(),
    n.remove());
}
function h() {
  return (h = e(() => {
    (i(), n(), c());
  }))();
}
export { h as a, u as i, l as n, d as r, f as t };
