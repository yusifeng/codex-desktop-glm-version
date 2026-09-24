// @ts-nocheck
import { n as e } from "./rolldown-runtime-2d059c5e81f4.js";
import { $3 as t, I3 as n } from "./app-shared-7b9edc1bfb7f.js";
import {
  M6t as r,
  N6t as i,
  Qgn as a,
  Ygn as o,
  i_n as s,
  l_n as c,
  o_n as l,
} from "./app-initial-51da50e6c6e3.js";
import { n as u, t as d } from "./shared-task-dialog-e860488923dd.js";
function f() {
  let e = (0, p.c)(15),
    { postId: t } = c(),
    { search: n, hash: r, state: a } = s(),
    u = l(),
    { authMethod: f, isLoading: h } = i();
  if (h) return null;
  if (t == null) {
    let t;
    return (
      e[0] === Symbol.for(`react.memo_cache_sentinel`)
        ? ((t = (0, m.jsx)(o, { to: `/`, replace: !0 })), (e[0] = t))
        : (t = e[0]),
      t
    );
  }
  if (f === `chatgpt`) {
    let i;
    e[1] !== t || e[2] !== n
      ? ((i = new URLSearchParams(n)), i.set(`shared_task`, t), (e[1] = t), (e[2] = n), (e[3] = i))
      : (i = e[3]);
    let s = `?${i}`,
      c;
    e[4] !== r || e[5] !== s
      ? ((c = { pathname: `/scheduled`, search: s, hash: r }), (e[4] = r), (e[5] = s), (e[6] = c))
      : (c = e[6]);
    let l;
    return (
      e[7] !== a || e[8] !== c
        ? ((l = (0, m.jsx)(o, { to: c, state: a, replace: !0 })),
          (e[7] = a),
          (e[8] = c),
          (e[9] = l))
        : (l = e[9]),
      l
    );
  }
  let g;
  e[10] === u ? (g = e[11]) : ((g = () => void u(`/`)), (e[10] = u), (e[11] = g));
  let _;
  return (
    e[12] !== t || e[13] !== g
      ? ((_ = (0, m.jsx)(d, { postId: t, onClose: g })), (e[12] = t), (e[13] = g), (e[14] = _))
      : (_ = e[14]),
    _
  );
}
var p, m;
function h() {
  return (h = e(() => {
    ((p = t()), a(), r(), u(), (m = n()));
  }))();
}
h();
export { f as ScheduledSharedTaskRoute };
