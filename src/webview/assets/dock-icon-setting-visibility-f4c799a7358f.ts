// @ts-nocheck
import { n as e } from "./rolldown-runtime-2d059c5e81f4.js";
import { Cq as t, wL as n } from "./app-shared-7b9edc1bfb7f.js";
function r({ platform: e, dockIconPreviews: n, buildFlavor: r = `prod` }) {
  return e !== `macOS` || r === t.Agent ? null : n;
}
function i() {
  return (i = e(() => {
    n();
  }))();
}
export { i as n, r as t };
