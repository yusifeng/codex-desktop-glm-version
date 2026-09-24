// @ts-nocheck
import { n as e } from "./rolldown-runtime-2d059c5e81f4.js";
import { $3 as t, FX as n, HX as r, I3 as i } from "./app-shared-7b9edc1bfb7f.js";
import { St as a, xt as o } from "./app-primary-d66705000d76.js";
import { n as s, t as c } from "./right-panel-composer-overlay-fdca4b46e82c.js";
import { n as l, t as u } from "./content-quick-chat-overlay-ed4d1aa8ed4b.js";
function d(e) {
  let t = (0, f.c)(5),
    { children: n, expandComposerContentImmediately: i, forceExpanded: o } = e,
    s = r(a),
    l;
  return (
    t[0] !== n || t[1] !== i || t[2] !== o || t[3] !== s
      ? ((l = s
          ? (0, p.jsx)(u, { composerOnly: !0, children: n })
          : (0, p.jsx)(c, {
              expandComposerContentImmediately: i,
              forceExpanded: o,
              children: n(),
            })),
        (t[0] = n),
        (t[1] = i),
        (t[2] = o),
        (t[3] = s),
        (t[4] = l))
      : (l = t[4]),
    l
  );
}
var f, p;
function m() {
  return (m = e(() => {
    ((f = t()), n(), l(), o(), s(), (p = i()));
  }))();
}
m();
export { d as HomeComposerOverlay };
