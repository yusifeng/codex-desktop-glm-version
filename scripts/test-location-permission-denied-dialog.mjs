import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const state = (globalThis.__locationPermissionDialogTest = {
  initializers: [],
  jsx: {
    jsx: (type, props) => ({ type, props }),
  },
});

const result = await esbuild.build({
  entryPoints: [
    path.join(ROOT, "src/renderer/location-permission-denied-dialog/index.ts"),
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
          () => ({
            contents: `
              export const I3 = () => globalThis.__locationPermissionDialogTest.jsx;
              export const Ih = "Dialog"; export const Oh = "DialogContent";
              export const jh = "DialogSection"; export const Ah = "DialogHeader";
              export const Rh = "DialogTitle"; export const Lh = "DialogDescription";
              export const Y2 = "FormattedMessage";
              export const $3 = () => globalThis.__locationPermissionDialogTest.initializers.push("compiler");
              export const K2 = () => globalThis.__locationPermissionDialogTest.initializers.push("intl");
              export const zh = () => globalThis.__locationPermissionDialogTest.initializers.push("dialog");
              export const Ph = () => globalThis.__locationPermissionDialogTest.initializers.push("header");
            `,
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

let closed = 0;
const node = dialog.ChatGptLocationPermissionDeniedDialog({
  onClose: () => closed++,
});
assert.deepEqual(state.initializers, ["compiler", "intl", "dialog", "header"]);
assert.equal(node.type, "Dialog");
assert.equal(node.props.open, true);
assert.equal(node.props.size, "compact");
const header = node.props.children.props.children.props.children;
assert.equal(header.type, "DialogHeader");
assert.equal(
  header.props.title.props.children.props.defaultMessage,
  "Turn on location access",
);
assert.match(
  header.props.subtitle.props.children.props.defaultMessage,
  /site settings/,
);
node.props.onOpenChange(true);
assert.equal(closed, 0);
node.props.onOpenChange(false);
assert.equal(closed, 1);
console.log("9 location permission dialog assertions passed");
