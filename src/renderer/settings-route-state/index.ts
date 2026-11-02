// @ts-nocheck
import { n as e } from "@rchunk/rolldown-runtime";
import { H4 as t, R4 as n, g4 as r, q4 as i } from "@rchunk/app-shared";
function a(e) {
  let t = u.safeParse(e);
  return t.success && t.data.passkeyEnrollmentCompleted === !0;
}
function o(e) {
  let t = u.safeParse(e);
  return t.success && t.data.pepperOnboardingPersonalization === !0
    ? (t.data.pepperOnboardingAccountId ?? null)
    : null;
}
function s(e) {
  let t = u.safeParse(e);
  return t.success && t.data.returnToPreviousHistoryEntry === !0;
}
function c(e) {
  let t = u.safeParse(e);
  return t.success && t.data.securitySubviewHasParent === !0;
}
function l(e) {
  let t = u.safeParse(e);
  return !t.success || !Object.hasOwn(t.data, `workspaceRoot`)
    ? { hasValue: !1, workspaceRoot: null }
    : { hasValue: !0, workspaceRoot: t.data.workspaceRoot ?? null };
}
var u;
function d() {
  return (d = e(() => {
    (r(),
      (u = t({
        passkeyEnrollmentCompleted: n(!0).optional(),
        pepperOnboardingPersonalization: n(!0).optional(),
        pepperOnboardingAccountId: i().optional(),
        returnToPreviousHistoryEntry: n(!0).optional(),
        securitySubviewHasParent: n(!0).optional(),
        workspaceRoot: i().min(1).nullable().optional(),
      }).loose()));
  }))();
}
export { l as a, s as i, a as n, d as o, o as r, c as t };
