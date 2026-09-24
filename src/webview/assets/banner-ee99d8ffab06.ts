// @ts-nocheck
const __vite__mapDeps = (
  i,
  m = __vite__mapDeps,
  d = m.f ||
    (m.f = [
      "./banner-content-6fd3d18d582a.js",
      "./rolldown-runtime-2d059c5e81f4.js",
      "./app-shared-7b9edc1bfb7f.js",
      "./app-shared-fa570b9eb9dd.css",
      "./app-initial-51da50e6c6e3.js",
      "./app-initial-e8ceb32eb626.css",
      "./app-primary-d66705000d76.js",
      "./app-primary-484df789f2f5.css",
      "./chat-choice-view-dbd92be32fed.js",
      "./retirement-67c575376054.js",
      "./migrated-plugin-access-912829d71f23.js",
      "./notices-dbed4ccd62e0.js",
      "./migrated-plugin-e6c50d3e1d93.js",
    ]),
) => i.map((i) => d[i]);
import { n as e } from "./rolldown-runtime-2d059c5e81f4.js";
import {
  $3 as t,
  BX as n,
  FX as r,
  H3 as i,
  I3 as a,
  Jm as o,
  LX as s,
  QI as c,
  V3 as l,
  ZI as u,
  qm as d,
} from "./app-shared-7b9edc1bfb7f.js";
import {
  Qgn as f,
  fN as p,
  i_n as m,
  mN as h,
  mfn as g,
  o_n as _,
  pfn as v,
} from "./app-initial-51da50e6c6e3.js";
import { Lp as y, Mp as b, Pp as x } from "./app-primary-d66705000d76.js";
import { n as S, t as C } from "./chat-choice-view-dbd92be32fed.js";
function w(e) {
  let t = (0, E.c)(3),
    { gizmoId: r } = e,
    i = n(g, `2160578039`),
    a;
  return (
    t[0] !== i || t[1] !== r
      ? ((a = i ? (0, D.jsx)(O, { gizmoId: r }, r) : null), (t[0] = i), (t[1] = r), (t[2] = a))
      : (a = t[2]),
    a
  );
}
function T(e) {
  let t = (0, E.c)(10),
    { gizmoId: r } = e,
    i = s(u),
    a = m(),
    o = _(),
    { data: c } = n(p, r),
    l;
  t[0] !== r || t[1] !== a.pathname
    ? ((l = { gizmoId: r, visitKey: a.pathname }), (t[0] = r), (t[1] = a.pathname), (t[2] = l))
    : (l = t[2]);
  let d = n(x, l),
    f;
  return (
    t[3] !== d || t[4] !== r || t[5] !== a.pathname || t[6] !== o || t[7] !== c || t[8] !== i
      ? ((f =
          d && c?.gizmo.migrated_plugin_id
            ? (0, D.jsx)(C, {
                gptName: c.gizmo.display.name,
                accessState: `error`,
                onUsePlugin: () => void o(`/plugins`),
                onKeepUsingGpt: () => b(i, { gizmoId: r, visitKey: a.pathname }),
              })
            : null),
        (t[3] = d),
        (t[4] = r),
        (t[5] = a.pathname),
        (t[6] = o),
        (t[7] = c),
        (t[8] = i),
        (t[9] = f))
      : (f = t[9]),
    f
  );
}
var E, D, O;
function k() {
  return (k = e(() => {
    ((E = t()),
      r(),
      f(),
      d(),
      c(),
      v(),
      h(),
      S(),
      y(),
      (D = a()),
      i(),
      (O = o(
        async () =>
          (
            await l(
              async () => {
                let { GptPluginMigrationBannerContent: e } = await import(
                  `./banner-content-6fd3d18d582a.js`
                );
                return { GptPluginMigrationBannerContent: e };
              },
              __vite__mapDeps([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]),
              import.meta.url,
            )
          ).GptPluginMigrationBannerContent,
        { errorFallback: (e) => (0, D.jsx)(T, { ...e }) },
      )));
  }))();
}
export { k as n, w as t };
