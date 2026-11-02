// @ts-nocheck
import { n as e } from "@rchunk/rolldown-runtime";
import { FX as t, QI as n, ZI as r, dZ as i } from "@rchunk/app-shared";
import { mnt as a, pnt as o } from "@rchunk/app-initial";
import { n as s, t as c } from "@rchunk/profile";
function l() {
  return c.initialize(o?.browserHost);
}
var u;
function d() {
  return (d = e(() => {
    (t(),
      a(),
      n(),
      s(),
      (u = i(r, c.getSnapshot, ({ set: e }) => c.subscribe(() => e(c.getSnapshot())))));
  }))();
}
export { d as n, l as r, u as t };
