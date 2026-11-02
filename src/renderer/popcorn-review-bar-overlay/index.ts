// @ts-nocheck
import { n as e } from "@rchunk/rolldown-runtime";
import { I3 as t } from "@rchunk/app-shared";
function n({ children: e, viewportInsets: t }) {
  return (0, r.jsx)(`div`, {
    className: `popcorn-review-bar-overlay`,
    "data-popcorn-review-bar": `true`,
    style: t,
    children: (0, r.jsx)(`div`, { className: `popcorn-review-bar-overlay-content`, children: e }),
  });
}
var r;
function i() {
  return (i = e(() => {
    r = t();
  }))();
}
export { i as n, n as t };
