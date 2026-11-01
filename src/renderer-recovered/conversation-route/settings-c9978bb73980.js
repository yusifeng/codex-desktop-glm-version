import { n as e } from "./rolldown-runtime-2d059c5e81f4.js";
import { $3 as t, I3 as n, K2 as r, Y2 as i } from "./app-shared-7b9edc1bfb7f.js";
import { Slt as a, xlt as o } from "./app-initial-51da50e6c6e3.js";
import { n as s, t as c } from "./billing-analytics-9a493b3c8aaf.js";
function l(e) {
  let t = (0, u.c)(4),
    { isPolling: n } = e,
    r = n === void 0 || n,
    o = a(),
    s;
  t[0] === Symbol.for(`react.memo_cache_sentinel`)
    ? ((s = (0, d.jsx)(`p`, {
        className: `text-sm text-secondary`,
        children: (0, d.jsx)(i, {
          id: `settings.usage.enterprise.consumerOverride.subtitle`,
          defaultMessage: `Restricted view used solely for OpenAI internal testing. Shows your real usage in this workspace.`,
          description: `Explains that this restricted consumer analytics view is only for OpenAI internal testing and shows the signed-in member's real usage in the active workspace`,
        }),
      })),
      (t[0] = s))
    : (s = t[0]);
  let l;
  return (
    t[1] !== r || t[2] !== o
      ? ((l = (0, d.jsxs)(d.Fragment, {
          children: [
            s,
            (0, d.jsx)(c, {
              isPolling: r,
              canViewCreditSettings: !1,
              reduceMotion: o,
              scope: `consumer`,
              workspaceTaskUsage: !0,
            }),
          ],
        })),
        (t[1] = r),
        (t[2] = o),
        (t[3] = l))
      : (l = t[3]),
    l
  );
}
var u, d;
function f() {
  return (f = e(() => {
    ((u = t()), r(), o(), s(), (d = n()));
  }))();
}
f();
export { l as ConsumerViewSettings };
