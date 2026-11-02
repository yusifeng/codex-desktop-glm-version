// @ts-nocheck
import { n as e } from "@rchunk/rolldown-runtime";
import { I3 as t } from "@rchunk/app-shared";
import { Grt as n, Irt as r, Lrt as i, Rrt as a } from "@rchunk/app-initial";
function o({ paginated: e }) {
  return {
    annotationControl: null,
    commentsControl: null,
    editingControls: null,
    navigationControl: e
      ? (0, s.jsx)(`span`, {
          inert: !0,
          "aria-hidden": !0,
          className: `pointer-events-none`,
          children: (0, s.jsx)(r, {
            currentPage: 1,
            onNextPage: c,
            onPreviousPage: c,
            totalPages: 1,
          }),
        })
      : null,
    supplementalActions: null,
    zoomControl: (0, s.jsx)(`span`, {
      inert: !0,
      "aria-hidden": !0,
      className: `pointer-events-none`,
      children: (0, s.jsx)(n, { zoomPercent: 100, onZoomPercentChange: c }),
    }),
  };
}
var s, c;
function l() {
  return (l = e(() => {
    (a(), i(), (s = t()), (c = () => void 0));
  }))();
}
export { l as n, o as t };
