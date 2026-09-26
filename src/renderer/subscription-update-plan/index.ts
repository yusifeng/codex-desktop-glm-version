// subscription-update-plan —— 前端套餐枚举与订阅更新 API plan slug 的双向映射。
// 原版：app/webview/assets/subscription-update-plan-21755a439e4a.js。

import * as runtimeChunk from "@rchunk/rolldown-runtime";
import * as appInitialChunk from "@rchunk/app-initial";

void runtimeChunk;

const appInitial = appInitialChunk as Record<string, any>;

type SubscriptionPlanSlug =
  "chatgptgoplan" | "chatgptplusplan" | "chatgptprolite" | "chatgptpro";

function subscriptionPlanToSlug(
  plan: unknown,
): SubscriptionPlanSlug | undefined {
  const plans = appInitial.Pdn;
  switch (plan) {
    case plans?.GO:
      return "chatgptgoplan";
    case plans?.PLUS:
      return "chatgptplusplan";
    case plans?.PROLITE:
      return "chatgptprolite";
    case plans?.PRO:
      return "chatgptpro";
    default:
      return undefined;
  }
}

function subscriptionPlanFromSlug(slug: string): unknown {
  const plans = appInitial.Pdn;
  switch (slug) {
    case "chatgptgoplan":
      return plans?.GO;
    case "chatgptplusplan":
      return plans?.PLUS;
    case "chatgptprolite":
      return plans?.PROLITE;
    case "chatgptpro":
      return plans?.PRO;
    default:
      return undefined;
  }
}

function initializeSubscriptionUpdatePlan(): void {
  appInitial.Rln?.();
}

initializeSubscriptionUpdatePlan();

export {
  subscriptionPlanFromSlug as n,
  initializeSubscriptionUpdatePlan as r,
  subscriptionPlanToSlug as t,
};
