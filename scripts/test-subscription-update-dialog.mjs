import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
globalThis.__updateDialogTest = {
  jsx: {
    Fragment: "fragment",
    jsx: (type, props, key) => ({ type, props, key }),
    jsxs: (type, props, key) => ({ type, props, key }),
  },
};
const result = await esbuild.build({
  entryPoints: [
    path.join(ROOT, "src/renderer/subscription-update-dialog/index.ts"),
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
                "app-shared": `
                  export const I3 = () => globalThis.__updateDialogTest.jsx;
                  export const n4 = () => ({ formatDate: value => "date:" + value });
                  export const m4 = (...values) => values.filter(Boolean).join(" ");
                  export const Y2 = "FormattedMessage";
                  export const Ih = "Dialog"; export const Oh = "DialogBody";
                  export const Ah = "DialogHeader"; export const jh = "DialogSection";
                  export const kh = "DialogActions"; export const Yh = "Button";
                  export const $3 = () => {}; export const K2 = () => {}; export const h4 = () => {};
                `,
                "app-initial": `export const TI = ({ amount, currencyCode }) => currencyCode + " " + amount.toFixed(2);`,
                "pricing-promotions": `export const n = "trial-campaign"; export const f = () => {}; export const m = () => {};`,
                "plan-names": `export const n = ({ planType }) => "plan:" + planType; export const r = () => {};`,
                pricing: `export const n = ({ amount, currencyCode }) => ({ formatted: String(amount), currencyCodeLabel: currencyCode });`,
                "offer-notice": `export const i = () => {}; export const n = "RenewalNotice"; export const r = "PlanChangeNotice";`,
              }[importPath] ?? "export {};",
            loader: "js",
          }),
        );
      },
    },
  ],
});
const updateDialog = await import(
  `data:text/javascript;base64,${Buffer.from(result.outputFiles[0].text).toString("base64")}`
);

let assertions = 0;
function check(value, message) {
  assert.ok(value, message);
  assertions += 1;
}
function bodyOf(dialog) {
  return dialog.props.children;
}

let confirmed = 0;
let cancelled = 0;
const saved = updateDialog.t({
  onCancel: () => {
    cancelled += 1;
  },
  onConfirm: () => {
    confirmed += 1;
  },
  onOpenChange() {},
  subscriptionUpdate: {
    kind: "saved_card_upgrade",
    updatedPlan: "chatgptpro",
    minorUnitExponent: 2,
    paymentMethod: { card_brand: "visa", card_last4: "4242" },
    preview: {
      currency: "usd",
      positive_line_item_total: 1200,
      amount_due: {
        amount_excluding_tax: 1000,
        tax_amount: 200,
        amount: 1200,
      },
    },
  },
});
check(
  saved.type === "Dialog" && saved.props.open,
  "renders an open shared dialog",
);
const savedBody = bodyOf(saved);
let prevented = false;
savedBody.props.onSubmit({ preventDefault: () => (prevented = true) });
check(prevented && confirmed === 1, "submits an enabled update exactly once");
const savedActions = savedBody.props.children[3].props.children;
savedActions.props.children[0].props.onClick();
check(cancelled === 1, "forwards the cancel action");
check(
  savedActions.props.children[2].props.children.props.defaultMessage ===
    "Pay now",
  "uses Pay now when money is due immediately",
);
const savedSummary = savedBody.props.children[1].props.children;
check(
  JSON.stringify(savedSummary).includes("VISA *4242") &&
    JSON.stringify(savedSummary).includes("USD 12.00"),
  "shows the normalized card and total amount",
);
check(
  JSON.stringify(savedSummary).includes("Subtotal") &&
    JSON.stringify(savedSummary).includes("Tax"),
  "breaks out positive tax",
);

const renewal = updateDialog.t({
  disableConfirm: true,
  onCancel() {},
  onConfirm() {
    confirmed += 1;
  },
  onOpenChange() {},
  subscriptionUpdate: { renewal: { plan: "plus" } },
});
const renewalBody = bodyOf(renewal);
renewalBody.props.onSubmit({ preventDefault() {} });
check(confirmed === 1, "blocks confirmation when disabled");
check(
  renewalBody.props.children[1].props.children.type === "RenewalNotice",
  "renders the renewal notice branch",
);

let web = 0;
const downgrade = updateDialog.t({
  isUpdating: true,
  onBack() {},
  onCancel() {},
  onConfirm() {},
  onGoToWeb: () => {
    web += 1;
  },
  onOpenChange() {},
  pricingInfo: {
    monthlyAmounts: { prolite: 20 },
    currencyCode: "USD",
    minorUnitExponent: 2,
  },
  subscriptionUpdate: {
    kind: "scheduled_downgrade",
    updatedPlan: "chatgptprolite",
    currentPlan: "pro",
    preview: { renewal_date: "2027-01-01" },
  },
});
const downgradeBody = bodyOf(downgrade);
const downgradeActions = downgradeBody.props.children[3].props.children;
check(
  downgrade.props.variant === "chatgpt" && !downgrade.props.showDialogClose,
  "uses the scheduled-change dialog treatment while updating",
);
check(
  downgradeBody.props.children[1].props.children.type === "PlanChangeNotice",
  "renders the scheduled plan-change notice",
);
downgradeActions.props.children[1].props.onClick();
check(web === 1, "forwards the Go to web action");
check(
  downgradeActions.props.children[2].props.disabled &&
    downgradeActions.props.children[2].props.loading,
  "disables and loads actions during an update",
);

assert.equal(assertions, 12);
console.log(`${assertions} subscription update dialog assertions passed`);
