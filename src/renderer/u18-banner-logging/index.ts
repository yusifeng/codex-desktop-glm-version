// @ts-nocheck
import { n as e } from "@rchunk/rolldown-runtime";
import { Cpn as t, ypn as n } from "@rchunk/app-initial";
import { f as r, p as i } from "@rchunk/settings-parental-presentation";
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
