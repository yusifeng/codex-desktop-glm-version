import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const MODULES = ["outbound-identity-connection-dialog", "plugin-share-dialogs-runtime"];
const state = globalThis.__businessDialogsTest = {
  apiDeletes: [], copied: [], dropzoneOptions: null, initialized: [], mutationOptions: null,
  mutationResult: null, schemaInputs: [], stateOverrides: [], uploads: [],
};
const importedNamesByModule = new Map();
for (const directory of MODULES) {
  const source = fs.readFileSync(path.join(ROOT, "src/renderer", directory, "index.ts"), "utf8");
  for (const match of source.matchAll(/import\s*(?:type\s*)?{([\s\S]*?)}\s*from\s*"@rchunk\/([^"]+)";/g)) {
    const names = importedNamesByModule.get(match[2]) ?? new Set();
    for (const raw of match[1].split(",")) {
      const specifier = raw.trim().replace(/^type\s+/, "");
      if (specifier) names.add(specifier.split(/\s+as\s+/)[0]);
    }
    importedNamesByModule.set(match[2], names);
  }
}
const marker = name => `() => globalThis.__businessDialogsTest.initialized.push(${JSON.stringify(name)})`;
const component = name => `(${JSON.stringify(name)})`;
const appSharedComponents = ["Ah", "Ih", "Lf", "Lh", "Oh", "Rh", "S_", "Y2", "Yh", "nl", "rl", "tf", "jh", "kh"];
const overrides = {
  "app-shared": {
    $3: marker("compiler"), Bt: `{ name: "azure" }`, C_: marker("dialog-structure"),
    G2: `messages => messages`, Ht: marker("dialog-root"), I3: `() => globalThis.__businessDialogsTest.jsx`,
    K2: marker("intl"), Ph: marker("dialog-forms"), Qc: marker("clipboard"),
    Rf: marker("cloud-icons"), Vt: `{ name: "gcp" }`, Xm: marker("copy-runtime"),
    Ym: `(text, event) => globalThis.__businessDialogsTest.copied.push({ text, event })`,
    Zc: component("FieldList"), Zh: marker("dialog-panel"), al: marker("form-fields"),
    an: `{ name: "aws" }`, e6: `Object.assign(() => globalThis.__businessDialogsTest.react, globalThis.__businessDialogsTest.react)`,
    iL: `options => { const state = globalThis.__businessDialogsTest; state.mutationOptions = options; return state.mutationResult ?? { mutate: variables => options.mutationFn(variables), isPending: false, isSuccess: false, isError: false, error: null, variables: undefined }; }`,
    n4: `() => ({ formatMessage: descriptor => descriptor.defaultMessage })`, nf: marker("inputs"),
    on: marker("aws-icons"), rL: marker("use-mutation"), zh: marker("dialog-runtime"), zt: marker("buttons"),
  },
  "app-initial": {
    $W: marker("provider-assets"), Jat: component("TextInput"), QW: component("SelectControl"),
    Xat: component("TextArea"),
    Yat: `{ parse(value) { globalThis.__businessDialogsTest.schemaInputs.push(value); if (globalThis.__businessDialogsTest.schemaError) throw new Error("schema"); return value; } }`,
    bmt: marker("identity-schema"), xmt: marker("identity-model"), pdn: marker("api-headers"),
    udn: `{ safeDelete: async (url, options) => { globalThis.__businessDialogsTest.apiDeletes.push({ url, options }); return {}; } }`,
  },
  "outbound-identity-error": { n: marker("identity-error"), t: component("OutboundIdentityError") },
  "mcp-oauth-runtime": {
    n: `options => { const state = globalThis.__businessDialogsTest; state.dropzoneOptions = options; return { getRootProps: props => ({ ...props, root: true }), getInputProps: props => ({ ...props, input: true }), inputRef: { current: state.dropzoneInput ?? { isConnected: true, disabled: false } }, open: () => { state.dropzoneOpened = true; } }; }`,
    t: marker("dropzone"),
  },
  api: {
    a: `file => globalThis.__businessDialogsTest.archiveError ?? (file.size > 100 ? "too-large" : null)`,
    o: marker("plugin-upload-api"),
    s: `async (pluginId, accountId, file) => { globalThis.__businessDialogsTest.uploads.push({ pluginId, accountId, file }); return {}; }`,
  },
};
for (const name of appSharedComponents) overrides["app-shared"][name] = component(name);
state.jsx = {
  Fragment: "Fragment",
  jsx: (type, props, key) => ({ type, props: props ?? {}, key }),
  jsxs: (type, props, key) => ({ type, props: props ?? {}, key }),
};
state.react = {
  Fragment: "Fragment",
  useId: () => "field-id",
  useState(initial) {
    const override = state.stateOverrides.length > 0 ? state.stateOverrides.shift() : initial;
    const box = { value: override };
    return [box.value, value => { box.value = typeof value === "function" ? value(box.value) : value; state.lastStateSet = box.value; }];
  },
};

function mockModule(name) {
  if (name === "rolldown-runtime") return "export {};";
  const names = importedNamesByModule.get(name) ?? new Set();
  return [...names].map(exportName => `export const ${exportName} = ${overrides[name]?.[exportName] ?? "undefined"};`).join("\n");
}
let bundleIndex = 0;
async function bundle(directory) {
  const result = await esbuild.build({
    entryPoints: [path.join(ROOT, "src/renderer", directory, "index.ts")], bundle: true,
    format: "esm", platform: "node", target: "node22", write: false, logLevel: "silent",
    plugins: [{ name: "business-dialog-mocks", setup(build) {
      build.onResolve({ filter: /^@rchunk\// }, ({ path: importPath }) => ({ path: importPath.slice(8), namespace: "mock" }));
      build.onLoad({ filter: /.*/, namespace: "mock" }, ({ path: importPath }) => ({ contents: mockModule(importPath), loader: "js" }));
    } }],
  });
  return import(`data:text/javascript;base64,${Buffer.from(result.outputFiles[0].text).toString("base64")}#${directory}-${bundleIndex++}`);
}
function walk(node, visit) {
  if (node == null || typeof node !== "object") return;
  visit(node);
  const children = node.props?.children;
  if (Array.isArray(children)) for (const child of children) walk(child, visit);
  else walk(children, visit);
}
function find(node, predicate) {
  let result;
  walk(node, candidate => { if (result == null && predicate(candidate)) result = candidate; });
  return result;
}
function findAll(node, predicate) {
  const results = [];
  walk(node, candidate => { if (predicate(candidate)) results.push(candidate); });
  return results;
}

// plugin-share-dialogs-runtime
const plugins = await bundle("plugin-share-dialogs-runtime");
assert.deepEqual(Object.keys(plugins).sort(), ["PluginDeleteDialog", "PluginUploadDialog"]);
assert.equal(state.initialized.filter(name => name === "dropzone").length, 1);
assert.equal(state.initialized.includes("plugin-upload-api"), true);

state.mutationResult = { mutate: file => state.mutationOptions.mutationFn(file), isPending: false, isSuccess: false, isError: false, error: null, variables: undefined };
let closed = 0;
let uploadNode = plugins.PluginUploadDialog({ pluginId: "plugin-1", accountId: "acct-1", onClose: () => closed++, onUpdated() {} });
assert.equal(uploadNode.type, "Ih");
assert.equal(uploadNode.props.showDialogClose, true);
assert.equal(state.dropzoneOptions.multiple, false);
assert.deepEqual(state.dropzoneOptions.accept["application/gzip"], [".tar.gz", ".tgz"]);
const archive = { name: "plugin.zip", size: 50 };
state.dropzoneOptions.onDrop([archive], []);
await Promise.resolve();
assert.equal(state.uploads.at(-1).pluginId, "plugin-1");
assert.equal(state.uploads.at(-1).accountId, "acct-1");
assert.equal(state.uploads.at(-1).file, archive);
state.archiveError = "unsupported";
state.dropzoneOptions.onDrop([{ name: "bad.txt", size: 10 }], []);
assert.equal(state.lastStateSet, true);
state.archiveError = null;
state.dropzoneOptions.onDrop([], [{}]);
assert.equal(state.lastStateSet, true);
uploadNode.props.onOpenChange(false);
assert.equal(closed, 1);

state.mutationResult = { mutate() {}, isPending: true, isSuccess: false, isError: false, error: null, variables: archive };
uploadNode = plugins.PluginUploadDialog({ pluginId: "plugin-1", accountId: "acct-1", onClose: () => closed++ });
assert.equal(uploadNode.props.showDialogClose, false);
assert.equal(uploadNode.props.shouldIgnoreClickOutside, true);
uploadNode.props.onOpenChange(false);
assert.equal(closed, 1);
assert.equal(find(uploadNode, node => node.props?.role === "status").props.children.includes("plugin.zip"), true);

let deleted = 0;
state.mutationResult = null;
let deleteNode = plugins.PluginDeleteDialog({
  accountId: "acct-2", onClose: () => closed++, onDeleted: () => deleted++,
  plugin: { id: "personal", scope: "USER", release: { display_name: "My Plugin" } },
});
const deleteForm = find(deleteNode, node => node.type === "Oh");
deleteForm.props.onSubmit({ preventDefault() {} });
await Promise.resolve();
assert.equal(state.apiDeletes.at(-1).url, "/ps/plugins/{plugin_id}");
assert.equal(state.apiDeletes.at(-1).options.additionalHeaders["ChatGPT-Account-Id"], "acct-2");
assert.equal(state.apiDeletes.at(-1).options.parameters.path.plugin_id, "personal");
await state.mutationOptions.onSuccess();
assert.equal(deleted, 1);
deleteNode = plugins.PluginDeleteDialog({
  accountId: "acct-3", onClose() {}, onDeleted() {},
  plugin: { id: "workspace", scope: "WORKSPACE", release: { display_name: "Team Plugin" } },
});
await state.mutationOptions.mutationFn();
assert.equal(state.apiDeletes.at(-1).url, "/public/plugins/workspace/{plugin_id}");
assert.deepEqual(state.apiDeletes.at(-1).options.expectedErrorStatuses, [400, 403, 404, 409]);

// outbound-identity-connection-dialog
const identity = await bundle("outbound-identity-connection-dialog");
assert.deepEqual(Object.keys(identity), ["OutboundIdentityConnectionDialog"]);
assert.equal(state.initialized.includes("identity-schema"), true);
assert.equal(state.initialized.includes("identity-error"), true);
let submitInput;
let identityClosed = 0;
let identityNode = identity.OutboundIdentityConnectionDialog({
  isOpen: true, onClose: () => identityClosed++,
  onSubmit: async input => { submitInput = input; return { ok: true, data: { connection_id: "c1", provider_kind: "azure" } }; },
});
assert.equal(identityNode.type, "Ih");
assert.equal(identityNode.props.open, true);
const identityForm = find(identityNode, node => node.type === "Oh");
assert.equal(identityForm.props.as, "form");
identityForm.props.onSubmit({ preventDefault() {}, stopPropagation() {} });
await new Promise(resolve => setImmediate(resolve));
assert.equal(submitInput.subject_template, "oai:v1:oic:{connection_id}");
assert.deepEqual(submitInput.additional_claims, {});
assert.equal(submitInput.azure_tenant_id, "");
assert.equal(submitInput.azure_client_id, "");
assert.equal(state.schemaInputs.length > 0, true);
identityNode.props.onOpenChange(false);
assert.equal(identityClosed, 1);
const select = find(identityNode, node => node.type === "SelectControl");
assert.equal(select.props.selectedId, "azure");
assert.deepEqual(select.props.options.map(option => option.id), ["azure", "aws", "gcp"]);
select.props.onSelect("aws");
assert.equal(state.lastStateSet.provider_kind, "aws");
assert.equal(state.lastStateSet.region, "us-east-1");

state.schemaError = true;
identityNode = identity.OutboundIdentityConnectionDialog({ isOpen: true, onClose() {}, onSubmit: async () => ({ ok: false }) });
find(identityNode, node => node.type === "Oh").props.onSubmit({ preventDefault() {}, stopPropagation() {} });
await Promise.resolve();
assert.equal(state.lastStateSet.error, "invalid-request");
state.schemaError = false;

state.stateOverrides = [
  { display_name: "Saved", subject_template: "oai:v1:oic:{connection_id}", include_actor_email: true },
  { provider_kind: "gcp", workload_identity_provider: "projects/p/providers/oai", service_account_email: "svc@test" },
  "{}", false, null, { ok: false, error: "unavailable" },
];
identityNode = identity.OutboundIdentityConnectionDialog({ isOpen: true, onClose() {}, onSubmit: async () => ({ ok: false }) });
const alert = find(identityNode, node => node.props?.role === "alert");
assert.equal(alert.props.children.includes("Couldn't confirm"), true);
const submitButton = findAll(identityNode, node => node.type === "Yh").find(node => node.props.type === "submit");
assert.equal(submitButton.props.disabled, true);

state.stateOverrides = [
  { display_name: "Existing", subject_template: "oai:v1:oic:{connection_id}", include_actor_email: false },
  { provider_kind: "aws", role_arn: "arn:role", region: "us-east-1" }, "{}", false, null, null,
];
identityNode = identity.OutboundIdentityConnectionDialog({
  isOpen: true, onClose() {}, onSubmit: async () => ({ ok: false }),
  connection: { connection_id: "conn-1", provider_kind: "aws", display_name: "Existing", target: { provider_kind: "aws", role_arn: "arn:role", region: "us-east-1" } },
});
assert.equal(find(identityNode, node => node.type === "SelectControl"), undefined);
assert.equal(find(identityNode, node => node.type?.name === "ProviderFields").props.readOnly, true);
assert.equal(findAll(identityNode, node => node.type === "Yh").some(node => node.props.children === "Save connection"), true);

console.log("business dialogs cluster tests passed");
