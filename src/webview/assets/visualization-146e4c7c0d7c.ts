// @ts-nocheck
import { n as e } from "./rolldown-runtime-2d059c5e81f4.js";
import { I3 as t, K2 as n, n4 as r } from "./app-shared-7b9edc1bfb7f.js";
import { a as i, n as a, t as o } from "./control-panel-9789995ccf0d.js";
import {
  a as s,
  c,
  n as l,
  r as u,
  s as d,
  t as f,
} from "./constant-acceleration-visualization-5cb4c2e637e4.js";
var p, m, h, g, _;
function v() {
  return (v = e(() => {
    (n(),
      i(),
      d(),
      s(),
      (p = t()),
      (m = (e, t) => {
        let n = c(t),
          r = u(e, n.initialVelocity),
          i = u(e, n.acceleration),
          a = u(e, n.time),
          o = u(e, n.displacement);
        return String.raw`\Delta x=(${r}\,\mathrm{m/s})(${a}\,\mathrm{s})+\frac{1}{2}(${i}\,\mathrm{m/s^2})(${a}\,\mathrm{s})^2\approx${o}\,\mathrm{m}`;
      }),
      (h = ({ values: e }) => {
        let t = r();
        return (0, p.jsx)(o, { children: (0, p.jsx)(a, { content: m(t, e), format: `katex` }) });
      }),
      (g = f),
      (_ = ({ values: e, presentationMode: t }) =>
        (0, p.jsx)(l, { values: e, presentationMode: t, focus: `displacement` })));
  }))();
}
v();
export {
  h as KinematicsDisplacementUniformAccelerationCaption,
  g as KinematicsDisplacementUniformAccelerationControls,
  _ as KinematicsDisplacementUniformAccelerationVisualization,
};
