// @ts-nocheck
import { areEquivalentPaths as r, normalizePathSeparators as a } from "../app-shared/runtime/path-key-policy";
import { n as e } from "@rchunk/rolldown-runtime";
import {
  $3 as t,
  I3 as n,
  RI as i,
  WK as o,
  kC as s,
  lw as c,
} from "@rchunk/app-shared";
import {
  Xd as l,
  Zd as u,
} from "@rchunk/app-initial";
import "@rchunk/terminal-panel-bootstrap";
function d(e) {
  let t = (0, m.c)(13),
    { title: n, cwd: r, homeDirectory: i, outputTail: a } = e,
    o;
  t[0] === Symbol.for(`react.memo_cache_sentinel`)
    ? ((o = (0, h.jsx)(s, {})), (t[0] = o))
    : (o = t[0]);
  let c;
  t[1] !== r || t[2] !== i || t[3] !== n
    ? ((c = p(n, r, i)), (t[1] = r), (t[2] = i), (t[3] = n), (t[4] = c))
    : (c = t[4]);
  let u;
  t[5] === a
    ? (u = t[6])
    : ((u = a?.length
        ? {
            kind: `text`,
            content: (0, h.jsx)(`span`, {
              className: `text-codex-terminal-foreground`,
              "data-codex-xterm": !0,
              children: a.map(f),
            }),
            lines: 8,
            variant: `code`,
          }
        : null),
      (t[5] = a),
      (t[6] = u));
  let d;
  t[7] === u ? (d = t[8]) : ((d = [u]), (t[7] = u), (t[8] = d));
  let g;
  return (
    t[9] !== c || t[10] !== d || t[11] !== n
      ? ((g = (0, h.jsx)(l, { icon: o, subtitle: c, title: n, sections: d })),
        (t[9] = c),
        (t[10] = d),
        (t[11] = n),
        (t[12] = g))
      : (g = t[12]),
    g
  );
}
function f(e, t) {
  return (0, h.jsx)(`span`, { style: e.style, children: e.text }, t);
}
function p(e, t, n) {
  if (t == null) return null;
  let i = a(e.trim());
  return (
    n != null && (i === `~` || i.startsWith(`~/`)) && (i = o(n, i.slice(2))),
    r(i, t) ? null : t
  );
}
var m, h;
function g() {
  return (g = e(() => {
    ((m = t()), u(), c(), i(), (h = n()));
  }))();
}
export { g as n, d as t };
