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

const secretScopeReleaseAssertions = assertReleaseOwner("secret-scope");

const allowedDomainsReleaseAssertions = assertReleaseOwner("allowed-domains-input");
console.log(`secret scope cluster with ${secretScopeReleaseAssertions} secret scope and ${allowedDomainsReleaseAssertions} allowed domains release assertions complete`);
