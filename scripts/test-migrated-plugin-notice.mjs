import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
globalThis.__migratedNoticeTest = {
  access: { data: true },
  closed: 0,
  opened: null,
  navigated: null,
  jsx: {
    jsx: (type, props, key) => ({ type, props, key }),
    jsxs: (type, props, key) => ({ type, props, key }),
  },
};
const result = await esbuild.build({
  entryPoints: [
    path.join(ROOT, "src/renderer/migrated-plugin-notice/index.ts"),
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
        build.onResolve({ filter: /^@rchunk\// }, ({ path: importPath }) => ({
          path: importPath.slice("@rchunk/".length),
          namespace: "mock",
        }));
        build.onLoad(
          { filter: /.*/, namespace: "mock" },
          ({ path: importPath }) => ({
            contents:
              {
                "app-shared": `
                  export const I3 = () => globalThis.__migratedNoticeTest.jsx;
                  export const BX = () => globalThis.__migratedNoticeTest.access;
                  export const Yh = "Button"; export const Y2 = "FormattedMessage";
                  export const S_ = "Icon"; export const Is = "OpenAsset";
                  export const $3 = () => {}; export const Ls = () => {}; export const FX = () => {};
                  export const K2 = () => {}; export const Zh = () => {}; export const C_ = () => {};
                `,
                "app-initial": `
                  export const o_n = () => path => { globalThis.__migratedNoticeTest.navigated = path; };
                  export const u1 = pluginId => { globalThis.__migratedNoticeTest.opened = pluginId; };
                  export const Qgn = () => {}; export const l1 = () => {};
                `,
                "chat-choice-view": `export const t = "ChoiceView"; export const n = () => {};`,
                "migrated-plugin-access": `export const n = "access"; export const t = () => {};`,
              }[importPath] ?? "export {};",
            loader: "js",
          }),
        );
      },
    },
  ],
});
const notice = await import(
  `data:text/javascript;base64,${Buffer.from(result.outputFiles[0].text).toString("base64")}`
);
let assertions = 0;
function check(value, message) {
  assert.ok(value, message);
  assertions += 1;
}
const close = () => globalThis.__migratedNoticeTest.closed++;

let node = notice.t({
  pluginId: "plugin-1",
  gptName: "My GPT",
  onClose: close,
});
check(
  typeof node.type === "function",
  "uses the access-checking wrapper for a named GPT",
);
node = node.type(node.props);
check(
  typeof node.type === "function",
  "maps plugin access through the presentation component",
);
let choice = node.type(node.props);
check(
  choice.type === "ChoiceView" && choice.props.accessState === "allowed",
  "shows the allowed plugin choice",
);
choice.props.onUsePlugin();
check(
  globalThis.__migratedNoticeTest.opened === "plugin-1" &&
    globalThis.__migratedNoticeTest.closed === 1,
  "closes and opens an allowed plugin",
);

globalThis.__migratedNoticeTest.access = { data: false };
node = notice.t({ pluginId: "plugin-1", gptName: "My GPT", onClose: close });
choice = node.type(node.props).type(node.type(node.props).props);
check(choice.props.accessState === "denied", "reports denied plugin access");
choice.props.onUsePlugin();
check(
  globalThis.__migratedNoticeTest.navigated === "/plugins",
  "explores plugins when access is denied",
);

globalThis.__migratedNoticeTest.access = {
  isError: true,
  refetch: () => (globalThis.__migratedNoticeTest.retried = true),
};
node = notice.t({ pluginId: "plugin-1", gptName: "My GPT" });
choice = node.type(node.props).type(node.type(node.props).props);
check(choice.props.accessState === "error", "reports plugin access errors");
choice.props.onRetry();
check(globalThis.__migratedNoticeTest.retried, "wires access retry");

node = notice.t({
  pluginId: "plugin-2",
  presentation: "row",
  onClose: close,
});
check(
  typeof node.type === "function",
  "uses the direct open button without a GPT name",
);
const button = node.type(node.props);
check(
  button.type === "Button" &&
    button.props.color === "outlineGhost" &&
    button.props.size === "entityRowAction",
  "uses row button styling",
);
check(
  button.props.children[0].props.defaultMessage === "Open plugin" &&
    button.props.children[1].props.asset === "OpenAsset",
  "preserves the open-plugin label and icon",
);
button.props.onClick();
check(
  globalThis.__migratedNoticeTest.opened === "plugin-2",
  "opens an unnamed migrated plugin directly",
);

assert.equal(assertions, 12);
console.log(`${assertions} migrated plugin notice assertions passed`);
