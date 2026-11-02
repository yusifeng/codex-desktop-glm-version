// @ts-nocheck
import { n as e } from "@rchunk/rolldown-runtime";
import { Cq as t, wL as n } from "@rchunk/app-shared";
function r({ platform: e, dockIconPreviews: n, buildFlavor: r = `prod` }) {
  return e !== `macOS` || r === t.Agent ? null : n;
}
function i() {
  return (i = e(() => {
    n();
  }))();
}
export { i as n, r as t };
