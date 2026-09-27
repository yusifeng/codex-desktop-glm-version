import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const jsx = {
  Fragment: Symbol("Fragment"),
  jsx: (type, props, key) => ({ type, props: props ?? {}, key }),
  jsxs: (type, props, key) => ({ type, props: props ?? {}, key }),
};
globalThis.__jsx = jsx;
globalThis.__saveConfig = async () => ({
  configPath: "/tmp/local.toml",
  type: "success",
});
globalThis.__requestPersonalSecrets = async () => ({
  ok: true,
  data: { secrets: [{ id: "saved" }] },
});
globalThis.__definedSignals = [];

async function load(name) {
  const result = await esbuild.build({
    entryPoints: [path.join(ROOT, `src/renderer/${name}/index.ts`)],
    bundle: true,
    format: "esm",
    platform: "node",
    target: "node22",
    write: false,
    logLevel: "silent",
    plugins: [
      {
        name: "mocks",
        setup(build) {
          build.onResolve({ filter: /^@rchunk\// }, ({ path: modulePath }) => ({
            path: modulePath.slice(8),
            namespace: "mock",
          }));
          build.onLoad(
            { filter: /.*/, namespace: "mock" },
            ({ path: modulePath }) => {
              if (modulePath === "app-shared")
                return {
                  loader: "js",
                  contents:
                    "export const I3=()=>globalThis.__jsx;export const G2=(messages)=>messages;export const K2=()=>{};export const FX=()=>{};export const QI=()=>{};export const ZI={};export const pZ=(_scope,value)=>{const signal={kind:'signal',value};globalThis.__definedSignals.push(signal);return signal};export const rZ=(_scope,derive)=>{const family={kind:'family',derive};globalThis.__definedSignals.push(family);return family};",
                };
              if (modulePath === "app-initial")
                return {
                  loader: "js",
                  contents:
                    "export const pnt={localEnvironments:{saveConfig:(input)=>globalThis.__saveConfig(input)},environmentConfigs:{requestPersonalSecrets:(input)=>globalThis.__requestPersonalSecrets(input)}};export const Ftn=()=>{};export const Ltn={kind:'query'};export const Sun=()=>{};export const _un={kind:'user'};export const mun={kind:'account'};",
                };
              return { loader: "js", contents: "export default {};" };
            },
          );
        },
      },
    ],
  });
  return import(
    `data:text/javascript;base64,${Buffer.from(result.outputFiles[0].text).toString("base64")}#${name}`
  );
}

const editor = await load("local-environment-editor");
editor.n();
const empty = editor.f({ defaultName: "local" });
assert.equal(empty.name, "local");
assert.deepEqual(empty.actions, []);
assert.equal(empty.setupScript, "");
assert.deepEqual(empty.setupPlatformScripts, {
  darwin: "",
  linux: "",
  win32: "",
});

const restored = editor.f({
  environment: {
    name: "Development",
    setup: { script: "npm install", darwin: { script: "brew bundle" } },
    cleanup: { script: "npm run clean", linux: { script: "rm -rf .cache" } },
    actions: [
      { name: "Serve", icon: "run", command: "npm start", platform: "linux" },
    ],
  },
});
assert.equal(restored.name, "Development");
assert.equal(restored.setupPlatformScripts.darwin, "brew bundle");
assert.equal(restored.cleanupPlatformScripts.linux, "rm -rf .cache");
assert.equal(restored.actions[0].command, "npm start");
assert.match(restored.actions[0].id, /.+/);

const action = editor.d();
assert.equal(action.icon, "tool");
assert.equal(action.platform, null);
assert.equal(action.name, "");
assert.equal(editor.m.length, 4);

let selectedPlatform = null;
const selector = editor.a({
  leadingOption: "default",
  selectedId: "linux",
  ariaLabel: "Setup platform",
  onSelect: (value) => {
    selectedPlatform = value;
  },
});
assert.equal(selector.props["aria-label"], "Setup platform");
assert.equal(selector.props.children.length, 4);
selector.props.onChange({ currentTarget: { value: "win32" } });
assert.equal(selectedPlatform, "win32");

const icon = editor.g({ icon: "debug", className: "icon-sm" });
assert.equal(icon.props["data-icon"], "debug");
assert.equal(icon.props.className, "icon-sm");
const variables = editor.r();
assert.equal(variables.props.children.length, 2);
assert.equal(variables.props.children[0].props.children, "CODEX_WORKTREE_PATH");

let savedInput = null;
globalThis.__saveConfig = async (input) => {
  savedInput = input;
  return { configPath: "/tmp/dev.toml", type: "success" };
};
let invalidated = 0;
const saved = await editor.c({
  configPath: null,
  draft: restored,
  expectedRevision: "rev-1",
  hostId: "local",
  queryClient: { invalidateQueries: () => invalidated++ },
  selectEnvironment: () => true,
  version: 2,
  workspaceRoot: "/repo",
});
assert.equal(saved.type, "success");
assert.equal(saved.configPath, "/tmp/dev.toml");
assert.equal(savedInput.expectedRevision, "rev-1");
assert.match(savedInput.raw, /version = 2/);
assert.match(savedInput.raw, /\[setup\.darwin\]/);
assert.match(savedInput.raw, /\[\[actions\]\]/);
assert.equal(invalidated, 1);

const invalid = await editor.c({
  configPath: null,
  draft: { ...empty, name: "" },
  hostId: "local",
  version: 1,
  workspaceRoot: "/repo",
});
assert.equal(invalid.type, "invalid");

globalThis.__saveConfig = async () => ({
  configPath: "/tmp/conflict.toml",
  type: "conflict",
});
const conflict = await editor.c({
  configPath: "/tmp/dev.toml",
  draft: restored,
  hostId: "local",
  version: 1,
  workspaceRoot: "/repo",
});
assert.equal(conflict.type, "conflict");

const view = editor.t({
  configPath: null,
  hostId: "local",
  initialEnvironment: null,
  workspaceRoot: "/repo",
  simpleSetup: true,
  hasReadError: true,
  onDiscardConflict() {},
  onRetryRead() {},
  onSaved() {},
});
assert.equal(view.type, "form");
assert.equal(view.props["data-simple-setup"], true);
assert.equal(view.props.children[0].props["aria-label"], "Name");
assert.equal(view.props.children[4].props.children, "Retry");
assert.equal(view.props.children[5].props.children, "Set up project");

const entryType = await load("entry-type");
entryType.n();
assert.equal(
  entryType.t({ namespace: "not_sensitive" }).props.children,
  "Environment variable",
);
assert.equal(
  entryType.t({ namespace: "sensitive" }).props.children,
  "Network secret",
);

const playOutline = await load("play-outline");
playOutline.i();
playOutline.n();
const flaskIcon = playOutline.r({ className: "flask" });
const playIcon = playOutline.t({ className: "play" });
assert.equal(flaskIcon.props.viewBox, "0 0 20 20");
assert.equal(flaskIcon.props.className, "flask");
assert.equal(playIcon.props.viewBox, "0 0 18 18");
assert.equal(playIcon.props.children.props.fill, "currentColor");

const changeMessages = await load("environment-change-messages");
changeMessages.n();
assert.equal(
  changeMessages.t.variables.defaultMessage,
  "Environment variables",
);
assert.equal(
  changeMessages.t.connections.defaultMessage,
  "Outbound identity connections",
);
assert.equal(changeMessages.t.network.defaultMessage, "Internet access");
assert.equal(changeMessages.t.privacy.defaultMessage, "Privacy");

globalThis.__definedSignals.length = 0;
const pendingOnboarding = await load("pending-environment-onboarding");
pendingOnboarding.t();
assert.equal(pendingOnboarding.r.kind, "signal");
assert.equal(pendingOnboarding.n.kind, "family");
const pendingValue = { accountId: "account", userId: "user", draft: true };
pendingOnboarding.r.value.set("environment", pendingValue);
const get = (signal, parameter) => {
  if (signal.kind === "account") return "account";
  if (signal.kind === "user") return "user";
  if (signal.kind === "query")
    return parameter === "environment" ? { id: parameter } : null;
  return signal.value;
};
assert.equal(pendingOnboarding.n.derive(null, { get }), null);
assert.equal(pendingOnboarding.n.derive("missing", { get }), null);
assert.equal(pendingOnboarding.n.derive("environment", { get }), pendingValue);

const secretDialog = await load("personal-secret-dialog");
let closedNamespace = null;
let requestInput = null;
globalThis.__requestPersonalSecrets = async (input) => {
  requestInput = input;
  return { ok: true, data: { secrets: [{ id: "created" }] } };
};
const addSecret = secretDialog.PersonalSecretDialog({
  accountId: "account",
  userId: "user",
  initialNamespace: "sensitive",
  onClose: (namespace) => {
    closedNamespace = namespace;
  },
});
assert.equal(addSecret.type, "dialog");
const addForm = addSecret.props.children;
assert.equal(addForm.props.children[0].props.children, "Add to personal vault");
assert.equal(
  addForm.props.children[1].props.children[1].props.pattern,
  "[A-Za-z_][A-Za-z0-9_]*",
);
addForm.props.children[1].props.children[1].props.onChange({
  currentTarget: { value: "API_KEY" },
});
await addForm.props.onSubmit({
  preventDefault() {},
  currentTarget: {
    elements: { namedItem: () => ({ value: "secret-value" }) },
  },
});
assert.equal(requestInput.method, "POST");
assert.equal(requestInput.body.secrets[0].env_var, "API_KEY");
assert.equal(requestInput.body.secrets[0].value, "secret-value");
assert.equal(closedNamespace, "sensitive");

closedNamespace = null;
const deleteSecret = secretDialog.PersonalSecretDialog({
  accountId: "account",
  userId: "user",
  initialNamespace: "not_sensitive",
  secret: { id: "secret-1", name: "TOKEN", env_var: "TOKEN" },
  deleting: true,
  onClose: (namespace) => {
    closedNamespace = namespace;
  },
});
const deleteForm = deleteSecret.props.children;
assert.equal(deleteForm.props.children[0].props.children, "Delete TOKEN?");
await deleteForm.props.onSubmit({ preventDefault() {}, currentTarget: {} });
assert.equal(requestInput.method, "DELETE");
assert.deepEqual(requestInput.body.ids, ["secret-1"]);
assert.equal(closedNamespace, "not_sensitive");

console.log("local environment settings cluster complete");
