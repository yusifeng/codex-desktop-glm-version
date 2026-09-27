import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const MODULES = [
  "security-client",
  "security-shared",
  "security-src",
  "security-keys",
  "use-resume-conversation-if-needed",
];
const state = (globalThis.__resumeSecurityTest = {
  available: false,
  initialized: [],
  requests: [],
  resumeCalls: [],
  stateCursor: 0,
  stateValues: [],
  jsx: {
    jsx: (type, props) => ({ type, props }),
    jsxs: (type, props) => ({ type, props }),
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
  `() => globalThis.__resumeSecurityTest.initialized.push(${JSON.stringify(name)})`;
const overrides = {
  "app-shared": {
    $O: `{ ONE_MINUTE: 60000 }`,
    Ah: `"DialogHeader"`,
    BX: `(signal, parameter) => signal?.id === "available" ? globalThis.__resumeSecurityTest.available : signal?.id === "permission"`,
    I3: `() => globalThis.__resumeSecurityTest.jsx`,
    IH: `error => error instanceof Error ? error.message : String(error)`,
    K2: marker("internationalization"),
    LX: `() => globalThis.__resumeSecurityTest.scope`,
    Lh: `"DialogDescription"`,
    Oh: `"DialogContent"`,
    Ph: `"DialogTitle"`,
    Qh: `"LoadingSpinner"`,
    S_: `"Icon"`,
    Y2: `"FormattedMessage"`,
    Yh: `"Button"`,
    e6: `() => globalThis.__resumeSecurityTest.react`,
    ek: marker("http-runtime"),
    hG: `error => error?.configDetail ? error.configDetail : null`,
    jh: `"DialogBody"`,
    k: `{ name: "chevron-left" }`,
    kh: `"DialogFooterActions"`,
    n4: `() => ({ intl: { formatMessage: descriptor => descriptor.defaultMessage } })`,
    oY: `error => error?.transportUnavailable === true`,
    pk: `{ id: "toast" }`,
    wL: marker("utilities"),
  },
  "app-initial": {
    B8t: `() => false`,
    DZt: `{ id: "available" }`,
    Jmn: `error => error?.retryable === true`,
    PQt: `{ id: "parent" }`,
    Ugn: `() => globalThis.__resumeSecurityTest.hostService`,
    VZt: `{ id: "resolved-host" }`,
    Vsn: `(scope, hostId) => ({ scope, hostId })`,
    Yon: `async () => ["/workspace"]`,
    au: `"SettingsSubpageLayout"`,
    cJt: marker("api-client"),
    ddn: `class { constructor(options) { this.options = options; } safeGet(path, options) { globalThis.__resumeSecurityTest.requests.push({ path, options }); return Promise.resolve({ path }); } }`,
    mfn: `{ id: "permission" }`,
    o0t: `{ id: "catalog" }`,
    oJt: `() => ({ "X-Base": "base" })`,
    p4: `conversationId => ({ activeMode: conversationId == null ? null : "default" })`,
    pdn: marker("api-routes"),
    su: marker("settings-layout"),
    ul: `error => error?.writerConflict === true`,
    wQt: `{ id: "host" }`,
  },
};

function generic(moduleName, exportName) {
  return `(...args) => { globalThis.__resumeSecurityTest.initialized.push(${JSON.stringify(`${moduleName}:${exportName}`)}); return undefined; }`;
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
  const result = await esbuild.build({
    entryPoints: [path.join(ROOT, "src/renderer", directory, "index.ts")],
    bundle: true,
    format: "esm",
    platform: "node",
    target: "node22",
    write: false,
    logLevel: "silent",
    plugins: [{
      name: "resume-security-mocks",
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

const securityClient = await bundle("security-client");
securityClient.t();
const queries = securityClient.n("account-1");
assert.deepEqual(queries.mfa.queryKey, ["chatgpt-security", "account-1", "mfa"]);
assert.equal(queries.mfa.staleTime, 60000);
assert.equal(queries.mfa.retry, false);
assert.equal(queries.protection.refetchOnWindowFocus, "always");
assert.equal(Object.keys(queries).length, 7);
await queries.linkedApps.queryFn({ signal: "signal-1" });
assert.equal(state.requests.at(-1).path, "/client_applications");
assert.equal(state.requests.at(-1).options.additionalHeaders["ChatGPT-Account-ID"], "account-1");
assert.equal(state.requests.at(-1).options.signal, "signal-1");
assert.deepEqual(state.initialized.slice(0, 3), ["api-client", "http-runtime", "api-routes"]);

const securityShared = await bundle("security-shared");
let backed = 0;
const subpage = securityShared.r({ title: "Security", subtitle: "Manage", action: "Action", onBack: () => backed++, children: "Body" });
assert.equal(subpage.type, "SettingsSubpageLayout");
assert.equal(subpage.props.children, "Body");
subpage.props.backSlot.props.onClick();
assert.equal(backed, 1);
const loading = securityShared.n({ isError: false, onRetry: () => {} });
assert.equal(loading.props.role, "status");
const failed = securityShared.n({ isError: true, onRetry: () => backed++ });
assert.equal(failed.props.role, "alert");
failed.props.children[1].props.onClick();
assert.equal(backed, 2);
let confirmed = 0;
let closed = 0;
const confirmation = securityShared.t({ title: "Remove", confirmLabel: "Remove", onConfirm: () => confirmed++, onClose: () => closed++ });
assert.equal(confirmation.props.open, true);
confirmation.props.children.props.onSubmit({ preventDefault() {} });
assert.equal(confirmed, 1);
confirmation.props.onOpenChange(false);
assert.equal(closed, 1);
const pendingConfirmation = securityShared.t({ title: "Remove", confirmLabel: "Remove", isPending: true, onConfirm: () => confirmed++, onClose: () => closed++ });
pendingConfirmation.props.children.props.onSubmit({ preventDefault() {} });
assert.equal(confirmed, 1);

const securitySource = await bundle("security-src");
assert.equal(securitySource.a("openid"), securitySource.a("email"));
assert.equal(securitySource.a("openid").defaultMessage, "Access your basic profile information");
assert.equal(securitySource.a("resource.invoke").defaultMessage, "Resource actions");
assert.equal(securitySource.a("chatgpt.tokens.use.direct"), securitySource.a("chatpass.enable.request"));
assert.equal(securitySource.i("profile"), securitySource.i("openid"));
assert.equal(securitySource.i("resource.invoke"), undefined);
assert.match(securitySource.i("offline_access").defaultMessage, /connection active/);
assert.equal(securitySource.a("unknown.scope"), undefined);

const securityKeys = await bundle("security-keys");
const icon = securityKeys.t({ className: "security-icon", "aria-hidden": true });
assert.equal(icon.type, "svg");
assert.equal(icon.props.width, 20);
assert.equal(icon.props.height, 20);
assert.equal(icon.props.className, "security-icon");
assert.equal(icon.props.children.length, 3);

state.react = {
  useEffect(effect) {
    state.cleanup = effect();
  },
  useRef(value) {
    return { current: value };
  },
  useState(initial) {
    const index = state.stateCursor++;
    const value = state.stateValues[index] ?? initial;
    return [value, next => {
      state.stateValues[index] = typeof next === "function" ? next(value) : next;
    }];
  },
};
state.scope = {
  get(signal, parameter) {
    if (signal?.id === "available") return state.available;
    if (signal?.id === "host") return "host-1";
    if (signal?.id === "catalog") return { hostId: "host-1", threadId: parameter };
    if (signal?.id === "parent") return null;
    if (signal?.id === "toast") return { danger: () => ({ close() {} }) };
    return undefined;
  },
};
state.hostService = {
  async resumeConversation(input, options) {
    state.resumeCalls.push({ input, options });
  },
};
const resume = await bundle("use-resume-conversation-if-needed");
state.stateCursor = 0;
let resumeState = resume.n("thread-1", "private");
assert.equal(resumeState.isResuming, false);
assert.equal(resumeState.hasResumeFailed, false);
assert.equal(resumeState.isUnavailable, false);
assert.equal(typeof resumeState.retryResume, "function");
state.available = true;
state.stateCursor = 0;
state.stateValues = [];
resumeState = resume.n("thread-1", "private");
await new Promise(resolve => setImmediate(resolve));
assert.equal(resumeState.isResuming, true);
assert.equal(state.resumeCalls.length, 1);
assert.deepEqual(state.resumeCalls[0].input.workspaceRoots, ["/workspace"]);
resume.t();
assert.equal(state.initialized.includes("internationalization"), true);

console.log("40 conversation resume security cluster assertions passed");
