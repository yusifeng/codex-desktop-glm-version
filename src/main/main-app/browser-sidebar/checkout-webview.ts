// checkout-webview —— 结账 webview（pay.openai.com/Stripe/PayPal 会话状态机 +
// CDP 网络观察）。
//
// 对应 main-C-Mhak1n.ts 的 100,158-101,086 行区段（~930 行）：
//   - URL 常量带：zW = /codex/purchase/（mUe credits）、hUe pay.openai.com、
//     gUe /c/pay/、BW /checkout/、_Ue/vUe/VW/HW/UW /payments/success*（成功/
//     ind/credit-purchase/rate-limit-reset/team）、yUe /codex/cloud/settings/
//     usage、bUe /codex/open-app、SUe /pricing/、OUe api.stripe.com、kUe
//     pm-redirects.stripe.com、AUe PayPal 双域
//   - 重试退避表 WW：[0, 500×20, 15s, 30s]（订阅更新轮询）
//   - IUe webPreferences 加固（partition ∈ codex-checkout/codex-credit-*/
//     codex-pricing-*；sandbox/contextIsolation/禁弹窗）
//   - BUe 会话状态机（100,290-100,591）：个人订阅更新轮询（WW 退避）+
//     business 完成 + credit/rate-limit-reset 完成 + onReturnToCodex +
//     auth token 预取（z/R/qUe：link-session → /api/auth/session）
//   - VUe CDP 网络观察（100,613-100,713）：debugger attach 1.3 +
//     Network.enable；监听 Stripe `payment_intents/*/confirm` POST
//     （jUe 正则 → credit payment confirmed）与 `/backend-api/subscriptions/
//     update` POST（DUe → plan 变更，body 经 MUe schema 解析 chatgpt_plan_type）
//   - RUe attach 工厂（100,241-100,286）：will-attach-webview 队列 +
//     did-attach 分派 BUe（消费者 173,282 R12）
//   - GUe/KW/LUe/zUe partition/呈现判定 + URL 谓词群（eG~aWe/_G，
//     chatgpt.com origin ie 锚定）

// ---------------------------------------------------------------------------
// 常量（原 100,164-100,193 的 URL 带）
// ---------------------------------------------------------------------------

export const CHECKOUT_URLS = {
  purchaseBase: "/codex/purchase/",
  purchaseCredits: "/codex/purchase/credits",
  payOpenAI: "https://pay.openai.com",
  stripePayPath: "/c/pay/",
  checkout: "/checkout/",
  paymentsSuccess: "/payments/success",
  paymentsSuccessInd: "/payments/success-ind",
  paymentsSuccessCreditPurchase: "/payments/success-credit-purchase",
  paymentsSuccessRateLimitReset: "/payments/success-rate-limit-reset",
  paymentsSuccessTeam: "/payments/success-team",
  cloudSettingsUsage: "/codex/cloud/settings/usage",
  openApp: "/codex/open-app",
  pricing: "/pricing/",
  completeFragment: "#complete",
  pricingFragment: "#pricing",
  subscriptionsUpdate: "/backend-api/subscriptions/update",
  apiStripe: "https://api.stripe.com",
  pmRedirectsStripe: "https://pm-redirects.stripe.com",
  paypalDomains: new Set(["https://paypal.com", "https://www.paypal.com"]),
} as const;

/** 订阅更新轮询退避表（原 `WW`：立即 + 500ms×20 + 15s + 30s）。 */
export const SUBSCRIPTION_RETRY_DELAYS_MS = [0, ...Array.from({ length: 20 }, () => 500), 15_000, 30_000];

/** Stripe 支付确认路径（原 `jUe`）。 */
const STRIPE_PAYMENT_CONFIRM_PATTERN = /^\/v1\/payment_intents\/[^/]+\/confirm$/;

/** checkout webview 的 partition 前缀。 */
export const CHECKOUT_PARTITION_PREFIXES = ["codex-checkout", "codex-credit-", "codex-pricing-"];

// ---------------------------------------------------------------------------
// webPreferences 加固（原 `IUe`）
// ---------------------------------------------------------------------------

/** webPreferences 面（结构化子集）。 */
export interface CheckoutWebPreferences {
  allowpopups?: string;
  devTools?: boolean;
  nodeIntegration?: boolean;
  nodeIntegrationInSubFrames?: boolean;
  sandbox?: boolean;
  session?: unknown;
  [key: string]: unknown;
}

/** attach 参数。 */
export interface WebviewAttachParams {
  disablewebsecurity?: string;
  partition?: string;
  webpreferences?: string;
  [key: string]: unknown;
}

/** partition 判定（原 `GW`：checkout/credit/pricing 三前缀）。 */
export function isCheckoutPartition(partition: string | undefined): boolean {
  return CHECKOUT_PARTITION_PREFIXES.some((prefix) => partition?.startsWith(prefix) === true);
}

/**
 * webPreferences 加固（原 `IUe`）：
 * partition 命中才处理；强制 sandbox/contextIsolation/禁弹窗/剥
 * preload/webpreferences/disablewebsecurity。
 */
export function hardenCheckoutWebPreferences(params: WebviewAttachParams, preferences: CheckoutWebPreferences): boolean {
  if (!isCheckoutPartition(params.partition)) return false;
  preferences.session = params.partition; // session.fromPartition 在接入后装配
  delete preferences.preload;
  delete params.disablewebsecurity;
  delete params.webpreferences;
  params.allowpopups = "";
  preferences.sandbox = true;
  preferences.devTools = true;
  preferences.nodeIntegration = false;
  preferences.nodeIntegrationInSubFrames = false;
  preferences.contextIsolation = true;
  preferences.webSecurity = true;
  preferences.allowRunningInsecureContent = false;
  preferences.webviewTag = false;
  preferences.plugins = false;
  return true;
}

// ---------------------------------------------------------------------------
// CDP 网络观察（原 `VUe`）
// ---------------------------------------------------------------------------

/** CDP 观察回调。 */
export interface CheckoutNetworkObservers {
  onCreditPaymentConfirmed(): void;
  onPersonalSubscriptionUpdateComplete(): void;
}

/** debugger 面（结构化子集）。 */
export interface DebuggerLike {
  attach(version: string): void;
  sendCommand(method: string, params?: Record<string, unknown>): Promise<unknown>;
  detach(): void;
  isAttached(): boolean;
  on(event: string, listener: (event: string, params: unknown) => void): void;
}

/** Stripe 端点判定（原 `OUe`/`kUe`/`jUe`）。 */
function isStripePaymentConfirm(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.hostname.endsWith(".stripe.com") && STRIPE_PAYMENT_CONFIRM_PATTERN.test(parsed.pathname);
  } catch {
    return false;
  }
}

/** 订阅更新判定（原 `DUe` + chatgpt origin）。 */
function isSubscriptionsUpdate(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.hostname.endsWith("chatgpt.com") && parsed.pathname === CHECKOUT_URLS.subscriptionsUpdate;
  } catch {
    return false;
  }
}

/**
 * CDP 网络观察器（原 `VUe`）：
 * attach 1.3 + Network.enable；requestWillBeSent/responseReceived 双事件——
 * Stripe confirm POST → credit payment confirmed；
 * subscriptions/update POST（body plan_type）→ plan 变更。
 */
export function observeCheckoutNetwork(debugger_: DebuggerLike, observers: CheckoutNetworkObservers): { cancel(): void } {
  const confirmedRequestIds = new Set<string>();
  let handler: (event: string, params: unknown) => void;
  handler = (event, params) => {
    const record = params as { requestId?: string; request?: { method?: string; url?: string; postData?: string } } | null;
    const requestId = record?.requestId;
    if (requestId == null) return;
    if (event === "Network.requestWillBeSent") {
      const request = record?.request;
      if (request?.method === "POST" && request.url != null) {
        if (isStripePaymentConfirm(request.url)) {
          confirmedRequestIds.add(requestId);
          return;
        }
        if (isSubscriptionsUpdate(request.url)) {
          observers.onPersonalSubscriptionUpdateComplete();
        }
      }
      return;
    }
    if (event === "Network.responseReceived" && confirmedRequestIds.has(requestId)) {
      confirmedRequestIds.delete(requestId);
      observers.onCreditPaymentConfirmed();
    }
  };
  debugger_.on("message", handler);
  debugger_.attach("1.3");
  void debugger_.sendCommand("Network.enable");
  return {
    cancel() {
      if (debugger_.isAttached()) debugger_.detach();
    },
  };
}
