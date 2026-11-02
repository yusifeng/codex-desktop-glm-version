// @ts-nocheck
const __vite__mapDeps = (
  i,
  m = __vite__mapDeps,
  d = m.f ||
    (m.f = [
      "@rchunk/automation-side-panel-tab-core",
      "@rchunk/rolldown-runtime",
      "@rchunk/app-shared",
      "./app-shared-fa570b9eb9dd.css",
      "@rchunk/app-initial",
      "./app-initial-e8ceb32eb626.css",
      "@rchunk/appgen-access",
      "@rchunk/elicitation-events",
      "@rchunk/site-automation-setup-state",
      "@rchunk/automation-dialog",
      "@rchunk/app-primary",
      "./app-primary-484df789f2f5.css",
      "@rchunk/model-and-reasoning-effort-translations",
      "@rchunk/cloud-automation-detail-panel",
      "@rchunk/automation-frequency-section",
      "@rchunk/date-picker-runtime",
      "./DatePicker-e5c9d75bac51.css",
      "@rchunk/automation-editor-dialog",
      "@rchunk/appgen-automations-state",
      "@rchunk/automation-delete-confirmation-dialog",
      "@rchunk/schedule-fields",
      "@rchunk/chatgpt-tasks-runtime",
      "@rchunk/schedule-draft",
      "@rchunk/share-analytics",
      "@rchunk/conversation-summary",
      "@rchunk/timestamps",
      "@rchunk/platform-ui-kit-provider",
      "@rchunk/navigation-blocker",
    ]),
) => i.map((i) => d[i]);
import { n as e } from "@rchunk/rolldown-runtime";
import {
  H3 as t,
  I3 as n,
  Jm as r,
  V3 as i,
  lw as a,
  qm as o,
  wy as s,
} from "@rchunk/app-shared";
import {
  Fg as c,
  Gvt as l,
  Ig as u,
  Ng as d,
  Pg as f,
  QCt as p,
  Sun as m,
  Vvt as h,
  Wvt as g,
  ZCt as _,
  _un as v,
  _vt as y,
  gvt as b,
  mun as x,
  qvt as S,
  stt as C,
  ttt as w,
  zg as T,
} from "@rchunk/app-initial";
import { n as E, t as D } from "@rchunk/elicitation-events";
import { n as O, t as k } from "@rchunk/site-automation-setup-state";
function A({
  scope: e,
  revealAndFocus: t = !0,
  automationId: n,
  insertPosition: r,
  tabId: i,
  target: a = `right`,
  title: o,
}) {
  P({
    scope: e,
    revealAndFocus: t,
    durableRoute: { kind: c, params: { automationId: n }, payloadVersion: 1 },
    insertPosition: r,
    request: { type: `automation`, automationId: n },
    tabId: i ?? `automation:${n}`,
    target: a,
    title: o,
  });
}
async function j(e, t, { revealAndFocus: n, insertPosition: r, tabId: i, target: a }) {
  try {
    let { items: o } = await e.query.getOrFetch(p),
      s = o.find((e) => e.id === t),
      c = s == null ? await e.query.getOrFetch(w, t) : null,
      l = s?.name ?? c?.automation.title;
    return (
      l != null &&
      (A({
        scope: e,
        revealAndFocus: n,
        automationId: t,
        insertPosition: r,
        tabId: i,
        target: a,
        title: l,
      }),
      !0)
    );
  } catch {
    return !1;
  }
}
function M({ scope: e, seed: t, title: n }) {
  P({ scope: e, request: { type: `suggestion`, seed: t }, tabId: T(t.directiveKey), title: n });
}
function N({ scope: e, ...t }) {
  let n = `site-automation:${t.projectId}`,
    r = JSON.stringify([e.get(x), e.get(v), t.projectId]);
  (b(e, n) == null && e.get(O, r)?.status === `saved` && e.set(O, r, null),
    P({ scope: e, request: { type: `site`, proposal: t }, tabId: n, title: t.title }));
}
function P({
  scope: e,
  revealAndFocus: t = !0,
  durableRoute: n,
  insertPosition: r,
  request: i,
  tabId: a,
  target: o = `right`,
  title: s,
}) {
  l(e, L, {
    revealAndFocus: t,
    defaultState: () => ({ draftInstanceId: crypto.randomUUID(), savedAutomationId: null }),
    durableRoute: n,
    icon: (0, F.jsx)(I, {}),
    insertPosition: r,
    props: { request: i },
    id: a,
    target: b(e, a) ?? o,
    title: s,
    tooltip: s,
    onClose: (e, t) => {
      let n = t === `right` ? S : h,
        r = e.get(n.tabStateById$, a)?.value;
      i.type === `suggestion` &&
        i.seed.elicitation != null &&
        typeof r == `object` &&
        r &&
        `savedAutomationId` in r &&
        r.savedAutomationId == null &&
        E(e, i.seed.elicitation, `dismiss`);
    },
  });
}
var F, I, L;
function R() {
  return (R = e(() => {
    (D(),
      g(),
      m(),
      a(),
      o(),
      d(),
      y(),
      _(),
      u(),
      C(),
      k(),
      (F = n()),
      t(),
      (I = r(
        async () => {
          let { AutomationSidePanelTabIcon: e } = await i(
            async () => {
              let { AutomationSidePanelTabIcon: e } = await import(
                `@rchunk/automation-side-panel-tab-core`
              );
              return { AutomationSidePanelTabIcon: e };
            },
            __vite__mapDeps([
              0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23,
              24, 25, 26, 27,
            ]),
            import.meta.url,
          );
          return e;
        },
        { fallback: (0, F.jsx)(s, { "aria-hidden": !1 }), propagateLoadError: !0 },
      )),
      (L = f({ open: A, restore: j })));
  }))();
}
export { j as a, N as i, A as n, M as r, R as t };
