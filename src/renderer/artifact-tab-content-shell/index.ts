// @ts-nocheck
const __vite__mapDeps = (
  i,
  m = __vite__mapDeps,
  d = m.f ||
    (m.f = [
      "@rchunk/artifact-tab-content-electron-entry",
      "@rchunk/app-shared",
      "@rchunk/rolldown-runtime",
      "./app-shared-fa570b9eb9dd.css",
      "@rchunk/artifact-tab-content-electron",
      "@rchunk/app-initial",
      "./app-initial-e8ceb32eb626.css",
      "@rchunk/spreadsheet-editor",
      "@rchunk/artifact-presentation",
      "@rchunk/app-primary",
      "./app-primary-484df789f2f5.css",
      "@rchunk/artifact-annotation-batch-controls",
      "@rchunk/popcorn-icons",
      "@rchunk/arrow-rotate-ccw",
      "./artifact-annotation-batch-controls-e72108cc6651.css",
      "@rchunk/artifact-layout",
      "@rchunk/editor-header",
      "@rchunk/popcorn-manual-edit-header-controls",
      "./editor-header-9f248c84e999.css",
      "@rchunk/artifact-feedback-button",
      "@rchunk/thumb-mixed",
      "@rchunk/artifact-annotation-comment",
      "@rchunk/sidebar-panel",
      "@rchunk/presentation-annotation-cursor-coachmark",
      "@rchunk/presentation-annotation-coachmark",
      "@rchunk/open-in-library-item",
      "@rchunk/version-history",
      "@rchunk/header-content-fade",
      "@rchunk/artifact-originating-turn",
      "@rchunk/artifact-preview-header",
      "@rchunk/use-app-connect-flow",
      "@rchunk/app-connect-modal",
      "@rchunk/country-codes",
      "@rchunk/google-logo",
      "./app-connect-modal-662390d53cb7.css",
      "@rchunk/app-connect-availability",
      "@rchunk/open-in-google-drive-menu-item",
      "@rchunk/use-target-apps",
      "@rchunk/codex-analytics-attribution",
      "@rchunk/review-file-source-item",
      "@rchunk/codex-diff-css",
      "@rchunk/register-pierre-themes",
      "@rchunk/diff-file-view",
      "@rchunk/render-file-children",
      "@rchunk/diff-source",
      "@rchunk/highlight-selectors",
      "@rchunk/scroll-to-match",
      "@rchunk/compact-empty-state",
      "@rchunk/review-preferences-model",
      "@rchunk/diff-comment-card",
      "./diff-comment-card-2288e5b28f03.css",
      "@rchunk/pull-request-readonly-comment",
      "@rchunk/file-diff-alt",
      "@rchunk/file-diff-presentation-core",
      "@rchunk/virtualized-file-diff-line-position",
      "@rchunk/review-row",
      "@rchunk/code-diff-context-menu",
      "@rchunk/binary-preview-source",
      "@rchunk/surface",
      "@rchunk/review-file-tree-side-pane",
      "@rchunk/pull-request-actions",
      "@rchunk/pull-request-comment",
      "@rchunk/pull-request-code-review-navigation-core",
      "@rchunk/pull-request-revision-queries-core",
      "@rchunk/full-content-metadata",
      "@rchunk/pull-request-detail-model",
      "@rchunk/arrow-curved-right",
      "@rchunk/conversation-diff-comments",
      "@rchunk/review-file-tree-pane",
      "@rchunk/filter-alt",
      "@rchunk/review-file-source-breadcrumb",
      "@rchunk/keyboard-shortcuts-gate",
      "@rchunk/workspace-file-context-menu-trigger",
      "@rchunk/file-blank-icon",
      "@rchunk/file-viewer-frame",
      "@rchunk/view-frame",
      "@rchunk/review-diff-virtualizer-metrics",
      "@rchunk/artifact-preview-status",
      "@rchunk/artifact-preview-zoom",
      "@rchunk/right-panel-composer-overlay-alignment",
    ]),
) => i.map((i) => d[i]);
import { n as e } from "@rchunk/rolldown-runtime";
import {
  $3 as t,
  H3 as n,
  I3 as r,
  K2 as i,
  V3 as a,
  Y2 as o,
  e6 as s,
} from "@rchunk/app-shared";
import { n as c, t as l } from "@rchunk/artifact-layout";
import { n as u, t as d } from "@rchunk/pane-layout";
function f(e) {
  let t = (0, m.c)(14),
    n,
    r;
  t[0] === e
    ? ((n = t[1]), (r = t[2]))
    : (({ renderSlots: r, ...n } = e), (t[0] = e), (t[1] = n), (t[2] = r));
  let i;
  t[3] === r ? (i = t[4]) : ((i = r == null ? void 0 : (e) => u(r, e)), (t[3] = r), (t[4] = i));
  let a = i,
    o;
  t[5] === Symbol.for(`react.memo_cache_sentinel`)
    ? ((o = (0, g.jsx)(p, {})), (t[5] = o))
    : (o = t[5]);
  let s;
  t[6] === a
    ? (s = t[7])
    : ((s = (0, g.jsx)(l, { header: null, content: o, renderLayout: a })), (t[6] = a), (t[7] = s));
  let c;
  t[8] !== n || t[9] !== a
    ? ((c = (0, g.jsx)(_, { ...n, renderLayout: a })), (t[8] = n), (t[9] = a), (t[10] = c))
    : (c = t[10]);
  let d;
  return (
    t[11] !== s || t[12] !== c
      ? ((d = (0, g.jsx)(h.Suspense, { fallback: s, children: c })),
        (t[11] = s),
        (t[12] = c),
        (t[13] = d))
      : (d = t[13]),
    d
  );
}
function p() {
  let e = (0, m.c)(1),
    t;
  return (
    e[0] === Symbol.for(`react.memo_cache_sentinel`)
      ? ((t = (0, g.jsx)(`div`, {
          className: `flex h-full items-center justify-center px-6 text-center text-sm text-tertiary`,
          children: (0, g.jsx)(o, {
            id: `artifactTab.loading`,
            defaultMessage: `Loading preview...`,
            description: `Loading state shown while an artifact tab preview is mounting`,
          }),
        })),
        (e[0] = t))
      : (t = e[0]),
    t
  );
}
var m, h, g, _;
function v() {
  return (v = e(() => {
    ((m = t()),
      (h = s()),
      i(),
      c(),
      d(),
      (g = r()),
      n(),
      (_ = (0, h.lazy)(async () => {
        let { ArtifactTabContent: e } = await a(
          async () => {
            let { ArtifactTabContent: e } = await import(
              `@rchunk/artifact-tab-content-electron-entry`
            );
            return { ArtifactTabContent: e };
          },
          __vite__mapDeps([
            0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23,
            24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45,
            46, 47, 48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 58, 59, 60, 61, 62, 63, 64, 65, 66, 67,
            68, 69, 70, 71, 72, 73, 74, 75, 76, 77, 78, 79,
          ]),
          import.meta.url,
        );
        return { default: e };
      })));
  }))();
}
v();
export { f as ArtifactTabContentShell };
