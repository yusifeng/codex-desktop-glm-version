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
let activeHooks = [], hookCursor = 0;
const React = { useState(initial) { const hooks = activeHooks, index = hookCursor++; if (!(index in hooks)) hooks[index] = typeof initial === "function" ? initial() : initial; return [hooks[index], value => { hooks[index] = typeof value === "function" ? value(hooks[index]) : value; }]; } };
globalThis.__jsx = jsx;
globalThis.__secretScopeReact = React;
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
            ({ path: modulePath }) => pathModule(modulePath),
          );
        },
      },
    ],
  });
  return import(
    `data:text/javascript;base64,${Buffer.from(result.outputFiles[0].text).toString("base64")}#${name}`
  );
}
function pathModule(name) {
  return name === "app-shared"
    ? { loader: "js", contents: "export const I3=()=>globalThis.__jsx;export const e6=globalThis.__secretScopeReact;" }
    : { loader: "js", contents: "export default {};" };
}
function mount(Component, props) { const hooks = []; return { render() { activeHooks = hooks; hookCursor = 0; return Component(props); } }; }

const validation = await load("validation-message");
validation.r();
assert.equal(
  validation.n({ error: "missing-key" }).props.children,
  "Enter a key",
);
assert.match(
  validation.n({ error: "invalid-key" }).props.children,
  /letter or underscore/,
);
assert.match(
  validation.n({ error: "reserved-key" }).props.children,
  /reserved/,
);
assert.match(
  validation.n({ error: "duplicate" }).props.children,
  /already used/,
);
assert.match(
  validation.n({ error: "missing-value" }).props.children,
  /Enter a value/,
);
assert.match(
  validation.n({ error: "invalid-value" }).props.children,
  /null characters/,
);
assert.match(validation.t({ name: "BAD" }).props.children, /“BAD”/);

const scope = await load("secret-scope");
scope.c();
let environmentValue = null;
const environmentInput = scope.s({
  id: "env",
  value: "line one\nline two",
  ariaLabel: "Environment value",
  hasSavedValue: true,
  onChange: (value) => {
    environmentValue = value;
  },
});
assert.equal(environmentInput.type, "textarea");
assert.equal(environmentInput.props.rows, 3);
assert.equal(
  environmentInput.props.placeholder,
  "Leave blank to keep saved value",
);
environmentInput.props.onChange({ currentTarget: { value: "updated" } });
assert.equal(environmentValue, "updated");
const optionalInput = scope.s({
  id: "optional",
  value: "",
  ariaLabel: "Optional",
  optional: true,
  onChange() {},
});
assert.equal(optionalInput.props.placeholder, "Your value (optional)");
let secretValue = null;
const revealMount = mount(scope.a, {
  id: "secret",
  value: "hidden",
  ariaLabel: "Secret",
  personal: true,
  onChange: (value) => {
    secretValue = value;
  },
});
let reveal = revealMount.render();
assert.equal(reveal.props.children[0].props.type, "password");
assert.equal(
  reveal.props.children[1].props["aria-label"],
  "Reveal secret value",
);
reveal.props.children[0].props.onChange({
  currentTarget: { value: "changed" },
});
assert.equal(secretValue, "changed");
reveal.props.children[1].props.onClick();
reveal = revealMount.render();
assert.equal(reveal.props.children[0].props.type, "text");
assert.equal(reveal.props.children[1].props["aria-label"], "Hide secret value");
let retried = 0;
const unavailable = scope.r({
  id: "personal",
  value: "",
  ariaLabel: "Personal",
  namespace: "sensitive",
  name: "TOKEN",
  savedStatus: "unavailable",
  onChange() {},
  onRetry: () => {
    retried++;
  },
});
assert.equal(unavailable.props.children[1].props.role, "status");
assert.match(unavailable.props.children[1].props.children, /unavailable/);
unavailable.props.children[2].props.onClick();
assert.equal(retried, 1);
assert.match(
  scope.r({
    id: "personal",
    value: "",
    ariaLabel: "Personal",
    namespace: "not_sensitive",
    name: "TOKEN",
    savedStatus: "ambiguous",
    onChange() {},
  }).props.children[1].props.children,
  /Multiple/,
);
let changedScope = null;
const scopeControl = scope.t({
  name: "TOKEN",
  source: "environment",
  onChange: (value) => {
    changedScope = value;
  },
});
assert.equal(scopeControl.props["aria-label"], "Scope for TOKEN");
assert.equal(
  scopeControl.props.children[1].props.children[0].props.checked,
  true,
);
scopeControl.props.children[2].props.children[0].props.onChange();
assert.equal(changedScope, "user_provided");

const allowedDomainsReleaseAssertions = assertReleaseOwner("allowed-domains-input");
console.log(`secret scope cluster and ${allowedDomainsReleaseAssertions} allowed domains release assertions complete`);
