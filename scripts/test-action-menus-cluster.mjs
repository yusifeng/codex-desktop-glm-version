import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";
import { assertReleaseOwner } from "./release-owner-test-helpers.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const jsx = {
  Fragment: Symbol("Fragment"),
  jsx: (type, props, key) => ({ type, props: props ?? {}, key }),
  jsxs: (type, props, key) => ({ type, props: props ?? {}, key }),
};
globalThis.__jsx = jsx;
globalThis.__stateOverrides = [];
globalThis.__React = {
  useState(initialValue) {
    const value = globalThis.__stateOverrides.length > 0
      ? globalThis.__stateOverrides.shift()
      : typeof initialValue === "function" ? initialValue() : initialValue;
    return [value, () => {}];
  },
};

async function load(name) {
  const result = await esbuild.build({
    entryPoints: [path.join(ROOT, `src/renderer/${name}/index.ts`)],
    bundle: true,
    format: "esm",
    platform: "node",
    target: "node22",
    write: false,
    logLevel: "silent",
    plugins: [{
      name: "mocks",
      setup(build) {
        build.onResolve({ filter: /^@rchunk\// }, ({ path: modulePath }) => ({ path: modulePath.slice(8), namespace: "mock" }));
        build.onLoad({ filter: /.*/, namespace: "mock" }, ({ path: modulePath }) =>
          modulePath === "app-shared"
            ? { loader: "js", contents: "export const I3=()=>globalThis.__jsx;export const e6=()=>globalThis.__React;" }
            : { loader: "js", contents: "export default {};" },
        );
      },
    }],
  });
  return import(`data:text/javascript;base64,${Buffer.from(result.outputFiles[0].text).toString("base64")}#${name}`);
}

const outputMenuModule = await load("create-output-menu");
let createdKind = null;
const outputMenu = outputMenuModule.ChatGptCreateOutputMenu({
  defaultOpen: true,
  composerActions: {
    availableArtifactKinds: ["document", "site"],
    createArtifact: (kind) => { createdKind = kind; },
  },
});
assert.equal(outputMenu.props.children[0].props["aria-label"], "Create file or site");
assert.equal(outputMenu.props.children[1].type, "menu");
assert.equal(outputMenu.props.children[1].props.children[0][1].props.children.props.disabled, true);
outputMenu.props.children[1].props.children[0][3].props.children.props.onClick();
assert.equal(createdKind, "site");
assert.equal(outputMenu.props.children[1].props.children[0].length, 4);

assertReleaseOwner("add-source-menu");

assertReleaseOwner("settings-command-menu-section-items");

assertReleaseOwner("agent-menu");

const moveReleaseAssertions = assertReleaseOwner("conversation-move-menu-items");

console.log(`action menus cluster complete (${moveReleaseAssertions} release assertions)`);
