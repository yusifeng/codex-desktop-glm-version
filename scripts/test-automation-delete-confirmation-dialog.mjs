import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
globalThis.__automationDeleteTest = {
  jsx: {
    jsx: (type, props, key) => ({ type, props, key }),
    jsxs: (type, props, key) => ({ type, props, key }),
  },
};
const result = await esbuild.build({
  entryPoints: [
    path.join(
      ROOT,
      "src/renderer/automation-delete-confirmation-dialog/index.ts",
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
      name: "mock-chunks",
      setup(build) {
        build.onResolve({ filter: /^@rchunk\// }, ({ path: importPath }) => ({
          path: importPath,
          namespace: "mock",
        }));
        build.onLoad({ filter: /.*/, namespace: "mock" }, () => ({
          contents: `
            export const I3 = () => globalThis.__automationDeleteTest.jsx;
            export const Rh = "DialogTitle"; export const Lh = "DialogDescription";
            export const Y2 = "FormattedMessage"; export const Yh = "Button";
            export const jh = "DialogSection"; export const Ah = "DialogHeading";
            export const kh = "DialogActions"; export const Oh = "DialogContent"; export const Ih = "Dialog";
            export const $3 = () => {}; export const K2 = () => {}; export const Zh = () => {};
            export const zh = () => {}; export const Ph = () => {};
          `,
          loader: "js",
        }));
      },
    },
  ],
});
const deletion = await import(
  `data:text/javascript;base64,${Buffer.from(result.outputFiles[0].text).toString("base64")}`
);
let canceled = 0;
let confirmed = 0;
const dialog = deletion.t({
  isPending: true,
  name: "Daily summary",
  onCancel: () => canceled++,
  onConfirm: () => confirmed++,
  open: true,
});
assert.equal(dialog.type, "Dialog");
assert.equal(dialog.props.open, true);
const form = dialog.props.children;
const title = form.props.children[0].props.children.props.title;
assert.equal(
  title.props.children.props.values.name.props.children,
  "Daily summary",
);
const buttons = form.props.children[1].props.children.props.children;
assert.equal(buttons[0].props.color, "outline");
assert.equal(buttons[1].props.color, "danger");
assert.equal(buttons[1].props.loading, true);
form.props.onSubmit({ preventDefault() {} });
assert.equal(confirmed, 1);
dialog.props.onOpenChange(false);
buttons[0].props.onClick();
assert.equal(canceled, 2);
console.log("9 automation delete confirmation dialog assertions passed");
