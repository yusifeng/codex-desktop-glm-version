// @ts-nocheck
const __vite__mapDeps = (
  i,
  m = __vite__mapDeps,
  d = m.f ||
    (m.f = [
      "@rchunk/pull-request-revision-tab",
      "@rchunk/rolldown-runtime",
      "@rchunk/app-shared",
      "./app-shared-fa570b9eb9dd.css",
      "@rchunk/app-initial",
      "./app-initial-e8ceb32eb626.css",
      "@rchunk/pull-request-revision-queries-core",
      "@rchunk/full-content-metadata",
      "@rchunk/pull-request-code-review-navigation-core",
      "@rchunk/virtualized-file-diff-line-position",
      "@rchunk/pull-request-actions",
      "@rchunk/pull-request-code-review-core",
      "@rchunk/app-primary",
      "./app-primary-484df789f2f5.css",
      "@rchunk/codex-diff-css",
      "@rchunk/review-preferences-model",
      "@rchunk/diff-comment-card",
      "./diff-comment-card-2288e5b28f03.css",
      "@rchunk/pull-request-readonly-comment",
      "@rchunk/file-diff-alt",
      "@rchunk/file-diff-presentation-core",
      "@rchunk/register-pierre-themes",
      "@rchunk/review-row",
      "@rchunk/pull-request-comment",
      "@rchunk/pull-request-detail-model",
      "@rchunk/arrow-curved-right",
      "@rchunk/review-diff-virtualizer-metrics",
      "@rchunk/review-file-tree-pane",
      "@rchunk/use-target-apps",
      "@rchunk/codex-analytics-attribution",
      "@rchunk/text-shorter",
      "@rchunk/code-diff",
      "@rchunk/code-diff-context-menu",
      "@rchunk/binary-preview-source",
      "@rchunk/surface",
      "@rchunk/undo",
      "@rchunk/pull-request-error-description",
      "@rchunk/middle-truncated-text",
      "@rchunk/layout",
      "@rchunk/revision-review-unavailable-message",
      "@rchunk/registered-pull-request-thumbnail",
      "@rchunk/pull-request-status-label",
      "@rchunk/pull-request-checks-summary",
    ]),
) => i.map((i) => d[i]);
import { n as e } from "@rchunk/rolldown-runtime";
import {
  CS as t,
  H3 as n,
  I3 as r,
  Jm as i,
  V3 as a,
  lw as o,
  qm as s,
} from "@rchunk/app-shared";
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
} from "@rchunk/app-initial";
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
                `@rchunk/pull-request-revision-tab`
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
                `@rchunk/registered-pull-request-thumbnail`
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
