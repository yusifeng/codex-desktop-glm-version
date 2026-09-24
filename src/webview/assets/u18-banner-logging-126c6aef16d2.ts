// @ts-nocheck
import { n as e } from "./rolldown-runtime-2d059c5e81f4.js";
import { Cpn as t, ypn as n } from "./app-initial-51da50e6c6e3.js";
import { f as r, p as i } from "./presentation-eeb7ac6fced2.js";
function a(e, n, r) {
  if (!i(e, n)) return;
  let a = Date.now();
  e.get(t).logU18ModelPolicyBannerEvent?.(
    r == null ? `U18 Model Policy Banner Shown` : `U18 Model Policy Banner Clicked`,
    {
      origin: `chat`,
      user_id: n.userId,
      timestamp_ms: a,
      timestamp_iso: new Date(a).toISOString(),
      ...(r == null ? {} : { cta: r }),
    },
  );
}
function o() {
  return (o = e(() => {
    (n(), r());
  }))();
}
export { a as n, o as t };
