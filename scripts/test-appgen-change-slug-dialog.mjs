import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const state = (globalThis.__appgenChangeSlugDialogTest = {
  initialized: [],
  inputValue: undefined,
  debouncedSlug: undefined,
  mutation: {},
  query: {},
  queryConfig: null,
  changedTo: null,
  refetched: 0,
  toast: null,
  jsx: {
    jsx: (type, props, key) => ({ type, props, key }),
    jsxs: (type, props, key) => ({ type, props, key }),
  },
});
const result = await esbuild.build({
  entryPoints: [
    path.join(ROOT, "src/renderer/appgen-change-slug-dialog/index.ts"),
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
                  const state = globalThis.__appgenChangeSlugDialogTest; const init = (name) => state.initialized.push(name);
                  export const e6 = () => { init("e6"); return { useState: (initial) => [state.inputValue === undefined ? initial : state.inputValue, (value) => state.changedTo = value] }; };
                  export const I3 = () => { init("I3"); return state.jsx; }; export const LX = () => ({ get: () => ({ danger: (message, options) => state.toast = { message, options } }) }); export const ZI = "scope";
                  export const n4 = () => ({ formatMessage: (descriptor) => descriptor.defaultMessage }); export const BX = () => state.mutation;
                  export const _L = (config) => { state.queryConfig = config; return { ...state.query, refetch: () => state.refetched++ }; };
                  export const G2 = (messages) => messages; export const m4 = (...values) => values.filter(Boolean).join(" "); export const pk = "toast";
                  export const Rh = "DialogTitle"; export const Y2 = "FormattedMessage"; export const Ah = "DialogHeader"; export const Lh = "DialogSubtitle";
                  export const jh = "DialogContent"; export const Yh = "Button"; export const kh = "DialogFooter"; export const Oh = "DialogBody"; export const Ih = "Dialog";
                  export const $3 = () => init("$3"); export const gL = () => init("gL"); export const h4 = () => init("h4"); export const FX = () => init("FX");
                  export const K2 = () => init("K2"); export const Zh = () => init("Zh"); export const zh = () => init("zh"); export const Ph = () => init("Ph");
                  export const lk = () => init("lk"); export const QI = () => init("QI");
                `,
                "app-initial": `
                  const state = globalThis.__appgenChangeSlugDialogTest;
                  export const ean = "mutation"; export const Xin = ["slug-availability"]; export const Cht = (value) => state.debouncedSlug ?? value;
                  export const pan = async (projectId, slug) => ({ projectId, slug });
                  export const Sht = () => state.initialized.push("Sht"); export const _an = () => state.initialized.push("_an");
                `,
              }[importPath] ?? "export {};",
            loader: "js",
          }),
        );
      },
    },
  ],
});
const slugDialog = await import(
  `data:text/javascript;base64,${Buffer.from(result.outputFiles[0].text).toString("base64")}`
);

let assertions = 0;
function check(value, message) {
  assert.ok(value, message);
  assertions += 1;
}
function render(overrides = {}) {
  let closed = 0;
  const node = slugDialog.AppgenChangeSlugDialog({
    currentSlug: "old-site",
    hostedDomainSuffix: ".example.com",
    projectId: "site-1",
    onClose: () => closed++,
    ...overrides,
  });
  return {
    node,
    get closed() {
      return closed;
    },
  };
}
function parts(node) {
  const form = node.props.children;
  const [, content, footer] = form.props.children;
  return {
    form,
    fieldNode: content.props.children[0],
    statusNode: content.props.children[1],
    cancel: footer.props.children[0],
    submit: footer.props.children[1],
  };
}

check(
  state.initialized.length === 14,
  "initializes all slug dialog dependencies",
);
state.mutation = { isPending: false, mutateAsync: async () => {} };
state.query = {};
let rendered = render();
let view = parts(rendered.node);
check(
  rendered.node.type === "Dialog" && rendered.node.props.open === true,
  "opens a compact modal dialog",
);
check(state.queryConfig.enabled === false, "does not query an unchanged slug");
check(
  view.statusNode.type(view.statusNode.props) === null,
  "hides status for an unchanged slug",
);
check(
  view.submit.props.disabled === true,
  "disables submission until availability is confirmed",
);
rendered.node.props.onOpenChange(false);
check(rendered.closed === 1, "closes from the dialog open-state callback");

state.inputValue = " Bad--Slug ";
rendered = render();
view = parts(rendered.node);
let status = view.statusNode.type(view.statusNode.props);
check(
  status.props.role === "alert" &&
    status.props.children[0].props.defaultMessage.startsWith(
      "Start with a letter",
    ),
  "shows invalid-format validation",
);
const field = view.fieldNode.type(view.fieldNode.props);
check(
  field.props.children[0].props["aria-invalid"] === true,
  "marks an invalid slug input",
);
check(
  field.props.children[0].props["aria-describedby"].includes(
    "appgen-site-slug-domain",
  ) &&
    field.props.children[0].props["aria-describedby"].includes(
      "appgen-site-slug-status",
    ),
  "describes the input with domain and status",
);
field.props.children[0].props.onChange({ target: { value: "next-site" } });
check(state.changedTo === "next-site", "forwards input changes to state");

state.inputValue = " Next-Site ";
state.query = {
  data: { slug: "next-site", available: true },
  isFetching: false,
  isError: false,
};
let mutatedSlug = null;
state.mutation = {
  isPending: false,
  mutateAsync: async (slug) => {
    mutatedSlug = slug;
  },
};
rendered = render();
view = parts(rendered.node);
status = view.statusNode.type(view.statusNode.props);
check(
  state.queryConfig.enabled === true &&
    state.queryConfig.retry === false &&
    state.queryConfig.staleTime === 0,
  "queries stable valid slugs without retries",
);
check(
  status.props.role === "status" &&
    status.props.className.includes("text-chart-green"),
  "shows an available status",
);
check(
  view.submit.props.disabled === false,
  "enables submission for an available slug",
);
view.form.props.onSubmit({ preventDefault() {} });
await new Promise((resolve) => setTimeout(resolve, 0));
check(
  mutatedSlug === "next-site" && rendered.closed === 1,
  "normalizes, saves, and closes after success",
);

state.query = {
  data: { slug: "next-site", available: false },
  isFetching: false,
  isError: false,
};
rendered = render();
view = parts(rendered.node);
status = view.statusNode.type(view.statusNode.props);
check(
  status.props.role === "alert" &&
    status.props.children[0].props.defaultMessage ===
      "This URL is not available",
  "shows unavailable validation",
);

state.query = { isError: true, isFetching: false };
rendered = render();
view = parts(rendered.node);
status = view.statusNode.type(view.statusNode.props);
check(
  status.props.children[1].type === "Button",
  "offers retry after availability errors",
);
status.props.children[1].props.onClick();
check(state.refetched === 1, "retries the availability query");

state.query = {
  data: { slug: "next-site", available: true },
  isFetching: false,
  isError: false,
};
state.mutation = { isPending: true, mutateAsync: async () => {} };
rendered = render();
check(
  rendered.node.props.shouldIgnoreClickOutside === true &&
    rendered.node.props.showDialogClose === false,
  "locks the dialog while saving",
);
rendered.node.props.onOpenChange(false);
check(rendered.closed === 0, "does not close while a mutation is pending");

state.mutation = {
  isPending: false,
  mutateAsync: async () => {
    throw new Error("save failed");
  },
};
state.toast = null;
rendered = render();
view = parts(rendered.node);
view.form.props.onSubmit({ preventDefault() {} });
await new Promise((resolve) => setTimeout(resolve, 0));
check(
  state.toast.message === "Unable to change site URL",
  "shows a save failure toast",
);
check(
  state.toast.options.errorAnalytics.toastId ===
    "sites_settings_slug_save_error",
  "attaches stable error analytics",
);

console.log(`${assertions} Appgen change-slug dialog assertions passed`);
