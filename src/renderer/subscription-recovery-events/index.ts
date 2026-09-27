import "@rchunk/rolldown-runtime";
import "@rchunk/app-initial";
import "@rchunk/chatgpt-subscription-events";
interface EventScope { logProductEvent?(descriptor: string, payload: Record<string, unknown>): void }
const announcementActions = { shown: "shown", dismissed: "dismissed", cta_clicked: "cta_clicked" } as const;
const modalActions = { shown: "shown", dismissed: "dismissed", pay_now_clicked: "pay_now_clicked", requires_action: "requires_action", payment_failed: "payment_failed", payment_error: "payment_error", payment_succeeded: "payment_succeeded" } as const;
function logAnnouncement(scope: EventScope, action: keyof typeof announcementActions, payload: Record<string, unknown> = {}): void { scope.logProductEvent?.("subscription_payment_recovery_announcement", { ...payload, actionType: announcementActions[action] }); }
function logModal(scope: EventScope, action: keyof typeof modalActions, payload: Record<string, unknown> = {}): void { scope.logProductEvent?.("subscription_payment_recovery_modal", { ...payload, actionType: modalActions[action] }); }
function initialize(): void {}
export { initialize as n, logAnnouncement as r, logModal as t };
