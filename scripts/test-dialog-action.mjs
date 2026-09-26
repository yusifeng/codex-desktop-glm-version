import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const state = (globalThis.__dialogActionTest = {
  initialized: 0,
  events: [],
  jsx: {
    jsx: (type, props, key) => ({ type, props, key }),
    jsxs: (type, props, key) => ({ type, props, key }),
  },
});

const result = await esbuild.build({
  entryPoints: [path.join(ROOT, "src/renderer/dialog-action/index.ts")],
  bundle: true,
  format: "esm",
  platform: "node",
  target: "node22",
  write: false,
  logLevel: "silent",
  plugins: [
    {
      name: "mock-renderer-chunks",
      setup(build) {
        build.onResolve({ filter: /^@rchunk\// }, ({ path: importPath }) => ({
          path: importPath.slice("@rchunk/".length),
          namespace: "mock-renderer-chunk",
        }));
        build.onLoad(
          { filter: /.*/, namespace: "mock-renderer-chunk" },
          ({ path: importPath }) => ({
            contents:
              importPath === "app-shared"
                ? `
                  export const I3 = () => globalThis.__dialogActionTest.jsx;
                  export const Yh = "Button"; export const Y2 = "FormattedMessage";
                  export const $3 = () => globalThis.__dialogActionTest.initialized++;
                  export const K2 = () => globalThis.__dialogActionTest.initialized++;
                  export const Zh = () => globalThis.__dialogActionTest.initialized++;
                `
                : "export {};",
            loader: "js",
          }),
        );
      },
    },
  ],
});
const dialogAction = await import(
  `data:text/javascript;base64,${Buffer.from(result.outputFiles[0].text).toString("base64")}`
);

let assertions = 0;
function check(value, message) {
  assert.ok(value, message);
  assertions += 1;
}
const actions = {
  invite: {
    onClick: () => state.events.push("invite"),
    type: "button",
  },
  share: {
    onClick: () => state.events.push("share"),
    type: "submit",
  },
};
function render(overrides = {}) {
  return dialogAction.t({
    actions,
    hasPendingAccessChange: false,
    hasPendingInvitees: false,
    ...overrides,
  });
}

dialogAction.n();
check(state.initialized === 3, "initializes shared action dependencies");
check(render() === null, "renders nothing while idle without idle actions");
const idle = { type: "IdleActions" };
check(
  render({ idleActions: idle }) === idle,
  "returns caller-provided idle actions",
);

let node = render({ hasPendingAccessChange: true });
let [cancelButton, primaryButton] = node.props.children;
check(cancelButton === null, "omits cancellation when not configured");
check(
  primaryButton.props.type === "submit" &&
    primaryButton.props.children.props.action === "share",
  "selects the share action for access-only changes",
);
primaryButton.props.onClick();
check(state.events.join(",") === "share", "uses the share callback");

node = render({ hasPendingInvitees: true });
primaryButton = node.props.children[1];
check(
  primaryButton.props.type === "button" &&
    primaryButton.props.children.props.action === "invite",
  "selects the invite action for pending invitees",
);
node = render({ hasPendingAccessChange: true, hasPendingInvitees: true });
check(
  node.props.children[1].props.children.props.action === "invite",
  "prioritizes inviting when both changes are pending",
);

const customLabel = { type: "CustomLabel" };
node = render({
  hasPendingAccessChange: true,
  actions: { ...actions, share: { ...actions.share, label: customLabel } },
});
check(
  node.props.children[1].props.children === customLabel,
  "uses a custom action label when supplied",
);

node = render({
  hasPendingAccessChange: true,
  disabled: true,
  isSaving: true,
  size: "large",
  cancelAction: { onClick: () => state.events.push("cancel") },
});
[cancelButton, primaryButton] = node.props.children;
check(
  cancelButton.props.disabled === true && cancelButton.props.size === "large",
  "disables cancellation while saving",
);
check(
  primaryButton.props["aria-busy"] === true &&
    primaryButton.props.loading === true,
  "announces and displays the saving state",
);
check(
  primaryButton.props.children.props.defaultMessage === "Saving",
  "replaces the primary label while saving",
);
check(
  primaryButton.props.disabled === true,
  "forwards the global disabled state",
);

node = render({
  hasPendingAccessChange: true,
  disabled: true,
  isSaving: false,
  cancelAction: {
    disabled: false,
    onClick: () => state.events.push("cancel"),
  },
});
cancelButton = node.props.children[0];
check(
  cancelButton.props.disabled === false,
  "lets cancel-specific disabled state override the global state",
);
cancelButton.props.onClick();
check(state.events.join(",") === "share,cancel", "uses the cancel callback");
check(
  node.props.className.includes("justify-end"),
  "right-aligns and wraps dialog actions",
);

console.log(`${assertions} dialog action assertions passed`);
