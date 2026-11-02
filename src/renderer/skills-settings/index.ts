// @ts-nocheck
import { n as e } from "@rchunk/rolldown-runtime";
import { $3 as t, I3 as n } from "@rchunk/app-shared";
import { au as r, su as i } from "@rchunk/app-initial";
import { n as a, r as o } from "@rchunk/skills-page-core";
function s() {
  let e = (0, c.c)(1),
    t;
  return (
    e[0] === Symbol.for(`react.memo_cache_sentinel`)
      ? ((t = (0, l.jsx)(r, { children: (0, l.jsx)(a, {}) })), (e[0] = t))
      : (t = e[0]),
    t
  );
}
var c, l;
function u() {
  return (u = e(() => {
    ((c = t()), o(), i(), (l = n()));
  }))();
}
u();
export { s as SkillsSettings };
