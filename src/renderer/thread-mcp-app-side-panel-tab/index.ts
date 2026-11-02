// @ts-nocheck
import { n as e } from "@rchunk/rolldown-runtime";
import { $3 as t, I3 as n } from "@rchunk/app-shared";
function r(e) {
  let t = (0, i.c)(2),
    { onPanelElementChange: n } = e,
    r;
  return (
    t[0] === n
      ? (r = t[1])
      : ((r = (0, a.jsx)(`div`, {
          className: `relative h-full min-h-0`,
          children: (0, a.jsx)(`div`, {
            ref: n,
            "data-mcp-app-side-panel-frame-container": `true`,
            className: `h-full min-h-0 w-full`,
          }),
        })),
        (t[0] = n),
        (t[1] = r)),
    r
  );
}
var i, a;
function o() {
  return (o = e(() => {
    ((i = t()), (a = n()));
  }))();
}
o();
export { r as McpAppThreadSidePanelTab };
