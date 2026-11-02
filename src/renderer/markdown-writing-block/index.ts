// @ts-nocheck
import { n as e } from "@rchunk/rolldown-runtime";
import {
  $3 as t,
  I3 as n,
  K2 as r,
  Xm as i,
  Y2 as a,
  Yh as o,
  Ym as s,
  Zh as c,
  dg as l,
  e6 as u,
  fg as d,
} from "@rchunk/app-shared";
import { d6 as f, u6 as p } from "@rchunk/app-initial";
import { i as m, r as h } from "@rchunk/writing-block-surface";
import { n as g, t as _ } from "@rchunk/writing-block-copy-button";
function v(e) {
  let t = (0, b.c)(21),
    { className: n, content: r, onAddSelectedTextToChat: i, showCopyButton: c } = e,
    l = c === void 0 || c,
    u = (0, x.useRef)(null),
    f = d(),
    m;
  t[0] !== r || t[1] !== i
    ? ((m = () => {
        let e = r.trim(),
          t = u.current;
        if (e.length === 0 || t == null) return;
        let n = t.ownerDocument.createRange();
        (n.selectNodeContents(t), i?.(e, n));
      }),
      (t[0] = r),
      (t[1] = i),
      (t[2] = m))
    : (m = t[2]);
  let g = m,
    v;
  t[3] === r
    ? (v = t[4])
    : ((v = (e) => {
        s(r, e);
      }),
      (t[3] = r),
      (t[4] = v));
  let C = v,
    w = f ? `dark` : `light`,
    T;
  t[5] !== g || t[6] !== i
    ? ((T =
        i == null
          ? null
          : (0, S.jsxs)(o, {
              color: `outline`,
              size: `composer`,
              onMouseDown: y,
              onClick: g,
              children: [
                (0, S.jsx)(p, { "aria-hidden": `true`, className: `icon-2xs` }),
                (0, S.jsx)(a, {
                  id: `selectedTextOverlay.addToCodex`,
                  defaultMessage: `Add to chat`,
                  description: `Button label for adding currently selected text from an overlay anchored to that selection to the chat`,
                }),
              ],
            })),
      (t[5] = g),
      (t[6] = i),
      (t[7] = T))
    : (T = t[7]);
  let E;
  t[8] !== C || t[9] !== l
    ? ((E = l ? (0, S.jsx)(_, { className: `ms-auto`, onCopy: C }) : null),
      (t[8] = C),
      (t[9] = l),
      (t[10] = E))
    : (E = t[10]);
  let D;
  t[11] !== T || t[12] !== E
    ? ((D = (0, S.jsxs)(`div`, {
        "data-markdown-copy": `exclude`,
        className: `flex items-center px-2 pt-2 pb-2 font-sans text-sm text-codex-description select-none`,
        children: [T, E],
      })),
      (t[11] = T),
      (t[12] = E),
      (t[13] = D))
    : (D = t[13]);
  let O;
  t[14] === r
    ? (O = t[15])
    : ((O = (0, S.jsx)(`div`, {
        ref: u,
        className: `overflow-auto px-4 pt-2 pb-4 text-size-chat whitespace-pre-wrap [unicode-bidi:plaintext]`,
        dir: `auto`,
        children: r,
      })),
      (t[14] = r),
      (t[15] = O));
  let k;
  return (
    t[16] !== n || t[17] !== w || t[18] !== D || t[19] !== O
      ? ((k = (0, S.jsxs)(h, {
          "data-markdown-copy": `code-block`,
          className: n,
          "data-theme": w,
          children: [D, O],
        })),
        (t[16] = n),
        (t[17] = w),
        (t[18] = D),
        (t[19] = O),
        (t[20] = k))
      : (k = t[20]),
    k
  );
}
function y(e) {
  e.preventDefault();
}
var b, x, S;
function C() {
  return (C = e(() => {
    ((b = t()), (x = u()), r(), c(), f(), i(), l(), g(), m(), (S = n()));
  }))();
}
C();
export { v as MarkdownWritingBlock };
