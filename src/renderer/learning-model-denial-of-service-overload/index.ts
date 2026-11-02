// @ts-nocheck
import { n as e } from "@rchunk/rolldown-runtime";
var t, n, r, i;
function a() {
  return (a = e(() => {
    ((t = `DENIAL_OF_SERVICE_OVERLOAD`),
      (n = `denial-of-service-overload-v1`),
      (r = {
        server_capacity: { kind: `integer`, defaultValue: 120, min: 100, max: 300 },
        legitimate_request_rate: { kind: `integer`, defaultValue: 40, min: 10, max: 80 },
      }),
      (i = { type: t, version: 3, thumbnailAssetKey: n, parameters: r }));
  }))();
}
export { i as n, a as t };
