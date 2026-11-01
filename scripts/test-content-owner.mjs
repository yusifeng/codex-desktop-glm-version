import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const jsx = {
  Fragment: Symbol("Fragment"),
  jsx: (type, props, key) => ({ type, props: props ?? {}, key }),
  jsxs: (type, props, key) => ({ type, props: props ?? {}, key }),
};
const react = {
  lazy: (load) => (props) => ({ type: "lazy", props, load }),
  useState: (initial) => [initial, () => {}],
};
globalThis.__contentOwnerTest = {
  accountId: "account-1",
  jsx,
  memoryConfiguration: { m3mEnabled: true, m3mOptedOut: false },
  react,
};

const sharedMock = `
const test=globalThis.__contentOwnerTest;
export const I3=()=>test.jsx; export const e6=()=>test.react;
export const HX=signal=>typeof signal==="function"?signal():signal;
export const S_="IconAsset"; export const Gm="FallbackIcon"; export const Qh="Spinner";
export const Y2="FormattedMessage"; export const Yh="Button"; export const Iv="MemoryIcon";
export const Tf="PopoverTrigger"; export const Cf="PopoverContent"; export const xf="Popover"; export const my="Chevron";
export const fm="approved"; export const Gl="brush"; export const Tw="code"; export const Bm="search";
export const ul="denied"; export const jT="edit"; export const gE="globe"; export const HD="library";
export const wE="files"; export const Xa="stop"; export const ID="thoughts";
export const FX=()=>{}; export const K2=()=>{}; export const Zh=()=>{}; export const lw=()=>{};
export const qm=()=>{}; export const Ef=()=>{}; export const $h=()=>{}; export const wL=()=>{};
export const LD=()=>{}; export const pm=()=>{}; export const dl=()=>{}; export const TE=()=>{};
export const _E=()=>{}; export const zm=()=>{}; export const Wl=()=>{}; export const AT=()=>{};
export const Ya=()=>{}; export const ww=()=>{}; export const C_=()=>{}; export const Km=()=>{};
`;
const initialMock = `
const test=globalThis.__contentOwnerTest;
export const Dlt="AppLogo";
export const U6t=()=>test.accountId; export const yqt=()=>test.memoryConfiguration;
export const ofn=mode=>mode==="enabled";
export const Olt=()=>{}; export const ifn=()=>{}; export const Sqt=()=>{};
`;

const result = await esbuild.build({
  entryPoints: [path.join(ROOT, "src/renderer/content/index.ts")],
  bundle: true,
  format: "esm",
  platform: "node",
  target: "node22",
  write: false,
  logLevel: "silent",
  plugins: [
    {
      name: "content-owner-mocks",
      setup(build) {
        build.onResolve({ filter: /^@rchunk\// }, ({ path: value }) => ({
          path: value.slice(8),
          namespace: "mock",
        }));
        build.onLoad(
          { filter: /.*/, namespace: "mock" },
          ({ path: value }) => ({
            contents:
              value === "app-shared"
                ? sharedMock
                : value === "app-initial"
                  ? initialMock
                  : value === "book-open"
                    ? "export const n=()=>{};export const t='BookOpen';"
                    : value === "memory-manager-gate"
                      ? 'export const t=()=>"enabled";'
                      : value === "chatgpt-about-you-summary-panel"
                        ? "export const MemorySummaryDialog='MemorySummaryDialog';"
                        : value === "chatgpt-saved-memories-panel"
                          ? "export const SavedMemoriesDialog='SavedMemoriesDialog';"
                          : "export {};",
            loader: "js",
          }),
        );
      },
    },
  ],
});
const content = await import(
  `data:text/javascript;base64,${Buffer.from(result.outputFiles[0].text).toString("base64")}`
);

content.i();
content.n();
const icons = content.r({
  resolvedApps: [
    {
      installUrl: "https://plugins.example.com/connect/",
      logoUrl: "https://cdn.example.com/app.png",
    },
  ],
  shouldBlockExternalEgress: true,
  toolIcons: ["code", "/icons/relative.png", "javascript:alert(1)"],
});
assert.equal(icons.type, "span");
assert.equal(icons.props.children.length, 2);
assert.equal(icons.props.children[0].type, "IconAsset");
assert.equal(icons.props.children[0].props.asset, "code");
assert.equal(icons.props.children[1].type, "AppLogo");
assert.equal(
  icons.props.children[1].props.logoUrl,
  "https://plugins.example.com/icons/relative.png",
);
assert.equal(icons.props.children[1].props.loadRemote, false);
assert.equal(
  content.r({ resolvedApps: [], toolIcons: ["javascript:alert(1)"] }),
  null,
);

const updating = content.t({ item: { isUpdating: true, writes: [] } });
assert.equal(updating.props.role, "status");
assert.equal(updating.props.children[0].type, "Spinner");
assert.equal(
  updating.props.children[1].props.defaultMessage,
  "Updating memory",
);

const memoryOwner = content.t({
  item: { writes: ["The user likes tea", "User's city is Paris"] },
});
const memoryTree = memoryOwner.type(memoryOwner.props);
const popover = memoryTree.props.children[0];
const popoverContent = popover.props.children[1];
const memoryList = popoverContent.props.children.props.children[0];
assert.deepEqual(
  memoryList.props.children.map((item) => item.props.children),
  ["likes tea", "city is Paris"],
);
const manageButton = popoverContent.props.children.props.children[1];
assert.equal(manageButton.type, "Button");
assert.equal(manageButton.props.disabled, false);
assert.equal(typeof manageButton.props.onClick, "function");

console.log("18 content owner behavior assertions passed");
