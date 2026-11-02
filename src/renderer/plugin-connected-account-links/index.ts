// @ts-nocheck
import { n as e } from "@rchunk/rolldown-runtime";
import { $3 as t, I3 as n } from "@rchunk/app-shared";
import { q6t as r } from "@rchunk/app-initial";
function i(e) {
  let t = (0, a.c)(3),
    { ariaLabel: n, icon: r } = e,
    i;
  return (
    t[0] !== n || t[1] !== r
      ? ((i = (0, o.jsx)(`span`, {
          role: `img`,
          "aria-label": n,
          className: `flex h-7 w-7 items-center justify-center rounded-md text-codex-description`,
          children: r,
        })),
        (t[0] = n),
        (t[1] = r),
        (t[2] = i))
      : (i = t[2]),
    i
  );
}
var a, o;
function s() {
  return (s = e(() => {
    ((a = t()), (o = n()));
  }))();
}
function c(e, t) {
  let n = r(t);
  return e.filter(
    (e) =>
      r(e.connector_id) === n && e.visibility !== `HIDDEN` && !e.id.startsWith(`implicit_link::`),
  );
}
function l() {
  return (l = e(() => {}))();
}
export { s as i, l as n, i as r, c as t };
