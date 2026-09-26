import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const state = (globalThis.__savedMemoryDeleteDialogTest = {
  events: [],
  jsx: {
    jsx: (type, props, key) => ({ type, props, key }),
    jsxs: (type, props, key) => ({ type, props, key }),
  },
});

const result = await esbuild.build({
  entryPoints: [
    path.join(
      ROOT,
      "src/renderer/chatgpt-saved-memory-source-delete-dialog/index.ts",
    ),
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
                  export const I3 = () => globalThis.__savedMemoryDeleteDialogTest.jsx;
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

const node = dialog.ChatGptSavedMemorySourceDeleteDialog({
  title: "Prefers concise answers",
  onClose: () => state.events.push("close"),
  onConfirm: () => state.events.push("confirm"),
});
check(
  node.type === "Dialog" && node.props.open === true,
  "renders an open dialog",
);
const form = node.props.children;
check(
  form.type === "DialogContent" && form.props.as === "form",
  "renders the content as a form",
);
const [heading, description, actions] = form.props.children;
check(
  heading.props.children.props.title.props.children.props.defaultMessage ===
    "Delete this memory?",
  "renders the delete-memory title",
);
check(
  description.props.children.props.children.props.values.title ===
    "Prefers concise answers",
  "includes the saved-memory title in the warning",
);

const [cancelButton, deleteButton] = actions.props.children;
check(
  cancelButton.props.color === "secondary" &&
    cancelButton.props.type === "button",
  "renders a secondary cancel button",
);
check(
  deleteButton.props.color === "danger" && deleteButton.props.type === "submit",
  "renders a destructive submit button",
);
node.props.onOpenChange(true);
check(state.events.length === 0, "ignores an open-state notification");
node.props.onOpenChange(false);
check(
  state.events.join(",") === "close",
  "closes when the dialog is dismissed",
);
cancelButton.props.onClick();
check(
  state.events.join(",") === "close,close",
  "cancel closes without deleting",
);

let prevented = 0;
form.props.onSubmit({ preventDefault: () => prevented++ });
check(prevented === 1, "prevents native form submission");
check(
  state.events.join(",") === "close,close,confirm",
  "confirms deletion on submit",
);

console.log(`${assertions} saved-memory delete dialog assertions passed`);
