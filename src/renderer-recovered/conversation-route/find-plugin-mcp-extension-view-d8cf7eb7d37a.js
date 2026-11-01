import { n as e } from "./rolldown-runtime-2d059c5e81f4.js";
import { $Et as t, dXt as n, pXt as r, rDt as i } from "./app-initial-51da50e6c6e3.js";
function a(e, r) {
  return e == null
    ? null
    : (r.find((r) => {
        let i = n(r);
        if (i != null) return e.apps.some((e) => e.id === i);
        if (r.pluginId !== void 0) return r.pluginId === e.summary.id;
        let a = t(r.server);
        return e.mcpServers.some((e) => t(e) === a);
      }) ?? null);
}
function o() {
  return (o = e(() => {
    (r(), i());
  }))();
}
export { o as n, a as t };
