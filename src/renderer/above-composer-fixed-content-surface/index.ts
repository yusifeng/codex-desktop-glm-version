// @ts-nocheck
import { n as e } from "@rchunk/rolldown-runtime";
import { $3 as t, I3 as n, a$ as r, o$ as i } from "@rchunk/app-shared";
function a(e) {
  let t = (0, o.c)(5),
    { children: n, transition: r } = e,
    a;
  t[0] === n
    ? (a = t[1])
    : ((a = (0, s.jsx)(`div`, {
        className: `flex w-max max-w-full min-w-0 items-center gap-2 rounded-3xl border border-border/80 bg-background-primary-soft/70 px-3 py-1.5 text-default backdrop-blur-sm`,
        children: n,
      })),
      (t[0] = n),
      (t[1] = a));
  let c;
  return (
    t[2] !== a || t[3] !== r
      ? ((c = (0, s.jsx)(`div`, {
          className: `flex w-full max-w-(--thread-content-max-width) min-w-0 justify-center`,
          children: (0, s.jsx)(i.div, {
            layout: `size`,
            transition: r,
            className: `relative z-10 w-fit max-w-full min-w-0 overflow-hidden rounded-3xl`,
            children: a,
          }),
        })),
        (t[2] = a),
        (t[3] = r),
        (t[4] = c))
      : (c = t[4]),
    c
  );
}
var o, s;
function c() {
  return (c = e(() => {
    ((o = t()), r(), (s = n()));
  }))();
}
export { c as n, a as t };
