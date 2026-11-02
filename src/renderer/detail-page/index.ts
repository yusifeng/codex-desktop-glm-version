// @ts-nocheck
import { n as e } from "@rchunk/rolldown-runtime";
import { $3 as t, I3 as n, h4 as r, m4 as i } from "@rchunk/app-shared";
function a(e) {
  let t = (0, o.c)(3),
    { children: n } = e,
    r;
  t[0] === Symbol.for(`react.memo_cache_sentinel`)
    ? ((r = i(
        c,
        `@container mx-auto w-full max-w-[var(--thread-content-max-width)] [--detail-page-inline-inset:var(--padding-row-x)] [--detail-page-section-gap:calc(var(--spacing)*6)]`,
      )),
      (t[0] = r))
    : (r = t[0]);
  let a;
  return (
    t[1] === n
      ? (a = t[2])
      : ((a = (0, s.jsx)(`div`, { className: r, children: n })), (t[1] = n), (t[2] = a)),
    a
  );
}
var o, s, c;
function l() {
  return (l = e(() => {
    ((o = t()), r(), (s = n()), (c = `flex flex-col gap-[var(--detail-page-section-gap)]`));
  }))();
}
export { a as n, l as r, c as t };
