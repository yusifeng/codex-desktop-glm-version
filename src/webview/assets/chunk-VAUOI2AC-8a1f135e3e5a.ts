// @ts-nocheck
import { n as e } from "./rolldown-runtime-2d059c5e81f4.js";
import { t } from "./src-d4879d58b20a.js";
import { o as n } from "./chunk-X3CZISLH-994f10fe4442.js";
import { n as r, r as i } from "./chunk-Y2CYZVJY-24cce454fd91.js";
import { j as a, x as o } from "./chunk-WYO6CB5R-48e89393abef.js";
var s;
function c() {
  return (c = e(() => {
    (a(),
      i(),
      t(),
      (s = r((e) => {
        let { securityLevel: t } = o(),
          r = n(`body`);
        if (t === `sandbox`) {
          let t = n(`#i${e}`).node()?.contentDocument ?? document;
          r = n(t.body);
        }
        return r.select(`#${e}`);
      }, `selectSvgElement`)));
  }))();
}
export { s as n, c as t };
