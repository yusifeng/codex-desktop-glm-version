import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const state = (globalThis.__appgenDisabledTooltipTest = {
  initialized: [],
  jsx: { jsx: (type, props, key) => ({ type, props, key }) },
});
const result = await esbuild.build({
  entryPoints: [
    path.join(ROOT, "src/renderer/appgen-disabled-tooltip/index.ts"),
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
                  export const I3 = () => globalThis.__appgenDisabledTooltipTest.jsx;
                  export const e6 = () => ({ Children: { toArray: (value) => Array.isArray(value) ? value : [value] } });
                  export const Y2 = "FormattedMessage";
                  export const $3 = () => globalThis.__appgenDisabledTooltipTest.initialized.push("$3");
                  export const K2 = () => globalThis.__appgenDisabledTooltipTest.initialized.push("K2");
                `,
                "app-initial": `export const Jot = "ExternalLink"; export const Xot = () => globalThis.__appgenDisabledTooltipTest.initialized.push("Xot");`,
              }[importPath] ?? "export {};",
            loader: "js",
          }),
        );
      },
    },
  ],
});
const tooltip = await import(
  `data:text/javascript;base64,${Buffer.from(result.outputFiles[0].text).toString("base64")}`
);

let assertions = 0;
function check(value, message) {
  assert.ok(value, message);
  assertions += 1;
}
tooltip.n();
check(
  state.initialized.join(",") === "$3,K2,Xot",
  "initializes tooltip dependencies",
);
let node = tooltip.t({ disabledBy: "openai" });
check(
  node.props.id === "appgenPage.disabledByOpenAI.tooltip",
  "uses the policy warning for OpenAI-disabled Sites",
);
check(
  typeof node.props.values.learnMore === "function",
  "provides a rich-text learn-more renderer",
);
const link = node.props.values.learnMore(["Learn", " more"]);
check(
  link.type === "ExternalLink" && link.key === "sites-terms-link",
  "renders a keyed external link",
);
check(
  link.props.href === "https://openai.com/policies/chatgpt-sites-terms/" &&
    link.props.initiator === "sites_library",
  "links to the Sites terms with analytics context",
);
check(
  link.props.children.join("") === "Learn more",
  "normalizes rich-text link children",
);
check(
  link.props.className.includes("underline-offset-2"),
  "styles the policy link as informational text",
);

node = tooltip.t({ disabledBy: "workspace_admin" });
check(
  node.props.defaultMessage === "Disabled by an admin",
  "identifies workspace-admin disabling",
);
node = tooltip.t({ disabledBy: "unknown" });
check(node.props.defaultMessage === "Disabled", "uses the unknown fallback");
node = tooltip.t({ disabledBy: null });
check(
  node.props.defaultMessage === "Disabled",
  "uses the fallback for missing actors",
);

console.log(`${assertions} Appgen disabled tooltip assertions passed`);
