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

const sourceMenuModule = await load("add-source-menu");
let sourceAction = null;
const sourceMenu = sourceMenuModule.ChatGptAddSourceMenu({
  conversationId: "conversation-1",
  defaultOpen: true,
  composerActions: {
    canOpenFileDialog: false,
    canOpenLibraryPicker: true,
    openFileDialog: () => { sourceAction = "file"; },
    openLibraryPicker: () => { sourceAction = "library"; },
    openPluginDirectory: () => { sourceAction = "plugins"; },
  },
});
assert.equal(sourceMenu.props["data-conversation-id"], "conversation-1");
assert.equal(sourceMenu.props.children[1].props.children[0].props.children.props.children, "Connect plugins");
assert.equal(sourceMenu.props.children[1].props.children[1].props.children.props.disabled, true);
sourceMenu.props.children[1].props.children[2].props.children.props.onClick();
assert.equal(sourceAction, "library");
assert.equal(sourceMenu.props.children[1].props.children[2].props.children.props.children, "Add from library");

const settingsModule = await load("settings-command-menu-section-items");
let settingsAction = null;
let closeCount = 0;
const settings = settingsModule.VisibleSettingsCommandMenuSectionItems({
  close: () => closeCount++,
  isSelectedHostLocal: true,
  selectedHostId: "local",
  sections: [
    { label: "General", slug: "general" },
    { disabled: true, label: "Hidden", slug: "hidden" },
    { externalUrl: "https://example.com/security", label: "Security", slug: "security" },
  ],
  onNavigate: (path) => { settingsAction = path; },
  onOpenExternal: (url) => { settingsAction = url; },
});
assert.equal(settings.props["data-local-host"], true);
assert.equal(settings.props.children[1].props.children.length, 2);
settings.props.children[1].props.children[0].props.children.props.onClick();
assert.equal(settingsAction, "/settings/general");
settings.props.children[1].props.children[1].props.children.props.onClick();
assert.equal(settingsAction, "https://example.com/security");
assert.equal(closeCount, 2);

const agentModule = await load("agent-menu");
globalThis.__stateOverrides = [true, false];
let agentAction = null;
const agentMenu = agentModule.t({
  agent: { id: "agent-1", name: "Reviewer" },
  canDelete: true,
  isPinned: false,
  isPublished: true,
  onCopyLink: (id) => { agentAction = `copy:${id}`; return true; },
  onDelete: (id) => { agentAction = `delete:${id}`; },
  onDuplicate: (agent) => { agentAction = `duplicate:${agent.id}`; },
  onPinChange: (agent, pinned) => { agentAction = `pin:${agent.id}:${pinned}`; },
});
assert.equal(agentMenu.props.children[0].props["aria-label"], "More actions");
assert.equal(agentMenu.props.children[1].type, "menu");
agentMenu.props.children[1].props.children[0].props.children[0].props.children.props.onClick();
assert.equal(agentAction, "copy:agent-1");
await agentMenu.props.children[1].props.children[0].props.children[1].props.children.props.onClick();
assert.equal(agentAction, "pin:agent-1:true");
agentMenu.props.children[1].props.children[2].props.children.props.onClick();
assert.equal(agentAction, "delete:agent-1");

const moveReleaseAssertions = assertReleaseOwner("conversation-move-menu-items");

console.log(`action menus cluster complete (${moveReleaseAssertions} release assertions)`);
