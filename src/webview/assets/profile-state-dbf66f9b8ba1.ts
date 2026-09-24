// @ts-nocheck
import { n as e } from "./rolldown-runtime-2d059c5e81f4.js";
import { FX as t, QI as n, ZI as r, dZ as i } from "./app-shared-7b9edc1bfb7f.js";
import { mnt as a, pnt as o } from "./app-initial-51da50e6c6e3.js";
import { n as s, t as c } from "./profile-c8800e4c561a.js";
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
