// @ts-nocheck
import { n as e } from "@rchunk/rolldown-runtime";
import {
  G4 as t,
  H4 as n,
  R4 as r,
  Z4 as i,
  g4 as a,
  k4 as o,
  q4 as s,
} from "@rchunk/app-shared";
function c(e) {
  let t = l.safeParse(e);
  return t.success ? t.data : null;
}
var l;
function u() {
  return (u = e(() => {
    (a(),
      (l = n({
        code: s(),
        constants: t(s(), i()).optional(),
        appData: t(s(), i()).optional(),
        clientDefinedWidgets: t(s(), i()).optional(),
        programFailure: n({
          status: r(`failed`),
          code: r(`payload_too_large`),
          retryable: o(),
        }).optional(),
      })));
  }))();
}
export { c as n, u as t };
