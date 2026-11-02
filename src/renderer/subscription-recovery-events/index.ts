// @ts-nocheck
import { n as e } from "@rchunk/rolldown-runtime";
import { xpn as t, ypn as n } from "@rchunk/app-initial";
import { a as r, c as i, d as a, o, s } from "@rchunk/chatgpt-subscription-events";
function c(e, n) {
  t(e, r, { actionType: u[n] });
}
function l(e, n, r) {
  t(e, s, { actionType: d[n], entryPoint: `announcement`, ...r });
}
var u, d;
function f() {
  return (f = e(() => {
    (a(),
      n(),
      (u = {
        shown: o.CHATGPT_SUBSCRIPTION_PAYMENT_RECOVERY_ANNOUNCEMENT_ACTION_TYPE_SHOWN,
        dismissed: o.CHATGPT_SUBSCRIPTION_PAYMENT_RECOVERY_ANNOUNCEMENT_ACTION_TYPE_DISMISSED,
        cta_clicked: o.CHATGPT_SUBSCRIPTION_PAYMENT_RECOVERY_ANNOUNCEMENT_ACTION_TYPE_CTA_CLICKED,
      }),
      (d = {
        shown: i.CHATGPT_SUBSCRIPTION_PAYMENT_RECOVERY_MODAL_ACTION_TYPE_SHOWN,
        dismissed: i.CHATGPT_SUBSCRIPTION_PAYMENT_RECOVERY_MODAL_ACTION_TYPE_DISMISSED,
        pay_now_clicked: i.CHATGPT_SUBSCRIPTION_PAYMENT_RECOVERY_MODAL_ACTION_TYPE_PAY_NOW_CLICKED,
        requires_action: i.CHATGPT_SUBSCRIPTION_PAYMENT_RECOVERY_MODAL_ACTION_TYPE_REQUIRES_ACTION,
        payment_failed: i.CHATGPT_SUBSCRIPTION_PAYMENT_RECOVERY_MODAL_ACTION_TYPE_PAYMENT_FAILED,
        payment_error: i.CHATGPT_SUBSCRIPTION_PAYMENT_RECOVERY_MODAL_ACTION_TYPE_PAYMENT_ERROR,
        payment_succeeded:
          i.CHATGPT_SUBSCRIPTION_PAYMENT_RECOVERY_MODAL_ACTION_TYPE_PAYMENT_SUCCEEDED,
      }));
  }))();
}
export { c as n, l as r, f as t };
