// @ts-nocheck
import { n as e } from "@rchunk/rolldown-runtime";
import { RR as t, wL as n } from "@rchunk/app-shared";
function r(e) {
  let n = i(e);
  return n == null ? null : (t[n.toLowerCase()] ?? null);
}
function i(e) {
  let t = e.trim();
  if (t.length === 0) return null;
  let n = t.match(/^(['"])(.*?)\1/),
    r = n?.[2];
  if (r) {
    if (n[0].length === t.length) t = r.trim();
    else return a(r);
  }
  let i = t.match(/^\S+/)?.[0];
  return i == null ? null : a(i);
}
function a(e) {
  return e.split(/[/\\]/).at(-1) ?? e;
}
function o() {
  return (o = e(() => {
    n();
  }))();
}
export { o as n, r as t };
