import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const MODULES = [
  "linked-app-logo",
  "confirmation",
  "history",
  "order-yubikey-dialog",
  "security-settings",
];
const state = (globalThis.__securityFlowTest = {
  apiGets: [],
  apiPosts: [],
  initialized: [],
  opened: [],
  runEffects: true,
  stateCursor: 0,
  stateValues: [],
  historyPage: { events: [], has_more: false, next_cursor: null },
  jsx: {
    Fragment: "Fragment",
    jsx: (type, props, key) => ({ type, props, key }),
    jsxs: (type, props, key) => ({ type, props, key }),
  },
});

const importedNamesByModule = new Map();
for (const directory of MODULES) {
  const source = fs.readFileSync(
    path.join(ROOT, "src/renderer", directory, "index.ts"),
    "utf8",
  );
  for (const match of source.matchAll(
    /import\s*{([\s\S]*?)}\s*from\s*"@rchunk\/([^"]+)";/g,
  )) {
    const names = importedNamesByModule.get(match[2]) ?? new Set();
    for (const rawSpecifier of match[1].split(",")) {
      const specifier = rawSpecifier.trim();
      if (!specifier || specifier.startsWith("type ")) continue;
      names.add(specifier.split(/\s+as\s+/)[0]);
    }
    importedNamesByModule.set(match[2], names);
  }
}

const marker = name =>
  `() => globalThis.__securityFlowTest.initialized.push(${JSON.stringify(name)})`;
const overrides = {
  "app-shared": {
    $3: marker("runtime"),
    AS: `"ConnectedAppsGlyph"`,
    I3: `() => globalThis.__securityFlowTest.jsx`,
    K2: marker("internationalization"),
    Lh: `"DialogDescription"`,
    Oh: `"DialogContent"`,
    Ot: `{ name: "generated-site-detail" }`,
    Qh: `"LoadingSpinner"`,
    R_: `"AppleGlyph"`,
    S_: `"Icon"`,
    Y2: `"FormattedMessage"`,
    Yh: `"Button"`,
    e6: `Object.assign(() => globalThis.__securityFlowTest.react, globalThis.__securityFlowTest.react)`,
    h4: marker("class-names"),
    kh: `"DialogFooterActions"`,
    m4: `(...values) => values.flat(Infinity).filter(Boolean).join(" ")`,
    HX: `() => null`,
    _L: `options => ({ data: options.name === "mfa" ? { mfa_enabled_v2: true } : options.name === "sessions" ? { sessions: [{ id: "session-1", device_name: "Mac", current: false }] } : options.name === "linkedApps" ? { applications: [{ id: "app-1", name: "Calendar" }] } : {}, isLoading: false, isError: false, refetch() {} })`,
    zw: `{ name: "generated-site-list" }`,
  },
  "app-initial": {
    C: marker("app-initial"),
    Jot: `"ExternalLink"`,
    Xot: marker("external-link"),
    aa: `"SettingsList"`,
    cJt: marker("api-client"),
    ddn: `class { safePost(path, options) { globalThis.__securityFlowTest.apiPosts.push({ path, options }); return globalThis.__securityFlowTest.postError ? Promise.reject(new Error("failed")) : Promise.resolve({ order_url: "https://order.example/key" }); } }`,
    kft: `options => globalThis.__securityFlowTest.opened.push(options)`,
    n6: `"CodexGlyph"`,
    oJt: `() => ({})`,
    oa: `"SettingsRow"`,
    r6: marker("account-glyphs"),
  },
  "security-client": {
    n: `accountId => ({ mfa: { name: "mfa", accountId }, sessions: { name: "sessions", accountId }, linkedApps: { name: "linkedApps", accountId }, protection: { name: "protection", accountId } })`,
    r: `{ safeGet(path, options) { globalThis.__securityFlowTest.apiGets.push({ path, options }); return Promise.resolve(globalThis.__securityFlowTest.historyPage); } }`,
    t: marker("security-client"),
  },
  "security-keys": {
    t: `"SecurityKeysIcon"`,
  },
  "security-messages": {
    n: marker("security-messages"),
    t: `{ title: { id: "history.title", defaultMessage: "Security history" }, description: { id: "history.description", defaultMessage: "Review activity" } }`,
  },
  "security-shared": {
    i: marker("security-shared"),
    n: `props => ({ type: "SecurityLoadingState", props })`,
    r: `props => ({ type: "SecuritySubpage", props })`,
    t: `props => ({ type: "SecurityConfirmationDialog", props })`,
  },
};

function generic(moduleName, exportName) {
  return `(...args) => { globalThis.__securityFlowTest.initialized.push(${JSON.stringify(`${moduleName}:${exportName}`)}); return undefined; }`;
}

function mockModule(name) {
  if (name === "rolldown-runtime") return "export {};";
  const names = importedNamesByModule.get(name) ?? new Set();
  return [...names]
    .map(
      exportName =>
        `export const ${exportName} = ${overrides[name]?.[exportName] ?? generic(name, exportName)};`,
    )
    .join("\n");
}

async function bundle(directory) {
  state.stateCursor = 0;
  const result = await esbuild.build({
    entryPoints: [path.join(ROOT, "src/renderer", directory, "index.ts")],
    bundle: true,
    format: "esm",
    platform: "node",
    target: "node22",
    write: false,
    logLevel: "silent",
    plugins: [{
      name: "security-flow-mocks",
      setup(build) {
        build.onResolve({ filter: /^@rchunk\// }, ({ path: importPath }) => ({
          path: importPath.slice("@rchunk/".length),
          namespace: "mock",
        }));
        build.onLoad({ filter: /.*/, namespace: "mock" }, ({ path: importPath }) => ({
          contents: mockModule(importPath),
          loader: "js",
        }));
      },
    }],
  });
  return import(
    `data:text/javascript;base64,${Buffer.from(result.outputFiles[0].text).toString("base64")}#${directory}`
  );
}

state.react = {
  useEffect(effect) {
    if (state.runEffects) effect();
  },
  useState(initial) {
    const index = state.stateCursor++;
    const value = state.stateValues[index] ?? initial;
    return [value, next => {
      state.stateValues[index] = typeof next === "function" ? next(value) : next;
    }];
  },
};

const logoModule = await bundle("linked-app-logo");
let logo = logoModule.n({ app: { name: "calendar", logo_uri: "http://cdn.openai.com/logo.png" } });
assert.equal(logo.type.name ?? logo.type, "LogoFrame");
assert.equal(logo.props.children[0].props.children, "C");
assert.equal(logo.props.children[1], null);
logo = logoModule.n({ app: { name: "calendar", logo_uri: "https://cdn.openai.com/logo.png" }, size: "detail" });
assert.equal(logo.props.children[1].props.src, "https://cdn.openai.com/logo.png");
assert.match(logo.props.children[1].props.className, /size-10/);
assert.equal(logo.props.children[1].props.referrerPolicy, "no-referrer");
const generatedLogo = logoModule.n({ app: { name: "Site", client_app_type: "codex_generated_site" }, size: "detail" });
assert.equal(generatedLogo.props.children[0].props.asset.name, "generated-site-detail");
const connectionLogo = logoModule.t({ app: { name: "Codex", type: "codex_cli" }, borderless: true });
assert.equal(connectionLogo.props.children.type, "CodexGlyph");
assert.equal(connectionLogo.props.borderless, true);
logoModule.r();
assert.equal(state.initialized.includes("account-glyphs"), true);

const confirmationModule = await bundle("confirmation");
let confirmed = 0;
let closed = 0;
let confirmation = confirmationModule.LockdownConfirmation({ disablesDeveloperMode: true, isPending: true, onConfirm: () => confirmed++, onClose: () => closed++ });
assert.equal(confirmation.type(confirmation.props).type, "SecurityConfirmationDialog");
assert.equal(confirmation.props.isPending, true);
confirmation.props.onConfirm();
assert.equal(confirmed, 1);
confirmation.props.onClose();
assert.equal(closed, 1);
let restrictionItems = confirmation.props.children.props.children[2].props.children;
assert.equal(restrictionItems.length, 6);
confirmation = confirmationModule.LockdownConfirmation({ disablesDeveloperMode: false, isPending: false, onConfirm() {}, onClose() {} });
restrictionItems = confirmation.props.children.props.children[2].props.children;
assert.equal(restrictionItems.length, 5);
const descriptionMessage = confirmation.props.children.props.children[0].props.children;
const learnLink = descriptionMessage.props.values.link("Learn more");
assert.match(learnLink.props.href, /lockdown-mode/);

const historyModule = await bundle("history");
state.historyPage = {
  events: [{ event_type: "login_success", id: "event-1", timestamp_second: 1 }],
  has_more: true,
  next_cursor: "cursor-2",
};
state.stateValues = [];
state.stateCursor = 0;
state.runEffects = true;
let history = historyModule.SecurityHistorySettings({ accountId: "account-1", onBack() {} });
await new Promise(resolve => setImmediate(resolve));
assert.equal(history.type(history.props).type, "SecuritySubpage");
assert.equal(state.apiGets.at(-1).path, "/accounts/security_settings/history");
assert.equal(state.apiGets.at(-1).options.additionalHeaders["ChatGPT-Account-ID"], "account-1");
assert.equal(state.stateValues[0][0].id, "event-1");
assert.equal(state.stateValues[1], "cursor-2");
state.runEffects = false;
state.stateValues = [[
  { event_type: "login_success", id: "login", timestamp_second: 1, device_description: "Mac", location_description: "Shanghai" },
  { event_type: "password_changed", id: "password", timestamp_second: 1, device_description: "Chrome" },
], null, true, false, false];
state.stateCursor = 0;
history = historyModule.SecurityHistorySettings({ accountId: "account-1", onBack() {} });
const historyBody = history.props.children;
assert.equal(historyBody.props.children[0].props["data-history-date"], "1970-1-1");
const rows = historyBody.props.children[0].props.children[1].props.children;
assert.equal(rows.length, 2);
assert.equal(rows[0].props.label, "Signed in");
assert.equal(rows[0].props.description, "Mac • Shanghai");
assert.equal(rows[1].props.label, "Password updated");
assert.equal(historyBody.props.children[1].type, "Button");

const orderModule = await bundle("order-yubikey-dialog");
let orderClosed = 0;
let prevented = false;
state.stateValues = [];
state.stateCursor = 0;
let order = orderModule.OrderYubikeyDialog({ accountId: "account-2", onClose: () => orderClosed++ });
assert.equal(order.type, "DialogContent");
assert.equal(order.props.open, true);
order.props.children.props.onSubmit({ preventDefault: () => { prevented = true; } });
state.stateCursor = 0;
order = orderModule.OrderYubikeyDialog({ accountId: "account-2", onClose: () => orderClosed++ });
assert.equal(order.props.children.props.children[1].props.children[1].props.disabled, true);
await new Promise(resolve => setImmediate(resolve));
assert.equal(prevented, true);
assert.equal(state.apiPosts.at(-1).path, "/accounts/security_settings/yubikey/order_link");
assert.equal(state.apiPosts.at(-1).options.additionalHeaders["ChatGPT-Account-ID"], "account-2");
assert.equal(state.opened.at(-1).href, "https://order.example/key");
state.stateCursor = 0;
order = orderModule.OrderYubikeyDialog({ accountId: "account-2", onClose: () => orderClosed++ });
order.props.onOpenChange(false);
assert.equal(orderClosed, 1);

const settingsModule = await bundle("security-settings");
assert.equal(settingsModule.ChatGptSecuritySettings({}).props["data-security-settings-empty"], true);
const settings = settingsModule.ChatGptSecuritySettings({ accountId: "account-3" });
assert.equal(settings.type, "main");
assert.equal(settings.props["data-account-id"], "account-3");
assert.equal(JSON.stringify(settings).includes("Advanced protection"), true);
assert.equal(JSON.stringify(settings).includes("Active sessions"), true);
assert.equal(JSON.stringify(settings).includes("Connected apps"), true);

console.log("40 security settings flow cluster assertions passed");
