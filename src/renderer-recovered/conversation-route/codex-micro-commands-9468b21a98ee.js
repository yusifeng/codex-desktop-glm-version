import { n as e } from "./rolldown-runtime-2d059c5e81f4.js";
import { Ep as t, Xp as n, qp as r } from "./app-shared-7b9edc1bfb7f.js";
import { hEt as i, mEt as a } from "./app-initial-51da50e6c6e3.js";
function o(e) {
  let t = e === `newThread` ? `newTask` : e;
  return c.find((e) => e.id === t) ?? null;
}
function s(e) {
  let t = /^recentThread([1-6])$/.exec(e);
  return t == null ? null : Number(t[1]) - 1;
}
var c;
function l() {
  return (l = e(() => {
    (t(),
      i(),
      (c = n.filter((e) => (e.kind === `webview` && r(e, `electron`)) || (e.kind === `electron-only` && a(e.id)))));
  }))();
}
export { l as i, o as n, s as r, c as t };
