import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const state = (globalThis.__sourceFileDeleteDialogTest = {
  canOperate: true,
  events: [],
  project: {
    gizmo: { current_user_permission: { can_write: true } },
    files: [{ file_id: "file-1" }, { id: "legacy-file" }],
  },
  queryArgs: null,
  jsx: {
    jsx: (type, props, key) => ({ type, props, key }),
    jsxs: (type, props, key) => ({ type, props, key }),
  },
});

const result = await esbuild.build({
  entryPoints: [
    path.join(ROOT, "src/renderer/source-file-delete-dialog/index.ts"),
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
                  export const I3 = () => globalThis.__sourceFileDeleteDialogTest.jsx;
                  export const BX = (...args) => { globalThis.__sourceFileDeleteDialogTest.queryArgs = args; return { data: globalThis.__sourceFileDeleteDialogTest.project }; };
                  export const Ih = "Dialog"; export const Oh = "DialogContent";
                  export const jh = "DialogSection"; export const Ah = "DialogHeading";
                  export const Rh = "DialogTitle"; export const Lh = "DialogSubtitle";
                  export const kh = "DialogActions"; export const Yh = "Button"; export const Y2 = "FormattedMessage";
                  export const $3 = () => {}; export const FX = () => {}; export const K2 = () => {};
                  export const Zh = () => {}; export const zh = () => {}; export const Ph = () => {};
                `,
                "app-initial": `
                  export const cjt = "project-query"; export const ux = () => globalThis.__sourceFileDeleteDialogTest.canOperate;
                  export const eUt = (canWrite, context) => Boolean(canWrite && context);
                  export const dp = (file) => file.processingState;
                  export const ujt = () => {}; export const pp = () => {}; export const lx = () => {};
                `,
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
function render(fileId = "file-1") {
  return dialog.ChatGptProjectFileDeleteDialog({
    fileId,
    projectId: "project-1",
    title: "notes.txt",
    onClose: () => state.events.push("close"),
    onDelete: () => state.events.push("delete"),
  });
}

let node = render();
check(node.type === "Dialog" && node.props.open, "renders an open dialog");
check(
  state.queryArgs[0] === "project-query" && state.queryArgs[1] === "project-1",
  "loads the selected project",
);
const form = node.props.children;
check(
  form.props.className === "select-none" && form.props.as === "form",
  "renders a non-selectable form",
);
const [heading, footer] = form.props.children;
check(
  heading.props.children.props.title.props.children.props.values.title ===
    "notes.txt",
  "includes the filename in the title",
);
const bold =
  heading.props.children.props.subtitle.props.children.props.values.bold(
    "everyone",
  );
check(
  bold.type === "strong" && bold.props.children === "everyone",
  "renders the shared-access warning in bold",
);
const [cancelButton, deleteButton] = footer.props.children.props.children;
check(
  deleteButton.props.disabled === false,
  "enables deletion for an eligible file",
);

let prevented = 0;
form.props.onSubmit({ preventDefault: () => prevented++ });
check(prevented === 1, "prevents native form submission");
check(
  state.events.join(",") === "close,delete",
  "closes before invoking deletion",
);

state.events.length = 0;
node.props.onOpenChange(true);
check(state.events.length === 0, "ignores an open-state notification");
node.props.onOpenChange(false);
check(state.events.join(",") === "close", "closes when dismissed");
cancelButton.props.onClick();
check(
  state.events.join(",") === "close,close",
  "cancel closes without deleting",
);

state.events.length = 0;
node = render("missing-file");
check(
  node.props.children.props.children[1].props.children.props.children[1].props
    .disabled === true,
  "disables deletion when the file is absent",
);
node.props.children.props.onSubmit({ preventDefault() {} });
check(state.events.length === 0, "does not delete an absent file");

state.project.files = [{ file_id: "file-1", processingState: "processing" }];
node = render();
check(
  node.props.children.props.children[1].props.children.props.children[1].props
    .disabled === true,
  "disables deletion for a protected processing file",
);

state.project.files = [{ id: "legacy-file" }];
node = render("legacy-file");
check(
  node.props.children.props.children[1].props.children.props.children[1].props
    .disabled === false,
  "supports legacy file ids",
);

state.canOperate = false;
node = render("legacy-file");
check(
  node.props.children.props.children[1].props.children.props.children[1].props
    .disabled === true,
  "requires the active deletion context",
);

console.log(`${assertions} source-file delete dialog assertions passed`);
