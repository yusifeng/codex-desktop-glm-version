import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const state = (globalThis.__pendingEditsDialogTest = {
  events: [],
  jsx: {
    jsx: (type, props, key) => ({ type, props, key }),
    jsxs: (type, props, key) => ({ type, props, key }),
  },
});

const result = await esbuild.build({
  entryPoints: [path.join(ROOT, "src/renderer/pending-edits-dialog/index.ts")],
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
                  export const I3 = () => globalThis.__pendingEditsDialogTest.jsx;
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
const callbacks = {
  onCancel: () => state.events.push("cancel"),
  onConfirm: () => state.events.push("confirm"),
};

check(
  dialog.t({ ...callbacks, open: false }) === null,
  "stays hidden when closed",
);
const node = dialog.t({ ...callbacks, open: true });
check(
  node.type === "Dialog" && node.props.open === true,
  "renders an explicitly open dialog",
);
check(node.props.size === "compact", "uses the compact dialog size");

node.props.onOpenChange(true);
check(state.events.length === 0, "ignores an open-state notification");
node.props.onOpenChange(false);
check(state.events.join(",") === "cancel", "cancels when the dialog closes");

const form = node.props.children;
check(
  form.type === "DialogContent" && form.props.as === "form",
  "renders the content as a form",
);
const [heading, footer] = form.props.children;
check(
  heading.props.children.props.title.props.children.props.defaultMessage ===
    "Close editor?",
  "renders the close-editor title",
);
check(
  heading.props.children.props.subtitle.props.children.props.defaultMessage.includes(
    "pending edits",
  ),
  "warns about pending edits",
);

const [cancelButton, closeButton] = footer.props.children.props.children;
check(
  cancelButton.props.color === "outline" &&
    cancelButton.props.type === "button",
  "renders an outline cancel button",
);
check(
  closeButton.props.color === "primary" && closeButton.props.type === "submit",
  "renders a primary close submit button",
);
cancelButton.props.onClick();
check(
  state.events.join(",") === "cancel,cancel",
  "the cancel button invokes cancellation",
);

let prevented = 0;
form.props.onSubmit({ preventDefault: () => prevented++ });
check(prevented === 1, "prevents native form submission");
check(
  state.events.join(",") === "cancel,cancel,confirm",
  "confirms after form submission",
);

console.log(`${assertions} pending-edits dialog assertions passed`);
