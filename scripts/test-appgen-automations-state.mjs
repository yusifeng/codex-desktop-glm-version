import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const state = (globalThis.__appgenAutomationsStateTest = {
  initialized: [],
  requests: [],
});
const result = await esbuild.build({
  entryPoints: [
    path.join(ROOT, "src/renderer/appgen-automations-state/index.ts"),
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
                  export const QX = (_scope, factory) => factory; export const ZI = "scope";
                  export const $O = { THIRTY_SECONDS: 30000, ONE_MINUTE: 60000 };
                  export const FX = () => globalThis.__appgenAutomationsStateTest.initialized.push("FX");
                  export const QI = () => globalThis.__appgenAutomationsStateTest.initialized.push("QI");
                  export const ek = () => globalThis.__appgenAutomationsStateTest.initialized.push("ek");
                `,
                "app-initial": `
                  export const I1t = () => ({ default: (items, size) => Array.from({ length: Math.ceil(items.length / size) }, (_, index) => items.slice(index * size, (index + 1) * size)) });
                  export const ett = "account"; export const mfn = "feature";
                  export const rJt = { safeGet: async (url, options) => { globalThis.__appgenAutomationsStateTest.requests.push({ url, options }); return url.includes("attachments") ? options.parameters.query.project_ids.map((id) => ({ id })) : { sites: ["site-1"] }; } };
                  export const stt = () => globalThis.__appgenAutomationsStateTest.initialized.push("stt");
                  export const cJt = () => globalThis.__appgenAutomationsStateTest.initialized.push("cJt");
                  export const pfn = () => globalThis.__appgenAutomationsStateTest.initialized.push("pfn");
                `,
              }[importPath] ?? "export {};",
            loader: "js",
          }),
        );
      },
    },
  ],
});
const module = await import(
  `data:text/javascript;base64,${Buffer.from(result.outputFiles[0].text).toString("base64")}`
);
module.r();

let assertions = 0;
function check(value, message) {
  assert.ok(value, message);
  assertions += 1;
}
check(state.initialized.length === 6, "initializes query dependencies");
const enabledGet = (signal, flag) =>
  signal === "account"
    ? "account-1"
    : signal === "feature" && flag === "282477705";

let options = module.t([], { get: enabledGet });
check(
  options.enabled === false,
  "disables attachment queries without projects",
);
const projectIds = Array.from(
  { length: 205 },
  (_, index) => `project-${index}`,
);
options = module.t(projectIds, { get: enabledGet });
check(
  options.enabled === true,
  "enables attachment queries for an eligible account",
);
check(
  options.queryKey[0] === "site-automation-attachments" &&
    options.queryKey[1] === "account-1" &&
    options.queryKey[2] === projectIds,
  "scopes attachment data by account and project list",
);
check(
  options.staleTime === 30000 &&
    options.refetchInterval === 60000 &&
    options.refetchOnMount === "always" &&
    options.retry === false,
  "uses the release refresh policy",
);
const signal = { aborted: false };
const attachments = await options.queryFn({ signal });
check(
  state.requests.length === 3,
  "chunks attachment requests at 100 projects",
);
check(
  state.requests
    .map((request) => request.options.parameters.query.project_ids.length)
    .join(",") === "100,100,5",
  "preserves all chunk sizes",
);
check(
  state.requests.every((request) => request.options.signal === signal),
  "forwards the abort signal to every chunk",
);
check(attachments.length === 205, "flattens chunked attachment responses");

state.requests.length = 0;
options = module.n("automation-1", { get: enabledGet });
check(
  options.enabled === true,
  "enables backlink queries for an eligible account",
);
check(
  options.queryKey.join(":") ===
    "site-automation-backlinks:account-1:automation-1",
  "scopes backlinks by account and automation",
);
const backlinks = await options.queryFn({ signal });
check(backlinks.sites[0] === "site-1", "returns the backlink response");
check(
  state.requests[0].url === "/websites/automations/{automation_id}/sites" &&
    state.requests[0].options.parameters.path.automation_id === "automation-1",
  "uses the typed backlink endpoint",
);
check(
  module.n("automation-1", { get: () => null }).enabled === false,
  "disables backlinks without an account",
);
check(
  module.t(["project-1"], {
    get: (signal) => (signal === "account" ? "account-1" : false),
  }).enabled === false,
  "respects the feature gate",
);

console.log(`${assertions} Appgen automations state assertions passed`);
