// @ts-nocheck
import { n as e } from "./rolldown-runtime-2d059c5e81f4.js";
import { I3 as t, K2 as n, n4 as r } from "./app-shared-7b9edc1bfb7f.js";
import { i, n as a } from "./chatgpt_math_blocks-9905574f666f.js";
import { a as o, n as s, r as c, t as l } from "./control-panel-9789995ccf0d.js";
import { a as u, n as d } from "./input-selector-d6854a7f5fbb.js";
import { r as f, t as p } from "./input-selector-group-c5ab39b64319.js";
import { i as m, r as h } from "./learning-block-stroke-e5db4228ffca.js";
var g, _, v, y, b, x;
function S() {
  return (S = e(() => {
    ((g = [`hours`, `days`, `weeks`, `months`, `years`]),
      (_ = [
        { key: `evaporation`, importance: [1, 0.72, 0.18, 0.05, 0.02] },
        { key: `dissolution`, importance: [0.16, 0.1, 0.04, 0.02, 0.01] },
        { key: `oxidation`, importance: [0.08, 0.24, 0.55, 0.65, 0.42] },
        { key: `biodegradation`, importance: [0.05, 0.22, 0.55, 0.72, 0.66] },
        { key: `sedimentation`, importance: [0.03, 0.08, 0.18, 0.2, 0.14] },
        { key: `emulsification`, importance: [0.14, 0.42, 0.2, 0.06, 0.03] },
        { key: `dispersion`, importance: [0.86, 0.9, 0.34, 0.12, 0.04] },
        { key: `spreading`, importance: [1, 0.52, 0.15, 0.05, 0.03] },
      ]),
      (v = [
        { key: `evaporation`, importance: [0.34, 0.22, 0.08, 0.03, 0.02] },
        { key: `dissolution`, importance: [0.08, 0.06, 0.03, 0.01, 0.01] },
        { key: `oxidation`, importance: [0.07, 0.2, 0.52, 0.82, 0.82] },
        { key: `biodegradation`, importance: [0.04, 0.16, 0.44, 0.7, 0.78] },
        { key: `sedimentation`, importance: [0.05, 0.12, 0.36, 0.66, 0.68] },
        { key: `emulsification`, importance: [0.22, 0.95, 0.58, 0.18, 0.06] },
        { key: `dispersion`, importance: [0.32, 0.44, 0.36, 0.15, 0.06] },
        { key: `spreading`, importance: [0.72, 0.55, 0.28, 0.1, 0.05] },
      ]),
      (y = [0.88, 0.54, 0.22, 0.1, 0.04]),
      (b = [0.94, 0.96, 0.84, 0.7, 0.58]),
      (x = (e) => {
        let t = e.oil_type === `heavy oil` ? `heavy oil` : `light oil`,
          n = Number.isFinite(e.elapsedStage)
            ? Math.min(4, Math.max(0, Math.round(e.elapsedStage)))
            : 0,
          r = t === `heavy oil` ? v : _,
          i = t === `heavy oil` ? b : y;
        return {
          elapsedStage: n,
          oilType: t,
          processes: r,
          strongest: [...r]
            .sort((e, t) => t.importance[n] - e.importance[n])
            .slice(0, 3)
            .map((e) => e.key),
          surfaceResidue: i,
        };
      }));
  }))();
}
var C, w, T, E, D, O, k, A, j, M, N, P, F, I;
function L() {
  return (L = e(() => {
    (i(),
      n(),
      o(),
      u(),
      f(),
      m(),
      S(),
      (C = t()),
      (w = d([
        { value: 0, label: `Light oil` },
        { value: 1, label: `Heavy oil` },
      ])),
      (T = (e, t) => {
        switch (t) {
          case `spreading`:
            return e.formatMessage({
              id: `oil-spill-fate.process.spreading`,
              defaultMessage: `Spreading`,
            });
          case `evaporation`:
            return e.formatMessage({
              id: `oil-spill-fate.process.evaporation`,
              defaultMessage: `Evaporation`,
            });
          case `dispersion`:
            return e.formatMessage({
              id: `oil-spill-fate.process.dispersion`,
              defaultMessage: `Dispersion`,
            });
          case `emulsification`:
            return e.formatMessage({
              id: `oil-spill-fate.process.emulsification`,
              defaultMessage: `Emulsification`,
            });
          case `dissolution`:
            return e.formatMessage({
              id: `oil-spill-fate.process.dissolution`,
              defaultMessage: `Dissolution`,
            });
          case `oxidation`:
            return e.formatMessage({
              id: `oil-spill-fate.process.oxidation`,
              defaultMessage: `Oxidation`,
            });
          case `sedimentation`:
            return e.formatMessage({
              id: `oil-spill-fate.process.sedimentation`,
              defaultMessage: `Sedimentation / sinking`,
            });
          case `biodegradation`:
            return e.formatMessage({
              id: `oil-spill-fate.process.biodegradation`,
              defaultMessage: `Biodegradation`,
            });
        }
      }),
      (E = (e, t) =>
        t === `sedimentation`
          ? e.formatMessage({
              id: `oil-spill-fate.process.sedimentation-compact`,
              defaultMessage: `Sedimentation`,
            })
          : T(e, t)),
      (D = (e, t) => {
        switch (g[t] ?? `hours`) {
          case `hours`:
            return e.formatMessage({ id: `oil-spill-fate.time.hours`, defaultMessage: `Hours` });
          case `days`:
            return e.formatMessage({ id: `oil-spill-fate.time.days`, defaultMessage: `Days` });
          case `weeks`:
            return e.formatMessage({ id: `oil-spill-fate.time.weeks`, defaultMessage: `Weeks` });
          case `months`:
            return e.formatMessage({ id: `oil-spill-fate.time.months`, defaultMessage: `Months` });
          case `years`:
            return e.formatMessage({ id: `oil-spill-fate.time.years`, defaultMessage: `Years` });
        }
      }),
      (O = (e, t) => {
        switch (g[t] ?? `hours`) {
          case `hours`:
            return e.formatMessage({ id: `oil-spill-fate.axis.hours`, defaultMessage: `Hr` });
          case `days`:
            return e.formatMessage({ id: `oil-spill-fate.axis.days`, defaultMessage: `D` });
          case `weeks`:
            return e.formatMessage({ id: `oil-spill-fate.axis.weeks`, defaultMessage: `Wk` });
          case `months`:
            return e.formatMessage({ id: `oil-spill-fate.axis.months`, defaultMessage: `Mo` });
          case `years`:
            return e.formatMessage({ id: `oil-spill-fate.axis.years`, defaultMessage: `Yr` });
        }
      }),
      (k = (e) => {
        switch (e) {
          case `evaporation`:
            return `var(--learning-block-color-primary)`;
          case `dissolution`:
            return `var(--learning-block-color-secondary)`;
          case `oxidation`:
            return `var(--learning-block-color-companion)`;
          case `biodegradation`:
            return `var(--learning-block-color-third)`;
          case `sedimentation`:
            return `var(--learning-block-color-fourth)`;
          case `emulsification`:
            return `var(--learning-block-color-secondary)`;
          case `dispersion`:
            return `var(--learning-block-color-companion)`;
          case `spreading`:
            return `var(--learning-block-color-primary)`;
        }
      }),
      (A = (e, t) => {
        let n = [0, 125, 250, 375, 500],
          r = e.map((e) => 1.25 + e * 9.25);
        return `M0 ${t - r[0]} ${((e) =>
          n
            .slice(1)
            .map((i, a) => {
              let o = n[a],
                s = t + e * r[a],
                c = t + e * r[a + 1],
                l = (i - o) / 2;
              return `C${o + l} ${s} ${i - l} ${c} ${i} ${c}`;
            })
            .join(` `))(-1)} L500 ${t + r[4]} ${n
          .slice(0, -1)
          .reverse()
          .map((e, i) => {
            let a = n.length - 2 - i,
              o = n[a + 1],
              s = t + r[a + 1],
              c = t + r[a],
              l = (o - e) / 2;
            return `C${o - l} ${s} ${e + l} ${c} ${e} ${c}`;
          })
          .join(` `)} Z`;
      }),
      (j = [22, 22, 22, 22, 24, 32, 32, 22]),
      (M = j.reduce((e, t) => e + t, 0)),
      (N = (e) => j.slice(0, e).reduce((e, t) => e + t, 0) + j[e] / 2),
      (P = ({ values: e, presentationMode: t }) => {
        let n = r(),
          { elapsedStage: i, oilType: a, processes: o, strongest: s, surfaceResidue: c } = x(e),
          l = t === `thumbnail`,
          u = D(n, i),
          d =
            a === `light oil`
              ? n.formatMessage({ id: `oil-spill-fate.oil.light`, defaultMessage: `Light oil` })
              : n.formatMessage({ id: `oil-spill-fate.oil.heavy`, defaultMessage: `Heavy oil` }),
          f = n.formatMessage(
            {
              id: `oil-spill-fate.visual.aria`,
              defaultMessage: `{oilType}, {time} after the spill. The most prominent weathering processes are {processes}. The surface-residue cue is {residue}. Band widths show qualitative relative importance from hours to years, not mass fractions.`,
            },
            {
              oilType: d,
              time: u,
              processes: n.formatList(
                s.map((e) => T(n, e)),
                { type: `conjunction` },
              ),
              residue:
                c[i] >= 0.5
                  ? n.formatMessage({
                      id: `oil-spill-fate.residue.prominent`,
                      defaultMessage: `prominent`,
                    })
                  : n.formatMessage({
                      id: `oil-spill-fate.residue.limited`,
                      defaultMessage: `limited`,
                    }),
            },
          );
        if (l) {
          let e = o.filter((e) => s.includes(e.key)),
            t = e.length * 24 + 18;
          return (0, C.jsxs)(`div`, {
            role: `img`,
            "aria-label": f,
            className: `text-token-text-primary flex h-full w-full flex-col justify-center gap-1 px-2`,
            children: [
              (0, C.jsx)(`div`, {
                className: `text-token-text-primary truncate text-center text-xs font-semibold`,
                children: n.formatMessage(
                  { id: `oil-spill-fate.thumbnail.title`, defaultMessage: `Oil · {time}` },
                  { time: O(n, i) },
                ),
              }),
              (0, C.jsxs)(`svg`, {
                "aria-hidden": `true`,
                className: `block w-full`,
                style: { height: 54 },
                viewBox: `0 0 500 ${t}`,
                preserveAspectRatio: `none`,
                children: [
                  (0, C.jsx)(h, {
                    from: { x: i * 125, y: 0 },
                    to: { x: i * 125, y: t },
                    variant: `guideDashed`,
                    color: `var(--learning-block-accent)`,
                    opacity: 0.75,
                    strokeWidth: 2,
                    vectorEffect: `non-scaling-stroke`,
                  }),
                  e.map((e, t) =>
                    (0, C.jsx)(
                      `path`,
                      { d: A(e.importance, 12 + t * 24), fill: k(e.key), fillOpacity: 0.85 },
                      e.key,
                    ),
                  ),
                  (0, C.jsx)(`path`, {
                    d: A(c, e.length * 24 + 9),
                    fill: `var(--learning-block-color-fourth)`,
                    fillOpacity: 0.75,
                  }),
                ],
              }),
            ],
          });
        }
        return (0, C.jsx)(`div`, {
          role: `img`,
          "aria-label": f,
          "data-learning-block-wide-width": `44rem`,
          "data-oil-spill-fate-visualization": !0,
          className: `text-token-text-primary flex h-full min-h-0 w-full items-center justify-center px-6 pb-6`,
          children: (0, C.jsxs)(`div`, {
            className: `mx-auto min-h-0 w-full max-w-[720px]`,
            children: [
              (0, C.jsx)(`div`, {
                className: `text-token-text-secondary mb-2 text-xs font-semibold`,
                children: n.formatMessage({
                  id: `oil-spill-fate.visual.subtitle`,
                  defaultMessage: `Band width = relative importance`,
                }),
              }),
              (0, C.jsxs)(`div`, {
                className: `flex min-w-0 gap-2`,
                children: [
                  (0, C.jsxs)(`div`, {
                    className: `shrink-0`,
                    style: { width: `clamp(154px, 52%, 172px)`, paddingTop: 20 },
                    children: [
                      o.map((e, t) => {
                        let r = s.includes(e.key),
                          i =
                            e.key === `dispersion`
                              ? n.formatMessage({
                                  id: `oil-spill-fate.process.dispersion-hint`,
                                  defaultMessage: `oil → water`,
                                })
                              : e.key === `emulsification`
                                ? n.formatMessage({
                                    id: `oil-spill-fate.process.emulsification-hint`,
                                    defaultMessage: `water → oil`,
                                  })
                                : null;
                        return (0, C.jsxs)(
                          `div`,
                          {
                            className: `flex min-w-0 flex-col justify-center`,
                            style: { height: j[t] },
                            children: [
                              (0, C.jsxs)(`span`, {
                                className: r
                                  ? `text-token-text-primary text-xs font-semibold break-words`
                                  : `text-token-text-secondary text-xs break-words`,
                                title: T(n, e.key),
                                children: [
                                  (0, C.jsx)(`span`, {
                                    className: `oil-spill-fate-process-full`,
                                    children: T(n, e.key),
                                  }),
                                  (0, C.jsx)(`span`, {
                                    className: `oil-spill-fate-process-compact`,
                                    children: E(n, e.key),
                                  }),
                                ],
                              }),
                              i
                                ? (0, C.jsx)(`span`, {
                                    className: `text-token-text-tertiary text-xs`,
                                    children: i,
                                  })
                                : null,
                            ],
                          },
                          e.key,
                        );
                      }),
                      (0, C.jsx)(`div`, {
                        className: `text-token-text-secondary flex min-w-0 items-end text-xs font-semibold`,
                        style: { height: 22 },
                        children: n.formatMessage({
                          id: `oil-spill-fate.visual.residue`,
                          defaultMessage: `Oil residue`,
                        }),
                      }),
                    ],
                  }),
                  (0, C.jsxs)(`div`, {
                    className: `relative min-w-0 flex-1`,
                    children: [
                      (0, C.jsx)(`div`, {
                        className: `relative`,
                        style: { height: 20 },
                        children: g.map((e, t) =>
                          (0, C.jsxs)(
                            `span`,
                            {
                              className:
                                t === i
                                  ? `text-token-text-primary absolute text-xs font-semibold`
                                  : `text-token-text-tertiary absolute text-xs`,
                              style: {
                                left: `${t * 25}%`,
                                transform:
                                  t === 0
                                    ? `translateX(0)`
                                    : t === g.length - 1
                                      ? `translateX(-100%)`
                                      : `translateX(-50%)`,
                              },
                              children: [
                                (0, C.jsx)(`span`, {
                                  className: `oil-spill-fate-axis-full`,
                                  children: D(n, t),
                                }),
                                (0, C.jsx)(`span`, {
                                  className: `oil-spill-fate-axis-compact`,
                                  children: O(n, t),
                                }),
                              ],
                            },
                            t,
                          ),
                        ),
                      }),
                      (0, C.jsxs)(`svg`, {
                        "aria-hidden": `true`,
                        className: `block w-full`,
                        style: { height: M + 22 },
                        viewBox: `0 0 500 ${M + 22}`,
                        preserveAspectRatio: `none`,
                        children: [
                          [0, 125, 250, 375, 500].map((e, t) =>
                            (0, C.jsx)(
                              h,
                              {
                                from: { x: e, y: 0 },
                                to: { x: e, y: M + 22 },
                                variant: `guideDashed`,
                                color:
                                  t === i ? `var(--learning-block-accent)` : `var(--text-tertiary)`,
                                opacity: t === i ? 0.8 : 0.18,
                                strokeWidth: t === i ? 1.5 : 1,
                                vectorEffect: `non-scaling-stroke`,
                              },
                              e,
                            ),
                          ),
                          o.map((e, t) => {
                            let n = s.includes(e.key);
                            return (0, C.jsx)(
                              `path`,
                              {
                                d: A(e.importance, N(t)),
                                fill: k(e.key),
                                fillOpacity: n ? 0.84 : 0.6,
                                stroke: k(e.key),
                                strokeOpacity: n ? 0.92 : 0.68,
                                strokeWidth: n ? 1.1 : 0.7,
                                vectorEffect: `non-scaling-stroke`,
                              },
                              e.key,
                            );
                          }),
                          (0, C.jsx)(`path`, {
                            d: A(c, M + 12),
                            fill: `var(--learning-block-color-fourth)`,
                            fillOpacity: 0.68,
                            stroke: `var(--learning-block-color-fourth)`,
                            strokeOpacity: 0.82,
                            strokeWidth: 0.9,
                            vectorEffect: `non-scaling-stroke`,
                          }),
                        ],
                      }),
                    ],
                  }),
                ],
              }),
            ],
          }),
        });
      }),
      (F = ({ values: e, setValues: t }) => {
        let n = r(),
          { elapsedStage: i, oilType: o } = x(e),
          s = w.map((e) => ({
            ...e,
            label:
              e.value === 0
                ? n.formatMessage({ id: `oil-spill-fate.oil.light`, defaultMessage: `Light oil` })
                : n.formatMessage({ id: `oil-spill-fate.oil.heavy`, defaultMessage: `Heavy oil` }),
          }));
        return (0, C.jsx)(c, {
          screenReaderContent: n.formatMessage({
            id: `oil-spill-fate.controls.help`,
            defaultMessage: `Select elapsed time and oil type to compare overlapping weathering processes.`,
          }),
          children: (0, C.jsx)(p, {
            inputs: [
              {
                min: 0,
                max: 4,
                step: 1,
                value: i,
                sliderStyle: `stepped`,
                showValueInput: !1,
                ariaLabel: n.formatMessage({
                  id: `oil-spill-fate.controls.time`,
                  defaultMessage: `Elapsed time after spill`,
                }),
                ariaValueText: D(n, i),
                onChange: (e) =>
                  t(
                    (t) => ({ ...t, elapsedStage: e }),
                    a.CHATGPT_MATH_BLOCK_EDIT_TYPE_SLIDER_CHANGE,
                  ),
              },
              {
                min: 0,
                max: 1,
                step: 1,
                value: +(o === `heavy oil`),
                variable: n.formatMessage({
                  id: `oil-spill-fate.controls.oil`,
                  defaultMessage: `Oil type`,
                }),
                options: s,
                ariaLabel: n.formatMessage({
                  id: `oil-spill-fate.controls.oil`,
                  defaultMessage: `Oil type`,
                }),
                onChange: (e) =>
                  t(
                    (t) => ({ ...t, oil_type: e === 1 ? `heavy oil` : `light oil` }),
                    a.CHATGPT_MATH_BLOCK_EDIT_TYPE_SLIDER_CHANGE,
                  ),
              },
            ],
          }),
        });
      }),
      (I = ({ values: e }) => {
        let t = r(),
          { elapsedStage: n, oilType: i } = x(e),
          a = t.formatMessage(
            { id: `oil-spill-fate.caption.title`, defaultMessage: `{time} after the spill` },
            { time: D(t, n) },
          ),
          o =
            i === `light oil`
              ? [
                  t.formatMessage({
                    id: `oil-spill-fate.caption.light.hours`,
                    defaultMessage: `Spreading, evaporation, and oil-in-water dispersion dominate early.`,
                  }),
                  t.formatMessage({
                    id: `oil-spill-fate.caption.light.days`,
                    defaultMessage: `Evaporation and dispersion remain prominent; slower processes begin.`,
                  }),
                  t.formatMessage({
                    id: `oil-spill-fate.caption.light.weeks`,
                    defaultMessage: `Early processes taper as oxidation and biodegradation grow.`,
                  }),
                  t.formatMessage({
                    id: `oil-spill-fate.caption.light.months`,
                    defaultMessage: `Oxidation and biodegradation dominate; little surface residue remains.`,
                  }),
                  t.formatMessage({
                    id: `oil-spill-fate.caption.light.years`,
                    defaultMessage: `Oxidation and biodegradation still act on limited residue.`,
                  }),
                ][n]
              : [
                  t.formatMessage({
                    id: `oil-spill-fate.caption.heavy.hours`,
                    defaultMessage: `Spreading leads; evaporation and dispersion stay limited.`,
                  }),
                  t.formatMessage({
                    id: `oil-spill-fate.caption.heavy.days`,
                    defaultMessage: `Water-in-oil emulsification peaks; surface residue can persist.`,
                  }),
                  t.formatMessage({
                    id: `oil-spill-fate.caption.heavy.weeks`,
                    defaultMessage: `Emulsification tapers while residue and slower processes persist.`,
                  }),
                  t.formatMessage({
                    id: `oil-spill-fate.caption.heavy.months`,
                    defaultMessage: `Oxidation, biodegradation, and sediment association dominate.`,
                  }),
                  t.formatMessage({
                    id: `oil-spill-fate.caption.heavy.years`,
                    defaultMessage: `Surface residue and possible sediment-associated sinking persist.`,
                  }),
                ][n];
        return (0, C.jsxs)(l, {
          reserveLines: 3,
          children: [
            (0, C.jsx)(s, { variant: `title`, children: a }),
            (0, C.jsx)(s, { children: o }),
          ],
        });
      }));
  }))();
}
L();
export { I as OilSpillFateCaption, F as OilSpillFateControls, P as OilSpillFateVisualization };
