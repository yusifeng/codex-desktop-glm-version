// @ts-nocheck
import { n as e } from "@rchunk/rolldown-runtime";
import { I3 as t, K2 as n, Y2 as r } from "@rchunk/app-shared";
import { $at as i, eot as a } from "@rchunk/app-initial";
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
