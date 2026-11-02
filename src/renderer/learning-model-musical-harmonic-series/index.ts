// @ts-nocheck
import { n as e } from "@rchunk/rolldown-runtime";
var t, n, r, i;
function a() {
  return (a = e(() => {
    ((t = `MUSICAL_HARMONIC_SERIES`),
      (n = `musical-harmonic-series-v1`),
      (r = { fundamental_frequency_hz: { kind: `number`, defaultValue: 220, min: 20, max: 2e3 } }),
      (i = { type: t, version: 2, thumbnailAssetKey: n, parameters: r }));
  }))();
}
export { i as n, a as t };
