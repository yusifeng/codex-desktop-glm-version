// @ts-nocheck
import { n as e } from "@rchunk/rolldown-runtime";
var t, n, r, i;
function a() {
  return (a = e(() => {
    ((t = `CURRENT_TO_MAGNETIC_FIELD_DIRECTION`),
      (n = `current-to-magnetic-field-direction-v3`),
      (r = {
        currentDirection: { kind: `enum`, defaultValue: `up`, allowedValues: [`up`, `down`] },
      }),
      (i = { type: t, version: 1, thumbnailAssetKey: n, parameters: r }));
  }))();
}
export { i as n, a as t };
