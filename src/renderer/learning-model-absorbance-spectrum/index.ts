// @ts-nocheck
import { n as e } from "@rchunk/rolldown-runtime";
var t, n, r, i;
function a() {
  return (a = e(() => {
    ((t = `ABSORBANCE_SPECTRUM`),
      (n = `absorbance-spectrum-v1`),
      (r = { lambda_max_nm: { kind: `number`, defaultValue: 520, min: 210, max: 740 } }),
      (i = { type: t, version: 2, thumbnailAssetKey: n, parameters: r }));
  }))();
}
export { i as n, a as t };
