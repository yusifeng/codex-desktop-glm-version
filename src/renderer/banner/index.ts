// @ts-nocheck
const __vite__mapDeps = (
  i,
  m = __vite__mapDeps,
  d = m.f ||
    (m.f = [
      "@rchunk/gpt-plugin-migration-banner-content",
      "@rchunk/rolldown-runtime",
      "@rchunk/app-shared",
      "./app-shared-fa570b9eb9dd.css",
      "@rchunk/app-initial",
      "./app-initial-e8ceb32eb626.css",
      "@rchunk/app-primary",
      "./app-primary-484df789f2f5.css",
      "@rchunk/chat-choice-view",
      "@rchunk/gpt-plugin-retirement",
      "@rchunk/migrated-plugin-access",
      "@rchunk/gpt-plugin-migration-notices",
      "@rchunk/migrated-plugin-notice",
    ]),
) => i.map((i) => d[i]);
import { initializeGptPluginMigrationState as y, markGptPluginMigrationContinued as b, migrationVisitEligible as x } from "../app-primary/runtime/gpt-plugin-migration-state";
import { n as e } from "@rchunk/rolldown-runtime";
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
} from "@rchunk/app-shared";
import {
  Qgn as f,
  fN as p,
  i_n as m,
  mN as h,
  mfn as g,
  o_n as _,
  pfn as v,
} from "@rchunk/app-initial";

import { n as S, t as C } from "@rchunk/chat-choice-view";
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
                  `@rchunk/gpt-plugin-migration-banner-content`
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
