// @ts-nocheck
import { n as e } from "./rolldown-runtime-2d059c5e81f4.js";
import { H4 as t, R4 as n, V4 as r, g4 as i, q4 as a } from "./app-shared-7b9edc1bfb7f.js";
import { GGt as o, HGt as s, krt as c } from "./app-initial-51da50e6c6e3.js";
async function l({ hasPaidSubscription: e, intl: t, signal: n }) {}
function u() {
  return (u = e(() => {
    (i(),
      o(),
      c(),
      s(),
      t({
        asset: t({
          asset_pointer: a().min(1),
          content_type: n(`image_asset_pointer`),
          width: r(),
          height: r(),
          size_bytes: r(),
        }),
        conversationId: a().optional(),
        createdAt: r(),
      }));
  }))();
}
u();
export { l as resumePendingCheckoutImageDownload };
