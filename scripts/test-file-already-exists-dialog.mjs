import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const state = (globalThis.__fileAlreadyExistsDialogTest = {
  events: [],
  jsx: {
    Fragment: "Fragment",
    jsx: (type, props, key) => ({ type, props, key }),
    jsxs: (type, props, key) => ({ type, props, key }),
  },
});

const result = await esbuild.build({
  entryPoints: [
    path.join(ROOT, "src/renderer/file-already-exists-dialog/index.ts"),
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
              {
                "app-shared": `
                  export const I3 = () => globalThis.__fileAlreadyExistsDialogTest.jsx;
                  export const Y2 = "FormattedMessage"; export const Yh = "Button";
                  export const $3 = () => {}; export const K2 = () => {}; export const Zh = () => {};
                `,
                "app-initial": `export const Kat = "Dialog"; export const qat = () => {};`,
              }[importPath] ?? "export {};",
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

const node = dialog.ProjectFileAlreadyExistsDialog({
  fileName: "roadmap.pdf",
  onClose: () => state.events.push("close"),
  onConfirm: () => state.events.push("confirm"),
});
check(node.type === "Dialog", "renders the shared dialog shell");
check(node.props.size === "compact", "uses the compact dialog size");
check(
  node.props.title.props.defaultMessage === "File already exists",
  "renders the duplicate-file title",
);
check(
  node.props.subtitle.type === "span" &&
    node.props.subtitle.props.className === "wrap-anywhere",
  "allows long filenames to wrap",
);
check(
  node.props.subtitle.props.children.props.values.fileName === "roadmap.pdf",
  "interpolates the exact filename",
);

const [skipButton, uploadButton] = node.props.footer.props.children;
check(
  skipButton.props.color === "secondary" && skipButton.props.type === "button",
  "renders Skip as a secondary button",
);
check(
  uploadButton.props.color === "primary" &&
    uploadButton.props.type === "submit",
  "renders Upload anyway as the primary submit button",
);
skipButton.props.onClick();
check(state.events.join(",") === "close", "Skip only closes the dialog");

state.events.length = 0;
node.props.onSubmit();
check(
  state.events.join(",") === "confirm,close",
  "confirmation runs before closing",
);
check(node.props.children === null, "does not render a dialog body");

console.log(`${assertions} file-already-exists dialog assertions passed`);
