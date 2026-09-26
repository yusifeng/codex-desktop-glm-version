import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

async function loadModule(mocks) {
  const result = await esbuild.build({
    entryPoints: [
      path.join(ROOT, "src/renderer/subscription-management-page/index.ts"),
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
              contents: mocks[importPath] ?? "export {};",
              loader: "js",
            }),
          );
        },
      },
    ],
  });
  return import(
    `data:text/javascript;base64,${Buffer.from(result.outputFiles[0].text).toString("base64")}`
  );
}

globalThis.__subscriptionManagementTest = {
  accountIds: [],
  activeAccountId: "account-1",
  billingFlag: true,
  flagLoading: false,
  location: { search: "", pathname: "/subscription/manage" },
  query: { isPending: true, isFetching: false, isError: false },
  replaced: [],
  switched: [],
  navigated: [],
  jsx: {
    jsx(type, props, key) {
      return { type, props, key };
    },
  },
  react: {
    useRef(value) {
      return { current: value };
    },
    useEffect(effect) {
      effect();
    },
  },
};
globalThis.window = {
  location: {
    origin: "https://chatgpt.com",
    replace(url) {
      globalThis.__subscriptionManagementTest.replaced.push(url);
    },
  },
};

const management = await loadModule({
  "app-shared": `
    export const I3 = globalThis.__subscriptionManagementTest.jsx;
    export const e6 = globalThis.__subscriptionManagementTest.react;
    export const _L = () => globalThis.__subscriptionManagementTest.query;
    export const iL = options => ({
      isError: false,
      mutate: () => { void options.mutationFn(); },
    });
  `,
  "app-initial": `
    export const d_n = () => [{ getAll: () => globalThis.__subscriptionManagementTest.accountIds }];
    export const Ygn = "Navigate";
    export const Let = "Loading";
    export const N6t = () => ({ accountId: globalThis.__subscriptionManagementTest.activeAccountId });
    export const lfn = () => "credential";
    export const i_n = () => globalThis.__subscriptionManagementTest.location;
    export const r_n = () => "/subscription/manage?account_id=account-1";
    export const Mx = async (workspace, credential, returnUrl) => {
      globalThis.__subscriptionManagementTest.switched.push({ workspace, credential, returnUrl });
      return { willRedirect: false };
    };
    export const kx = value => "session:" + value;
    export const Ax = async url => { globalThis.__subscriptionManagementTest.navigated.push(url); };
    export const O0 = plan => plan === "plus" ? "PLUS" : null;
    export const ofn = () => globalThis.__subscriptionManagementTest.billingFlag;
    export const sfn = () => globalThis.__subscriptionManagementTest.flagLoading;
  `,
  queries: `
    export const i = () => {};
    export const n = accountId => ({ accountId });
  `,
});

let assertions = 0;
function check(value, message) {
  assert.ok(value, message);
  assertions += 1;
}

let view = management.SubscriptionManagementPage();
check(
  view.type === "Navigate" && view.props.to === "/",
  "rejects a missing account_id",
);
globalThis.__subscriptionManagementTest.accountIds = ["account-1", "account-2"];
view = management.SubscriptionManagementPage();
check(view.type === "Navigate", "rejects ambiguous account_id values");

globalThis.__subscriptionManagementTest.accountIds = [" account-1 "];
view = management.SubscriptionManagementPage();
check(view.key === "account-1", "trims and keys the selected account route");
let accountView = view.type(view.props);
check(
  accountView.type === "Loading",
  "shows loading while the account query is pending",
);

globalThis.__subscriptionManagementTest.query = {
  isPending: false,
  isFetching: false,
  isError: false,
  data: {
    account: {
      account_id: "account-1",
      structure: "personal",
      plan_type: "plus",
    },
    can_access_with_session: true,
  },
};
accountView = management.SubscriptionManagementPage();
const settingsRedirect = accountView.type(accountView.props);
const billingRedirect = settingsRedirect.type(settingsRedirect.props);
check(
  billingRedirect.type === "Navigate" &&
    billingRedirect.props.to === "/settings/billing",
  "routes an eligible personal plan to billing settings",
);

globalThis.__subscriptionManagementTest.billingFlag = false;
accountView = management.SubscriptionManagementPage();
const legacyRedirect = accountView.type(accountView.props).type({});
check(
  legacyRedirect.props.to === "/settings/account",
  "falls back to account settings",
);

globalThis.__subscriptionManagementTest.query.data.account.plan_type = "free";
accountView = management.SubscriptionManagementPage();
const unsupportedPlan = accountView.type(accountView.props);
check(
  unsupportedPlan.props.to === "/settings/account",
  "rejects a non-billable plan",
);

globalThis.__subscriptionManagementTest.query.data.account = {
  account_id: "account-1",
  structure: "workspace",
  plan_type: "plus",
};
globalThis.__subscriptionManagementTest.activeAccountId = "account-1";
accountView = management.SubscriptionManagementPage();
accountView.type(accountView.props);
check(
  globalThis.__subscriptionManagementTest.replaced.at(-1) === "/admin/billing",
  "sends an active workspace account to admin billing",
);

globalThis.__subscriptionManagementTest.query.data.account = {
  account_id: "account-1",
  structure: "personal",
  plan_type: "plus",
  name: "Personal",
};
globalThis.__subscriptionManagementTest.activeAccountId = "account-2";
accountView = management.SubscriptionManagementPage();
accountView.type(accountView.props);
await new Promise((resolve) => setTimeout(resolve, 0));
check(
  globalThis.__subscriptionManagementTest.switched.at(-1).workspace
    .workspaceAccountId === "account-1" &&
    globalThis.__subscriptionManagementTest.navigated
      .at(-1)
      .includes("refresh_account=true"),
  "switches account context and refreshes the management route",
);

globalThis.__subscriptionManagementTest.location.search =
  "?refresh_account=true";
accountView = management.SubscriptionManagementPage();
const refreshed = accountView.type(accountView.props);
check(
  refreshed.type === "Navigate" && refreshed.props.to === "/",
  "breaks a failed refresh loop",
);

assert.equal(assertions, 10);
console.log(`${assertions} subscription management page assertions passed`);
