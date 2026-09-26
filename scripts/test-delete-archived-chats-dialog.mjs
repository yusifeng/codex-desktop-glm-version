import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
globalThis.__deleteArchivedTest = {
  jsx: {
    jsx: (type, props, key) => ({ type, props, key }),
    jsxs: (type, props, key) => ({ type, props, key }),
  },
};
const result = await esbuild.build({
  entryPoints: [
    path.join(ROOT, "src/renderer/delete-archived-chats-dialog/index.ts"),
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
        build.onResolve({ filter: /^@rchunk\// }, ({ path }) => ({
          path,
          namespace: "mock",
        }));
        build.onLoad({ filter: /.*/, namespace: "mock" }, ({ path }) => ({
          contents: path.endsWith("app-initial")
            ? `export const Lb = { delete: { defaultMessage: "Delete" } }; export const Rb = () => {};`
            : `
                export const I3 = () => globalThis.__deleteArchivedTest.jsx;
                export const Rh = "DialogTitle"; export const Y2 = "FormattedMessage"; export const Yh = "Button";
                export const jh = "DialogSection"; export const Ah = "DialogHeading"; export const kh = "DialogActions";
                export const Oh = "DialogContent"; export const Ih = "Dialog";
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
let assertions = 0;
function check(value, message) {
  assert.ok(value, message);
  assertions += 1;
}
check(deletion.t({ state: null }) === null, "hides without a pending deletion");
let confirmed = 0;
const changes = [];
const render = (state, isDeleting = false) =>
  deletion.t({
    state,
    isDeleting,
    onConfirm: () => confirmed++,
    onOpenChange: (open) => changes.push(open),
  });
let dialog = render({ kind: "project", threads: [{}, {}] });
check(
  dialog.type === "Dialog" && dialog.props.showDialogClose === false,
  "renders a modal without a close affordance",
);
let form = dialog.props.children;
const [header, body, footer] = form.props.children;
check(
  header.props.children.props.title.props.children.props.defaultMessage ===
    "Delete all in project?",
  "uses the project title",
);
check(
  body.props.children.props.children.props.values.count === 2,
  "includes the project archived-chat count",
);
let [cancel, confirm] = footer.props.children.props.children;
check(
  cancel.props.color === "ghost" && confirm.props.color === "danger",
  "uses cancel and destructive actions",
);
form.props.onSubmit({ preventDefault() {} });
check(confirmed === 1, "confirms from form submission");
cancel.props.onClick();
dialog.props.onOpenChange(false);
check(
  changes.length === 2 && changes.every((value) => value === false),
  "closes from cancel or dialog dismissal",
);

dialog = render({ kind: "all", threads: [] }, true);
form = dialog.props.children;
[cancel, confirm] = form.props.children[2].props.children.props.children;
check(
  cancel.props.disabled && confirm.props.loading,
  "locks actions while deletion is pending",
);
form.props.onSubmit({ preventDefault() {} });
dialog.props.onOpenChange(false);
check(
  confirmed === 1 && changes.length === 2,
  "blocks confirm and dismissal while deleting",
);

dialog = render({ kind: "single", threads: [{}] });
check(
  dialog.props.children.props.children[0].props.children.props.title.props
    .children.props.defaultMessage === "Delete archived chat?",
  "uses the single-chat title",
);

assert.equal(assertions, 10);
console.log(`${assertions} delete archived chats dialog assertions passed`);
