import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
globalThis.window = { location: { href: "https://chatgpt.com/upgrade" } };
globalThis.__confirmUpgradeTest = {
  accountId: "account-1",
  userId: "user-1",
  updateQueue: [],
  updateInputs: [],
  posts: [],
  cleanups: [],
};

const result = await esbuild.build({
  entryPoints: [
    path.join(ROOT, "src/renderer/confirm-subscription-upgrade/index.ts"),
  ],
  bundle: true,
  format: "esm",
  platform: "node",
  target: "node22",
  write: false,
  logLevel: "silent",
  plugins: [
    {
      name: "mock-chunks",
      setup(build) {
        build.onResolve({ filter: /^@rchunk\// }, ({ path: importPath }) => ({
          path: importPath.slice("@rchunk/".length),
          namespace: "mock",
        }));
        build.onLoad(
          { filter: /.*/, namespace: "mock" },
          ({ path: importPath }) => ({
            contents:
              {
                "app-shared": `export const vW = "x-account-id"; export const wL = () => {};`,
                "app-initial": `
                export class Sdn extends Error { constructor(status, message = "http error") { super(message); this.status = status; } }
                export const mun = "account";
                export const _un = "user";
                export const rJt = { safePost: async (url, options) => { globalThis.__confirmUpgradeTest.posts.push({ url, options }); } };
                export const NF = async input => {
                  globalThis.__confirmUpgradeTest.updateInputs.push(input);
                  const next = globalThis.__confirmUpgradeTest.updateQueue.shift();
                  if (next instanceof Error) throw next;
                  if (next?.httpStatus) throw new Sdn(next.httpStatus);
                  return next;
                };
                export const jF = async input => { globalThis.__confirmUpgradeTest.cleanups.push(input); };
                export const Sun = () => {};
                export const cJt = () => {};
                export const kF = () => {};
                export const wdn = () => {};
              `,
                "stripe-payment-confirmation": `
                export const a = error => error.reason ?? "other";
                export const n = intent => intent.status === "requires_payment_method" ? "payment_method_declined" : intent.status === "requires_action" ? "authentication_failed" : null;
                export const t = ({ confirmPaymentIntent }) => confirmPaymentIntent();
                export const r = () => {};
                export const o = () => {};
              `,
              }[importPath] ?? "export {};",
            loader: "js",
          }),
        );
      },
    },
  ],
});
const upgrade = await import(
  `data:text/javascript;base64,${Buffer.from(result.outputFiles[0].text).toString("base64")}`
);

const testState = globalThis.__confirmUpgradeTest;
const scope = {
  get(key) {
    return key === "account" ? testState.accountId : testState.userId;
  },
};
const baseStripe = {
  async confirmCardPayment() {
    return { paymentIntent: { status: "succeeded" } };
  },
  async confirmPayment() {
    return { paymentIntent: { status: "succeeded" } };
  },
  async confirmPixPayment() {
    return { paymentIntent: { status: "succeeded" } };
  },
  async confirmSetup() {
    return { setupIntent: { status: "succeeded", id: "seti-1" } };
  },
};

function options(overrides = {}) {
  return {
    accountId: "account-1",
    updatedPlan: "plus",
    userId: "user-1",
    isActive: () => true,
    stripe: baseStripe,
    willRenew: true,
    async revalidatePaymentMethod() {
      return true;
    },
    isPendingUpdateError: () => false,
    ...overrides,
  };
}

let assertions = 0;
function check(value, message) {
  assert.ok(value, message);
  assertions += 1;
}
function reset(...updates) {
  testState.updateQueue = [...updates];
  testState.updateInputs = [];
  testState.posts = [];
  testState.cleanups = [];
}

reset({ status: "complete" });
let outcome = await upgrade.t(scope, options({ isActive: () => false }));
check(
  outcome.status === "closed" && testState.updateInputs.length === 0,
  "stops before submission when closed",
);

reset({ status: "complete" });
outcome = await upgrade.t(scope, options());
check(outcome.status === "complete", "accepts an immediately complete update");

reset({ status: "pending" });
outcome = await upgrade.t(scope, options());
check(outcome.status === "pending", "preserves a pending update");

reset({
  status: "payment_method_failed",
  pending_update_payment_intent_id: "pi-failed",
  pending_update_invoice_id: "in-failed",
  payment_method_failure_reason: "insufficient_funds",
  payment_method_failure_detail: "declined",
});
outcome = await upgrade.t(scope, options());
check(
  outcome.status === "payment_method_failed" &&
    outcome.source === "update" &&
    outcome.reason === "insufficient_funds",
  "classifies an update-time payment failure",
);
check(
  testState.cleanups[0].expectedPaymentIntentId === "pi-failed",
  "cleans a failed pending update",
);

reset({ status: "setup_required", setup_intent_client_secret: "seti-secret" });
outcome = await upgrade.t(scope, options({ mandateRecovery: false }));
check(
  outcome.status === "payment_method_failed" && outcome.reason === "other",
  "requires mandate recovery for setup intents",
);

reset(
  { status: "setup_required", setup_intent_client_secret: "seti-secret" },
  { status: "complete" },
);
outcome = await upgrade.t(scope, options({ mandateRecovery: true }));
check(
  outcome.status === "complete" && testState.updateInputs.length === 2,
  "retries after confirming a setup intent",
);
check(
  testState.updateInputs[1].setupIntentId === "seti-1" &&
    testState.updateInputs[1].paymentMethodId === undefined,
  "uses the recovered setup intent on retry",
);

reset({ status: "complete" });
outcome = await upgrade.t(
  scope,
  options({
    willRenew: false,
    async revalidatePaymentMethod() {
      return false;
    },
  }),
);
check(
  outcome.status === "payment_method_failed" &&
    outcome.reason === "payment_method_unavailable",
  "reports an unavailable method after compensating renewal",
);
check(
  testState.posts.map((entry) => entry.url).join(",") ===
    "/subscriptions/renew,/subscriptions/cancel",
  "cancels the temporary renewal when revalidation fails",
);

reset(new Error("network unavailable"));
outcome = await upgrade.t(scope, options());
check(
  outcome.status === "unknown",
  "keeps an ambiguous network submission pending",
);

reset({ httpStatus: 400 });
outcome = await upgrade.t(scope, options());
check(
  outcome.status === "request_failed",
  "classifies a definitive client error as request failure",
);

reset({
  status: "requires_action",
  payment_intent: { id: "pi-action", client_secret: "secret" },
  pending_update_invoice_id: "in-action",
});
outcome = await upgrade.t(scope, options());
check(outcome.status === "complete", "confirms a required card action");

reset({
  status: "requires_action",
  payment_intent: { id: "pi-declined", client_secret: "secret" },
  pending_update_invoice_id: "in-declined",
});
outcome = await upgrade.t(
  scope,
  options({
    isPaymentMethodRecoveryEnabled: true,
    stripe: {
      ...baseStripe,
      async confirmCardPayment() {
        return { error: { reason: "payment_method_declined" } };
      },
    },
  }),
);
check(
  outcome.status === "payment_method_failed" &&
    outcome.reason === "payment_method_declined" &&
    outcome.source === "confirmation",
  "maps a Stripe confirmation failure",
);
check(
  testState.cleanups[0].expectedPaymentIntentId === "pi-declined",
  "cleans a failed confirmation",
);

assert.equal(assertions, 15);
console.log(`${assertions} confirm subscription upgrade assertions passed`);
