// @ts-nocheck
const __vite__mapDeps = (
  i,
  m = __vite__mapDeps,
  d = m.f ||
    (m.f = [
      "./dagre-VKFMJZFB-c8b379ff6c01.js",
      "./rolldown-runtime-2d059c5e81f4.js",
      "./chunk-X3CZISLH-994f10fe4442.js",
      "./src-d4879d58b20a.js",
      "./linear-32e1d819583b.js",
      "./string-963febbec52f.js",
      "./defaultLocale-99084237f459.js",
      "./init-cd6c1f803e47.js",
      "./ordinal-654830f58ee1.js",
      "./band-7f9eb19564f9.js",
      "./treemap-4d58692b5de2.js",
      "./time-510b3d922182.js",
      "./nice-2b3cc20611af.js",
      "./Tableau10-232fa539940a.js",
      "./arc-a62fdff23ebe.js",
      "./path-3b8129ebc7ff.js",
      "./constant-363a14bf6d8f.js",
      "./math-de3a0e0db4e2.js",
      "./linear-51abf1a86c3b.js",
      "./line-5171f1d885cc.js",
      "./array-15adaa1bc228.js",
      "./pie-f34043ff89c8.js",
      "./step-cc59eba019a7.js",
      "./chunk-ICXQ74PX-21a9a2166c02.js",
      "./catmullRom-b244076d0269.js",
      "./monotone-68fb4f84bd88.js",
      "./chunk-Y2CYZVJY-24cce454fd91.js",
      "./chunk-WYO6CB5R-48e89393abef.js",
      "./app-shared-7b9edc1bfb7f.js",
      "./app-shared-fa570b9eb9dd.css",
      "./dist-7639783f6492.js",
      "./noop-4d1a48b9db0c.js",
      "./ganttDiagram-NO4QXBWP-c82db8aa5eac.js",
      "./chunk-RYQCIY6F-b36f63691d81.js",
      "./union-2f12e2dfc01f.js",
      "./map-3ea4bc6d7205.js",
      "./graphlib-29dd066428e4.js",
      "./chunk-HOUHSVGY-a54821dae74f.js",
      "./chunk-Q4XR5HBZ-4211919cd322.js",
      "./app-initial-51da50e6c6e3.js",
      "./app-initial-e8ceb32eb626.css",
      "./chunk-7BUUIJ7U-e96b99f62157.js",
      "./chunk-OGEWGWER-231d3ca85f29.js",
      "./chunk-C7G6YPKG-706b98be43a2.js",
      "./chunk-ZGVPDNZ5-207f0d2acb98.js",
      "./rough.esm-dc8b11ccd8a8.js",
      "./chunk-52WLFC77-9cc486fd1e60.js",
      "./dagre-6e57af0b5cc9.js",
      "./zipObject-b39425e8947b.js",
      "./swimlanes-5IMT3BWC-3b4af5680fa9.js",
      "./cose-bilkent-JH36ORCC-dccf435aa34f.js",
      "./cytoscape.esm-9c90b5045aa0.js",
    ]),
) => i.map((i) => d[i]);
import { n as e } from "./rolldown-runtime-2d059c5e81f4.js";
import { H3 as t, V3 as n } from "./app-shared-7b9edc1bfb7f.js";
import { n as r, t as i } from "./chunk-X3CZISLH-994f10fe4442.js";
import { d as a, f as o } from "./chunk-ICXQ74PX-21a9a2166c02.js";
import { n as s, r as c } from "./chunk-Y2CYZVJY-24cce454fd91.js";
import { b as l, j as u, s as d } from "./chunk-WYO6CB5R-48e89393abef.js";
import { a as f, c as p, i as m, o as h } from "./chunk-ZGVPDNZ5-207f0d2acb98.js";
import { a as g, i as _, o as v, r as y, s as b } from "./chunk-52WLFC77-9cc486fd1e60.js";
var x, S, C, w, T;
function E() {
  return (E = e(() => {
    (y(),
      m(),
      a(),
      u(),
      i(),
      c(),
      t(),
      (x = {
        common: d,
        getConfig: l,
        insertCluster: f,
        insertEdge: _,
        insertEdgeLabel: g,
        insertMarkers: v,
        insertNode: h,
        interpolateToCurve: o,
        labelHelper: p,
        log: r,
        positionEdgeLabel: b,
      }),
      (S = {}),
      (C = s((e) => {
        for (let t of e) S[t.name] = t;
      }, `registerLayoutLoaders`)),
      s(() => {
        C([
          {
            name: `dagre`,
            loader: s(
              async () =>
                await n(
                  () => import(`./dagre-VKFMJZFB-c8b379ff6c01.js`),
                  __vite__mapDeps([
                    0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21,
                    22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41,
                    42, 43, 44, 45, 46, 47, 48,
                  ]),
                  import.meta.url,
                ),
              `loader`,
            ),
          },
          {
            name: `swimlane`,
            loader: s(
              async () =>
                await n(
                  () => import(`./swimlanes-5IMT3BWC-3b4af5680fa9.js`),
                  __vite__mapDeps([
                    49, 1, 28, 29, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19,
                    20, 21, 22, 23, 24, 25, 26, 27, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41,
                    42, 43, 44, 45, 46,
                  ]),
                  import.meta.url,
                ),
              `loader`,
            ),
          },
          {
            name: `cose-bilkent`,
            loader: s(
              async () =>
                await n(
                  () => import(`./cose-bilkent-JH36ORCC-dccf435aa34f.js`),
                  __vite__mapDeps([
                    50, 1, 3, 4, 5, 6, 7, 8, 9, 2, 26, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20,
                    21, 22, 23, 24, 25, 27, 28, 29, 30, 31, 32, 51,
                  ]),
                  import.meta.url,
                ),
              `loader`,
            ),
          },
        ]);
      }, `registerDefaultLayoutLoaders`)(),
      (w = s(async (e, t, n) => {
        if (!(e.layoutAlgorithm in S))
          throw Error(`Unknown layout algorithm: ${e.layoutAlgorithm}`);
        if (e.diagramId)
          for (let t of e.nodes) {
            let n = t.domId || t.id;
            t.domId = `${e.diagramId}-${n}`;
          }
        let r = S[e.layoutAlgorithm],
          i = await r.loader(),
          { theme: a, themeVariables: o } = e.config,
          { useGradient: s, gradientStart: c, gradientStop: l } = o,
          u = t.attr(`id`);
        if (
          (t
            .append(`defs`)
            .append(`filter`)
            .attr(`id`, `${u}-drop-shadow`)
            .attr(`height`, `130%`)
            .attr(`width`, `130%`)
            .append(`feDropShadow`)
            .attr(`dx`, `4`)
            .attr(`dy`, `4`)
            .attr(`stdDeviation`, 0)
            .attr(`flood-opacity`, `0.06`)
            .attr(`flood-color`, `${a?.includes(`dark`) ? `#FFFFFF` : `#000000`}`),
          t
            .append(`defs`)
            .append(`filter`)
            .attr(`id`, `${u}-drop-shadow-small`)
            .attr(`height`, `150%`)
            .attr(`width`, `150%`)
            .append(`feDropShadow`)
            .attr(`dx`, `2`)
            .attr(`dy`, `2`)
            .attr(`stdDeviation`, 0)
            .attr(`flood-opacity`, `0.06`)
            .attr(`flood-color`, `${a?.includes(`dark`) ? `#FFFFFF` : `#000000`}`),
          s)
        ) {
          let e = t
            .append(`linearGradient`)
            .attr(`id`, t.attr(`id`) + `-gradient`)
            .attr(`gradientUnits`, `objectBoundingBox`)
            .attr(`x1`, `0%`)
            .attr(`y1`, `0%`)
            .attr(`x2`, `100%`)
            .attr(`y2`, `0%`);
          (e.append(`svg:stop`).attr(`offset`, `0%`).attr(`stop-color`, c).attr(`stop-opacity`, 1),
            e
              .append(`svg:stop`)
              .attr(`offset`, `100%`)
              .attr(`stop-color`, l)
              .attr(`stop-opacity`, 1));
        }
        return i.render(e, t, x, { algorithm: r.algorithm }, n);
      }, `render`)),
      (T = s((e = ``, { fallback: t = `dagre` } = {}) => {
        if (e in S) return e;
        if (t in S)
          return (r.warn(`Layout algorithm ${e} is not registered. Using ${t} as fallback.`), t);
        throw Error(`Both layout algorithms ${e} and ${t} are not registered.`);
      }, `getRegisteredLayoutAlgorithm`)));
  }))();
}
export { w as i, E as n, C as r, T as t };
