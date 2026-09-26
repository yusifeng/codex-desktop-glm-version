import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

async function bundle(entry, mocks = {}) {
  const result = await esbuild.build({
    entryPoints: [path.join(ROOT, entry)],
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

let assertions = 0;
function check(value, message) {
  assert.ok(value, message);
  assertions += 1;
}

const htmlModule = await bundle(
  "src/renderer/wallet-onboarding-announcement-content/wallet-enrollment-html.ts",
);
const html = htmlModule.buildWalletEnrollmentHtml(
  { title: "Add <card>", submit: "Add card" },
  { styleVariables: { "--color": "<red>" }, theme: "dark" },
);
check(
  html.startsWith("<!doctype html>"),
  "builds a standalone enrollment document",
);
check(
  html.includes(
    "https://js.verygoodvault.com/vgs-collect/3.2.2/vgs-collect.js",
  ),
  "pins the official VGS Collect SDK",
);
check(
  html.includes("__wallet_onboarding_register_vgs_card"),
  "keeps the registration tool bridge",
);
check(
  html.includes("__wallet_onboarding_request_verification") &&
    html.includes("__wallet_onboarding_verify_card"),
  "keeps verification tool bridges",
);
check(
  html.includes("__wallet_onboarding_finalize_card"),
  "keeps the finalization tool bridge",
);
check(
  html.includes('addEventListener("openai:set_globals"'),
  "resynchronizes host globals",
);
check(
  html.includes("form.createCard"),
  "vaults card fields through VGS rather than the host page",
);
check(
  html.includes("Add \\u003ccard>") && html.includes("\\u003cred>"),
  "escapes injected message and style JSON",
);

globalThis.__walletContentTest = {
  stateQueue: [],
  stateWrites: [],
  effects: [],
  calls: [],
  completed: 0,
  identity: { kind: "connector", connectorId: "wallet-connector" },
  jsx: {
    Fragment: "fragment",
    jsx(type, props, key) {
      return { type, props, key };
    },
    jsxs(type, props, key) {
      return { type, props, key };
    },
  },
};
globalThis.__walletContentTest.react = {
  useId() {
    return "react-id";
  },
  useRef(value) {
    return { current: value };
  },
  useState(initial) {
    const value = globalThis.__walletContentTest.stateQueue.length
      ? globalThis.__walletContentTest.stateQueue.shift()
      : initial;
    return [
      value,
      (next) => globalThis.__walletContentTest.stateWrites.push(next),
    ];
  },
  useEffectEvent(callback) {
    return callback;
  },
  useEffect(effect) {
    globalThis.__walletContentTest.effects.push(effect());
  },
  useLayoutEffect(effect) {
    globalThis.__walletContentTest.effects.push(effect());
  },
};

const webview = {
  className: "",
  parentElement: null,
  setAttribute() {},
  remove() {},
  destroy() {},
};
const target = {
  appendChild(child) {
    child.parentElement = this;
  },
};
globalThis.document = {
  documentElement: { dataset: { theme: "light" } },
  createElement() {
    return webview;
  },
};

const bridge = {
  async *runWidgetCode() {
    yield { status: "running" };
  },
  async setTheme() {},
  async notifyMcpAppsHostContext() {},
  async setWidgetData() {},
};
globalThis.__walletContentTest.scope = {
  get(key) {
    if (key === "resource-current") return "current";
    return {};
  },
};

const content = await bundle(
  "src/renderer/wallet-onboarding-announcement-content/index.ts",
  {
    "app-shared": `
      export const I3 = globalThis.__walletContentTest.jsx;
      export const e6 = globalThis.__walletContentTest.react;
      export const BX = query => query === "identity-query" ? { data: globalThis.__walletContentTest.identity } : { data: { sourceUrl: "https://wallet.example/widget" } };
      export const LX = () => globalThis.__walletContentTest.scope;
      export const ZI = "scope";
      export const n4 = () => ({ locale: "en-US", formatMessage: descriptor => descriptor.defaultMessage });
      export const HX = () => ({ "--color-background-primary": "#fff" });
      export const AZ = values => JSON.stringify(values);
      export const KH = id => "persist:" + id;
      export const qH = () => "https://wallet.example";
      export const Q3 = { info() {}, warning() {} };
      export const Ih = "Dialog";
      export const Yh = "Button";
      export const Y2 = "FormattedMessage";
      export const Rh = "Heading";
      export const Ah = "Result";
      export const S_ = "Icon";
      export const vD = "check";
      export const o$ = { div: "MotionDiv", span: "MotionSpan" };
    `,
    "app-initial": `
      export const Ok = ({ view }) => ({ view });
      export const Rlt = "identity-query";
      export const eU = "source-query";
      export const QH = () => "sandbox-id";
      export const Blt = "resource-current";
      export const qU = "style-vars";
      export const Slt = () => false;
      export const Fnt = { safeParse: value => ({ success: value?.status === "running" }) };
      export const Ydt = ({ toolName }) => ({ name: toolName });
      export const mXt = () => false;
      export const sXt = ({ toolResult }) => toolResult;
      export const cXt = ({ toolResult }) => toolResult.structuredContent;
      export const Rdt = async (_scope, _hostId, _server, toolName, input) => {
        globalThis.__walletContentTest.calls.push({ toolName, input });
        if (toolName === "bootstrap") return { structuredContent: { vgs_collect_bootstrap: { access_token: "token", environment: "sandbox", vault_id: "vault" } } };
        if (toolName.endsWith("register_vgs_agentic_token")) return { structuredContent: { ok: true, registration_id: "registration-1", status: "verification_required", verification_options: [{ option_id: "sms" }] } };
        if (toolName.endsWith("finalize_vgs_card_registration")) return { structuredContent: { ok: true, card: { last4: "4242" } } };
        return { structuredContent: { ok: true } };
      };
      export const Nnt = async options => { globalThis.__walletContentTest.hostApiHandlers = options.hostApiHandlers; return globalThis.__walletContentTest.bridge; };
    `,
    "wallet-onboarding-announcement-modal": `
      export const WalletOnboardingAnnouncementModal = "WalletModal";
    `,
  },
);
globalThis.__walletContentTest.bridge = bridge;

const enrollmentView = {
  hostId: "host-1",
  server: { id: "wallet-server" },
  tool: { name: "bootstrap" },
  serverTools: [
    { name: "wallet.register_vgs_agentic_token" },
    { name: "wallet.request_vgs_card_verification" },
    { name: "wallet.verify_vgs_card" },
    { name: "wallet.finalize_vgs_card_registration" },
  ],
};
let root = content.WalletOnboardingAnnouncement({
  dismissAnnouncement() {},
  enrollmentView,
});
check(root.key === "host-1", "keys the onboarding flow by host identity");
let flow = root.type(root.props);
check(
  flow.props.children[0].type === "WalletModal",
  "starts on the Wallet introduction modal",
);
flow.props.children[0].props.onSetUpWallet();
check(
  globalThis.__walletContentTest.stateWrites[0] === true,
  "records setup intent while preparation is loading",
);
check(
  flow.props.children[1].props.preparing === true,
  "prepares the secure sandbox behind the introduction",
);

let resource = flow.props.children[1];
let sandbox = resource.type(resource.props);
check(
  sandbox.type?.name === "WalletEnrollmentSandbox",
  "binds enrollment to the resolved resource identity",
);

globalThis.__walletContentTest.stateQueue = [
  0,
  {
    attempt: 1,
    retry: 0,
    status: "ready",
    metadata: {
      vgs_collect_bootstrap: {
        access_token: "token",
        environment: "sandbox",
        vault_id: "vault",
      },
    },
  },
  bridge,
  webview,
  true,
];
globalThis.__walletContentTest.effects = [];
const hiddenTarget = sandbox.type({
  ...sandbox.props,
  active: true,
  preparing: false,
  targetElement: target,
  onComplete: () => {
    globalThis.__walletContentTest.completed += 1;
  },
});
check(
  hiddenTarget.props["aria-hidden"] === "true",
  "keeps an offscreen target for inactive enrollment",
);
await new Promise((resolve) => setTimeout(resolve, 0));
const handlers = globalThis.__walletContentTest.hostApiHandlers;
check(handlers != null, "installs a constrained sandbox host API");
await handlers.callTool("__wallet_onboarding_register_vgs_card", {
  vgs_card_id: "vgs-card-1",
});
await handlers.callTool("__wallet_onboarding_request_verification", {
  option_id: "sms",
});
await handlers.callTool("__wallet_onboarding_verify_card", { otp: "123456" });
await handlers.callTool("__wallet_onboarding_finalize_card", {});
check(
  globalThis.__walletContentTest.calls.some((call) =>
    call.toolName.endsWith("register_vgs_agentic_token"),
  ) &&
    globalThis.__walletContentTest.calls.some((call) =>
      call.toolName.endsWith("verify_vgs_card"),
    ),
  "dispatches registration and OTP calls only to matching Wallet tools",
);
check(
  globalThis.__walletContentTest.completed === 1,
  "completes enrollment after a valid finalization result",
);
await assert.rejects(
  handlers.callTool("__wallet_onboarding_verify_card", { otp: "12" }),
  /registration|verification code/,
);
assertions += 1;

globalThis.__walletContentTest.stateQueue = [
  "enrollment",
  2,
  true,
  "error",
  null,
];
root = content.WalletOnboardingAnnouncement({
  dismissAnnouncement() {},
  enrollmentView,
});
flow = root.type(root.props);
const dialog = flow.props.children[0].type(flow.props.children[0].props);
check(
  dialog.type === "Dialog",
  "shows the enrollment dialog after setup begins",
);
check(
  JSON.stringify(dialog).includes("Unable to add your card") &&
    JSON.stringify(dialog).includes("Try again"),
  "shows a retryable secure-session preparation error",
);

assert.equal(assertions, 20);
console.log(`${assertions} Wallet onboarding content assertions passed`);
