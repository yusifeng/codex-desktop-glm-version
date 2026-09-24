// @ts-nocheck
const __vite__mapDeps = (
  i,
  m = __vite__mapDeps,
  d = m.f ||
    (m.f = [
      "./artifact-tab-content.electron-e84d3ae919ee.js",
      "./app-shared-7b9edc1bfb7f.js",
      "./rolldown-runtime-2d059c5e81f4.js",
      "./app-shared-fa570b9eb9dd.css",
      "./artifact-tab-content.electron-cf33641b2f73.js",
      "./app-initial-51da50e6c6e3.js",
      "./app-initial-e8ceb32eb626.css",
      "./spreadsheet-83d23b306ef9.js",
      "./presentation-7a65f7834d7c.js",
      "./app-primary-d66705000d76.js",
      "./app-primary-484df789f2f5.css",
      "./artifact-annotation-batch-controls-53978c934319.js",
      "./PopcornIcons-24d4b598a4a2.js",
      "./arrow-rotate-ccw-b6615005fd79.js",
      "./artifact-annotation-batch-controls-e72108cc6651.css",
      "./layout-5a59d75a028f.js",
      "./editor-header-c92933e59212.js",
      "./PopcornManualEditHeaderControls-eea43aa5aca3.js",
      "./editor-header-9f248c84e999.css",
      "./artifact-feedback-button-253b2bfc6015.js",
      "./thumb-mixed-e90a960095aa.js",
      "./artifact-annotation-comment-b8164badc366.js",
      "./sidebar-panel-bd17eff5e383.js",
      "./presentation-annotation-cursor-coachmark-3f855e97c16a.js",
      "./presentation-annotation-coachmark-4bfb0e56586c.js",
      "./open-in-library-item-e4d80785b9d3.js",
      "./version-history-d13a1166f97f.js",
      "./header-content-fade-9fcd899f41c6.js",
      "./artifact-originating-turn-1e474bff8fcc.js",
      "./artifact-preview-header-ac41e9149b7c.js",
      "./use-app-connect-flow-e16aee878521.js",
      "./app-connect-modal-7b842fd077d6.js",
      "./country-codes-1c845666fc28.js",
      "./google-logo-fc56f9e3f0e8.js",
      "./app-connect-modal-662390d53cb7.css",
      "./availability-66a6fa804bad.js",
      "./open-in-google-drive-menu-item-b5e143939095.js",
      "./use-target-apps-976e88a40210.js",
      "./codex-analytics-attribution-42c546370ade.js",
      "./review-file-source-item-67c1530ba71f.js",
      "./codex-diff-css-4cc1d2356a79.js",
      "./register-pierre-themes-58d8ca57f84b.js",
      "./File-4270090fca79.js",
      "./renderFileChildren-897963e963e5.js",
      "./diff-source-2ab086806e6a.js",
      "./highlight-selectors-452c942ff7fd.js",
      "./scroll-to-match-baaa6728db7d.js",
      "./compact-empty-state-7d00ecb673ed.js",
      "./review-preferences-model-677402e96a42.js",
      "./diff-comment-card-c051f69be383.js",
      "./diff-comment-card-2288e5b28f03.css",
      "./pull-request-readonly-comment-26219c5c2731.js",
      "./file-diff-d04472cf49af.js",
      "./file-diff-presentation-b78d448e2f9c.js",
      "./virtualized-file-diff-line-position-c13dbee45987.js",
      "./row-794dad9b1eb6.js",
      "./use-code-diff-context-menu-f898c5a2b28c.js",
      "./use-binary-preview-source-29f703b35d6d.js",
      "./surface-71cd73238841.js",
      "./review-file-tree-side-pane-b836c018bbe2.js",
      "./pull-request-actions-5ac6dcc71dec.js",
      "./pull-request-comment-9f228a526fbf.js",
      "./pull-request-code-review-navigation-52f3cbf2cccc.js",
      "./pull-request-revision-queries-f191743fff00.js",
      "./full-content-metadata-da5411b2ee3b.js",
      "./pull-request-detail-model-d93a8be7012c.js",
      "./arrow-curved-right-f88ac704e2f7.js",
      "./use-conversation-diff-comments-4360bc3ecccb.js",
      "./review-file-tree-pane-d59081dc4b8c.js",
      "./filter-alt-b31dfd74b521.js",
      "./review-file-source-breadcrumb-27a017fee86e.js",
      "./gate-c0654fbd7860.js",
      "./workspace-file-context-menu-trigger-91e9150d0a73.js",
      "./file-blank-b55ab355e982.js",
      "./file-viewer-frame-a1daeeecc14e.js",
      "./view-frame-5231451c05be.js",
      "./review-diff-virtualizer-metrics-cf31633f04e3.js",
      "./artifact-preview-status-fbc6b8b99901.js",
      "./artifact-preview-zoom-be9e5386c42a.js",
      "./right-panel-composer-overlay-alignment-95f87dd3a2a9.js",
    ]),
) => i.map((i) => d[i]);
import { n as e } from "./rolldown-runtime-2d059c5e81f4.js";
import {
  $3 as t,
  H3 as n,
  I3 as r,
  K2 as i,
  V3 as a,
  Y2 as o,
  e6 as s,
} from "./app-shared-7b9edc1bfb7f.js";
import { n as c, t as l } from "./layout-5a59d75a028f.js";
import { n as u, t as d } from "./pane-layout-da45b15f9a56.js";
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
              `./artifact-tab-content.electron-e84d3ae919ee.js`
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
