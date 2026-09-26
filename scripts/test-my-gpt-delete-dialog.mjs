import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const state = (globalThis.__myGptDeleteDialogTest = {
  closed: 0,
  invalidations: [],
  isError: false,
  isPending: false,
  mutationConfig: null,
  mutateCount: 0,
  requests: [],
  scope: {
    queryClient: {
      invalidateQueries: (options) =>
        globalThis.__myGptDeleteDialogTest.invalidations.push(options),
    },
  },
  jsx: {
    jsx: (type, props, key) => ({ type, props, key }),
    jsxs: (type, props, key) => ({ type, props, key }),
  },
});

const result = await esbuild.build({
  entryPoints: [path.join(ROOT, "src/renderer/my-gpt-delete-dialog/index.ts")],
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
                  export const I3 = () => globalThis.__myGptDeleteDialogTest.jsx;
                  export const LX = () => globalThis.__myGptDeleteDialogTest.scope; export const ZI = "scope";
                  export const iL = (config) => { globalThis.__myGptDeleteDialogTest.mutationConfig = config; return {
                    mutate: () => globalThis.__myGptDeleteDialogTest.mutateCount++,
                    isPending: globalThis.__myGptDeleteDialogTest.isPending,
                    isError: globalThis.__myGptDeleteDialogTest.isError,
                  }; };
                  export const Ih = "Dialog"; export const Oh = "DialogContent";
                  export const jh = "DialogSection"; export const Ah = "DialogHeading";
                  export const Rh = "DialogTitle"; export const Lh = "DialogSubtitle";
                  export const kh = "DialogActions"; export const Yh = "Button"; export const Y2 = "FormattedMessage";
                  export const $3 = () => {}; export const rL = () => {}; export const FX = () => {}; export const K2 = () => {};
                  export const Zh = () => {}; export const zh = () => {}; export const Ph = () => {}; export const QI = () => {};
                `,
                "app-initial": `
                  export const rJt = { safeDelete: async (url, options) => globalThis.__myGptDeleteDialogTest.requests.push({ url, options }) };
                  export const cJt = () => {};
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
function resource(overrides = {}) {
  return {
    gizmo: {
      id: "gizmo-1",
      current_user_permission: { can_delete: true },
      migrated_plugin_id: null,
      ...overrides,
    },
  };
}
function render(overrides = {}) {
  return dialog.MyGptDeleteDialog({
    resource: resource(overrides),
    onClose: () => state.closed++,
  });
}

let node = render();
check(
  node.type === "Dialog" && node.props.showDialogClose === false,
  "renders a non-dismissible-close-control dialog",
);
const form = node.props.children;
check(form.props.size === "viewport", "uses the viewport form size");
const [, body, footer] = form.props.children;
check(body.props.children[1] === null, "does not render an error initially");
const [cancelButton, deleteButton] = footer.props.children.props.children;
check(
  cancelButton.props.disabled === false && deleteButton.props.loading === false,
  "keeps controls interactive while idle",
);

let prevented = 0;
form.props.onSubmit({ preventDefault: () => prevented++ });
check(
  prevented === 1 && state.mutateCount === 1,
  "submits an eligible deletion once",
);
await state.mutationConfig.mutationFn();
check(
  state.requests[0].url === "/gizmos/{gizmo_id}" &&
    state.requests[0].options.parameters.path.gizmo_id === "gizmo-1",
  "deletes the selected GPT through the typed endpoint",
);
state.mutationConfig.onSuccess();
check(
  state.invalidations[0].queryKey[0] === "chatgpt-gizmos",
  "invalidates the GPT listing after deletion",
);
check(state.closed === 1, "closes after a successful deletion");

node.props.onOpenChange(true);
check(state.closed === 1, "ignores an open-state notification");
node.props.onOpenChange(false);
check(state.closed === 2, "allows dismissal while idle");

state.mutateCount = 0;
node = render({ current_user_permission: { can_delete: false } });
node.props.children.props.onSubmit({ preventDefault() {} });
check(state.mutateCount === 0, "blocks deletion without permission");
node = render({ migrated_plugin_id: "plugin-1" });
node.props.children.props.onSubmit({ preventDefault() {} });
check(state.mutateCount === 0, "blocks deletion for migrated plugins");

state.isPending = true;
node = render();
const pendingButtons =
  node.props.children.props.children[2].props.children.props.children;
check(
  pendingButtons[0].props.disabled && pendingButtons[1].props.loading,
  "disables cancellation and shows loading while pending",
);
node.props.onOpenChange(false);
node.props.children.props.onSubmit({ preventDefault() {} });
check(
  state.closed === 2 && state.mutateCount === 0,
  "blocks dismissal and duplicate submission while pending",
);

state.isPending = false;
state.isError = true;
node = render();
const error = node.props.children.props.children[1].props.children[1];
check(
  error.props.role === "alert" &&
    error.props.children.props.defaultMessage.includes("Couldn't delete"),
  "renders a retryable deletion error",
);

console.log(`${assertions} My GPT delete dialog assertions passed`);
