import { n as e } from "./rolldown-runtime-2d059c5e81f4.js";
import { hq as t, wL as n } from "./app-shared-7b9edc1bfb7f.js";
import { w$t as r } from "./app-initial-51da50e6c6e3.js";
import { n as i, t as a } from "./webmcp-tool-calls-3e31ce94dbaa.js";
function o(e) {
  let n = [];
  for (let i = e.length - 1; i >= 0; --i) {
    let o = r(e[i]?.items ?? []);
    for (let e = o.length - 1; e >= 0; --e) {
      let r = o[e];
      r?.type === `mcpToolCall` &&
        r.status !== `inProgress` &&
        t(r.server) &&
        n.push(...a(r.result?._meta).slice().reverse());
    }
  }
  return n;
}
function s(e) {
  let t = new Map();
  for (let n of e) {
    let e = t.get(n.name);
    e == null ? t.set(n.name, { calls: [n], name: n.name }) : e.calls.push(n);
  }
  return Array.from(t.values());
}
function c(e) {
  try {
    return new URL(e).hostname || void 0;
  } catch {
    return;
  }
}
function l() {
  return (l = e(() => {
    (n(), i());
  }))();
}
export { l as i, o as n, s as r, c as t };
