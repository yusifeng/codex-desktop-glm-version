// @ts-nocheck
const __vite__mapDeps = (
  i,
  m = __vite__mapDeps,
  d = m.f ||
    (m.f = [
      "@rchunk/shell-textmate-grammar",
      "@rchunk/rolldown-runtime",
      "@rchunk/swift-textmate-grammar",
      "@exact-chunk/dist-e0e1dd5f7b9f.js",
      "@exact-chunk/dist-b08b159deede.js",
      "@rchunk/codemirror-state-runtime",
      "@exact-chunk/dist-ad7e2bb8433e.js",
      "@rchunk/codemirror-view-runtime",
      "@rchunk/app-shared",
      "./app-shared-fa570b9eb9dd.css",
      "@exact-chunk/dist-6c07c37ac5cf.js",
      "@rchunk/codemirror-language-runtime",
      "@exact-chunk/dist-fce68e279688.js",
      "@rchunk/codemirror-commands-runtime",
      "@rchunk/diff-worker-runtime-parser",
      "@exact-chunk/dist-4d0af915d2c7.js",
      "@exact-chunk/dist-5f3b979f6042.js",
      "@rchunk/codemirror-json-runtime",
      "@exact-chunk/dist-e57f9dd71fd9.js",
      "@rchunk/diff-worker-algorithm-parser",
      "@exact-chunk/dist-bb15462d19af.js",
      "@exact-chunk/dist-d3d163026d8c.js",
      "@rchunk/diff-worker-renderer-parser",
      "@exact-chunk/dist-d5dd03b951f2.js",
      "@exact-chunk/dist-d6b4a14570bf.js",
      "@rchunk/diff-worker-utils-parser",
      "@exact-chunk/dist-36a943344ead.js",
      "@rchunk/diff-worker-model-parser",
      "@exact-chunk/dist-eb3db1b44f9c.js",
      "@exact-chunk/dist-e0c27992a03d.js",
      "@exact-chunk/dist-8c3f059ab4f8.js",
      "@exact-chunk/dist-cdf530b7ad54.js",
      "@rchunk/ruby-textmate-grammar",
      "@rchunk/haskell-syntax-definition",
      "@rchunk/clike-syntax-definition",
      "@rchunk/codemirror-visual-basic-mode",
      "@rchunk/r-textmate-grammar",
      "@rchunk/lua-textmate-grammar",
      "@rchunk/perl-textmate-grammar",
      "@rchunk/commonlisp-syntax-definition",
      "@rchunk/clojure-syntax-definition",
      "@rchunk/mllike-textmate-grammar",
      "@rchunk/powershell-textmate-grammar",
      "@rchunk/codemirror-verilog-mode",
      "@rchunk/dockerfile-syntax-definition",
    ]),
) => i.map((i) => d[i]);
import { n as e } from "@rchunk/rolldown-runtime";
import {
  $3 as t,
  H3 as n,
  I3 as r,
  K2 as i,
  V3 as a,
  e6 as o,
  h4 as s,
  m4 as c,
  n4 as l,
} from "@rchunk/app-shared";
import {
  $ as u,
  H as d,
  M as f,
  R as p,
  _t as m,
  c as h,
  g,
  o as _,
  st as v,
  tt as y,
  ut as b,
  w as x,
  z as ee,
} from "@rchunk/codemirror-view-runtime";
import { a as S, r as te } from "@rchunk/codemirror-commands-runtime";
import { a as C, i as w, n as T, o as E, t as D } from "@rchunk/text-editor-merge-runtime";
import { n as O, r as k } from "@rchunk/chatgpt-code-block-highlighting";
function A(e) {
  return Object.hasOwn(F, e);
}
function j(e) {
  if (I.has(e)) return Promise.resolve(I.get(e) ?? null);
  let t = L.get(e);
  if (t != null) return t;
  if (!Object.hasOwn(F, e)) return Promise.resolve(null);
  let n = Promise.resolve(F[e]())
    .then((t) => (I.set(e, t), t))
    .catch(() => null)
    .finally(() => {
      L.delete(e);
    });
  return (L.set(e, n), n);
}
function M(e) {
  return I.get(e) ?? null;
}
function N(e) {
  return new _(h.define(e));
}
var P, F, I, L;
function R() {
  return (R = e(() => {
    (x(),
      n(),
      (P = () =>
        a(
          () => import(`@rchunk/shell-textmate-grammar`).then((e) => N(e.shell)),
          __vite__mapDeps([0, 1]),
          import.meta.url,
        )),
      (F = {
        bash: P,
        zsh: P,
        swift: () =>
          a(
            () => import(`@rchunk/swift-textmate-grammar`).then((e) => N(e.swift)),
            __vite__mapDeps([2, 1]),
            import.meta.url,
          ),
        css: () =>
          a(
            () => import(`@exact-chunk/dist-e0e1dd5f7b9f.js`).then((e) => e.css()),
            __vite__mapDeps([3, 4, 1, 5, 6, 7, 8, 9]),
            import.meta.url,
          ),
        html: () =>
          a(
            () => import(`@exact-chunk/dist-6c07c37ac5cf.js`).then((e) => e.html()),
            __vite__mapDeps([10, 11, 1, 5, 6, 7, 8, 9, 4, 12, 13, 14]),
            import.meta.url,
          ),
        javascript: () =>
          a(
            () =>
              import(`@exact-chunk/dist-4d0af915d2c7.js`).then((e) =>
                e.javascript({ jsx: !0, typescript: !1 }),
              ),
            __vite__mapDeps([15, 12, 1, 5, 7, 8, 9, 13, 14, 6]),
            import.meta.url,
          ),
        typescript: () =>
          a(
            () =>
              import(`@exact-chunk/dist-4d0af915d2c7.js`).then((e) =>
                e.javascript({ jsx: !0, typescript: !0 }),
              ),
            __vite__mapDeps([15, 12, 1, 5, 7, 8, 9, 13, 14, 6]),
            import.meta.url,
          ),
        json: () =>
          a(
            () => import(`@exact-chunk/dist-5f3b979f6042.js`).then((e) => e.json()),
            __vite__mapDeps([16, 17, 1, 5, 6, 7, 8, 9]),
            import.meta.url,
          ),
        python: () =>
          a(
            () => import(`@exact-chunk/dist-e57f9dd71fd9.js`).then((e) => e.python()),
            __vite__mapDeps([18, 1, 5, 7, 8, 9, 13, 19, 6]),
            import.meta.url,
          ),
        sql: () =>
          a(
            () => import(`@exact-chunk/dist-bb15462d19af.js`).then((e) => e.sql()),
            __vite__mapDeps([20, 1, 5, 6, 7, 8, 9, 13]),
            import.meta.url,
          ),
        go: () =>
          a(
            () => import(`@exact-chunk/dist-d3d163026d8c.js`).then((e) => e.go()),
            __vite__mapDeps([21, 1, 5, 7, 8, 9, 22, 6, 13]),
            import.meta.url,
          ),
        yaml: () =>
          a(
            () => import(`@exact-chunk/dist-d5dd03b951f2.js`).then((e) => e.yaml()),
            __vite__mapDeps([23, 1, 5, 6, 7, 8, 9]),
            import.meta.url,
          ),
        java: () =>
          a(
            () => import(`@exact-chunk/dist-d6b4a14570bf.js`).then((e) => e.java()),
            __vite__mapDeps([24, 1, 7, 8, 9, 5, 25, 6]),
            import.meta.url,
          ),
        rust: () =>
          a(
            () => import(`@exact-chunk/dist-36a943344ead.js`).then((e) => e.rust()),
            __vite__mapDeps([26, 1, 7, 8, 9, 5, 27, 6]),
            import.meta.url,
          ),
        cpp: () =>
          a(
            () => import(`@exact-chunk/dist-eb3db1b44f9c.js`).then((e) => e.cpp()),
            __vite__mapDeps([28, 1, 5, 6, 7, 8, 9]),
            import.meta.url,
          ),
        php: () =>
          a(
            () => import(`@exact-chunk/dist-e0c27992a03d.js`).then((e) => e.php()),
            __vite__mapDeps([29, 1, 5, 6, 7, 8, 9, 11, 4, 12, 13, 14]),
            import.meta.url,
          ),
        xml: () =>
          a(
            () => import(`@exact-chunk/dist-8c3f059ab4f8.js`).then((e) => e.xml()),
            __vite__mapDeps([30, 1, 5, 6, 7, 8, 9]),
            import.meta.url,
          ),
        vue: () =>
          a(
            () => import(`@exact-chunk/dist-cdf530b7ad54.js`).then((e) => e.vue()),
            __vite__mapDeps([31, 1, 5, 6, 7, 8, 9, 11, 4, 12, 13, 14]),
            import.meta.url,
          ),
        ruby: () =>
          a(
            () => import(`@rchunk/ruby-textmate-grammar`).then((e) => N(e.ruby)),
            __vite__mapDeps([32, 1]),
            import.meta.url,
          ),
        haskell: () =>
          a(
            () => import(`@rchunk/haskell-syntax-definition`).then((e) => N(e.haskell)),
            __vite__mapDeps([33, 1]),
            import.meta.url,
          ),
        kotlin: () =>
          a(
            () => import(`@rchunk/clike-syntax-definition`).then((e) => N(e.kotlin)),
            __vite__mapDeps([34, 1]),
            import.meta.url,
          ),
        csharp: () =>
          a(
            () => import(`@rchunk/clike-syntax-definition`).then((e) => N(e.csharp)),
            __vite__mapDeps([34, 1]),
            import.meta.url,
          ),
        vb: () =>
          a(
            () => import(`@rchunk/codemirror-visual-basic-mode`).then((e) => N(e.vb)),
            __vite__mapDeps([35, 1]),
            import.meta.url,
          ),
        c: () =>
          a(
            () => import(`@rchunk/clike-syntax-definition`).then((e) => N(e.c)),
            __vite__mapDeps([34, 1]),
            import.meta.url,
          ),
        objectivec: () =>
          a(
            () => import(`@rchunk/clike-syntax-definition`).then((e) => N(e.objectiveC)),
            __vite__mapDeps([34, 1]),
            import.meta.url,
          ),
        r: () =>
          a(
            () => import(`@rchunk/r-textmate-grammar`).then((e) => N(e.r)),
            __vite__mapDeps([36, 1]),
            import.meta.url,
          ),
        lua: () =>
          a(
            () => import(`@rchunk/lua-textmate-grammar`).then((e) => N(e.lua)),
            __vite__mapDeps([37, 1]),
            import.meta.url,
          ),
        dart: () =>
          a(
            () => import(`@rchunk/clike-syntax-definition`).then((e) => N(e.dart)),
            __vite__mapDeps([34, 1]),
            import.meta.url,
          ),
        scala: () =>
          a(
            () => import(`@rchunk/clike-syntax-definition`).then((e) => N(e.scala)),
            __vite__mapDeps([34, 1]),
            import.meta.url,
          ),
        perl: () =>
          a(
            () => import(`@rchunk/perl-textmate-grammar`).then((e) => N(e.perl)),
            __vite__mapDeps([38, 1]),
            import.meta.url,
          ),
        commonlisp: () =>
          a(
            () => import(`@rchunk/commonlisp-syntax-definition`).then((e) => N(e.commonLisp)),
            __vite__mapDeps([39, 1]),
            import.meta.url,
          ),
        clojure: () =>
          a(
            () => import(`@rchunk/clojure-syntax-definition`).then((e) => N(e.clojure)),
            __vite__mapDeps([40, 1]),
            import.meta.url,
          ),
        ocaml: () =>
          a(
            () => import(`@rchunk/mllike-textmate-grammar`).then((e) => N(e.oCaml)),
            __vite__mapDeps([41, 1]),
            import.meta.url,
          ),
        powershell: () =>
          a(
            () => import(`@rchunk/powershell-textmate-grammar`).then((e) => N(e.powerShell)),
            __vite__mapDeps([42, 1]),
            import.meta.url,
          ),
        verilog: () =>
          a(
            () => import(`@rchunk/codemirror-verilog-mode`).then((e) => N(e.verilog)),
            __vite__mapDeps([43, 1]),
            import.meta.url,
          ),
        dockerfile: () =>
          a(
            () => import(`@rchunk/dockerfile-syntax-definition`).then((e) => N(e.dockerFile)),
            __vite__mapDeps([44, 1]),
            import.meta.url,
          ),
      }),
      (I = new Map()),
      (L = new Map()));
  }))();
}
function z(e) {
  let t = (0, V.c)(54),
    {
      ref: n,
      className: r,
      code: i,
      editorStateRef: a,
      language: o,
      placeholder: s,
      wrapLines: u,
      onBlur: p,
      onChange: m,
    } = e,
    h = u !== void 0 && u,
    _ = l(),
    [x, S] = (0, H.useState)(null),
    E = (0, H.useRef)(null),
    k = (0, H.useRef)(null),
    [A] = (0, H.useState)(ne),
    N = (0, H.useEffectEvent)(m),
    P = (0, H.useEffectEvent)(p),
    F;
  t[0] === _
    ? (F = t[1])
    : ((F = _.formatMessage({
        id: `chatgpt.codeBlocks.editor.ariaLabel`,
        defaultMessage: `Edit code`,
        description: `Accessible label for an editable code block in a ChatGPT conversation or its execution dialog`,
      })),
      (t[0] = _),
      (t[1] = F));
  let I = F,
    L;
  (t[2] === Symbol.for(`react.memo_cache_sentinel`)
    ? ((L = () => ({ focus: () => k.current?.focus() })), (t[2] = L))
    : (L = t[2]),
    (0, H.useImperativeHandle)(n, L));
  let R;
  t[3] !== i ||
  t[4] !== A.a11y ||
  t[5] !== A.language ||
  t[6] !== A.placeholder ||
  t[7] !== A.wrapping ||
  t[8] !== a ||
  t[9] !== I ||
  t[10] !== o ||
  t[11] !== P ||
  t[12] !== N ||
  t[13] !== s ||
  t[14] !== h
    ? ((R = (e) => {
        let t = [
            O,
            A.language.of(o == null ? [] : (M(o) ?? [])),
            A.wrapping.of(h ? f.lineWrapping : []),
            A.placeholder.of(s == null ? [] : d(s)),
            A.a11y.of(
              f.contentAttributes.of({
                "aria-label": I,
                "aria-multiline": `true`,
                spellcheck: `false`,
              }),
            ),
            T(),
            ee.of([...D, ...g, ...te, ...w, C]),
            f.updateListener.of((e) => {
              ((E.current = e.state),
                a != null && (a.current = e.state),
                e.docChanged && N(e.state.doc.toString()));
            }),
            f.domEventHandlers({ blur: () => P() }),
          ],
          n = a == null ? E.current : a.current,
          r =
            n == null
              ? y.create({ doc: i, extensions: t })
              : n.update({
                  effects: v.reconfigure.of(t),
                  changes:
                    n.doc.toString() === i ? void 0 : { from: 0, to: n.doc.length, insert: i },
                  annotations: b.addToHistory.of(!1),
                }).state,
          c = new f({ parent: e, state: r });
        return (
          (E.current = r),
          a != null && (a.current = r),
          (k.current = c),
          c.focus(),
          () => {
            ((E.current = c.state),
              a != null && (a.current = c.state),
              (k.current = null),
              c.destroy());
          }
        );
      }),
      (t[3] = i),
      (t[4] = A.a11y),
      (t[5] = A.language),
      (t[6] = A.placeholder),
      (t[7] = A.wrapping),
      (t[8] = a),
      (t[9] = I),
      (t[10] = o),
      (t[11] = P),
      (t[12] = N),
      (t[13] = s),
      (t[14] = h),
      (t[15] = R))
    : (R = t[15]);
  let z = (0, H.useEffectEvent)(R),
    W;
  t[16] !== x || t[17] !== z
    ? ((W = () => {
        if (x != null) return z(x);
      }),
      (t[16] = x),
      (t[17] = z),
      (t[18] = W))
    : (W = t[18]);
  let G;
  (t[19] !== x || t[20] !== a ? ((G = [x, a]), (t[19] = x), (t[20] = a), (t[21] = G)) : (G = t[21]),
    (0, H.useLayoutEffect)(W, G));
  let K;
  t[22] !== A.language || t[23] !== o
    ? ((K = () => {
        let e = k.current;
        if (
          e == null ||
          (e.dispatch({ effects: A.language.reconfigure(o == null ? [] : (M(o) ?? [])) }),
          o == null)
        )
          return;
        let t = !1;
        return (
          j(o).then((n) => {
            !t && k.current === e && e.dispatch({ effects: A.language.reconfigure(n ?? []) });
          }),
          () => {
            t = !0;
          }
        );
      }),
      (t[22] = A.language),
      (t[23] = o),
      (t[24] = K))
    : (K = t[24]);
  let q;
  (t[25] !== A || t[26] !== x || t[27] !== a || t[28] !== o
    ? ((q = [A, x, a, o]), (t[25] = A), (t[26] = x), (t[27] = a), (t[28] = o), (t[29] = q))
    : (q = t[29]),
    (0, H.useEffect)(K, q));
  let J;
  t[30] !== A.a11y ||
  t[31] !== A.placeholder ||
  t[32] !== A.wrapping ||
  t[33] !== I ||
  t[34] !== s ||
  t[35] !== h
    ? ((J = () => {
        k.current?.dispatch({
          effects: [
            A.wrapping.reconfigure(h ? f.lineWrapping : []),
            A.placeholder.reconfigure(s == null ? [] : d(s)),
            A.a11y.reconfigure(
              f.contentAttributes.of({
                "aria-label": I,
                "aria-multiline": `true`,
                spellcheck: `false`,
              }),
            ),
          ],
        });
      }),
      (t[30] = A.a11y),
      (t[31] = A.placeholder),
      (t[32] = A.wrapping),
      (t[33] = I),
      (t[34] = s),
      (t[35] = h),
      (t[36] = J))
    : (J = t[36]);
  let Y;
  (t[37] !== A || t[38] !== x || t[39] !== a || t[40] !== I || t[41] !== s || t[42] !== h
    ? ((Y = [A, x, I, a, h, s]),
      (t[37] = A),
      (t[38] = x),
      (t[39] = a),
      (t[40] = I),
      (t[41] = s),
      (t[42] = h),
      (t[43] = Y))
    : (Y = t[43]),
    (0, H.useEffect)(J, Y));
  let X;
  t[44] === i
    ? (X = t[45])
    : ((X = () => {
        let e = k.current;
        e != null &&
          e.state.doc.toString() !== i &&
          e.dispatch({ changes: { from: 0, to: e.state.doc.length, insert: i } });
      }),
      (t[44] = i),
      (t[45] = X));
  let Z;
  (t[46] !== i || t[47] !== x || t[48] !== a
    ? ((Z = [i, x, a]), (t[46] = i), (t[47] = x), (t[48] = a), (t[49] = Z))
    : (Z = t[49]),
    (0, H.useEffect)(X, Z));
  let Q;
  t[50] === r
    ? (Q = t[51])
    : ((Q = c(`min-h-24 w-full overflow-auto text-size-code`, r)), (t[50] = r), (t[51] = Q));
  let $;
  return (
    t[52] === Q
      ? ($ = t[53])
      : (($ = (0, U.jsx)(`div`, { ref: S, className: Q, dir: `ltr`, onCopy: B })),
        (t[52] = Q),
        (t[53] = $)),
    $
  );
}
function B(e) {
  e.target instanceof Element && e.target.closest(`.cm-editor`) && e.stopPropagation();
}
function ne() {
  return { language: new u(), wrapping: new u(), a11y: new u(), placeholder: new u() };
}
var V, H, U;
function W() {
  return (W = e(() => {
    ((V = t()), S(), E(), x(), m(), p(), s(), (H = o()), i(), k(), R(), (U = r()));
  }))();
}
export { A as a, M as i, W as n, R as o, j as r, z as t };
