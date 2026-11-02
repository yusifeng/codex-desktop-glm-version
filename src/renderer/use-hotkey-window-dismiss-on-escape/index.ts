// @ts-nocheck
import { n as e } from "@rchunk/rolldown-runtime";
import { $3 as t, e6 as n } from "@rchunk/app-shared";
import { mnt as r, pnt as i } from "@rchunk/app-initial";
function a() {
  let e = (0, c.c)(1),
    t;
  (e[0] === Symbol.for(`react.memo_cache_sentinel`) ? ((t = []), (e[0] = t)) : (t = e[0]),
    (0, l.useEffect)(o, t));
}
function o() {
  let e = s;
  return (
    window.addEventListener(`keydown`, e),
    () => {
      window.removeEventListener(`keydown`, e);
    }
  );
}
function s(e) {
  e.key !== `Escape` ||
    e.defaultPrevented ||
    e.metaKey ||
    e.ctrlKey ||
    e.altKey ||
    e.shiftKey ||
    (e.preventDefault(), e.stopPropagation(), i.hotkeyWindowHotkeys?.dismiss());
}
var c, l;
function u() {
  return (u = e(() => {
    ((c = t()), (l = n()), r());
  }))();
}
export { a as n, u as t };
