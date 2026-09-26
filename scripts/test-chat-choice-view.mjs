import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
globalThis.__chatChoiceTest = {
  jsx: {
    jsx: (type, props, key) => ({ type, props, key }),
    jsxs: (type, props, key) => ({ type, props, key }),
  },
};
const result = await esbuild.build({
  entryPoints: [path.join(ROOT, "src/renderer/chat-choice-view/index.ts")],
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
                  export const I3 = () => globalThis.__chatChoiceTest.jsx;
                  export const n4 = () => ({ formatDate: (value, options) => value + ":" + options.timeZone });
                  export const Y2 = "FormattedMessage"; export const Yh = "Button";
                  export const S_ = "Icon"; export const Tl = "PluginAsset";
                  export const $3 = () => {}; export const wl = () => {}; export const K2 = () => {};
                  export const Zh = () => {}; export const C_ = () => {};
                `,
                "app-initial": `
                  export const afn = () => ({ get: () => "2027-03-15" });
                  export const n7 = "Banner"; export const r7 = () => {}; export const ifn = () => {};
                `,
                "gpt-plugin-retirement": `export const t = value => value; export const r = () => {};`,
              }[importPath] ?? "export {};",
            loader: "js",
          }),
        );
      },
    },
  ],
});
const choice = await import(
  `data:text/javascript;base64,${Buffer.from(result.outputFiles[0].text).toString("base64")}`
);

let assertions = 0;
function check(value, message) {
  assert.ok(value, message);
  assertions += 1;
}
const actions = { used: 0, kept: 0, retried: 0 };
const render = (accessState, extra = {}) =>
  choice.t({
    gptName: "Research GPT",
    accessState,
    onUsePlugin: () => actions.used++,
    onKeepUsingGpt: () => actions.kept++,
    ...extra,
  });
const bannerOf = (node) => node.props.children;
const buttonsOf = (node) => bannerOf(node).props.customCtas.props.children;

let node = render("allowed");
let banner = bannerOf(node);
check(
  node.type === "div" && banner.type === "Banner",
  "renders the announcement banner shell",
);
check(
  banner.props.title.props.defaultMessage === "{gptName} is now a plugin",
  "uses the named GPT title",
);
check(
  banner.props.content.props.values.deadline === "2027-03-15:UTC",
  "formats the retirement date in UTC",
);
check(
  banner.props.icon.props.asset === "PluginAsset",
  "uses the plugin announcement icon",
);
let [primary, secondary] = buttonsOf(node);
check(
  primary.props.children.props.defaultMessage === "Use plugin" &&
    !primary.props.disabled,
  "offers the available plugin",
);
primary.props.onClick();
secondary.props.onClick();
check(actions.used === 1 && actions.kept === 1, "wires both choice actions");

node = render("pending");
primary = buttonsOf(node)[0];
check(
  primary.props.disabled,
  "disables the plugin action while access is pending",
);

node = render("denied");
banner = bannerOf(node);
primary = buttonsOf(node)[0];
check(
  banner.props.content.props.defaultMessage.startsWith(
    "This plugin isn’t available",
  ),
  "explains denied plugin access",
);
check(
  primary.props.children.props.defaultMessage === "Explore plugins",
  "offers plugin discovery when access is denied",
);

node = render("error", {
  onRetry: () => actions.retried++,
});
banner = bannerOf(node);
primary = buttonsOf(node)[0];
check(
  banner.props.content.props.defaultMessage.includes("Try again"),
  "explains a retryable access failure",
);
check(
  primary.props.children.props.defaultMessage === "Try again",
  "labels the retry action",
);
primary.props.onClick();
check(actions.retried === 1, "wires the retry callback");

node = render("error", { onRetry: undefined });
check(
  bannerOf(node).props.content.props.defaultMessage.includes(
    "couldn’t check your access",
  ),
  "keeps the non-retry fallback copy",
);

node = choice.t({
  gptName: "   ",
  accessState: "allowed",
  onUsePlugin: () => {},
});
banner = bannerOf(node);
check(
  banner.props.title.props.defaultMessage === "This GPT is now a plugin",
  "uses generic copy for an unnamed GPT",
);
check(
  buttonsOf(node)[1] === null,
  "omits the keep-using action when unavailable",
);

assert.equal(assertions, 15);
console.log(`${assertions} chat choice view assertions passed`);
