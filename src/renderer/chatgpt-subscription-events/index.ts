// chatgpt-subscription-events —— 订阅流程的 protobuf analytics 枚举与事件描述符。
// 原版：app/webview/assets/chatgpt_subscription-3c17a9c54ef1.js。

import * as runtimeChunk from "@rchunk/rolldown-runtime";

void runtimeChunk;

type StringEnum<T extends readonly string[]> = { [K in T[number]]: K };

function stringEnum<const T extends readonly string[]>(
  values: T,
): StringEnum<T> {
  return Object.fromEntries(
    values.map((value) => [value, value]),
  ) as StringEnum<T>;
}

const ChatgptSubscriptionCancellationActionType = stringEnum([
  "CHATGPT_SUBSCRIPTION_CANCELLATION_ACTION_TYPE_UNSPECIFIED",
  "CHATGPT_SUBSCRIPTION_CANCELLATION_ACTION_TYPE_MODAL_SHOWN",
  "CHATGPT_SUBSCRIPTION_CANCELLATION_ACTION_TYPE_PROMOTION_SHOWN",
  "CHATGPT_SUBSCRIPTION_CANCELLATION_ACTION_TYPE_CONFIRM_CLICKED",
  "CHATGPT_SUBSCRIPTION_CANCELLATION_ACTION_TYPE_CANCELLATION_SUCCEEDED",
  "CHATGPT_SUBSCRIPTION_CANCELLATION_ACTION_TYPE_CLAIM_OFFER_CLICKED",
  "CHATGPT_SUBSCRIPTION_CANCELLATION_ACTION_TYPE_CLAIM_MODAL_SHOWN",
  "CHATGPT_SUBSCRIPTION_CANCELLATION_ACTION_TYPE_PAY_NOW_CLICKED",
  "CHATGPT_SUBSCRIPTION_CANCELLATION_ACTION_TYPE_PROMOTION_CLAIMED",
  "CHATGPT_SUBSCRIPTION_CANCELLATION_ACTION_TYPE_MODAL_DISMISSED",
  "CHATGPT_SUBSCRIPTION_CANCELLATION_ACTION_TYPE_CANCELLATION_FAILED",
  "UNRECOGNIZED",
] as const);

const ChatgptSubscriptionPlanChangeType = stringEnum([
  "CHATGPT_SUBSCRIPTION_PLAN_CHANGE_TYPE_UNSPECIFIED",
  "CHATGPT_SUBSCRIPTION_PLAN_CHANGE_TYPE_UPGRADE",
  "CHATGPT_SUBSCRIPTION_PLAN_CHANGE_TYPE_DOWNGRADE",
  "UNRECOGNIZED",
] as const);

const ChatgptSubscriptionPaymentRecoveryModalActionType = stringEnum([
  "CHATGPT_SUBSCRIPTION_PAYMENT_RECOVERY_MODAL_ACTION_TYPE_UNSPECIFIED",
  "CHATGPT_SUBSCRIPTION_PAYMENT_RECOVERY_MODAL_ACTION_TYPE_SHOWN",
  "CHATGPT_SUBSCRIPTION_PAYMENT_RECOVERY_MODAL_ACTION_TYPE_DISMISSED",
  "CHATGPT_SUBSCRIPTION_PAYMENT_RECOVERY_MODAL_ACTION_TYPE_PAY_NOW_CLICKED",
  "CHATGPT_SUBSCRIPTION_PAYMENT_RECOVERY_MODAL_ACTION_TYPE_REQUIRES_ACTION",
  "CHATGPT_SUBSCRIPTION_PAYMENT_RECOVERY_MODAL_ACTION_TYPE_PAYMENT_FAILED",
  "CHATGPT_SUBSCRIPTION_PAYMENT_RECOVERY_MODAL_ACTION_TYPE_PAYMENT_ERROR",
  "CHATGPT_SUBSCRIPTION_PAYMENT_RECOVERY_MODAL_ACTION_TYPE_PAYMENT_SUCCEEDED",
  "UNRECOGNIZED",
] as const);

const ChatgptSubscriptionPaymentRecoveryAnnouncementActionType = stringEnum([
  "CHATGPT_SUBSCRIPTION_PAYMENT_RECOVERY_ANNOUNCEMENT_ACTION_TYPE_UNSPECIFIED",
  "CHATGPT_SUBSCRIPTION_PAYMENT_RECOVERY_ANNOUNCEMENT_ACTION_TYPE_SHOWN",
  "CHATGPT_SUBSCRIPTION_PAYMENT_RECOVERY_ANNOUNCEMENT_ACTION_TYPE_DISMISSED",
  "CHATGPT_SUBSCRIPTION_PAYMENT_RECOVERY_ANNOUNCEMENT_ACTION_TYPE_CTA_CLICKED",
  "UNRECOGNIZED",
] as const);

const ChatgptSubscriptionPaymentConfirmationSurface = stringEnum([
  "CHATGPT_SUBSCRIPTION_PAYMENT_CONFIRMATION_SURFACE_UNSPECIFIED",
  "CHATGPT_SUBSCRIPTION_PAYMENT_CONFIRMATION_SURFACE_BUSINESS",
  "CHATGPT_SUBSCRIPTION_PAYMENT_CONFIRMATION_SURFACE_SOPHIA",
  "UNRECOGNIZED",
] as const);

const ChatgptSubscriptionCancellationAction = {
  $type: "protobuf_analytics_events.v1.ChatgptSubscriptionCancellationAction",
};
const ChatgptSubscriptionPlanChanged = {
  $type: "protobuf_analytics_events.v1.ChatgptSubscriptionPlanChanged",
};
const ChatgptSubscriptionPaymentRecoveryAnnouncementAction = {
  $type:
    "protobuf_analytics_events.v1.ChatgptSubscriptionPaymentRecoveryAnnouncementAction",
};
const ChatgptSubscriptionPaymentRecoveryModalAction = {
  $type:
    "protobuf_analytics_events.v1.ChatgptSubscriptionPaymentRecoveryModalAction",
};
const ChatgptSubscriptionPaymentConfirmationShown = {
  $type:
    "protobuf_analytics_events.v1.ChatgptSubscriptionPaymentConfirmationShown",
};

function initializeChatgptSubscriptionEvents(): void {}

export {
  ChatgptSubscriptionPaymentRecoveryAnnouncementAction as a,
  ChatgptSubscriptionPaymentRecoveryModalActionType as c,
  initializeChatgptSubscriptionEvents as d,
  ChatgptSubscriptionPaymentConfirmationSurface as i,
  ChatgptSubscriptionPlanChangeType as l,
  ChatgptSubscriptionCancellationActionType as n,
  ChatgptSubscriptionPaymentRecoveryAnnouncementActionType as o,
  ChatgptSubscriptionPaymentConfirmationShown as r,
  ChatgptSubscriptionPaymentRecoveryModalAction as s,
  ChatgptSubscriptionCancellationAction as t,
  ChatgptSubscriptionPlanChanged as u,
};
