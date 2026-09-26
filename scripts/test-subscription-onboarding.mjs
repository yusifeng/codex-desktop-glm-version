import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
Object.defineProperty(globalThis, "navigator", {
  configurable: true,
  value: { userAgent: "Mozilla/5.0 (Mac OS X)" },
});
globalThis.window = { location: { pathname: "/", search: "", hash: "" } };
globalThis.__subscriptionHostTest = {
  candidates: null,
  location: {
    pathname: "/",
    search: "?refresh_account=true",
    hash: "#plus_onboarding",
    state: null,
  },
  queryOptions: null,
  query: {
    data: {
      account: {
        account_id: "account-1",
        structure: "personal",
        plan_type: "plus",
      },
      entitlement: { has_active_subscription: true },
    },
    isPending: false,
    isError: false,
  },
  variant: "carousel_v1",
  jsx: {
    jsx: (type, props, key) => ({ type, props, key }),
    jsxs: (type, props, key) => ({ type, props, key }),
  },
  react: {
    useEffect() {},
    useRef: (value) => ({ current: value }),
    useState: (value) => [value, () => {}],
  },
};

const result = await esbuild.build({
  entryPoints: [
    path.join(ROOT, "src/renderer/subscription-onboarding/index.ts"),
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
                  export const I3 = () => globalThis.__subscriptionHostTest.jsx;
                  export const e6 = () => globalThis.__subscriptionHostTest.react;
                  export const _L = options => {
                    globalThis.__subscriptionHostTest.queryOptions = options;
                    return globalThis.__subscriptionHostTest.query;
                  };
                  export const n4 = () => ({ formatMessage: descriptor => descriptor.defaultMessage });
                  export const Ih = "Dialog";
                  export const $3 = () => {}; export const K2 = () => {};
                `,
                "app-initial": `
                  export const N6t = () => ({ accountId: "account-1", userId: "user-1" });
                  export const i_n = () => globalThis.__subscriptionHostTest.location;
                  export const o_n = () => () => {};
                  export const Gzt = () => false;
                  export const lfn = () => ({});
                  export const rfn = (_context, id) => ({
                    get(key, fallback) {
                      if (id === "1895559448" && key === "onboarding_variant") return globalThis.__subscriptionHostTest.variant;
                      if (id === "3081805378" && key === "carousel_onboarding_variant") return globalThis.__subscriptionHostTest.variant;
                      return fallback;
                    },
                  });
                `,
                queries: `export const i = () => {}; export const n = accountId => ({ queryKey: ["account", accountId] });`,
                "subscription-onboarding-content": `
                  export const t = () => {};
                  export const d = "CheckoutFrame";
                  export const g = ["intelligence", "work", "voice"];
                  export const h = ["intelligence", "work", "codex"];
                  export const v = "PlusTour";
                  export const p = "ProTour";
                  export const l = "Student2026Tour";
                  export const s = "StudentTour";
                  export const n = account => account.discount?.promo_campaign_id === "students-2026-four-month-free";
                  export const r = () => true;
                  export const a = () => {};
                `,
              }[importPath] ?? "export {};",
            loader: "js",
          }),
        );
      },
    },
  ],
});
const host = await import(
  `data:text/javascript;base64,${Buffer.from(result.outputFiles[0].text).toString("base64")}`
);

let assertions = 0;
function check(value, message) {
  assert.ok(value, message);
  assertions += 1;
}
const props = {
  canPresent: true,
  canStartConversation: true,
  onCreateImage() {},
  onSelectIntelligence() {},
  onStartConversation() {},
  renderCandidates(candidates) {
    globalThis.__subscriptionHostTest.candidates = candidates;
    return candidates;
  },
};

const plusHost = host.SubscriptionOnboarding(props);
check(typeof plusHost.type === "function", "selects the plan onboarding host");
check(
  globalThis.__subscriptionHostTest.queryOptions.queryKey.join(":") ===
    "account:account-1" &&
    globalThis.__subscriptionHostTest.queryOptions.enabled === true &&
    globalThis.__subscriptionHostTest.queryOptions.staleTime === 0,
  "configures the typed account query for the active account",
);
const plusCandidates = plusHost.type(plusHost.props);
check(
  plusCandidates.length === 1,
  "adds one subscription onboarding candidate",
);
check(
  plusCandidates[0].id === "subscription-onboarding" &&
    plusCandidates[0].isEligible,
  "publishes an eligible tracked candidate",
);
check(
  plusCandidates[0].content.type === "PlusTour",
  "selects the Plus carousel for a Plus route",
);

globalThis.__subscriptionHostTest.location = {
  pathname: "/",
  search: "",
  hash: "#pro_onboarding",
  state: null,
};
globalThis.__subscriptionHostTest.query.data.account.plan_type = "pro";
const proHost = host.SubscriptionOnboarding(props);
const proCandidates = proHost.type(proHost.props);
check(proCandidates[0].content.type === "ProTour", "selects the Pro carousel");
check(
  proCandidates[0].content.props.featurePageIds.join(",") ===
    "intelligence,work,codex",
  "includes Codex on supported desktop platforms",
);

globalThis.__subscriptionHostTest.query.isPending = true;
const empty = host.SubscriptionOnboarding(props);
check(
  Array.isArray(empty) && empty.length === 0,
  "renders no candidate while loading",
);

globalThis.__subscriptionHostTest.query.isPending = false;
globalThis.__subscriptionHostTest.query.data.account.plan_type = "plus";
globalThis.__subscriptionHostTest.query.data.entitlement.discount = {
  promo_campaign_id: "students-2026-four-month-free",
};
globalThis.__subscriptionHostTest.location = {
  pathname: "/",
  search: "",
  hash: "",
  state: null,
};
const student = host.SubscriptionOnboarding(props);
check(
  student[0].content.type.name === "StudentOnboardingHost",
  "routes an eligible student campaign to the student host",
);

assert.equal(assertions, 9);
console.log(`${assertions} subscription onboarding host assertions passed`);
