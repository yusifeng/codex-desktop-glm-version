import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const sourcePath = path.join(ROOT, "src/renderer/verify-page/index.ts");
const source = fs.readFileSync(sourcePath, "utf8");
const state = {
  accountId: "account-1",
  apiGets: [],
  apiPosts: [],
  beaconPath: "/beacon-return",
  continuation: {},
  continuationOptions: null,
  getQueue: [],
  initialized: 0,
  integrityActions: [],
  navigations: [],
  params: new URLSearchParams(),
  postQueue: [],
  stripeCalls: [],
  verification: {},
  verificationOptions: null,
};
const node = (type, props = {}) => ({ type, props });
const jsx = {
  jsx(type, props, key) {
    return typeof type === "function"
      ? type(props ?? {})
      : { type, props: props ?? {}, key };
  },
  jsxs(type, props, key) {
    return typeof type === "function"
      ? type(props ?? {})
      : { type, props: props ?? {}, key };
  },
};
globalThis.window = {
  location: { origin: "https://chatgpt.com" },
  setTimeout(callback) {
    callback();
    return 1;
  },
};
globalThis.__verifyPage = { jsx, node, state };

const initializer = "()=>{globalThis.__verifyPage.state.initialized+=1}";
const mocks = {
  "rolldown-runtime": "export {};",
  "app-shared": [
    "const r=globalThis.__verifyPage;",
    `export const $3=${initializer};`,
    "export const I3=()=>r.jsx;",
    `export const K2=${initializer};`,
    "export const Mh=props=>r.node('page',props);",
    `export const Ph=${initializer};`,
    "export const Y2=props=>r.node('message',props);",
    "export const Yh=props=>r.node('button',props);",
    `export const Zh=${initializer};`,
    "export const _L=options=>{if(options.queryKey?.[0]==='checkout-payment-continuation'){r.state.continuationOptions=options;return r.state.continuation}r.state.verificationOptions=options;return r.state.verification};",
    `export const gL=${initializer};`,
  ].join("\n"),
  "app-initial": [
    "const r=globalThis.__verifyPage;",
    `export const M6t=${initializer};`,
    "export const N6t=()=>({accountId:r.state.accountId});",
    `export const Qgn=${initializer};`,
    "export const Ygn=props=>r.node('navigate',props);",
    "export const _0=()=>'/fallback';",
    "export const _T=props=>r.node('loading',props);",
    `export const cJt=${initializer};`,
    "export const d_n=()=>[r.state.params];",
    "export const o_n=()=>((destination,options)=>r.state.navigations.push([destination,options]));",
    "export const rJt={safeGet:async(path,options)=>{r.state.apiGets.push([path,options]);const next=r.state.getQueue.shift();if(next instanceof Error)throw next;return next},safePost:async(path,options)=>{r.state.apiPosts.push([path,options]);const next=r.state.postQueue.shift();if(next instanceof Error)throw next;return next}};",
    "export const r_n=path=>'https://chatgpt.com'+path;",
    `export const v0=${initializer};`,
    `export const vT=${initializer};`,
  ].join("\n"),
  "app-primary": [
    "const r=globalThis.__verifyPage;",
    "export const ch=(params,source)=>{const output=new URLSearchParams(source);for(const [key,value] of params)if(!['redirectResult','pending','conditional_offer_preflight'].includes(key))output.set(key,value);return output};",
    "export const ih=()=>r.state.beaconPath;",
    `export const sh=${initializer};`,
  ].join("\n"),
  "checkout-policy": [
    `export const S=${initializer};`,
    `export const k=${initializer};`,
    "export const A=(input,output)=>{for(const key of ['source','checkout_from']){const value=input.get(key);if(value!=null)output.set(key,value)}return output};",
    "export const f=value=>value;",
    "export const l=checkout=>checkout.team_path??null;",
    "export const n={StandaloneCredit:'standalone_credit'};",
  ].join("\n"),
  error: [
    "const r=globalThis.__verifyPage;",
    "export const a=props=>r.node('payment-error',props);",
    `export const o=${initializer};`,
  ].join("\n"),
  pure: [
    "const runtime=globalThis.__verifyPage;",
    "export const r=async key=>({confirmPayment:async options=>{globalThis.__verifyPage.state.stripeCalls.push([key,options]);return {}}});",
    `export const t=${initializer};`,
  ].join("\n"),
  "chatgpt-account-action-integrity": [
    "const runtime=globalThis.__verifyPage;",
    "export const n=async action=>{runtime.state.integrityActions.push(action);return {'x-integrity':'ok'}};",
    `export const r=${initializer};`,
  ].join("\n"),
  session: [
    "const runtime=globalThis.__verifyPage;",
    `export const d=${initializer};`,
    "export const i=(accountId,route)=>({queryKey:['checkout-session',accountId,route.processorEntity,route.checkoutSessionId]});",
    `export const o=${initializer};`,
    "export const r={safeParse:value=>value.processorEntity&&value.checkoutSessionId?{success:true,data:value}:{success:false}};",
    "export const u=props=>globalThis.__verifyPage.node('checkout-wrapper',props);",
  ].join("\n"),
};

const result = await esbuild.build({
  entryPoints: [sourcePath],
  bundle: true,
  format: "esm",
  platform: "node",
  target: "node22",
  write: false,
  logLevel: "silent",
  plugins: [
    {
      name: "verify-page-mocks",
      setup(build) {
        build.onResolve({ filter: /^@rchunk\// }, ({ path: importPath }) => ({
          path: importPath.slice(8),
          namespace: "mock",
        }));
        build.onLoad(
          { filter: /.*/, namespace: "mock" },
          ({ path: moduleName }) => ({
            contents: mocks[moduleName] ?? "export {};",
            loader: "js",
          }),
        );
      },
    },
  ],
});
const module = await import(
  "data:text/javascript;base64," +
    Buffer.from(result.outputFiles[0].text).toString("base64")
);

assert.deepEqual(Object.keys(module), ["CheckoutVerifyPage"]);
assert.equal(state.initialized, 18);
const imports = [...source.matchAll(/from \"@rchunk\/([^\"]+)\"/g)].map(
  (match) => match[1],
);
assert.deepEqual(imports, [
  "app-shared",
  "app-initial",
  "app-primary",
  "checkout-policy",
  "error",
  "pure",
  "chatgpt-account-action-integrity",
  "session",
]);
assert.equal(source.includes('import "@rchunk/rolldown-runtime"'), true);
assert.equal(/\bany\b/.test(source), false);
assert.equal(
  /\b(?:appSharedChunk|appInitialChunk|appPrimaryChunk|checkoutPolicyChunk|errorChunk|stripeLoaderChunk|integrityChunk|sessionChunk)\s*\./.test(
    source,
  ),
  false,
);

function reset(query = "processor_entity=openai&stripe_session_id=session-1") {
  state.accountId = "account-1";
  state.apiGets.length = 0;
  state.apiPosts.length = 0;
  state.continuation = {
    refetch: () => {
      state.continuationRefetched = (state.continuationRefetched ?? 0) + 1;
    },
  };
  state.continuationOptions = null;
  state.continuationRefetched = 0;
  state.getQueue.length = 0;
  state.integrityActions.length = 0;
  state.navigations.length = 0;
  state.params = new URLSearchParams(query);
  state.postQueue.length = 0;
  state.stripeCalls.length = 0;
  state.verification = {
    refetch: () => {
      state.verificationRefetched = (state.verificationRefetched ?? 0) + 1;
    },
  };
  state.verificationOptions = null;
  state.verificationRefetched = 0;
}
function render() {
  return module.CheckoutVerifyPage();
}
function walk(value, output = []) {
  if (value == null || typeof value !== "object") return output;
  if (Array.isArray(value)) {
    for (const item of value) walk(item, output);
    return output;
  }
  output.push(value);
  walk(value.props?.children, output);
  return output;
}
function find(view, type) {
  return walk(view).find((item) => item.type === type);
}
function textContent(value) {
  if (value == null || typeof value === "boolean") return "";
  if (typeof value === "string" || typeof value === "number")
    return String(value);
  if (Array.isArray(value)) return value.map(textContent).join(" ");
  return value.type === "message"
    ? String(value.props.defaultMessage ?? "")
    : textContent(value.props?.children);
}

reset("processor_entity=openai");
let view = render();
assert.equal(view.type, "navigate");
assert.equal(view.props.to, "/fallback");
assert.equal(view.props.replace, true);

reset();
state.accountId = null;
view = render();
assert.equal(view.type, "loading");

reset(
  "processor_entity=openai&stripe_session_id=session-1&source=campaign&account_id=account-1",
);
state.verification.data = {
  tag: "custom_checkout_session",
  status: "complete",
  confirm_return_url: "https://chatgpt.com/done?plan_type=team&campaign=return",
};
view = render();
assert.equal(view.type, "navigate");
assert.equal(view.props.to.startsWith("/payments/success?"), true);
assert.equal(view.props.to.includes("processor_entity=openai"), true);
assert.equal(view.props.to.includes("stripe_session_id=session-1"), true);
assert.equal(view.props.to.includes("plan_type=team"), true);
assert.equal(view.props.to.includes("campaign=return"), true);
assert.equal(view.props.to.includes("account_id=account-1"), true);

reset();
state.verification.data = {
  tag: "custom_checkout_session",
  status: "complete",
  team_path: "/workspace/team-success",
};
view = render();
assert.equal(view.props.to, "/workspace/team-success");

reset(
  "processor_entity=openai&stripe_session_id=session-1&wallet_covered=true",
);
view = render();
assert.equal(view.type, "navigate");
assert.equal(view.props.to.includes("wallet_covered=true"), true);
assert.equal(state.verificationOptions.enabled, false);

reset("processor_entity=openai&stripe_session_id=session-1&pending=true");
state.verification.data = { tag: "custom_checkout_session", status: "open" };
view = render();
assert.equal(find(view, "checkout-wrapper").props.returnPath, "/beacon-return");
assert.equal(find(view, "p").props.role, "status");
assert.equal(textContent(view).includes("still processing"), true);
assert.equal(
  state.verificationOptions.refetchInterval({
    state: { data: state.verification.data },
  }),
  5000,
);

reset();
state.verification.data = {
  tag: "custom_checkout_session",
  status: "open",
  checkout_kind: "standalone_credit",
  credit_payment_state: "processing",
};
view = render();
assert.equal(textContent(view).includes("still processing"), true);
assert.equal(
  state.verificationOptions.refetchInterval({
    state: { data: state.verification.data },
  }),
  5000,
);

reset();
state.verification.isPending = true;
view = render();
assert.equal(view.type, "loading");

reset();
state.verification.data = { tag: "custom_checkout_session", status: "expired" };
view = render();
assert.equal(
  find(view, "payment-error").props.error.message,
  "Payment verification failed",
);
find(view, "payment-error").props.onRetry();
assert.equal(state.verificationRefetched, 1);

reset(
  "processor_entity=openai&stripe_session_id=session-1&redirectResult=returned",
);
state.continuation.data = {
  accountId: "account-1",
  failed: true,
  response: null,
};
view = render();
find(view, "payment-error").props.onRetry();
assert.equal(state.continuationRefetched, 1);

reset(
  "processor_entity=openai&stripe_session_id=session-1&redirectResult=returned",
);
state.continuation.data = {
  accountId: "other-account",
  failed: false,
  response: { status: "pending" },
};
view = render();
find(view, "payment-error").props.onRetry();
assert.deepEqual(state.navigations.at(-1), ["/fallback", undefined]);
assert.equal(state.verificationOptions.enabled, false);

reset("processor_entity=openai&stripe_session_id=session-1&source=resume");
state.verification.data = { tag: "custom_checkout_session", status: "open" };
view = render();
const resumeButton = find(view, "button");
assert.equal(textContent(resumeButton), "Return to payment details");
resumeButton.props.onClick();
assert.equal(
  state.navigations.at(-1)[0],
  "/checkout/openai/session-1?processor_entity=openai&stripe_session_id=session-1&source=resume",
);
assert.deepEqual(state.navigations.at(-1)[1], { replace: true });

reset(
  "processor_entity=openai&stripe_session_id=session-1&redirectResult=token",
);
render();
assert.deepEqual(state.continuationOptions.queryKey, [
  "checkout-payment-continuation",
  "openai",
  "session-1",
  "token",
  false,
]);
assert.equal(state.continuationOptions.enabled, true);
assert.equal(state.continuationOptions.retry, false);
assert.equal(state.continuationOptions.staleTime, Number.POSITIVE_INFINITY);
assert.equal(state.continuationOptions.refetchOnMount, false);
state.postQueue.push({ status: "pending" });
let continuationResult = await state.continuationOptions.queryFn({
  signal: new AbortController().signal,
});
assert.deepEqual(continuationResult, {
  accountId: "account-1",
  response: { status: "pending" },
  failed: false,
});
assert.equal(
  state.apiPosts.at(-1)[0],
  "/payments/checkout/custom_payment_method/continue",
);
assert.equal(
  state.apiPosts.at(-1)[1].requestBody.action_result.redirectResult,
  "token",
);

reset(
  "processor_entity=openai&stripe_session_id=session-1&conditional_offer_preflight=true",
);
render();
state.getQueue.push({
  tag: "custom_checkout_session",
  status: "open",
  publishable_key: "pk_test",
});
state.postQueue.push({
  status: "success",
  type: "payment_intent",
  conditional_offer_preflight: true,
  client_secret: "secret",
});
continuationResult = await state.continuationOptions.queryFn({
  signal: new AbortController().signal,
});
assert.deepEqual(continuationResult, {
  accountId: "account-1",
  response: { status: "pending" },
  failed: false,
});
assert.equal(state.integrityActions.at(-1), "checkout_session_approval");
assert.equal(state.apiPosts.at(-1)[0], "/payments/checkout/confirm");
assert.deepEqual(state.apiPosts.at(-1)[1].additionalHeaders, {
  "x-integrity": "ok",
});
assert.deepEqual(state.stripeCalls.at(-1), [
  "pk_test",
  { clientSecret: "secret", redirect: "if_required" },
]);

reset();
render();
assert.deepEqual(state.verificationOptions.queryKey, [
  "checkout-session",
  "account-1",
  "openai",
  "session-1",
  "verification",
]);
assert.equal(state.verificationOptions.enabled, true);
assert.equal(state.verificationOptions.staleTime, 0);
state.getQueue.push(
  { tag: "custom_checkout_session", status: "open" },
  { tag: "custom_checkout_session", status: "open" },
  { tag: "custom_checkout_session", status: "complete" },
);
const verified = await state.verificationOptions.queryFn({
  signal: new AbortController().signal,
});
assert.equal(verified.status, "complete");
assert.equal(state.apiGets.length, 3);

reset();
render();
state.getQueue.push({
  tag: "custom_checkout_session",
  status: "open",
  checkout_kind: "standalone_credit",
  credit_payment_state: "processing",
});
const processing = await state.verificationOptions.queryFn({
  signal: new AbortController().signal,
});
assert.equal(processing.credit_payment_state, "processing");
assert.equal(state.apiGets.length, 1);
assert.equal(
  state.verificationOptions.refetchInterval({
    state: { data: { tag: "other", status: "complete" } },
  }),
  false,
);

const assertionCount = [
  ...fs
    .readFileSync(fileURLToPath(import.meta.url), "utf8")
    .matchAll(/\bassert\./g),
].length;
console.log(assertionCount + " verify page assertions passed");
