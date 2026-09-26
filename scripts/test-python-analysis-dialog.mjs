import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const state = (globalThis.__pythonAnalysisDialogTest = {
  initializers: [],
  jsx: {
    jsx: (type, props, key) => ({ type, props, key }),
    jsxs: (type, props, key) => ({ type, props, key }),
  },
});

const result = await esbuild.build({
  entryPoints: [
    path.join(ROOT, "src/renderer/python-analysis-dialog/index.ts"),
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
                    export const I3 = () => globalThis.__pythonAnalysisDialogTest.jsx;
                    export const Ih = "Dialog"; export const Oh = "DialogContent";
                    export const Rh = "DialogTitle"; export const Y2 = "FormattedMessage";
                    ${["$3", "K2", "zh", "Ph"].map((name) => `export const ${name} = () => globalThis.__pythonAnalysisDialogTest.initializers.push("${name}");`).join("\n")}
                  `
                : `
                    export const n = () => globalThis.__pythonAnalysisDialogTest.initializers.push("details");
                    export const t = "AnalysisDetails";
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
const focusHandler = () => {};
const items = [
  { id: "code-1", type: "code" },
  { id: "output-1", type: "output" },
];
const node = dialog.PythonAnalysisDialog({
  items,
  onClose: () => closed++,
  onCloseAutoFocus: focusHandler,
});
assert.deepEqual(state.initializers, ["$3", "K2", "zh", "Ph", "details"]);
assert.equal(node.type, "Dialog");
assert.equal(node.props.size, "large");
assert.equal(node.props.variant, "chatgpt");
assert.equal(node.props.contentProps["aria-describedby"], undefined);
assert.equal(node.props.contentProps.onCloseAutoFocus, focusHandler);
const content = node.props.children;
assert.equal(content.type, "DialogContent");
assert.equal(
  content.props.children[0].props.children.props.defaultMessage,
  "Analysis",
);
const rows = content.props.children[1].props.children.props.children;
assert.deepEqual(
  rows.map((row) => [row.type, row.key, row.props.item.type]),
  [
    ["AnalysisDetails", "code-1", "code"],
    ["AnalysisDetails", "output-1", "output"],
  ],
);
node.props.onOpenChange(true);
assert.equal(closed, 0);
node.props.onOpenChange(false);
assert.equal(closed, 1);
console.log("11 Python analysis dialog assertions passed");
