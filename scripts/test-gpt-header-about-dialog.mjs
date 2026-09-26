import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const state = (globalThis.__gptHeaderAboutTest = {
  account: {
    id: "workspace-1",
    structure: "workspace",
    account_user_role: "account-owner",
  },
  activeAccountId: "workspace-1",
  closed: 0,
  navigated: null,
  policy: { allow_third_party_gpts: "allow_specific" },
  scopeWrites: [],
  jsx: { jsx: (type, props) => ({ type, props }) },
});

const result = await esbuild.build({
  entryPoints: [
    path.join(ROOT, "src/renderer/gpt-header-about-dialog/index.ts"),
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
                  export const I3 = () => globalThis.__gptHeaderAboutTest.jsx;
                  export const LX = () => "scope"; export const ZI = "root";
                  export const HX = () => globalThis.__gptHeaderAboutTest.activeAccountId;
                  export const BX = (_signal, accountId, options) => {
                    globalThis.__gptHeaderAboutTest.policyQuery = { accountId, options };
                    return { data: globalThis.__gptHeaderAboutTest.policy };
                  };
                  export const $3 = () => {}; export const FX = () => {}; export const QI = () => {};
                `,
                "app-initial": `
                  export const mun = "active-account"; export const Dln = "workspace-policy";
                  export const uht = () => ({ data: globalThis.__gptHeaderAboutTest.account });
                  export const o_n = () => path => { globalThis.__gptHeaderAboutTest.navigated = path; };
                  export const F7 = (...args) => globalThis.__gptHeaderAboutTest.scopeWrites.push(["resource", ...args]);
                  export const Jet = (...args) => globalThis.__gptHeaderAboutTest.scopeWrites.push(["mode", ...args]);
                  export const ytn = value => "/gpts/" + value;
                  ${["Qgn", "Sun", "Oln", "rht", "Het", "P7", "xtn"].map((name) => `export const ${name} = () => {};`).join("\n")}
                `,
                "gpt-about-dialog-core": `export const n = () => {}; export const t = "GptAboutDialog";`,
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
const resource = { id: "gizmo-1" };
let node = dialog.GptHeaderAboutDialog({
  accountId: "workspace-1",
  resource,
  onClose: () => state.closed++,
});
check(
  node.type === "GptAboutDialog",
  "renders the GPT about dialog for the active account",
);
check(
  node.props.accountId === "workspace-1" && node.props.gizmo === resource,
  "forwards account and GPT",
);
check(
  node.props.isOwnerAndWorkspaceAllowsSpecific,
  "enables owner-specific workspace controls",
);
check(
  state.policyQuery.accountId === "workspace-1" &&
    state.policyQuery.options.enabled,
  "loads policy only for the active workspace owner",
);

node.props.onStartChat({ gizmo: { id: "gizmo-1", short_url: "  research  " } });
check(state.closed === 1, "closes before starting a GPT chat");
check(
  state.scopeWrites[0][0] === "resource" && state.scopeWrites[0][2] === null,
  "clears the prior resource selection",
);
check(
  state.scopeWrites[1][0] === "mode" && state.scopeWrites[1][2] === "chat",
  "switches to chat mode",
);
check(
  state.navigated === "/gpts/research",
  "navigates using the trimmed GPT short URL",
);

state.activeAccountId = "workspace-2";
node = dialog.GptHeaderAboutDialog({
  accountId: "workspace-1",
  resource,
  onClose: () => state.closed++,
});
check(node === null, "hides resources from a non-active account");
check(
  !state.policyQuery.options.enabled,
  "disables policy loading across accounts",
);

state.activeAccountId = "workspace-1";
state.account.account_user_role = "member";
node = dialog.GptHeaderAboutDialog({
  accountId: "workspace-1",
  resource,
  onClose() {},
});
check(
  !node.props.isOwnerAndWorkspaceAllowsSpecific,
  "withholds owner controls from members",
);

console.log(`${assertions} GPT header about dialog assertions passed`);
