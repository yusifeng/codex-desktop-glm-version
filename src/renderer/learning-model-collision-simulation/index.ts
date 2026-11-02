// @ts-nocheck
import { n as e } from "@rchunk/rolldown-runtime";
var t, n, r, i, a;
function o() {
  return (o = e(() => {
    ((t = `COLLISION_SIMULATION`),
      (n = `collision-simulation-v1`),
      (r = `m_1v_{1,i} + m_2v_{2,i} = m_1v_{1,f} + m_2v_{2,f}`),
      (i = {
        cartAInitialVelocityMps: { kind: `number`, defaultValue: 2, min: -3, max: 3 },
        cartBInitialVelocityMps: { kind: `number`, defaultValue: -1.5, min: -3, max: 3 },
        collisionType: {
          kind: `enum`,
          defaultValue: `elastic`,
          allowedValues: [`elastic`, `perfectlyInelastic`],
        },
      }),
      (a = { type: t, version: 3, thumbnailAssetKey: n, canonicalFormula: r, parameters: i }));
  }))();
}
export { a as n, o as t };
