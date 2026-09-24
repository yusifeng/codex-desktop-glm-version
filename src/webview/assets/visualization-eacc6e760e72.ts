// @ts-nocheck
import { n as e } from "./rolldown-runtime-2d059c5e81f4.js";
import { I3 as t, K2 as n, e6 as r, h4 as i, m4 as a, n4 as o } from "./app-shared-7b9edc1bfb7f.js";
import { a as s, n as c, r as l, t as u } from "./control-panel-9789995ccf0d.js";
import { a as d, n as f } from "./input-selector-d6854a7f5fbb.js";
import { n as p, r as m, t as h } from "./input-selector-group-c5ab39b64319.js";
var g, _, v, y, b, x, S, C;
function w() {
  return (w = e(() => {
    ((g = `_root_1j5yq_1`),
      (_ = `_grid_1j5yq_5`),
      (v = `_cell_1j5yq_13`),
      (y = `_chromosomes_1j5yq_20`),
      (b = `_label_1j5yq_28`),
      (x = `_extraLabel_1j5yq_33`),
      (S = `_thumbnail_1j5yq_37`),
      (C = { root: g, grid: _, cell: v, chromosomes: y, label: b, extraLabel: x, thumbnail: S }));
  }))();
}
var T, E, D, O, k, A, j, M, N, P, F, I, L, R, z;
function B() {
  return (B = e(() => {
    (i(),
      (T = r()),
      n(),
      s(),
      d(),
      m(),
      w(),
      (E = t()),
      (D = [`typical-xx`, `typical-xy`, `trisomy-21-xx`, `trisomy-21-xy`]),
      (O = [
        52, 49, 46, 43, 41, 39, 37, 35, 34, 32, 31, 30, 29, 28, 27, 25, 24, 23, 21, 22, 17, 19,
      ]),
      (k = [
        0.44, 0.39, 0.43, 0.32, 0.34, 0.43, 0.38, 0.39, 0.36, 0.42, 0.36, 0.4, 0.24, 0.25, 0.25,
        0.39, 0.42, 0.33, 0.44, 0.4, 0.25, 0.27,
      ]),
      (A = [
        [
          [0.244, 0.275],
          [0.278, 0.339],
          [0.861, 0.899],
          [0.95, 0.978],
        ],
        [
          [0.226, 0.252],
          [0.309, 0.343],
          [0.502, 0.533],
          [0.752, 0.778],
        ],
        [
          [0.082, 0.12],
          [0.322, 0.351],
          [0.722, 0.752],
          [0.812, 0.847],
        ],
        [
          [0.146, 0.188],
          [0.308, 0.344],
          [0.595, 0.63],
          [0.684, 0.728],
        ],
        [
          [0.46, 0.512],
          [0.638, 0.673],
          [0.799, 0.828],
          [0.884, 0.931],
        ],
        [
          [0.089, 0.148],
          [0.367, 0.405],
          [0.44, 0.487],
          [0.691, 0.737],
        ],
        [
          [0.045, 0.086],
          [0.233, 0.272],
          [0.489, 0.544],
          [0.677, 0.722],
        ],
        [
          [0.088, 0.132],
          [0.2, 0.253],
          [0.515, 0.575],
          [0.592, 0.636],
        ],
        [
          [0.065, 0.103],
          [0.144, 0.185],
          [0.515, 0.553],
          [0.721, 0.762],
        ],
        [
          [0.382, 0.444],
          [0.469, 0.514],
          [0.6, 0.644],
          [0.777, 0.823],
        ],
        [
          [0.021, 0.087],
          [0.269, 0.321],
          [0.573, 0.636],
          [0.762, 0.819],
        ],
        [
          [0.11, 0.149],
          [0.284, 0.345],
          [0.6, 0.648],
          [0.719, 0.759],
        ],
        [
          [0.305, 0.345],
          [0.595, 0.637],
          [0.686, 0.762],
          [0.782, 0.825],
        ],
        [
          [0.225, 0.307],
          [0.349, 0.402],
          [0.788, 0.834],
          [0.895, 0.943],
        ],
        [
          [0.327, 0.39],
          [0.436, 0.482],
          [0.516, 0.577],
          [0.92, 0.961],
        ],
        [
          [0.185, 0.235],
          [0.268, 0.315],
          [0.634, 0.737],
          [0.82, 0.877],
        ],
        [
          [0.13, 0.193],
          [0.402, 0.478],
          [0.626, 0.715],
          [0.83, 0.876],
        ],
        [
          [0.342, 0.437],
          [0.491, 0.571],
          [0.631, 0.699],
          [0.795, 0.86],
        ],
        [
          [0.118, 0.215],
          [0.235, 0.275],
          [0.599, 0.645],
          [0.652, 0.732],
        ],
        [
          [0.079, 0.143],
          [0.186, 0.278],
          [0.605, 0.669],
          [0.794, 0.875],
        ],
        [
          [0.321, 0.484],
          [0.546, 0.647],
          [0.736, 0.779],
          [0.82, 0.882],
        ],
        [
          [0.502, 0.575],
          [0.626, 0.732],
          [0.799, 0.862],
          [0.947, 0.966],
        ],
      ]),
      (j = [
        [0.062, 0.112],
        [0.492, 0.547],
        [0.701, 0.752],
        [0.781, 0.83],
      ]),
      (M = [
        [0.217, 0.299],
        [0.342, 0.416],
      ]),
      (N = (e) => (D.includes(e.karyotype_example) ? e.karyotype_example : `typical-xx`)),
      (P = (e) => {
        let t = N(e),
          n = t.startsWith(`trisomy`),
          r = t.endsWith(`xy`) ? `XY` : `XX`;
        return {
          example: t,
          notation: `${n ? 47 : 46},${r}${n ? `,+21` : ``}`,
          sex: r,
          total: n ? 47 : 46,
          trisomy: n,
        };
      }),
      (F = (e, t, n, r, i) => {
        let a = t + n,
          o = t + n * r,
          s = i / 2,
          c = s * 0.58;
        return [
          `M ${e} ${t}`,
          `C ${e + s} ${t} ${e + s} ${t + 3} ${e + s} ${t + 6}`,
          `L ${e + s} ${o - 3}`,
          `Q ${e + s} ${o - 1} ${e + c} ${o}`,
          `Q ${e + s} ${o + 1} ${e + s} ${o + 3}`,
          `L ${e + s} ${a - 6}`,
          `C ${e + s} ${a - 3} ${e + s} ${a} ${e} ${a}`,
          `C ${e - s} ${a} ${e - s} ${a - 3} ${e - s} ${a - 6}`,
          `L ${e - s} ${o + 3}`,
          `Q ${e - s} ${o + 1} ${e - c} ${o}`,
          `Q ${e - s} ${o - 1} ${e - s} ${o - 3}`,
          `L ${e - s} ${t + 6}`,
          `C ${e - s} ${t + 3} ${e - s} ${t} ${e} ${t}`,
          `Z`,
        ].join(` `);
      }),
      (I = ({ chromosome: e, copies: t, sex: n, thumbnail: r, trisomy: i }) => {
        let a = (0, T.useId)(),
          o = e === `sex`,
          s = o ? 22 : e - 1,
          c = t === 3 ? [11, 30, 49] : r ? [21, 39] : [19, 41];
        return (0, E.jsx)(`svg`, {
          "aria-hidden": !0,
          className: C.chromosomes,
          viewBox: `0 0 60 56`,
          children: c.map((t, c) => {
            let l = o && n === `XY` && c === 1,
              u = r ? 48 : o ? (l ? 19 : 35) : O[s],
              d = 55 - u,
              f = o ? (l ? 0.18 : 0.4) : k[s],
              p = l ? 11 : r ? 13 : 16,
              m = F(t, d, u, f, p),
              h = `${a}-karyotype-${String(e)}-${c}`,
              g = i && e === 21,
              _ = o ? (l ? M : j) : A[s];
            return (0, E.jsxs)(
              `g`,
              {
                children: [
                  (0, E.jsx)(`clipPath`, { id: h, children: (0, E.jsx)(`path`, { d: m }) }),
                  (0, E.jsx)(`path`, {
                    d: m,
                    fill: `var(--learning-block-accent-surface)`,
                    stroke: g
                      ? `var(--learning-block-color-secondary)`
                      : `var(--learning-block-color-primary)`,
                    strokeWidth: `1.1`,
                  }),
                  (0, E.jsxs)(`g`, {
                    clipPath: `url(#${h})`,
                    children: [
                      _.map(([e, n], r) =>
                        (0, E.jsx)(
                          `rect`,
                          {
                            fill: g
                              ? `var(--learning-block-color-secondary)`
                              : `var(--learning-block-color-primary)`,
                            height: Math.max(1.4, u * (n - e)),
                            width: p + 3,
                            x: t - p / 2 - 1.5,
                            y: d + u * e,
                          },
                          `${h}-band-${r}`,
                        ),
                      ),
                      (0, E.jsx)(`rect`, {
                        fill: `var(--learning-block-visualization-surface, var(--bg-primary))`,
                        height: `1.1`,
                        width: p + 3,
                        x: t - p / 2 - 1.5,
                        y: d + u * f - 0.55,
                      }),
                    ],
                  }),
                ],
              },
              h,
            );
          }),
        });
      }),
      (L = ({ presentationMode: e = `standard`, values: t }) => {
        let n = o(),
          r = P(t),
          i = e === `thumbnail`,
          s = i ? [21] : Array.from({ length: 22 }, (e, t) => t + 1),
          c = i
            ? n.formatMessage(
                {
                  id: `learning-block.karyotype.thumbnail.aria`,
                  defaultMessage: `Chromosome 21 with {copies} matching copies`,
                },
                { copies: r.trisomy ? 3 : 2 },
              )
            : n.formatMessage(
                {
                  id: `learning-block.karyotype.visual.aria`,
                  defaultMessage: `Human karyogram showing {total} chromosomes, {sex} sex chromosomes, and {copies} copies of chromosome 21`,
                },
                { copies: r.trisomy ? 3 : 2, sex: r.sex, total: r.total },
              );
        return (0, E.jsx)(`div`, {
          "aria-label": c,
          "data-learning-block-wide-width": `full`,
          className: a(
            C.root,
            i && C.thumbnail,
            `text-token-text-primary`,
            i ? `px-2 py-1` : `w-full px-6 pb-6`,
          ),
          role: `img`,
          children: (0, E.jsxs)(`div`, {
            className: C.grid,
            children: [
              s.map((e) => {
                let t = r.trisomy && e === 21 ? 3 : 2,
                  o = r.trisomy && e === 21;
                return (0, E.jsxs)(
                  `div`,
                  {
                    className: C.cell,
                    children: [
                      (0, E.jsx)(I, {
                        chromosome: e,
                        copies: t,
                        sex: r.sex,
                        thumbnail: i,
                        trisomy: r.trisomy,
                      }),
                      (0, E.jsx)(`span`, {
                        className: a(C.label, o && C.extraLabel, `text-xs font-semibold`),
                        children: n.formatNumber(e),
                      }),
                    ],
                  },
                  e,
                );
              }),
              !i &&
                (0, E.jsxs)(`div`, {
                  className: C.cell,
                  children: [
                    (0, E.jsx)(I, {
                      chromosome: `sex`,
                      copies: 2,
                      sex: r.sex,
                      thumbnail: !1,
                      trisomy: r.trisomy,
                    }),
                    (0, E.jsx)(`span`, {
                      className: a(C.label, `text-xs font-semibold`),
                      children: r.sex,
                    }),
                  ],
                }),
            ],
          }),
        });
      }),
      (R = ({ setValues: e, values: t }) => {
        let n = o(),
          r = P(t),
          i = f([
            {
              value: 0,
              label: n.formatMessage({
                id: `learning-block.karyotype.control.typical-xx`,
                defaultMessage: `Typical XX`,
              }),
            },
            {
              value: 1,
              label: n.formatMessage({
                id: `learning-block.karyotype.control.typical-xy`,
                defaultMessage: `Typical XY`,
              }),
            },
            {
              value: 2,
              label: n.formatMessage({
                id: `learning-block.karyotype.control.trisomy-xx`,
                defaultMessage: `Trisomy 21 XX`,
              }),
            },
            {
              value: 3,
              label: n.formatMessage({
                id: `learning-block.karyotype.control.trisomy-xy`,
                defaultMessage: `Trisomy 21 XY`,
              }),
            },
          ]);
        return (0, E.jsx)(l, {
          children: (0, E.jsx)(h, {
            inputs: [
              p(`karyotype_example`, { max: 3, min: 0, step: 1 }, t, e, {
                ariaLabel: n.formatMessage({
                  id: `learning-block.karyotype.control.aria`,
                  defaultMessage: `Chromosome complement`,
                }),
                mapValue: (e) => D[Math.round(e)] ?? r.example,
                options: i,
                value: D.indexOf(r.example),
                variable: ``,
                variableFormat: `text`,
              }),
            ],
          }),
        });
      }),
      (z = ({ values: e }) => {
        let t = o(),
          n = P(e);
        return (0, E.jsx)(u, {
          reserveLines: 1,
          children: (0, E.jsx)(c, {
            content: t.formatMessage(
              {
                id: `learning-block.karyotype.caption`,
                defaultMessage: `{notation}: {copies} copies at chromosome 21`,
              },
              { copies: n.trisomy ? 3 : 2, notation: n.notation },
            ),
          }),
        });
      }));
  }))();
}
B();
export { z as Caption, R as Controls, L as Visualization };
