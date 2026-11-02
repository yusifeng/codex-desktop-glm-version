// @ts-nocheck
import { n as e } from "@rchunk/rolldown-runtime";
var t, n, r, i;
function a() {
  return (a = e(() => {
    ((t = `ABO_RH_TRANSFUSION_COMPATIBILITY`),
      (n = `abo-rh-transfusion-compatibility-v1`),
      (r = {
        donorType: {
          kind: `enum`,
          defaultValue: `A+`,
          allowedValues: [`O-`, `O+`, `A-`, `A+`, `B-`, `B+`, `AB-`, `AB+`],
        },
        recipientType: {
          kind: `enum`,
          defaultValue: `B-`,
          allowedValues: [`O-`, `O+`, `A-`, `A+`, `B-`, `B+`, `AB-`, `AB+`],
        },
      }),
      (i = { type: t, version: 1, thumbnailAssetKey: n, parameters: r }));
  }))();
}
export { i as n, a as t };
