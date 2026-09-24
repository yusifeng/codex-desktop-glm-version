// @ts-nocheck
import { n as e } from "./rolldown-runtime-2d059c5e81f4.js";
import { $O as t, BX as n, FX as r, QI as i, ZI as a, ek as o } from "./app-shared-7b9edc1bfb7f.js";
import { eun as s, nun as c } from "./app-initial-51da50e6c6e3.js";
function l(e) {
  let { data: t } = n(u, e?.kind === `appId` ? e.appId : null),
    { data: r } = n(d, e?.kind === `displayName` ? e.displayName : null);
  return t ?? r ?? null;
}
var u, d;
function f() {
  return (f = e(() => {
    (r(),
      i(),
      o(),
      c(),
      (u = s(a, `native-desktop-app-by-bundle-id`, (e) => ({
        enabled: e != null,
        params: e == null ? void 0 : { bundleId: e },
        refetchOnWindowFocus: !1,
        select: (e) => e.app,
        staleTime: t.FIVE_MINUTES,
      }))),
      (d = s(a, `native-desktop-apps`, (e) => ({
        cacheKey: [`computer-use-tool-row-display-name`, e],
        enabled: e != null,
        params: { order: `usage` },
        refetchOnWindowFocus: !1,
        select: (t) => t.apps.find((t) => t.displayName.toLowerCase() === e?.toLowerCase()) ?? null,
        staleTime: t.FIVE_MINUTES,
      }))));
  }))();
}
export { l as n, f as t };
