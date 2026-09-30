import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const assetRoot = path.join(root, "src/webview/assets");
const modules = [
  [
    "ProductTag-d3b05b25b4e5.js",
    "product-tag-icon",
    ["rolldown-runtime", "app-shared"],
    ["default"],
  ],
  [
    "confirm-pricing-plan-upgrade-32a0f7010a57.js",
    "confirm-pricing-plan-upgrade",
    [
      "rolldown-runtime",
      "app-initial",
      "queries",
      "subscription-update-plan",
      "billing-queries",
      "stripe-client",
      "billing-state",
      "payment-method-display",
      "confirm-subscription-upgrade",
      "delinquent-upgrade-preparation",
    ],
    [
      "confirmPricingPlanUpgrade",
      "getPricingPlanDefaultPaymentMethod",
      "getPricingPlanPaymentMethod",
    ],
  ],
  [
    "computer-use-app-approval-request-card-63cdc4e7642f.js",
    "computer-use-app-approval-request-card",
    ["rolldown-runtime", "app-shared", "app-initial"],
    ["i", "n", "r", "t"],
  ],
  [
    "client-206f71f5a32c.js",
    "conversation-snapshot-client",
    ["rolldown-runtime", "app-shared", "app-initial"],
    ["clearPersistedConversationSnapshots", "createConversationSnapshotClient"],
  ],
];

const aliases = new Map([
  ["queries-286723afe196", "queries"],
  ["queries-75df5b2ce147", "billing-queries"],
  ["display-7469cc8285f9", "payment-method-display"],
]);
const releaseName = (name) =>
  aliases.get(name) || name.replace(/-[a-f0-9]{12}$/u, "");
const releaseDependencies = (source) =>
  [...source.matchAll(/from "\.\/([^"]+)\.js"/gu)].map((match) =>
    releaseName(match[1]),
  );
const recoveredDependencies = (source) =>
  [...source.matchAll(/(?:from\s*|import\s*)"@rchunk\/([^"]+)"/gu)].map(
    (match) => match[1],
  );

let sourceAssertions = 0;
for (const [asset, directory, dependencies] of modules) {
  const original = fs.readFileSync(
    path.join(assetRoot, asset.replace(/\.js$/u, ".ts")),
    "utf8",
  );
  const recovered = fs.readFileSync(
    path.join(root, "src/renderer", directory, "index.ts"),
    "utf8",
  );
  assert.deepEqual(
    releaseDependencies(original),
    dependencies,
    directory + " release dependencies",
  );
  assert.deepEqual(
    recoveredDependencies(recovered),
    dependencies,
    directory + " recovered dependencies",
  );
  assert.equal(
    (original.match(/import\(/gu) || []).length,
    0,
    directory + " release dynamics",
  );
  assert.equal(
    (recovered.match(/import\(/gu) || []).length,
    0,
    directory + " recovered dynamics",
  );
  assert.equal(
    /:\s*any\b|\bas any\b|<any>|@ts-expect-error|@ts-nocheck/u.test(recovered),
    false,
    directory + " type escapes",
  );
  assert.ok(
    recovered.includes("Release chunk: " + asset),
    directory + " provenance",
  );
  sourceAssertions += 6;
}

const state = {
  initializers: [],
  replies: [],
  settled: [],
  stores: [],
  requests: [],
  metrics: [],
  disposed: 0,
  closed: 0,
  storage: new Map(),
  confirmInput: null,
  responseFor(request) {
    if (request.type === "readSnapshot")
      return {
        status: "hit",
        byteLength: 42,
        decodeDurationMs: 3,
        payload: { ok: true },
      };
    if (request.type === "writeSnapshot")
      return { status: "written", byteLength: 88, encodeDurationMs: 4 };
    return { status: "ok" };
  },
};
globalThis.__nh = state;

const sharedMock = [
  "const s=globalThis.__nh;",
  "export const I3=()=>({Fragment:'fragment',jsx:(type,props)=>({type,props}),jsxs:(type,props)=>({type,props})});",
  "export const e6=()=>({useRef:value=>({current:value}),useState:value=>[value,next=>{s.lastState=next}]});",
  "export const LX=()=>({set:(key,value)=>s.stores.push([key,value])});export const HX=()=>false;",
  "export const n4=()=>({formatMessage:message=>message.defaultMessage});export const ZI={scope:true};",
  "export const S_='asset-icon';export const Zw={warning:true};export const Y2='formatted-message';",
  ...["$3", "FX", "K2", "C_", "QI"].map(
    (name) =>
      "export const " +
      name +
      "=()=>s.initializers.push('shared:" +
      name +
      "');",
  ),
  "export const DI=()=>({request:request=>{s.requests.push(request);return Promise.resolve(s.responseFor(request));},[Symbol.dispose]:()=>{s.disposed+=1}});",
  "export const EI=()=>s.initializers.push('shared:EI');",
].join("\n");
const initialMock = [
  "const s=globalThis.__nh;export const D0=()=> 'upgrade';export const O0=plan=>({pricePlan:plan});export const j0=()=>s.initializers.push('initial:j0');",
  "export const Ugn=()=>({replyWithMcpServerElicitationResponse:(conversationId,requestId,response)=>{s.replies.push({conversationId,requestId,response});return Promise.resolve()}});",
  "export const Whn=(decision,metadata)=>({decision,metadata});export const cen='approved';export const ngn=()=>false;",
  ...["wfn", "Wgn", "rgn", "len"].map(
    (name) =>
      "export const " +
      name +
      "=()=>s.initializers.push('initial:" +
      name +
      "');",
  ),
  "export const GHt={max:5};export const KHt=()=>s.initializers.push('initial:KHt');export const UHt='snapshot-db';export const WHt='codex.conversation_snapshot_cache.persisted';export const eJt='metrics';",
  "export const nJt={count:(...args)=>s.metrics.push(['count',...args]),hist:(...args)=>s.metrics.push(['hist',...args])};export const tJt=()=>s.initializers.push('initial:tJt');",
].join("\n");

function mockSource(name) {
  if (name === "rolldown-runtime") return "export {};";
  if (name === "app-shared") return sharedMock;
  if (name === "app-initial") return initialMock;
  if (name === "queries")
    return "export const i=()=>globalThis.__nh.initializers.push('queries');export const n=accountId=>({kind:'accounts',accountId});";
  if (name === "subscription-update-plan")
    return "export const n=plan=>plan;export const r=()=>globalThis.__nh.initializers.push('plans');";
  if (name === "billing-queries")
    return "export const n=()=>globalThis.__nh.initializers.push('billingQueries');export const r=accountId=>({kind:'billing',accountId});";
  if (name === "stripe-client")
    return "export const n=()=>globalThis.__nh.initializers.push('stripe');export const r=accountId=>({kind:'stripe',accountId});";
  if (name === "billing-state")
    return "export const i=method=>method.expired===true;";
  if (name === "payment-method-display")
    return "export const n=()=>globalThis.__nh.initializers.push('display');export const t=method=>({label:method.type+':'+method.id});";
  if (name === "confirm-subscription-upgrade")
    return "export const n=()=>globalThis.__nh.initializers.push('confirm');export const t=async(_scope,input)=>{globalThis.__nh.confirmInput=input;return {status:'complete'}};";
  if (name === "delinquent-upgrade-preparation")
    return "export const n=()=>globalThis.__nh.initializers.push('delinquent');export const t=error=>error?.code;";
  return "export {};";
}

async function bundle(directory) {
  const result = await esbuild.build({
    entryPoints: [path.join(root, "src/renderer", directory, "index.ts")],
    bundle: true,
    format: "esm",
    platform: "node",
    target: "node22",
    write: false,
    logLevel: "silent",
    define: { "import.meta.url": JSON.stringify("file:///nh/index.js") },
    plugins: [
      {
        name: "nh-mocks",
        setup(build) {
          build.onResolve({ filter: /^@rchunk\// }, ({ path: modulePath }) => ({
            path: modulePath.slice(8),
            namespace: "mock",
          }));
          build.onLoad(
            { filter: /.*/, namespace: "mock" },
            ({ path: name }) => ({ contents: mockSource(name), loader: "js" }),
          );
        },
      },
    ],
  });
  return import(
    "data:text/javascript;base64," +
      Buffer.from(result.outputFiles[0].text).toString("base64") +
      "#" +
      directory
  );
}

const loaded = new Map();
let runtimeAssertions = 0;
for (const [_asset, directory, _dependencies, expectedExports] of modules) {
  const module = await bundle(directory);
  loaded.set(directory, module);
  assert.deepEqual(
    Object.keys(module).sort(),
    [...expectedExports].sort(),
    directory + " exports",
  );
  runtimeAssertions += 1;
}

const iconModule = loaded.get("product-tag-icon");
const icon = iconModule.default({ className: "tag", focusable: false });
assert.equal(icon.type, "svg");
assert.equal(icon.props.viewBox, "0 0 20 20");
assert.equal(icon.props.className, "tag");
assert.equal(icon.props.children.type, "path");
runtimeAssertions += 4;

const paymentMethods = {
  default_payment_method_id: "card-ok",
  payment_methods: [
    { id: "card-expired", type: "card", expired: true },
    { id: "card-ok", type: "card" },
    { id: "bank", type: "bank" },
  ],
};
const pricingScope = {
  queryClient: {
    async fetchQuery(options) {
      if (options.kind === "accounts")
        return {
          accounts: {
            acct: {
              account: {
                account_id: "acct",
                account_user_id: "user__acct",
                plan_type: "free",
                structure: "personal",
              },
              last_active_subscription: { will_renew: true },
            },
          },
        };
      if (options.kind === "stripe") return { stripe: "stripe-client" };
      if (options.kind === "billing") return paymentMethods;
      throw new Error("unexpected query");
    },
  },
};
const pricing = loaded.get("confirm-pricing-plan-upgrade");
assert.equal(
  await pricing.getPricingPlanDefaultPaymentMethod(pricingScope, "acct"),
  "card:card-ok",
);
assert.equal(
  await pricing.getPricingPlanPaymentMethod(pricingScope, "acct", "card-ok"),
  paymentMethods.payment_methods[1],
);
assert.equal(
  await pricing.getPricingPlanPaymentMethod(
    pricingScope,
    "acct",
    "card-expired",
  ),
  undefined,
);
assert.deepEqual(
  await pricing.confirmPricingPlanUpgrade({
    scope: pricingScope,
    accountId: "acct",
    userId: "user",
    initialPlan: "free",
    updatedPlan: "pro",
    statsigClient: { getLayer: () => ({ get: (_key, fallback) => fallback }) },
    isActive: () => false,
  }),
  { status: "closed" },
);
assert.deepEqual(
  await pricing.confirmPricingPlanUpgrade({
    scope: pricingScope,
    accountId: "acct",
    userId: "user",
    initialPlan: "free",
    updatedPlan: "pro",
    paymentMethodId: "card-ok",
    isActive: () => true,
    statsigClient: {
      getLayer: () => ({
        get: (key, fallback) =>
          key === "payment_method_recovery_enabled"
            ? true
            : key === "mandate_recovery_payment_method_types"
              ? ["card"]
              : fallback,
      }),
    },
  }),
  { status: "complete" },
);
assert.equal(state.confirmInput.mandateRecovery, true);
assert.equal(await state.confirmInput.revalidatePaymentMethod(), true);
assert.equal(
  state.confirmInput.isPendingUpdateError({
    code: "subscription_update_pending",
  }),
  true,
);
runtimeAssertions += 8;

const approvals = loaded.get("computer-use-app-approval-request-card");
approvals.i();
assert.match(approvals.r, /computer-use-plugin-icon-5eae5ff78888\.png$/u);
const approvalCard = (props) => props;
const renderedApproval = approvals.t({
  ApprovalCard: approvalCard,
  conversationId: "conversation",
  hostId: "host",
  requestId: "request",
  onRequestSettled: (result) => state.settled.push(result),
  request: {
    appDisplayName: "Calendar",
    connectorName: "Calendar",
    persistModes: ["session", "always"],
  },
});
assert.equal(renderedApproval.type, approvalCard);
assert.equal(renderedApproval.props.actions.isLoading, false);
assert.equal(
  typeof renderedApproval.props.actions.leadingAction.onClick,
  "function",
);
renderedApproval.props.actions.leadingAction.onClick();
await Promise.resolve();
assert.deepEqual(state.replies.at(-1).response, {
  decision: "accept",
  metadata: { persist: "always" },
});
assert.equal(state.settled.at(-1), "accept");
assert.deepEqual(state.stores.at(-1), ["approved", true]);
runtimeAssertions += 7;

globalThis.localStorage = {
  getItem: (key) => state.storage.get(key) ?? null,
  setItem: (key, value) => state.storage.set(key, value),
  removeItem: (key) => state.storage.delete(key),
};
class SnapshotWorker {
  port = {
    close: () => {
      state.closed += 1;
    },
  };
  addEventListener() {}
}
globalThis.SharedWorker = SnapshotWorker;
const snapshots = loaded.get("conversation-snapshot-client");
const snapshotClient = snapshots.createConversationSnapshotClient();
const read = await snapshotClient.read("conversation", true);
assert.equal(read.status, "hit");
assert.deepEqual(read.payload, { ok: true });
const written = await snapshotClient.write(
  { conversation_id: "conversation", mapping: {} },
  100,
);
assert.equal(written.status, "written");
assert.equal(
  state.storage.get("codex.conversation_snapshot_cache.persisted"),
  "1",
);
await snapshotClient.delete("conversation");
await snapshotClient.clear();
assert.equal(state.disposed, 1);
assert.equal(state.closed, 1);
assert.deepEqual(
  state.requests.map((request) => request.type),
  ["readSnapshot", "writeSnapshot", "deleteSnapshot", "clearDatabase"],
);
runtimeAssertions += 8;

const total = sourceAssertions + runtimeAssertions;
console.log(
  "misc-ui-utils rewrite NH: " +
    total +
    "/" +
    total +
    " assertions passed (" +
    sourceAssertions +
    " source, " +
    runtimeAssertions +
    " runtime)",
);
