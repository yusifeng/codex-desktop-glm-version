import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const state = (globalThis.__projectReportDialogTest = {
  activeAccountId: "account-1",
  jsx: { jsx: (type, props, key) => ({ type, props, key }) },
});

const result = await esbuild.build({
  entryPoints: [
    path.join(ROOT, "src/renderer/chatgpt-project-report-dialog/index.ts"),
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
                  export const I3 = () => globalThis.__projectReportDialogTest.jsx;
                  export const HX = () => globalThis.__projectReportDialogTest.activeAccountId;
                  export const Y2 = "FormattedMessage";
                  export const $3 = () => {}; export const FX = () => {}; export const K2 = () => {};
                `,
                "app-initial": `
                  export const mun = "active-account"; export const Jot = "ExternalLink";
                  export const Sun = () => {}; export const Xot = () => {};
                `,
                "codex-thread-report-dialog": `export const n = () => {}; export const t = "CodexThreadReportDialog";`,
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

const namedProject = {
  gizmo: { id: "project-1", display: { name: "Launch Plan" } },
};
let node = dialog.ChatGptProjectReportDialog({
  accountId: "account-1",
  onClose() {},
  project: namedProject,
});
check(
  node.type === "CodexThreadReportDialog" && node.key === "project-1",
  "keys the report dialog by project",
);
check(node.props.reportEntityType === "project", "reports a project entity");
check(node.props.threadId === "project-1", "forwards the project id");
check(
  node.props.title.props.values.projectName === "Launch Plan",
  "includes a non-empty project name",
);
check(
  node.props.successBody.props.values.learnMore instanceof Function,
  "provides the learn-more rich-text renderer",
);

const link = node.props.successBody.props.values.learnMore("Learn more");
check(link.type === "ExternalLink", "renders the policy link externally");
check(
  link.props.href === "https://openai.com/transparency-and-content-moderation/",
  "uses the content moderation policy URL",
);
check(
  link.props.initiator === "open_in_browser_bridge" &&
    link.props.openTarget === "external-browser",
  "uses the external browser bridge",
);

node = dialog.ChatGptProjectReportDialog({
  accountId: "account-1",
  onClose() {},
  project: { gizmo: { id: "project-2", display: { name: "" } } },
});
check(
  node.props.title.props.id === "chatgptProjectHome.report.fallbackTitle",
  "uses the fallback title for unnamed projects",
);

state.activeAccountId = "account-2";
node = dialog.ChatGptProjectReportDialog({
  accountId: "account-1",
  onClose() {},
  project: namedProject,
});
check(node === null, "hides a report dialog from a non-active account");

console.log(`${assertions} ChatGPT project report dialog assertions passed`);
