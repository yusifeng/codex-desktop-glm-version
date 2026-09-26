import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const state = (globalThis.__browserProfileImportDialogTest = {
  analytics: [],
  hookIndex: 0,
  hookValues: [],
  mutations: [],
  refs: [],
  setCalls: [],
  setters: [],
  profilesQuery: {
    data: [
      {
        source: "chrome",
        profilePath: "/profiles/default",
        appName: "Chrome",
        profileName: "Default",
        hasExtensions: true,
      },
    ],
    isError: false,
    isLoading: false,
  },
  mutation: {
    data: null,
    isError: false,
    isPending: false,
    variables: null,
    mutate(value) {
      state.mutations.push(value);
      this.variables = value;
    },
    reset() {
      state.reset = (state.reset ?? 0) + 1;
    },
  },
  jsx: {
    Fragment: "Fragment",
    jsx: (type, props, key) => ({ type, props, key }),
    jsxs: (type, props, key) => ({ type, props, key }),
  },
  react: {
    useState(initial) {
      const index = state.hookIndex++;
      const value =
        index in state.hookValues ? state.hookValues[index] : initial;
      const setter = (next) => {
        state.setCalls.push({ index, next });
        state.hookValues[index] = next;
      };
      state.setters[index] = setter;
      return [value, setter];
    },
    useRef(initial) {
      const index = state.hookIndex++;
      return (state.refs[index] ??= { current: initial });
    },
    useEffect(effect) {
      effect();
    },
  },
});
globalThis.document = { documentElement: { dataset: { codexOs: "darwin" } } };

const appSharedMock = `
  const component = name => name;
  export const I3 = () => globalThis.__browserProfileImportDialogTest.jsx;
  export const e6 = () => globalThis.__browserProfileImportDialogTest.react;
  export const G2 = value => value;
  export const LX = () => ({
    get: () => true,
    set: (signal, value) => globalThis.__browserProfileImportDialogTest.setCalls.push({ signal, value }),
  });
  export const BX = () => true;
  export const _L = () => globalThis.__browserProfileImportDialogTest.profilesQuery;
  export const iL = config => { globalThis.__browserProfileImportDialogTest.mutationConfig = config; return globalThis.__browserProfileImportDialogTest.mutation; };
  export const m4 = (...values) => values.filter(Boolean).join(" ");
  export const Y2 = component("FormattedMessage"); export const Yh = component("Button");
  export const Ih = component("Dialog"); export const Oh = component("DialogContent");
  export const Rh = component("DialogTitle"); export const Lh = component("DialogDescription");
  export const Ah = component("DialogHeader"); export const jh = component("DialogSection");
  export const kh = component("DialogActions"); export const Zc = component("SettingsList");
  export const Lf = component("Checkbox"); export const Ad = component("CheckControl");
  export const rl = component("SettingsRow"); export const Qh = component("Spinner");
  export const wc = component("SuccessIcon"); export const Ud = component("MinusIcon");
  export const Lo = component("ErrorIcon"); export const kf = component("MenuTrigger");
  export const jf = { Section: component("MenuSection"), Item: component("MenuItem") };
  export const o$ = component("MotionSpan"); export const Dh = "footer"; export const bD = "check";
  export const ZI = "scope";
  ${["$3", "rL", "gL", "FX", "zh", "QI", "xD", "h4", "a$", "K2", "Zh", "jd", "Ph", "If", "$h", "Rf", "Tc", "Wd", "Ro", "al", "Qc"].map((name) => `export const ${name} = () => {};`).join("\n")}
`;

const result = await esbuild.build({
  entryPoints: [
    path.join(ROOT, "src/renderer/browser-profile-import-dialog/index.ts"),
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
                "app-shared": appSharedMock,
                "app-initial": `
                  export const Gx = "import-success"; export const Jx = "import-time";
                  export const Kx = result => result?.success === true;
                  export const Ux = result => result?.status === "failed" || result?.status === "failed_to_copy";
                  export const Wx = result => result?.status === "success" || (result?.imported ?? 0) > 0;
                  export const Slt = () => false; export const mfn = "extension-flag";
                  export const ql = "SelectTrigger";
                  export const pfn = () => {}; export const xlt = () => {}; export const Xl = () => {}; export const qx = () => {};
                `,
                "app-primary": `export const Jp = "WarningIcon"; export const Yp = () => {};`,
                "browser-profile-import-analytics": `
                  const record = (name, args) => globalThis.__browserProfileImportDialogTest.analytics.push({ name, args });
                  export const a = (...args) => record("opened", args);
                  export const c = (...args) => record("admin-shown", args);
                  export const i = (...args) => record("closed", args);
                  export const n = (...args) => record("finished", args);
                  export const r = (...args) => record("started", args);
                  export const s = (...args) => record("admin-acknowledged", args);
                  export const t = () => {};
                `,
                "browser-profile-import-query": `
                  export const c = {
                    title: { defaultMessage: "Import from your browser" }, cookies: { defaultMessage: "Cookies" },
                    passwords: { defaultMessage: "Saved passwords" }, history: { defaultMessage: "Browsing history" },
                    extensions: { defaultMessage: "Extensions" },
                  };
                  export const a = "SourceIcon"; export const u = "DataIcon";
                  export const t = (service, enabled) => ({ service, enabled });
                  export const d = () => {}; export const l = () => {}; export const s = () => {}; export const i = () => {};
                `,
              }[importPath] ?? "export {};",
            loader: "js",
          }),
        );
      },
    },
  ],
});
const dialogModule = await import(
  `data:text/javascript;base64,${Buffer.from(result.outputFiles[0].text).toString("base64")}`
);

let assertions = 0;
function check(value, message) {
  assert.ok(value, message);
  assertions += 1;
}

function render(hookValues = []) {
  state.hookIndex = 0;
  state.hookValues = hookValues;
  state.refs = [];
  state.setCalls = [];
  state.mutations = [];
  state.mutation.variables = null;
  state.mutation.isError = false;
  state.mutation.isPending = false;
  return dialogModule.BrowserProfileImportDialogModal({
    entryPoint: "browser-settings-page",
    flowId: "flow-1",
    onClose: () => (state.closed = (state.closed ?? 0) + 1),
    service: {
      importBrowserProfile: async () => ({ success: true }),
      listImportableBrowserProfiles: async () => state.profilesQuery.data,
    },
  });
}

let modal = render();
check(modal.type === "Dialog" && modal.props.open, "renders an open modal");
check(
  modal.props.showDialogClose === true,
  "shows close affordance before import",
);
check(
  state.analytics.length === 0,
  "does not emit Windows admin events on macOS",
);

let selection = modal.props.children.type(modal.props.children.props);
check(
  selection.type === "DialogContent" && selection.props.as === "form",
  "renders the selection form",
);
const selectionBody = selection.props.children[1];
check(
  selectionBody.type === "DialogSection",
  "renders the profile and data choices",
);
selection.props.onSubmit({ preventDefault() {} });
check(state.mutations.length === 1, "starts import from the form submission");
let request = state.mutations[0].request;
check(
  request.source === "chrome" && request.profilePath === "/profiles/default",
  "targets the selected browser profile",
);
check(
  request.importCookies && request.importPasswords && request.importHistory,
  "requests the default browser data categories",
);
check(!request.importExtensions, "leaves extension import opt-in");
check(
  state.analytics.some((event) => event.name === "started"),
  "records the import attempt",
);

state.mutationConfig.onError(new Error("failed"), state.mutations[0]);
check(
  state.analytics.some((event) => event.name === "finished"),
  "records a transport failure without a result",
);
await state.mutationConfig.onSuccess(
  { source: "chrome", cookies: { status: "failed" } },
  state.mutations[0],
);
check(
  state.setCalls.some(
    (call) => call.index === 6 && call.next?.revealedRowCount === 3,
  ),
  "stores a failed result with all requested rows revealed",
);
check(
  state.analytics.filter((event) => event.name === "finished").length === 2,
  "records a returned import result",
);
modal.props.onOpenChange(false);
check(
  state.analytics.some(
    (event) =>
      event.name === "closed" &&
      event.args[2].dismissalReason === "close-button",
  ),
  "records the modal close reason",
);

const extensionState = [];
extensionState[4] = true;
modal = render(extensionState);
selection = modal.props.children.type(modal.props.children.props);
selection.props.onSubmit({ preventDefault() {} });
check(
  state.mutations.length === 0,
  "pauses before importing unverified extensions",
);
const confirmationUpdate = state.setCalls.find(
  (call) => call.index === 5,
)?.next;
check(
  confirmationUpdate?.request.importExtensions,
  "stores the extension confirmation request",
);

const confirmationState = [];
confirmationState[4] = true;
confirmationState[5] = confirmationUpdate;
modal = render(confirmationState);
selection = modal.props.children.type(modal.props.children.props);
selection = selection.type(selection.props);
check(selection.props.as === "form", "renders the extension confirmation form");
selection.props.onSubmit({ preventDefault() {} });
check(
  state.mutations.length === 1,
  "continues after explicit extension consent",
);
request = state.mutations[0].request;
check(
  request.importExtensions && request.allowUnverifiedExtensions,
  "marks the confirmed extension request explicitly",
);

globalThis.document.documentElement.dataset.codexOs = "win32";
modal = render();
check(
  state.analytics.some((event) => event.name === "admin-shown"),
  "records the Windows Chrome administrator notice",
);
selection = modal.props.children.type(modal.props.children.props);
const windowsBodyChildren = selection.props.children[1].props.children;
check(
  windowsBodyChildren.some(
    (child) => child?.type?.name === "ElevatedChromeConsent",
  ),
  "shows elevated Chrome consent on Windows",
);
const adminConsent = windowsBodyChildren.find(
  (child) => child?.type?.name === "ElevatedChromeConsent",
);
adminConsent.props.onChange(true);
check(
  state.analytics.some((event) => event.name === "admin-acknowledged"),
  "records administrator consent acknowledgement",
);

console.log(`${assertions} browser profile import dialog assertions passed`);
