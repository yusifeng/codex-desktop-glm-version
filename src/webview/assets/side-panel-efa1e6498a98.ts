// @ts-nocheck
const __vite__mapDeps = (
  i,
  m = __vite__mapDeps,
  d = m.f ||
    (m.f = [
      "./tab-panel-f36ccc73e17f.js",
      "./rolldown-runtime-2d059c5e81f4.js",
      "./app-shared-7b9edc1bfb7f.js",
      "./app-shared-fa570b9eb9dd.css",
      "./app-initial-51da50e6c6e3.js",
      "./app-initial-e8ceb32eb626.css",
      "./publish-actions-271f912485e5.js",
      "./pending-onboarding-9e794fa64b02.js",
      "./allowed-domains-input-2ddf45ddb4ff.js",
      "./validation-message-f0452d72af5e.js",
      "./change-messages-b91c906d971c.js",
      "./configuration-fields-56633f88c571.js",
      "./codex-diff-css-4cc1d2356a79.js",
      "./register-pierre-themes-58d8ca57f84b.js",
      "./File-4270090fca79.js",
      "./renderFileChildren-897963e963e5.js",
      "./file-diff-d04472cf49af.js",
      "./file-diff-presentation-b78d448e2f9c.js",
      "./virtualized-file-diff-line-position-c13dbee45987.js",
      "./result-values-d618934c5c1e.js",
      "./editor-370fecef1630.js",
      "./error-1e0b38c6edf3.js",
    ]),
) => i.map((i) => d[i]);
import { n as e } from "./rolldown-runtime-2d059c5e81f4.js";
import {
  FX as t,
  H3 as n,
  Hy as r,
  Jm as i,
  V3 as a,
  e6 as o,
  lw as s,
  oZ as c,
  pZ as l,
  qm as u,
  rJ as d,
  sZ as f,
  wL as p,
} from "./app-shared-7b9edc1bfb7f.js";
import {
  $en as m,
  Ebt as h,
  FDt as g,
  Ftn as _,
  Gvt as v,
  IDt as y,
  Otn as b,
  Utn as x,
  Wvt as S,
  _vt as C,
  itn as w,
  mpn as T,
  ppn as E,
  qvt as D,
  vbt as O,
  vvt as k,
  wtn as A,
} from "./app-initial-51da50e6c6e3.js";
function j({ open: e }) {
  return y(`environment-setup`, M, {
    getId: (e, { conversationId: t }) => `environment-setup:${d(t) ? t : (e.get(b, t) ?? t)}`,
    isAvailable: (e, t) =>
      e.value.routeKind === `client-local-thread`
        ? t != null && e.value.clientThreadId === t.conversationId
        : e.value.routeKind === `local-thread` &&
          (t == null || e.value.conversationId === e.get(x, t.conversationId)),
    open: e,
  });
}
var M;
function N() {
  return (N = e(() => {
    (p(),
      g(),
      u(),
      _(),
      n(),
      (M = i(
        async () => {
          let { EnvironmentSetupTabPanel: e } = await a(
            async () => {
              let { EnvironmentSetupTabPanel: e } = await import(`./tab-panel-f36ccc73e17f.js`);
              return { EnvironmentSetupTabPanel: e };
            },
            __vite__mapDeps([
              0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21,
            ]),
            import.meta.url,
          );
          return e;
        },
        { propagateLoadError: !0 },
      )));
  }))();
}
var P;
function F() {
  return (F = e(() => {
    (t(), w(), (P = c(m, (e) => null)));
  }))();
}
function I(e, t, n) {
  if (
    (e.value.routeKind !== `local-thread` || e.value.conversationId !== t) &&
    (e.value.routeKind !== `client-local-thread` || e.value.clientThreadId !== t)
  )
    return !1;
  v(e, z, {
    revealAndFocus: !0,
    allowDuringThreadCreation: !0,
    icon: (0, R.createElement)(r),
    id: `environment-setup:${d(t) ? t : (e.get(b, t) ?? t)}`,
    props: { conversationId: t },
    requiresWorkspaceReady: !1,
    title: e
      .get(T)
      .formatMessage({
        id: `restricted.environmentSetup.sidePanel.tabTitle`,
        defaultMessage: `Environment`,
        description: `Title of the side-panel tab for editing a cloud environment`,
      }),
  });
  let i = k(e, `right`);
  return (i && !d(t) && e.set(P, t, n ?? null), i);
}
function L(e, t) {
  !e.get(V) && I(e, t) && e.set(V, !0);
}
var R, z, B, V;
function H() {
  return (H = e(() => {
    (t(),
      p(),
      (R = o()),
      S(),
      h(),
      s(),
      E(),
      _(),
      N(),
      C(),
      F(),
      (z = j({ open: I })),
      (B = f(A, ({ get: e }) => e(O) && e(D.activeTab$)?.tabType.kind === z.kind)),
      (V = l(A, !1)));
  }))();
}
export { P as a, I as i, H as n, F as o, B as r, L as t };
