import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

async function loadModule(name, mocks) {
  const result = await esbuild.build({
    entryPoints: [path.join(ROOT, "src/renderer", name, "index.ts")],
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
              contents: mocks[importPath] ?? "export {};",
              loader: "js",
            }),
          );
        },
      },
    ],
  });
  return import(
    `data:text/javascript;base64,${Buffer.from(result.outputFiles[0].text).toString("base64")}`
  );
}

let assertions = 0;
function check(value, message) {
  assert.ok(value, message);
  assertions += 1;
}

const state = (globalThis.__browserProfileImportTest = {
  auth: { authLoading: true, authMethod: "oauth" },
  config: { data: null, isError: false },
  events: [],
  initializers: [],
  errors: [],
  warnings: [],
});

const availability = await loadModule("browser-profile-import-availability", {
  "app-shared": `
    export const FX = () => globalThis.__browserProfileImportTest.initializers.push("FX");
    export const QI = () => globalThis.__browserProfileImportTest.initializers.push("QI");
    export const ZI = "scope";
    export const sZ = (_scope, read) => read;
  `,
  "app-initial": `
    export const $sn = () => globalThis.__browserProfileImportTest.initializers.push("$sn");
    export const Oln = () => globalThis.__browserProfileImportTest.initializers.push("Oln");
    export const fgn = () => globalThis.__browserProfileImportTest.initializers.push("fgn");
    export const Sln = "auth";
    export const Ysn = "config";
    export const dgn = "desktop-host";
  `,
});
availability.t();
availability.t();
check(
  typeof availability.n === "function",
  "creates the derived availability signal",
);
check(
  state.initializers.length === 5,
  "initializes availability dependencies once",
);

function readAvailability() {
  return availability.n({
    get(signal, options) {
      if (signal === "auth") return state.auth;
      state.lastConfigOptions = options;
      return state.config;
    },
  });
}

check(
  readAvailability() === false,
  "disables import while authentication is loading",
);
state.auth.authLoading = false;
check(readAvailability() === false, "requires a resolved host configuration");
state.config = { data: {}, isError: true };
check(
  readAvailability() === false,
  "disables import after a host configuration error",
);
state.config = {
  data: {
    requirements: {
      inAppBrowser: { allowExternalBrowserSettingsImport: false },
    },
  },
  isError: false,
};
check(
  readAvailability() === false,
  "honors an explicit server-side disable flag",
);
state.config.data.requirements.inAppBrowser.allowExternalBrowserSettingsImport = true;
check(
  readAvailability() === true,
  "honors an explicit server-side enable flag",
);
state.config = { data: { requirements: {} }, isError: false };
check(
  readAvailability() === true,
  "defaults to available when the flag is omitted",
);
check(
  state.lastConfigOptions.authMethod === "oauth" &&
    state.lastConfigOptions.hostId === "desktop-host",
  "queries the active authentication method and desktop host",
);

const analytics = await loadModule("browser-profile-import-analytics", {
  "app-shared": `
    export const Q3 = {
      error: (message, details) => globalThis.__browserProfileImportTest.errors.push({ message, details }),
      warning: (message, details) => globalThis.__browserProfileImportTest.warnings.push({ message, details }),
    };
    export const Z3 = () => globalThis.__browserProfileImportTest.initializers.push("Z3");
  `,
  "app-initial": `
    const values = new Proxy({}, { get: (_target, property) => String(property) });
    export const Bs = values;
    export const Fs = values;
    export const Gs = values;
    export const Hs = values;
    export const Is = values;
    export const Ls = values;
    export const Rs = values;
    export const Us = values;
    export const Ws = values;
    export const zs = values;
    export const Vs = "browser-profile-import-event";
    export const Ux = value => String(value?.status ?? "").startsWith("failed") || (value?.failed ?? 0) > 0;
    export const xpn = (scope, descriptor, fields) => globalThis.__browserProfileImportTest.events.push({ scope, descriptor, fields });
    export const Ks = () => globalThis.__browserProfileImportTest.initializers.push("Ks");
    export const ypn = () => globalThis.__browserProfileImportTest.initializers.push("ypn");
    export const qx = () => globalThis.__browserProfileImportTest.initializers.push("qx");
  `,
});
analytics.t();
analytics.t();
check(
  state.initializers.slice(-4).join(",") === "Ks,ypn,Z3,qx",
  "initializes analytics dependencies once and in order",
);

analytics.o("scope", "browser-settings-page", "flow-1", "shown");
let event = state.events.at(-1);
check(
  event.fields.stepType ===
    "CODEX_BROWSER_PROFILE_IMPORT_LIFECYCLE_STEP_TYPE_NUX_SHOWN",
  "maps the NUX shown lifecycle step",
);
check(
  event.fields.entryPoint ===
    "CODEX_BROWSER_PROFILE_IMPORT_ENTRY_POINT_BROWSER_SETTINGS_PAGE",
  "maps browser settings as an entry point",
);

analytics.a("scope", "in-app-browser-import-banner", "flow-2");
event = state.events.at(-1);
check(
  event.fields.stepType ===
    "CODEX_BROWSER_PROFILE_IMPORT_LIFECYCLE_STEP_TYPE_DIALOG_OPENED",
  "records dialog opening",
);
check(
  event.descriptor === "browser-profile-import-event",
  "uses the analytics descriptor",
);

analytics.c("scope", "in-app-browser-import-modal", "flow-3");
event = state.events.at(-1);
check(
  event.fields.windowsChromeAdminApprovalNoticeRequired === true &&
    event.fields.windowsChromeAdminApprovalNoticeAcknowledged === false,
  "records the unacknowledged Chrome admin notice",
);
analytics.s("scope", "in-app-browser-import-modal", "flow-3");
check(
  state.events.at(-1).fields.windowsChromeAdminApprovalNoticeAcknowledged ===
    true,
  "records Chrome admin notice acknowledgement",
);

const request = {
  source: "chrome",
  importCookies: true,
  importPasswords: true,
  importExtensions: true,
};
const attempt = {
  flowId: "flow-4",
  attemptIndex: 2,
  windowsChromeAdminApprovalNoticeRequired: true,
  windowsChromeAdminApprovalNoticeAcknowledged: true,
};
analytics.r("scope", "in-app-browser-overflow-menu", request, attempt);
event = state.events.at(-1);
check(
  event.fields.source === "CODEX_BROWSER_PROFILE_IMPORT_SOURCE_CHROME" &&
    event.fields.cookiesRequested &&
    event.fields.passwordsRequested &&
    event.fields.extensionsRequested,
  "records the complete import request shape",
);
check(event.fields.attemptIndex === 2, "records the import attempt index");

analytics.n("scope", "in-app-browser-import-modal", request, attempt, {
  cookies: { status: "success", imported: 3, failed: 0 },
  passwords: {
    status: "partial-success",
    profile: { status: "success", imported: 2 },
    account: { status: "failed_to_read", failed: 1 },
  },
  extensions: { status: "missing", imported: 0 },
});
event = state.events.at(-1);
check(
  event.fields.requestOutcome ===
    "CODEX_BROWSER_PROFILE_IMPORT_REQUEST_OUTCOME_RETURNED_RESULT",
  "distinguishes a returned result from a transport failure",
);
check(
  event.fields.cookieOutcome ===
    "CODEX_BROWSER_PROFILE_IMPORT_DATA_OUTCOME_SUCCESS" &&
    event.fields.cookieItemResult ===
      "CODEX_BROWSER_PROFILE_IMPORT_COOKIE_ITEM_RESULT_IMPORTED_ONLY",
  "maps a successful cookie import",
);
check(
  event.fields.passwordOutcome ===
    "CODEX_BROWSER_PROFILE_IMPORT_DATA_OUTCOME_PARTIAL_SUCCESS",
  "maps mixed password results to partial success",
);
check(
  event.fields.passwordAccountStatus ===
    "CODEX_BROWSER_PROFILE_IMPORT_PASSWORD_STATUS_FAILED_TO_READ",
  "maps detailed password store failures",
);
check(
  event.fields.extensionOutcome ===
    "CODEX_BROWSER_PROFILE_IMPORT_DATA_OUTCOME_NO_NEW_DATA",
  "maps an empty extension result to no new data",
);
check(
  state.warnings.length === 1,
  "warns when a returned result contains failures",
);

analytics.n("scope", "in-app-browser-import-modal", request, attempt);
event = state.events.at(-1);
check(
  event.fields.requestOutcome ===
    "CODEX_BROWSER_PROFILE_IMPORT_REQUEST_OUTCOME_FAILED_WITHOUT_RESULT",
  "maps a request without a result to transport failure",
);
check(
  event.fields.cookieOutcome ===
    "CODEX_BROWSER_PROFILE_IMPORT_DATA_OUTCOME_FAILED" &&
    event.fields.passwordOutcome ===
      "CODEX_BROWSER_PROFILE_IMPORT_DATA_OUTCOME_FAILED",
  "marks requested data types failed when no result is returned",
);
check(state.errors.length === 1, "logs a request failure without a result");

analytics.i("scope", "browser-settings-page", {
  ...attempt,
  source: "atlas",
  exitState: "after-result",
  dismissalReason: "done-button",
});
event = state.events.at(-1);
check(
  event.fields.dialogExitState ===
    "CODEX_BROWSER_PROFILE_IMPORT_DIALOG_EXIT_STATE_AFTER_RESULT" &&
    event.fields.dismissalReason ===
      "CODEX_BROWSER_PROFILE_IMPORT_DISMISSAL_REASON_DONE_BUTTON",
  "maps dialog completion and dismissal state",
);
check(
  event.fields.source === "CODEX_BROWSER_PROFILE_IMPORT_SOURCE_ATLAS",
  "maps the Atlas import source",
);

console.log(
  `${assertions} browser profile import foundation assertions passed`,
);
