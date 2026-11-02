// @ts-nocheck
import { n as e } from "@rchunk/rolldown-runtime";
var t, n, r, i;
function a() {
  return (a = e(() => {
    ((t = `DISCRETE_EVENT_QUEUE_SIMULATION`),
      (n = `discrete-event-queue-simulation-v1`),
      (r = {
        workload: { kind: `enum`, defaultValue: `bursty`, allowedValues: [`spaced`, `bursty`] },
      }),
      (i = { type: t, version: 3, thumbnailAssetKey: n, parameters: r }));
  }))();
}
export { i as n, a as t };
