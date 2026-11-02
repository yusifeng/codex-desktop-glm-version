// @ts-nocheck
import { n as e } from "@rchunk/rolldown-runtime";
import { ojt as t, sjt as n } from "@rchunk/app-initial";
function r(e, t) {
  for (let r = e.length - 1; r >= 0; --r) {
    let i = e[r];
    if (i != null && i.status !== `inProgress`)
      for (let e = i.items.length - 1; e >= 0; --e) {
        let r = i.items[e];
        if (r == null || r.type !== `plan`) continue;
        let a = i.turnId ?? r.id;
        if (t != null && a !== t) continue;
        let o = r.text.match(/^#\s+(.+)$/m)?.[1]?.trim();
        return { content: r.text, key: a, title: o == null ? null : n(o) };
      }
  }
  return null;
}
function i() {
  return (i = e(() => {
    t();
  }))();
}
export { i as n, r as t };
