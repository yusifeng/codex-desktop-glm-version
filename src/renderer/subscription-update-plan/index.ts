// subscription-update-plan —— 前端套餐枚举与订阅更新 API plan slug 的双向映射。
// 原版：app/webview/assets/subscription-update-plan-21755a439e4a.js。

import * as runtimeChunk from "@rchunk/rolldown-runtime";
import * as appInitialChunk from "@rchunk/app-initial";

void runtimeChunk;

const {
  Pdn: subscriptionPlans,
  Rln: initializeSubscriptionPlans,
} = appInitialChunk;

type SubscriptionPlan =
  (typeof subscriptionPlans)[keyof typeof subscriptionPlans];

type SubscriptionPlanSlug =
  "chatgptgoplan" | "chatgptplusplan" | "chatgptprolite" | "chatgptpro";

function subscriptionPlanToSlug(
  plan: SubscriptionPlan,
): SubscriptionPlanSlug | undefined {
  switch (plan) {
    case subscriptionPlans.GO:
      return "chatgptgoplan";
    case subscriptionPlans.PLUS:
      return "chatgptplusplan";
    case subscriptionPlans.PROLITE:
      return "chatgptprolite";
    case subscriptionPlans.PRO:
      return "chatgptpro";
    default:
      return undefined;
  }
}

function subscriptionPlanFromSlug(
  slug: string,
): SubscriptionPlan | undefined {
  switch (slug) {
    case "chatgptgoplan":
      return subscriptionPlans.GO;
    case "chatgptplusplan":
      return subscriptionPlans.PLUS;
    case "chatgptprolite":
      return subscriptionPlans.PROLITE;
    case "chatgptpro":
      return subscriptionPlans.PRO;
    default:
      return undefined;
  }
}

function initializeSubscriptionUpdatePlan(): void {
  initializeSubscriptionPlans();
}

initializeSubscriptionUpdatePlan();

export {
  subscriptionPlanFromSlug as n,
  initializeSubscriptionUpdatePlan as r,
  subscriptionPlanToSlug as t,
};
