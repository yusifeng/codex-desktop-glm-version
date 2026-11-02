// @ts-nocheck
import { n as e } from "@rchunk/rolldown-runtime";
import { $3 as t, K3 as n, W3 as r } from "@rchunk/app-shared";
function i(e) {
  let t = (0, a.c)(5),
    { enabled: r, onToggle: i } = e,
    o;
  t[0] !== r || t[1] !== i
    ? ((o = () => {
        r && i();
      }),
      (t[0] = r),
      (t[1] = i),
      (t[2] = o))
    : (o = t[2]);
  let s;
  return (
    t[3] === r ? (s = t[4]) : ((s = [r]), (t[3] = r), (t[4] = s)),
    n(`toggle-thread-pin`, o, s),
    null
  );
}
var a;
function o() {
  return (o = e(() => {
    ((a = t()), r());
  }))();
}
export { o as n, i as t };
