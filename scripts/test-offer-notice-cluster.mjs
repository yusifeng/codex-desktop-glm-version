import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
globalThis.__offerNoticeTest = {
  initializations: [],
  components: {
    Button: Symbol("Button"),
    Dialog: Object.assign(Symbol("Dialog"), {
      Body: Symbol("DialogBody"),
      Close: Symbol("DialogClose"),
      Content: Symbol("DialogContent"),
      Description: Symbol("DialogDescription"),
      Footer: Symbol("DialogFooter"),
      Header: Symbol("DialogHeader"),
      Title: Symbol("DialogTitle"),
    }),
    FormattedMessage: Symbol("FormattedMessage"),
  },
  jsx: {
    Fragment: Symbol("Fragment"),
    jsx: (type, props, key) => ({ type, props: props ?? {}, key }),
    jsxs: (type, props, key) => ({ type, props: props ?? {}, key }),
  },
};

const result = await esbuild.build({
  entryPoints: [path.join(ROOT, "src/renderer/offer-notice/index.ts")],
  bundle: true,
  format: "esm",
  platform: "node",
  target: "node22",
  write: false,
  logLevel: "silent",
  plugins: [
    {
      name: "offer-notice-mocks",
      setup(build) {
        build.onResolve({ filter: /^@rchunk\// }, ({ path: value }) => ({
          path: value.slice(8),
          namespace: "mock",
        }));
        build.onLoad({ filter: /.*/, namespace: "mock" }, ({ path: value }) => {
          if (value === "app-shared")
            return {
              contents: `const s=globalThis.__offerNoticeTest; export const I3=()=>s.jsx; export const K2=()=>s.initializations.push("intl"); export const Y2=s.components.FormattedMessage;`,
              loader: "js",
            };
          if (value === "app-initial")
            return {
              contents: `const s=globalThis.__offerNoticeTest; export const CT=()=>s.initializations.push("theme"); export const KG=()=>s.initializations.push("buttons"); export const X7=()=>s.initializations.push("dialog"); export const l9=s.components.Button; export const qG=s.components.Dialog; export const wT={root:"root",offerNotice:"notice",offerNoticeTitle:"title",planChangeDetails:"details"};`,
              loader: "js",
            };
          return { contents: "export {};", loader: "js" };
        });
      },
    },
  ],
});
const offer = await import(
  `data:text/javascript;base64,${Buffer.from(result.outputFiles[0].text).toString("base64")}`
);

function nodes(root) {
  const output = [];
  const visit = (value) => {
    if (value == null || typeof value !== "object") return;
    if (Array.isArray(value)) return value.forEach(visit);
    if ("type" in value && "props" in value) output.push(value);
    visit(value.props?.children);
  };
  visit(root);
  return output;
}

offer.i();
assert.deepEqual(globalThis.__offerNoticeTest.initializations, [
  "dialog",
  "buttons",
  "intl",
  "theme",
]);
let closed = 0;
let retried = 0;
const dialog = offer.t({
  open: true,
  title: "Payment failed",
  message: "Try again",
  closeLabel: "Close",
  onClose() {
    closed += 1;
  },
  retry: {
    label: "Retry",
    onClick() {
      retried += 1;
    },
  },
  testId: "offer",
  isDarkMode: true,
});
assert.equal(dialog.type, globalThis.__offerNoticeTest.components.Dialog);
assert.equal(dialog.props.open, true);
dialog.props.onOpenChange(true);
dialog.props.onOpenChange(false);
assert.equal(closed, 1);
const dialogNodes = nodes(dialog);
assert.equal(
  dialogNodes.find(
    (node) =>
      node.type === globalThis.__offerNoticeTest.components.Dialog.Content,
  ).props["data-checkout-theme"],
  "dark",
);
assert.equal(
  dialogNodes.find(
    (node) =>
      node.type === globalThis.__offerNoticeTest.components.Dialog.Content,
  ).props["data-testid"],
  "offer",
);
const retryButton = dialogNodes.find(
  (node) =>
    node.type === globalThis.__offerNoticeTest.components.Button &&
    node.props.children === "Retry",
);
retryButton.props.onClick();
assert.equal(retried, 1);
assert.equal(
  dialogNodes.some(
    (node) =>
      node.type === globalThis.__offerNoticeTest.components.Button &&
      node.props["aria-label"] === "Close",
  ),
  true,
);

const promotional = offer.n({
  planName: "Plus",
  renewalDateFormatted: "Oct 1",
  fullPriceResumeDateFormatted: "Nov 1",
  formattedDiscountedCost: "$10",
  billingInterval: "month",
  currencySign: "$",
  planCost: "20",
});
const promotionalMessages = nodes(promotional).filter(
  (node) =>
    node.type === globalThis.__offerNoticeTest.components.FormattedMessage,
);
assert.equal(promotional.type, globalThis.__offerNoticeTest.jsx.Fragment);
assert.equal(
  promotionalMessages[0].props.id,
  "planRenewalModal.currentSubscriptionPromo",
);
assert.equal(
  promotionalMessages.some(
    (node) => node.props.id === "planDowngradeModal.newPlanCostAfterPromoMonth",
  ),
  true,
);
assert.equal(
  promotionalMessages.some(
    (node) => node.props.values?.promotionalCost === "$10",
  ),
  true,
);

const planChange = offer.r({
  currentPlanName: "Pro",
  planName: "Plus",
  currencyCode: "USD",
  currencySign: "$",
  planCost: "20",
  useTreatmentContentStyle: true,
});
const planMessages = nodes(planChange).filter(
  (node) =>
    node.type === globalThis.__offerNoticeTest.components.FormattedMessage,
);
assert.equal(planChange.props.className, "details");
assert.equal(
  planMessages[0].props.id,
  "planDowngradeModal.currentSubscriptionWithoutDate",
);
assert.equal(
  planMessages.some(
    (node) => node.props.id === "planDowngradeModal.newPlanCost",
  ),
  true,
);
assert.equal(
  planMessages.some(
    (node) =>
      node.props.id ===
      "settings.usage.pricingPlanPage.proLiteDowngrade.billingStartWithoutDate",
  ),
  true,
);
assert.equal(
  nodes(planChange)
    .find((node) => node.type === "p")
    .props.className.includes("text-base"),
  true,
);

console.log("17 offer notice cluster assertions passed");
