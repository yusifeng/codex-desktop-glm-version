// @ts-nocheck
import { n as e } from "@rchunk/rolldown-runtime";
function t(e) {
  try {
    return decodeURIComponent(e.replace(/\+/g, ` `));
  } catch {
    return e;
  }
}
function n() {
  return (n = e(() => {}))();
}
export { n, t };
