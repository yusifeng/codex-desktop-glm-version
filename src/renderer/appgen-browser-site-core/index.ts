// @ts-nocheck
import { n as e } from "@rchunk/rolldown-runtime";
import { Sf as t, yf as n } from "@rchunk/app-primary";
function r(e, t) {
  let n = null;
  for (let r of e)
    if (r.type === `appgen-app`)
      for (let e of [r.url, ...(r.alternateUrls ?? [])]) {
        if (e == null) continue;
        let a = i(t, e);
        a != null && a > (n?.specificity ?? -1) && (n = { site: r, specificity: a });
      }
  return n?.site ?? null;
}
function i(e, t) {
  return n(e, t) ? new URL(t).pathname.replace(/\/+$/u, ``).length : null;
}
function a() {
  return (a = e(() => {
    t();
  }))();
}
export { a as n, r as t };
