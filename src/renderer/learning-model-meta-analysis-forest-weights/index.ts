// @ts-nocheck
import { n as e } from "@rchunk/rolldown-runtime";
var t, n, r, i;
function a() {
  return (a = e(() => {
    ((t = `META_ANALYSIS_FOREST_WEIGHTS`),
      (n = `meta-analysis-forest-weights-v1`),
      (r = {
        effect1: { kind: `number`, defaultValue: -0.35, min: -0.8, max: 0.8 },
        effect2: { kind: `number`, defaultValue: -0.08, min: -0.8, max: 0.8 },
        effect3: { kind: `number`, defaultValue: 0.18, min: -0.8, max: 0.8 },
        effect4: { kind: `number`, defaultValue: 0.42, min: -0.8, max: 0.8 },
        effect5: { kind: `number`, defaultValue: 0.1, min: -0.8, max: 0.8 },
        weight1: { kind: `number`, defaultValue: 5, min: 2, max: 24 },
        weight2: { kind: `number`, defaultValue: 12, min: 2, max: 24 },
        weight3: { kind: `number`, defaultValue: 8, min: 2, max: 24 },
        weight4: { kind: `number`, defaultValue: 18, min: 2, max: 24 },
        weight5: { kind: `number`, defaultValue: 10, min: 2, max: 24 },
      }),
      (i = { type: t, version: 1, thumbnailAssetKey: n, parameters: r }));
  }))();
}
export { i as n, a as t };
