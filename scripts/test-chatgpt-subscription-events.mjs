import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const result = await esbuild.build({
  entryPoints: [
    path.join(ROOT, "src/renderer/chatgpt-subscription-events/index.ts"),
  ],
  bundle: true,
  format: "esm",
  platform: "node",
  target: "node22",
  write: false,
  logLevel: "silent",
  plugins: [
    {
      name: "mock-runtime",
      setup(build) {
        build.onResolve({ filter: /^@rchunk\/rolldown-runtime$/ }, () => ({
          path: "runtime",
          namespace: "mock",
        }));
        build.onLoad({ filter: /.*/, namespace: "mock" }, () => ({
          contents: "export const n = value => value;",
          loader: "js",
        }));
      },
    },
  ],
});
const events = await import(
  `data:text/javascript;base64,${Buffer.from(result.outputFiles[0].text).toString("base64")}`
);

assert.deepEqual(Object.keys(events).sort(), [
  "a",
  "c",
  "d",
  "i",
  "l",
  "n",
  "o",
  "r",
  "s",
  "t",
  "u",
]);
assert.equal(
  events.n.CHATGPT_SUBSCRIPTION_CANCELLATION_ACTION_TYPE_MODAL_SHOWN,
  "CHATGPT_SUBSCRIPTION_CANCELLATION_ACTION_TYPE_MODAL_SHOWN",
);
assert.equal(
  events.n.CHATGPT_SUBSCRIPTION_CANCELLATION_ACTION_TYPE_CANCELLATION_FAILED,
  "CHATGPT_SUBSCRIPTION_CANCELLATION_ACTION_TYPE_CANCELLATION_FAILED",
);
assert.equal(Object.keys(events.n).length, 12);
assert.equal(
  events.l.CHATGPT_SUBSCRIPTION_PLAN_CHANGE_TYPE_UPGRADE,
  "CHATGPT_SUBSCRIPTION_PLAN_CHANGE_TYPE_UPGRADE",
);
assert.equal(
  events.l.CHATGPT_SUBSCRIPTION_PLAN_CHANGE_TYPE_DOWNGRADE,
  "CHATGPT_SUBSCRIPTION_PLAN_CHANGE_TYPE_DOWNGRADE",
);
assert.equal(Object.keys(events.l).length, 4);
assert.equal(
  events.c
    .CHATGPT_SUBSCRIPTION_PAYMENT_RECOVERY_MODAL_ACTION_TYPE_REQUIRES_ACTION,
  "CHATGPT_SUBSCRIPTION_PAYMENT_RECOVERY_MODAL_ACTION_TYPE_REQUIRES_ACTION",
);
assert.equal(Object.keys(events.c).length, 9);
assert.equal(
  events.o
    .CHATGPT_SUBSCRIPTION_PAYMENT_RECOVERY_ANNOUNCEMENT_ACTION_TYPE_CTA_CLICKED,
  "CHATGPT_SUBSCRIPTION_PAYMENT_RECOVERY_ANNOUNCEMENT_ACTION_TYPE_CTA_CLICKED",
);
assert.equal(Object.keys(events.o).length, 5);
assert.equal(
  events.i.CHATGPT_SUBSCRIPTION_PAYMENT_CONFIRMATION_SURFACE_SOPHIA,
  "CHATGPT_SUBSCRIPTION_PAYMENT_CONFIRMATION_SURFACE_SOPHIA",
);
assert.equal(Object.keys(events.i).length, 4);
assert.equal(
  events.t.$type,
  "protobuf_analytics_events.v1.ChatgptSubscriptionCancellationAction",
);
assert.equal(
  events.u.$type,
  "protobuf_analytics_events.v1.ChatgptSubscriptionPlanChanged",
);
assert.equal(
  events.a.$type,
  "protobuf_analytics_events.v1.ChatgptSubscriptionPaymentRecoveryAnnouncementAction",
);
assert.equal(
  events.s.$type,
  "protobuf_analytics_events.v1.ChatgptSubscriptionPaymentRecoveryModalAction",
);
assert.equal(
  events.r.$type,
  "protobuf_analytics_events.v1.ChatgptSubscriptionPaymentConfirmationShown",
);
assert.equal(events.d(), undefined);

console.log("19 ChatGPT subscription event assertions passed");
