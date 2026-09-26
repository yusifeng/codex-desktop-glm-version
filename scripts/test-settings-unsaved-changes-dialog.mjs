import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const state = (globalThis.__settingsUnsavedDialogTest = {
  events: [],
  jsx: {
    jsx: (type, props, key) => ({ type, props, key }),
    jsxs: (type, props, key) => ({ type, props, key }),
  },
});

const result = await esbuild.build({
  entryPoints: [
    path.join(ROOT, "src/renderer/settings-unsaved-changes-dialog/index.ts"),
  ],
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
                  export const I3 = () => globalThis.__settingsUnsavedDialogTest.jsx;
                  export const Ih = "Dialog"; export const Oh = "DialogContent";
                  export const jh = "DialogSection"; export const Ah = "DialogHeading";
                  export const Rh = "DialogTitle"; export const Lh = "DialogSubtitle";
                  export const kh = "DialogActions"; export const Yh = "Button"; export const Y2 = "FormattedMessage";
                  export const $3 = () => {}; export const K2 = () => {}; export const Zh = () => {};
                  export const zh = () => {}; export const Ph = () => {};
                `
                : "export {};",
            loader: "js",
          }),
        );
      },
    },
  ],
});
const dialog = await import(
  `data:text/javascript;base64,${Buffer.from(result.outputFiles[0].text).toString("base64")}`
);

let assertions = 0;
function check(value, message) {
  assert.ok(value, message);
  assertions += 1;
}
const clear = () => state.events.push("clear");

let node = dialog.t({
  pendingNavigation: null,
  onClearPendingNavigation: clear,
});
check(
  node.type === "Dialog" && node.props.open === false,
  "closes without pending navigation",
);
check(node.props.showDialogClose === false, "hides the standard close control");

node = dialog.t({
  pendingNavigation: () => state.events.push("navigate"),
  onClearPendingNavigation: clear,
});
check(node.props.open === true, "opens while navigation is pending");
node.props.onOpenChange(true);
check(state.events.length === 0, "ignores an open-state notification");
node.props.onOpenChange(false);
check(
  state.events.join(",") === "clear",
  "clears pending navigation when dismissed",
);

const form = node.props.children;
check(
  form.type === "DialogContent" && form.props.as === "form",
  "renders the content as a form",
);
const [heading, footer] = form.props.children;
check(
  heading.props.children.props.title.props.children.props.defaultMessage ===
    "Discard changes?",
  "renders the discard title",
);
check(
  heading.props.children.props.subtitle.props.children.props.defaultMessage.includes(
    "unsaved changes",
  ),
  "warns that edits will be lost",
);

const [keepEditingButton, discardButton] = footer.props.children.props.children;
check(
  keepEditingButton.props.color === "secondary" &&
    keepEditingButton.props.type === "button",
  "renders Keep editing as a secondary button",
);
check(
  discardButton.props.color === "danger" &&
    discardButton.props.type === "submit",
  "renders Discard changes as a danger submit button",
);
state.events.length = 0;
keepEditingButton.props.onClick();
check(
  state.events.join(",") === "clear",
  "Keep editing clears pending navigation",
);

state.events.length = 0;
let prevented = 0;
form.props.onSubmit({ preventDefault: () => prevented++ });
check(prevented === 1, "prevents native form submission");
check(
  state.events.join(",") === "clear,navigate",
  "clears state before performing pending navigation",
);

console.log(`${assertions} settings unsaved changes dialog assertions passed`);
