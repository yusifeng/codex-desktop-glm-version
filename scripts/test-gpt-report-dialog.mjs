import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const state = (globalThis.__gptReportDialogTest = {
  activeAccountId: "account-1",
  closed: 0,
  requests: [],
  jsx: { jsx: (type, props, key) => ({ type, props, key }) },
});

const result = await esbuild.build({
  entryPoints: [path.join(ROOT, "src/renderer/gpt-report-dialog/index.ts")],
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
                  export const I3 = () => globalThis.__gptReportDialogTest.jsx;
                  export const LX = () => ({ get: () => globalThis.__gptReportDialogTest.activeAccountId });
                  export const ZI = "scope"; export const HX = () => globalThis.__gptReportDialogTest.activeAccountId;
                  export const Y2 = "FormattedMessage";
                  export const $3 = () => {}; export const FX = () => {}; export const K2 = () => {}; export const QI = () => {};
                `,
                "app-initial": `
                  export const mun = "active-account";
                  export const rJt = {
                    safeGet: async (url, options) => { globalThis.__gptReportDialogTest.requests.push({ method: "GET", url, options }); return ["spam"]; },
                    safePost: async (url, options) => { globalThis.__gptReportDialogTest.requests.push({ method: "POST", url, options }); },
                  };
                  export const Sun = () => {}; export const cJt = () => {};
                `,
                "report-dialog-core": `export const n = () => {}; export const t = "ReportDialog";`,
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
const resource = {
  gizmo: { id: "gizmo-1", display: { name: "Research GPT" } },
};
let node = dialog.GptReportDialog({
  accountId: "account-1",
  resource,
  onClose: () => state.closed++,
});
check(
  node.type === "ReportDialog" && node.key === "gizmo-1",
  "keys the report dialog by GPT",
);
check(
  node.props.queryKey.join(":") === "gpt-report-reasons:account-1",
  "scopes reasons by account",
);
check(
  node.props.title.props.values.gptName === "Research GPT",
  "includes the GPT display name",
);

const reasons = await node.props.loadReasons();
check(reasons[0] === "spam", "loads report reasons");
let request = state.requests.at(-1);
check(
  request.url === "/report_flow/reasons/{entity_type}" &&
    request.options.parameters.path.entity_type === "gizmo",
  "loads gizmo-specific reasons",
);

await node.props.submitReport({
  reason: { id: "spam" },
  details: "Misleading",
});
request = state.requests.at(-1);
check(
  request.method === "POST" && request.url === "/report_flow/report",
  "submits the report",
);
check(
  request.options.requestBody.entity_id === "gizmo-1",
  "reports the selected GPT",
);
check(
  request.options.requestBody.entity_type === "gizmo" &&
    request.options.requestBody.product_area === "gpts",
  "uses GPT reporting classification",
);
check(
  request.options.requestBody.reason.id === "spam" &&
    request.options.requestBody.reason.details === "Misleading",
  "forwards reason and details",
);
check(
  Object.keys(request.options.requestBody.additional_fields_values).length ===
    0,
  "sends an explicit empty additional-fields map",
);

state.activeAccountId = "account-2";
await node.props.submitReport({ reason: { id: "spam" }, details: "stale" });
check(
  state.closed === 1,
  "closes instead of reporting after an account switch",
);
check(
  state.requests.filter((item) => item.method === "POST").length === 1,
  "does not submit across accounts",
);
node = dialog.GptReportDialog({
  accountId: "account-1",
  resource,
  onClose() {},
});
check(node === null, "hides a report dialog from a non-active account");

console.log(`${assertions} GPT report dialog assertions passed`);
