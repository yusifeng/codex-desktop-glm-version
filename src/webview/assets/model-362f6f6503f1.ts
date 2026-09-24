// @ts-nocheck
import { n as e } from "./rolldown-runtime-2d059c5e81f4.js";
var t, n, r, i;
function a() {
  return (a = e(() => {
    ((t = { stormStage: 1, condition: `intact` }),
      (n = (e, t, n) => Math.min(Math.max(e, t), n)),
      (r = (e) => ({
        stormStage: n(
          Number.isFinite(e.stormStage) ? Math.round(e.stormStage) : t.stormStage,
          0,
          2,
        ),
        condition: e.condition === `degraded` ? `degraded` : `intact`,
      })),
      (i = (e) => {
        let t = r(e),
          n = t.condition === `degraded`,
          i = t.stormStage;
        return {
          ...t,
          waterLevel: n ? [0.24, 0.9, 0.26][i] : [0.32, 0.82, 0.58][i],
          capacityLevel: n ? 0.62 : 0.92,
          basinDepth: n ? 0.58 : 1,
          inflow: [1, 0.82, 0.18][i],
          outflow: n ? [0.58, 1, 0.62][i] : [0.2, 0.38, 0.46][i],
          incomingLoad: [1, 0.82, 0.24][i],
          outgoingLoad: n ? [0.78, 1, 0.66][i] : [0.22, 0.36, 0.18][i],
          retainedLoad: n ? [0.16, 0.26, 0.22][i] : [0.48, 0.94, 0.88][i],
          overtopping: n && i === 1,
        };
      }));
  }))();
}
export { r as i, i as n, a as r, t };
