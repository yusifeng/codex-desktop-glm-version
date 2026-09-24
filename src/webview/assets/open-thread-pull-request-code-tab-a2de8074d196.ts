// @ts-nocheck
const __vite__mapDeps = (
  i,
  m = __vite__mapDeps,
  d = m.f ||
    (m.f = [
      "./pull-request-revision-tab-5ef1fcd9eb3f.js",
      "./rolldown-runtime-2d059c5e81f4.js",
      "./app-shared-7b9edc1bfb7f.js",
      "./app-shared-fa570b9eb9dd.css",
      "./app-initial-51da50e6c6e3.js",
      "./app-initial-e8ceb32eb626.css",
      "./pull-request-revision-queries-f191743fff00.js",
      "./full-content-metadata-da5411b2ee3b.js",
      "./pull-request-code-review-navigation-52f3cbf2cccc.js",
      "./virtualized-file-diff-line-position-c13dbee45987.js",
      "./pull-request-actions-5ac6dcc71dec.js",
      "./pull-request-code-review-5ce1a9c20ee4.js",
      "./app-primary-d66705000d76.js",
      "./app-primary-484df789f2f5.css",
      "./codex-diff-css-4cc1d2356a79.js",
      "./review-preferences-model-677402e96a42.js",
      "./diff-comment-card-c051f69be383.js",
      "./diff-comment-card-2288e5b28f03.css",
      "./pull-request-readonly-comment-26219c5c2731.js",
      "./file-diff-d04472cf49af.js",
      "./file-diff-presentation-b78d448e2f9c.js",
      "./register-pierre-themes-58d8ca57f84b.js",
      "./row-794dad9b1eb6.js",
      "./pull-request-comment-9f228a526fbf.js",
      "./pull-request-detail-model-d93a8be7012c.js",
      "./arrow-curved-right-f88ac704e2f7.js",
      "./review-diff-virtualizer-metrics-cf31633f04e3.js",
      "./review-file-tree-pane-d59081dc4b8c.js",
      "./use-target-apps-976e88a40210.js",
      "./codex-analytics-attribution-42c546370ade.js",
      "./text-shorter-a76bbb7184d8.js",
      "./code-diff-ce80502834fb.js",
      "./use-code-diff-context-menu-f898c5a2b28c.js",
      "./use-binary-preview-source-29f703b35d6d.js",
      "./surface-71cd73238841.js",
      "./undo-56dd6481731f.js",
      "./pull-request-error-description-2346b4b2cfaf.js",
      "./middle-truncated-text-7e516615ba34.js",
      "./layout-a912dff4540d.js",
      "./revision-review-unavailable-message-e08b4bab3a02.js",
      "./registered-56d9602398a1.js",
      "./pull-request-status-label-98884b1521ca.js",
      "./pull-request-checks-summary-b02c4ca41d59.js",
    ]),
) => i.map((i) => d[i]);
import { n as e } from "./rolldown-runtime-2d059c5e81f4.js";
import {
  CS as t,
  H3 as n,
  I3 as r,
  Jm as i,
  V3 as a,
  lw as o,
  qm as s,
} from "./app-shared-7b9edc1bfb7f.js";
import {
  FDt as c,
  Gvt as l,
  IDt as u,
  Wvt as d,
  X8t as f,
  Z8t as p,
  _vt as m,
  by as h,
  e5t as g,
  gvt as _,
  hvt as v,
  i5t as y,
  mpn as b,
  ppn as x,
  vvt as S,
  yy as C,
} from "./app-initial-51da50e6c6e3.js";
function w(e, t, n) {
  let r = {
      ...t.pullRequest,
      hostname: p(t.pullRequest.hostname),
      owner: t.pullRequest.owner.toLowerCase(),
      repository: t.pullRequest.repository.toLowerCase(),
    },
    i = { account: g(t.account), pullRequest: r },
    a = f(r),
    o = `pull-request-code:${encodeURIComponent(t.account.hostId)}|${a}`,
    s = e
      .get(b)
      .formatMessage(
        {
          id: `thread.sidePanel.pullRequestTab.title`,
          defaultMessage: `PR #{number}`,
          description: `Title for a pull request side-panel tab`,
        },
        { number: r.number },
      ),
    c = n ?? e.get(h, { request: t, source: `pull_requests_page` }).data?.title ?? ``;
  return {
    id: o,
    props: { request: i },
    title: c.trim() || s,
    tooltip: `${r.hostname}/${r.owner}/${r.repository} #${r.number} — ${c} (${t.account.hostId})`,
  };
}
function T() {
  return (T = e(() => {
    (x(), y(), C());
  }))();
}
function E({ open: e }) {
  return u(`pull-request-code`, O, {
    defaultState: () => ({ snapshot: null, commitSha: null }),
    getIcon: () => (0, D.jsx)(t, {}),
    isAvailable: () => !0,
    open: e,
    renderThumbnail: (e, t) =>
      (0, D.jsx)(k, { props: { request: { provider: `github`, ...e.request } }, title: t.title }),
  });
}
var D, O, k;
function A() {
  return (A = e(() => {
    (c(),
      o(),
      s(),
      (D = r()),
      n(),
      (O = i(
        async () => {
          let { PullRequestRevisionTab: e } = await a(
            async () => {
              let { PullRequestRevisionTab: e } = await import(
                `./pull-request-revision-tab-5ef1fcd9eb3f.js`
              );
              return { PullRequestRevisionTab: e };
            },
            __vite__mapDeps([
              0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23,
              24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39,
            ]),
            import.meta.url,
          );
          return e;
        },
        { propagateLoadError: !0 },
      )),
      (k = i(
        async () => {
          let { RegisteredPullRequestThumbnail: e } = await a(
            async () => {
              let { RegisteredPullRequestThumbnail: e } = await import(
                `./registered-56d9602398a1.js`
              );
              return { RegisteredPullRequestThumbnail: e };
            },
            __vite__mapDeps([40, 1, 2, 3, 4, 5, 41, 42]),
            import.meta.url,
          );
          return e;
        },
        { propagateLoadError: !0 },
      )));
  }))();
}
function j(e, t, n, r = !1, i = `right`) {
  let a = w(e, t, n),
    o = a.id,
    s = _(e, o),
    c = s ?? (M.dropDestinations.includes(i) ? i : `right`);
  return (
    l(e, M, {
      ...a,
      kind: `pull-request-code`,
      requiresWorkspaceReady: !1,
      target: c,
      revealAndFocus: !0,
    }),
    r && v(c).updateTabState(e, o, () => ({ snapshot: null, commitSha: null })),
    S(e, c),
    { tabId: o, placement: c, status: s == null ? `opened` : `existing` }
  );
}
var M;
function N() {
  return (N = e(() => {
    (d(), T(), A(), m(), (M = E({ open: j })));
  }))();
}
export { j as n, N as t };
