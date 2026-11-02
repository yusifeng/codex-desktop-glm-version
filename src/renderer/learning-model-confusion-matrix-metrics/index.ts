// @ts-nocheck
import { n as e } from "@rchunk/rolldown-runtime";
import { n as t, t as n } from "@rchunk/binary-classification-metrics";
var r, i, a, o;
function s() {
  return (s = e(() => {
    ((r = `CONFUSION_MATRIX_METRICS`),
      (i = `confusion-matrix-metrics-v1`),
      (a = {
        truePositiveCount: { kind: `integer`, defaultValue: 32, min: 0, max: 100 },
        falsePositiveCount: { kind: `integer`, defaultValue: 8, min: 0, max: 100 },
        trueNegativeCount: { kind: `integer`, defaultValue: 48, min: 0, max: 100 },
        falseNegativeCount: { kind: `integer`, defaultValue: 12, min: 0, max: 100 },
      }),
      (o = { type: r, version: 1, thumbnailAssetKey: i, parameters: a }));
  }))();
}
var c, l, u, d, f, p;
function m() {
  return (m = e(() => {
    (t(),
      s(),
      (c = [`accuracy`, `precision`, `recall`, `specificity`, `f1`]),
      (l = `accuracy`),
      o.parameters.truePositiveCount.defaultValue,
      o.parameters.falsePositiveCount.defaultValue,
      o.parameters.trueNegativeCount.defaultValue,
      o.parameters.falseNegativeCount.defaultValue,
      (u = (e, t) =>
        Number.isFinite(e) ? Math.min(t.max, Math.max(t.min, Math.round(e))) : t.defaultValue),
      (d = (e) => e != null && c.includes(e)),
      (f = (e) => ({
        truePositiveCount: u(e.truePositiveCount, o.parameters.truePositiveCount),
        falsePositiveCount: u(e.falsePositiveCount, o.parameters.falsePositiveCount),
        trueNegativeCount: u(e.trueNegativeCount, o.parameters.trueNegativeCount),
        falseNegativeCount: u(e.falseNegativeCount, o.parameters.falseNegativeCount),
        metric: d(e.metric) ? e.metric : l,
      })),
      (p = (e) => {
        let t = f(e),
          r = {
            tp: t.truePositiveCount,
            fp: t.falsePositiveCount,
            tn: t.trueNegativeCount,
            fn: t.falseNegativeCount,
          };
        return { ...t, counts: r, metricAnalysis: n(t.metric, r) };
      }));
  }))();
}
export { s as a, m as i, l as n, o, p as r, c as t };
