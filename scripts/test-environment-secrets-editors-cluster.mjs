import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";
import { assertReleaseOwner } from "./release-owner-test-helpers.mjs";
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), ".."),
  jsx = {
    Fragment: Symbol("Fragment"),
    jsx: (type, props, key) => ({ type, props: props ?? {}, key }),
    jsxs: (type, props, key) => ({ type, props: props ?? {}, key }),
  };
globalThis.__jsx = jsx;
let activeHooks = [], hookCursor = 0;
const React = {
  useRef(initial) { const hooks = activeHooks, index = hookCursor++; if (!(index in hooks)) hooks[index] = { current: initial }; return hooks[index]; },
  useState(initial) { const hooks = activeHooks, index = hookCursor++; if (!(index in hooks)) hooks[index] = typeof initial === "function" ? initial() : initial; return [hooks[index], value => { hooks[index] = typeof value === "function" ? value(hooks[index]) : value; }]; },
};
globalThis.__environmentEditorReact = React;
globalThis.__parseEnvironment = () => ({ ok: true, entries: new Map() });
globalThis.__preflight = async () => null;
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
            ({ path: modulePath }) => mock(modulePath),
          );
        },
      },
    ],
  });
  return import(
    `data:text/javascript;base64,${Buffer.from(result.outputFiles[0].text).toString("base64")}#${name}`
  );
}
function mock(name) {
  if (name === "app-shared")
    return { loader: "js", contents: "export const I3=()=>globalThis.__jsx;export const e6=globalThis.__environmentEditorReact;" };
  if (name === "environment-entry-input")
    return {
      loader: "js",
      contents:
        "export const n=(...args)=>globalThis.__parseEnvironment(...args);export const r=()=>null;",
    };
  if (name === "environment-variable-row")
    return { loader: "js", contents: "export const t=()=>null;" };
  if (name === "environment-secret-row")
    return { loader: "js", contents: "export const t=()=>null;" };
  if (name === "personal-secrets-service")
    return {
      loader: "js",
      contents: "export const n=(value)=>globalThis.__preflight(value);",
    };
  return { loader: "js", contents: "export default {};" };
}
function mount(Component, props) { const hooks = []; return { render() { activeHooks = hooks; hookCursor = 0; return Component(props); } }; }

const entry = await load("environment-entry-input");
entry.i();
let parsed = entry.n(
  'FOO=bar\nexport BAZ=\'two words\'\nQUOTED="line\\"value" # note',
  128,
);
assert.equal(parsed.ok, true);
assert.equal(parsed.entries.get("FOO"), "bar");
assert.equal(parsed.entries.get("BAZ"), "two words");
assert.equal(parsed.entries.get("QUOTED"), 'line\\"value');
assert.deepEqual(entry.n("FOO=1\nFOO=2", 128), {
  ok: false,
  reason: "duplicate",
  line: 2,
});
assert.deepEqual(entry.n("1BAD=value", 128), {
  ok: false,
  reason: "malformed",
  line: 1,
});
assert.deepEqual(entry.n("TOOLONG=value", 3), {
  ok: false,
  reason: "malformed",
  line: 1,
});
assert.deepEqual(entry.n("BLOCKED", 128, ["BLOCKED"]), {
  ok: false,
  reason: "duplicate",
  line: 1,
});
assert.deepEqual(
  entry.n("# comment\n; comment\nOK=yes", 128).entries.get("OK"),
  "yes",
);
assert.equal(entry.a().props.role, "alert");
let pending = null,
  added = null;
const entryMount = mount(entry.r, {
  limit: 2,
  entryCount: 0,
  onAddKey: (key) => {
    added = key;
  },
  onImport: (source) => entry.n(source, 128),
  onPendingChange: (value) => {
    pending = value;
  },
});
let entryView = entryMount.render();
entryView.props.children[0].props.onChange({
  currentTarget: { value: "NEW_KEY" },
});
assert.equal(pending, true);
entryView = entryMount.render();
entryView.props.children[0].props.onKeyDown({
  key: "Enter",
  shiftKey: false,
  preventDefault() {},
  stopPropagation() {},
});
assert.equal(added, "NEW_KEY");
assert.equal(pending, false);

const variableRow = await load("environment-variable-row");
variableRow.n();
let variable = null,
  variableDeleted = 0;
const variableView = variableRow.t({
  variable: { name: "API", value: "one" },
  keyError: "Duplicate",
  valueError: "Required",
  onChange: (value) => {
    variable = value;
  },
  onDelete: () => {
    variableDeleted++;
  },
});
assert.equal(
  variableView.props.children[0].props["aria-label"],
  "Variable key",
);
variableView.props.children[0].props.onChange({
  currentTarget: { value: "TOKEN" },
});
assert.equal(variable.name, "TOKEN");
variableView.props.children[1].props.onChange({
  currentTarget: { value: "two" },
});
assert.equal(variable.value, "two");
assert.equal(variableView.props.children[2].props.role, "alert");
assert.equal(variableView.props.children[3].props.role, "alert");
variableView.props.children[4].props.onClick();
assert.equal(variableDeleted, 1);

const secretRowReleaseAssertions = assertReleaseOwner("environment-secret-row");

const service = await load("personal-secrets-service");
let preflightInput = null;
const selection = {
  accountId: "a",
  userId: "u",
  config: { id: "c" },
  preflightPersonalSecrets: async (input) => {
    preflightInput = input;
    return { ok: true, data: { issues: [] } };
  },
};
assert.deepEqual(await service.n(selection), { issues: [] });
assert.deepEqual(preflightInput, {
  accountId: "a",
  userId: "u",
  configId: "c",
});
assert.equal(
  await service.n({
    ...selection,
    preflightPersonalSecrets: async () => {
      throw new Error("offline");
    },
  }),
  null,
);

globalThis.__parseEnvironment = entry.n;
const variables = await load("environment-variables-batch-dialog");
let savedVariables = null;
const variablesMount = mount(variables.EnvironmentVariablesBatchDialog, {
  initialVariables: [{ name: "A", value: "1" }],
  unavailableNames: [],
  onClose() {},
  onSave: (value) => {
    savedVariables = value;
  },
});
let variablesView = variablesMount.render();
assert.equal(
  variablesView.props.children.props.children[0].props.children,
  "Manage environment variables",
);
assert.equal(
  variablesView.props.children.props.children[2].props.children.length,
  1,
);
variablesView.props.children.props.children[3].props.onAddKey("B");
variablesView = variablesMount.render();
variablesView.props.children.props.onSubmit({ preventDefault() {} });
assert.deepEqual(savedVariables, [
  { name: "A", value: "1" },
  { name: "B", value: "", optional: false },
]);
const conflictVariables = mount(variables.EnvironmentVariablesBatchDialog, {
  initialVariables: [],
  unavailableNames: [],
  hasConflict: true,
  onClose() {},
  onSave() {
    throw new Error("must not save");
  },
}).render();
assert.equal(
  conflictVariables.props.children.props.children[1].props.role,
  "alert",
);
conflictVariables.props.children.props.onSubmit({ preventDefault() {} });

const secrets = await load("environment-batch-secrets-dialog");
let savedSecrets = null,
  secretsClosed = 0;
const secretsMount = mount(secrets.EnvironmentBatchSecretsDialog, {
  initialSecrets: [{ id: 1, name: "TOKEN", value: "x" }],
  onClose: () => {
    secretsClosed++;
  },
  onLocalSave: (value) => {
    savedSecrets = value;
  },
});
let secretsView = secretsMount.render();
assert.equal(
  secretsView.props.children.props.children[0].props.children,
  "Manage secrets",
);
secretsView.props.children.props.children[3].props.onImport("SECOND=two");
secretsView = secretsMount.render();
secretsView.props.children.props.children[2].props.children[0].props.onChange({
  id: 1,
  name: "TOKEN",
  value: "updated",
});
secretsView = secretsMount.render();
secretsView.props.children.props.onSubmit({ preventDefault() {} });
assert.equal(savedSecrets[0].value, "updated");
assert.equal(savedSecrets[1].name, "SECOND");
assert.equal(secretsClosed, 1);
const optional = mount(secrets.EnvironmentBatchSecretsDialog, {
  initialSecrets: [{ id: 1, name: "EMPTY", value: "" }],
  requireValues: false,
  onClose: () => {
    secretsClosed++;
  },
  onLocalSave: (value) => {
    savedSecrets = value;
  },
}).render();
optional.props.children.props.onSubmit({ preventDefault() {} });
assert.equal(secretsClosed, 2);

const personalSecretsReleaseAssertions = assertReleaseOwner("personal-secrets-dialog");

const personalSecretReleaseAssertions = assertReleaseOwner("personal-secret-dialog");
console.log(`environment secrets editors cluster complete with ${secretRowReleaseAssertions + personalSecretsReleaseAssertions + personalSecretReleaseAssertions} release assertions`);
