// @ts-nocheck
import { n as e } from "@rchunk/rolldown-runtime";
function t(e) {
  return typeof e == `object` && `length` in e ? e : Array.from(e);
}
function n() {
  return (n = e(() => {
    Array.prototype.slice;
  }))();
}
export { n, t };
