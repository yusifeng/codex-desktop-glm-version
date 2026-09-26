import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const state = (globalThis.__imageUploadReminderDialogTest = {
  acknowledged: 0,
  jsx: {
    jsx: (type, props, key) => ({ type, props, key }),
    jsxs: (type, props, key) => ({ type, props, key }),
  },
});

const result = await esbuild.build({
  entryPoints: [
    path.join(
      ROOT,
      "src/renderer/chatgpt-image-upload-reminder-dialog-core/index.ts",
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
                  export const I3 = () => globalThis.__imageUploadReminderDialogTest.jsx;
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

dialog.n();
const node = dialog.t({
  onAcknowledge: () => state.acknowledged++,
  overlayClassName: "privacy-reminder-overlay",
});
check(node.type === "Dialog" && node.props.open, "renders an open dialog");
check(node.props.shouldIgnoreClickOutside, "ignores outside clicks");
check(node.props.showDialogClose === false, "hides the close control");
check(node.props.size === "compact", "uses the compact dialog size");
check(
  node.props.overlayClassName === "privacy-reminder-overlay",
  "forwards the overlay class",
);

const form = node.props.children;
check(
  form.type === "DialogContent" && form.props.as === "form",
  "renders the content as a form",
);
const [heading, footer] = form.props.children;
check(
  heading.props.children.props.title.props.children.props.defaultMessage ===
    "Check before sharing",
  "renders the privacy reminder title",
);
check(
  heading.props.children.props.subtitle.props.children.props.defaultMessage.includes(
    "anything sensitive",
  ),
  "warns about sensitive content",
);
check(
  footer.props.children.props.children.props.type === "submit",
  "renders a single submit acknowledgement button",
);

let prevented = 0;
let stopped = 0;
form.props.onSubmit({
  preventDefault: () => prevented++,
  stopPropagation: () => stopped++,
});
check(prevented === 1, "prevents native form submission");
check(stopped === 1, "stops submit propagation");
check(state.acknowledged === 1, "acknowledges after suppressing the event");
node.props.onOpenChange(false);
check(state.acknowledged === 1, "ignores open-state changes");

console.log(`${assertions} image upload reminder dialog assertions passed`);
