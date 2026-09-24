// @ts-nocheck
import { n as e } from "./rolldown-runtime-2d059c5e81f4.js";
import { I3 as t, K2 as n, Y2 as r } from "./app-shared-7b9edc1bfb7f.js";
import { $at as i, eot as a } from "./app-initial-51da50e6c6e3.js";
function o(e) {
  return e === `error`
    ? (0, s.jsx)(i, {
        className: `h-full`,
        children: (0, s.jsx)(r, {
          id: `artifactTab.previewError`,
          defaultMessage: `Couldn’t load this preview`,
          description: `Error state shown when an artifact preview fails to load`,
        }),
      })
    : null;
}
var s;
function c() {
  return (c = e(() => {
    (n(), a(), (s = t()));
  }))();
}
export { o as n, c as t };
