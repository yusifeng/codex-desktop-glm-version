import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
globalThis.__renewalPaymentTest = {
  opened: null,
  account: {
    data: {
      id: "workspace-1",
      structure: "workspace",
      account_user_role: "account-owner",
      plan_type: "business",
    },
    isLoading: false,
  },
  subscription: {
    data: { grace_period_end_timestamp: "2027-01-08T00:00:00Z" },
    isLoading: false,
  },
  jsx: { jsx: (type, props, key) => ({ type, props, key }) },
};
const result = await esbuild.build({
  entryPoints: [
    path.join(ROOT, "src/renderer/workspace-renewal-payment/index.ts"),
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
                  export const I3 = () => globalThis.__renewalPaymentTest.jsx;
                  export const n4 = () => ({ formatDate: value => "Jan 8:" + value });
                  export const Y2 = "FormattedMessage";
                  export const BX = () => globalThis.__renewalPaymentTest.subscription;
                  export const $3 = () => {}; export const K2 = () => {};
                `,
                "app-initial": `
                  export const uht = () => globalThis.__renewalPaymentTest.account;
                  export const Hln = plan => plan === "business";
                  export const uP = () => new Date("2027-01-05T00:00:00Z");
                  export const n7 = "Banner"; export const jTt = "https://billing.example";
                  export const Oft = input => { globalThis.__renewalPaymentTest.opened = input; };
                  export const rht = () => {}; export const eEt = () => {}; export const r7 = () => {};
                  export const Dft = () => {}; export const sP = () => {}; export const Rln = () => {};
                `,
                "app-primary": `export const Jp = "WarningIcon"; export const Yp = () => {};`,
                "workspace-renewal-state": `
                  export const n = () => {}; export const r = "query";
                  export const t = (subscription, now) => now < new Date(subscription.grace_period_end_timestamp) ? subscription.grace_period_end_timestamp : null;
                `,
              }[importPath] ?? "export {};",
            loader: "js",
          }),
        );
      },
    },
  ],
});
const payment = await import(
  `data:text/javascript;base64,${Buffer.from(result.outputFiles[0].text).toString("base64")}`
);

let assertions = 0;
function check(value, message) {
  assert.ok(value, message);
  assertions += 1;
}
const candidate = payment.n();
check(
  candidate.id === "workspace-renewal-payment",
  "uses the stable candidate id",
);
check(
  candidate.isEligible && !candidate.isLoading,
  "is eligible for an owner in grace period",
);
check(candidate.content.type === "Banner", "renders the shared warning banner");
check(
  candidate.content.props.title.props.defaultMessage ===
    "Workspace renewal failed" &&
    candidate.content.props.primaryCtaText.props.defaultMessage ===
      "Update payment",
  "preserves renewal warning copy",
);
check(candidate.content.props.Icon === "WarningIcon", "uses the warning icon");
candidate.content.props.onPrimaryCtaClick("click");
check(
  globalThis.__renewalPaymentTest.opened.href === "https://billing.example" &&
    globalThis.__renewalPaymentTest.opened.event === "click",
  "opens workspace billing with the source event",
);

globalThis.__renewalPaymentTest.account.data.account_user_role = "member";
const member = payment.n();
check(!member.isEligible, "hides renewal payment from non-owners");
globalThis.__renewalPaymentTest.account.isLoading = true;
check(payment.n().isLoading, "reports account loading state");

assert.equal(assertions, 8);
console.log(`${assertions} workspace renewal payment assertions passed`);
