import { n as e } from "./rolldown-runtime-2d059c5e81f4.js";
import { $3 as t, I3 as n, K2 as r, Y2 as i } from "./app-shared-7b9edc1bfb7f.js";
import { Xl as a, Yl as o, au as s, su as c } from "./app-initial-51da50e6c6e3.js";
import { n as l, t as u } from "./plugins-settings-a104e9fe3d0b.js";
function d() {
  let e = (0, f.c)(1),
    t;
  return (
    e[0] === Symbol.for(`react.memo_cache_sentinel`)
      ? ((t = (0, p.jsx)(s, {
          title: (0, p.jsx)(o, { slug: `mcp-settings` }),
          subtitle: (0, p.jsx)(i, {
            id: `settings.section.mcp-settings.subtitle`,
            defaultMessage: `Connect external tools and data sources`,
            description: `Subtitle for MCP settings section`,
          }),
          children: (0, p.jsx)(u, { manageOnly: !0 }),
        })),
        (e[0] = t))
      : (t = e[0]),
    t
  );
}
var f, p;
function m() {
  return (m = e(() => {
    ((f = t()), r(), c(), a(), l(), (p = n()));
  }))();
}
m();
export { d as McpSettings };
