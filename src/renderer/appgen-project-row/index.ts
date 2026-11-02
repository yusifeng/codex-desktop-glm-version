// @ts-nocheck
import { n as e } from "@rchunk/rolldown-runtime";
import { $3 as t, FX as n, I3 as r, QI as i, h4 as a, m4 as o } from "@rchunk/app-shared";
import {
  Dft as s,
  E6t as c,
  RS as l,
  T6t as u,
  _an as d,
  a7 as f,
  wan as p,
  yZ as m,
} from "@rchunk/app-initial";
import { s as h } from "@rchunk/appgen-access";
import { i as g, o as _ } from "@rchunk/appgen-access-state-messages";
import { a as v, n as y } from "@rchunk/appgen-card-layout";
import { t as b } from "@rchunk/open-appgen-share-dialog";
import { i as x, n as S, o as C, r as w, t as T } from "@rchunk/sites-default-thumbnail";
var E, D, O, k;
function A() {
  return (A = e(() => {
    ((E = `_openButton_1l7k7_2`),
      (D = `_listAsset_1l7k7_2`),
      (O = `_gridAsset_1l7k7_2`),
      (k = { openButton: E, listAsset: D, gridAsset: O }));
  }))();
}
function j(e) {
  let t = (0, N.c)(4),
    { aspectRatio: n, screenshotUrl: r, viewMode: i } = e,
    { data: a } = p(r),
    s;
  return (
    t[0] !== n || t[1] !== a || t[2] !== i
      ? ((s =
          a == null
            ? (0, P.jsx)(M, { aspectRatio: n, viewMode: i })
            : (0, P.jsx)(y, {
                className: `flex items-center justify-center`,
                aspectRatio: n,
                viewMode: i,
                children: (0, P.jsx)(`img`, {
                  alt: ``,
                  className: o(
                    i === `list` ? k.listAsset : k.gridAsset,
                    i === `grid` ? `max-h-[72%] max-w-[72%]` : `max-h-full max-w-full`,
                    `object-contain`,
                  ),
                  loading: `lazy`,
                  src: a,
                }),
              })),
        (t[0] = n),
        (t[1] = a),
        (t[2] = i),
        (t[3] = s))
      : (s = t[3]),
    s
  );
}
function M(e) {
  let t = (0, N.c)(10),
    { aspectRatio: n, viewMode: r } = e,
    { platform: i } = c(),
    a = i === `windows` ? w : T,
    s = r === `list` ? k.listAsset : k.gridAsset,
    l = r === `list` ? `size-full` : `h-auto w-[72%]`,
    u;
  t[0] !== s || t[1] !== l ? ((u = o(s, l)), (t[0] = s), (t[1] = l), (t[2] = u)) : (u = t[2]);
  let d;
  t[3] !== a || t[4] !== u
    ? ((d = (0, P.jsx)(a, { "aria-hidden": !0, className: u })), (t[3] = a), (t[4] = u), (t[5] = d))
    : (d = t[5]);
  let f;
  return (
    t[6] !== n || t[7] !== d || t[8] !== r
      ? ((f = (0, P.jsx)(y, {
          className: `flex items-center justify-center`,
          aspectRatio: n,
          viewMode: r,
          children: d,
        })),
        (t[6] = n),
        (t[7] = d),
        (t[8] = r),
        (t[9] = f))
      : (f = t[9]),
    f
  );
}
var N, P;
function F() {
  return (F = e(() => {
    ((N = t()),
      a(),
      n(),
      s(),
      f(),
      l(),
      u(),
      m(),
      v(),
      i(),
      h(),
      _(),
      g(),
      C(),
      d(),
      b(),
      x(),
      S(),
      A(),
      (P = r()));
  }))();
}
export { F as n, j as t };
