// @ts-nocheck
import { n as e } from "@rchunk/rolldown-runtime";
import { i as t, r as n, t as r } from "@rchunk/portable-thumbnail-font-face-source-runtime";
function i() {
  return (i = e(() => {}))();
}
function a() {
  return (a = e(() => {}))();
}
function o() {
  return (
    l ||
    ((l = Promise.resolve()
      .then(async () => {
        typeof document > `u` ||
          !document.fonts?.load ||
          (await Promise.all(c.map((e) => document.fonts.load(`${e} 16px Carlito`))), await t(r()));
      })
      .catch(() => {})
      .then(() => {
        u = !0;
      })),
    l)
  );
}
function s() {
  return u;
}
var c, l, u;
function d() {
  return (d = e(() => {
    (n(), (c = [`400`, `700`]), (l = null), (u = !1));
  }))();
}
export { i as a, a as i, o as n, d as r, s as t };
