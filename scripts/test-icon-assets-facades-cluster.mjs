import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
globalThis.__assetFacadeTest = {
  driveInitializations: [],
  components: {
    document: Symbol("document"),
    drive: Symbol("drive"),
    presentation: Symbol("presentation"),
    spreadsheet: Symbol("spreadsheet"),
  },
  jsx: {
    Fragment: Symbol("Fragment"),
    jsx: (type, props, key) => ({ type, props: props ?? {}, key }),
    jsxs: (type, props, key) => ({ type, props: props ?? {}, key }),
  },
  parserInitializations: [],
};

const appSharedMock = `
  const s=globalThis.__assetFacadeTest;
  function ReactRuntime(){return ReactRuntime}
  ReactRuntime.Children={toArray:(children)=>children==null?[]:(Array.isArray(children)?children:[children]),map:(children,mapper)=>(Array.isArray(children)?children:[children]).map(mapper)};
  export const e6=ReactRuntime;
  export const I3=()=>s.jsx;
  export const h4=()=>{};
  export const m4=(...values)=>values.filter(Boolean).join(" ");
`;

async function bundle(directory) {
  const result = await esbuild.build({
    entryPoints: [path.join(ROOT, "src/renderer", directory, "index.ts")],
    bundle: true,
    format: "esm",
    platform: "node",
    target: "node22",
    write: false,
    logLevel: "silent",
    plugins: [
      {
        name: "asset-facade-mocks",
        setup(build) {
          build.onResolve({ filter: /^@rchunk\// }, ({ path: value }) => ({
            path: value.slice(8),
            namespace: "mock",
          }));
          build.onLoad(
            { filter: /.*/, namespace: "mock" },
            ({ path: value }) => {
              if (value === "app-shared")
                return { contents: appSharedMock, loader: "js" };
              if (value === "app-initial")
                return {
                  contents: `
            const s=globalThis.__assetFacadeTest;
            export const D3t=()=>s.driveInitializations.push("document");
            export const E3t=s.components.spreadsheet;
            export const O3t=s.components.document;
            export const T3t=()=>s.driveInitializations.push("presentation");
            export const f3t=s.components.drive;
            export const k3t=()=>s.driveInitializations.push("spreadsheet");
            export const p3t=()=>s.driveInitializations.push("drive");
            export const w3t=s.components.presentation;
          `,
                  loader: "js",
                };
              if (value === "portable-thumbnail-font-face-source-runtime")
                return {
                  contents: `export const i=(fonts)=>Promise.resolve(fonts.length); export const n=()=>({debug:true}); export const r=()=>{}; export const t=()=>["carlito"];`,
                  loader: "js",
                };
              if (value === "portable-thumbnail-font-runtime")
                return {
                  contents: `export const n=()=>Promise.resolve("loaded"); export const r=()=>{}; export const t=()=>true;`,
                  loader: "js",
                };
              if (value === "portable-thumbnail-pdf-document")
                return {
                  contents: `export const n=()=>{}; export const t=()=>({GlobalWorkerOptions:{}});`,
                  loader: "js",
                };
              if (value.startsWith("diff-worker-") && value.endsWith("-parser"))
                return {
                  contents: `globalThis.__assetFacadeTest.parserInitializations.push(${JSON.stringify(value)}); export const n=${JSON.stringify(value)}; export const t=()=>{};`,
                  loader: "js",
                };
              return { contents: "export {};", loader: "js" };
            },
          );
        },
      },
    ],
  });
  return import(
    `data:text/javascript;base64,${Buffer.from(result.outputFiles[0].text).toString("base64")}#${directory}`
  );
}

const cookies = await bundle("browser-profile-import-cookies-icon");
cookies.n();
const cookiesIcon = cookies.t({ className: "cookies" });
assert.equal(cookiesIcon.type, "svg");
assert.equal(cookiesIcon.props.width, 20);
assert.equal(cookiesIcon.props.children.length, 5);

const history = await bundle("browser-profile-import-history-icon");
history.n();
const historyIcon = history.t({ className: "history" });
assert.equal(historyIcon.type, "svg");
assert.equal(historyIcon.props.width, 21);
assert.equal(historyIcon.props.children.type, "path");

const chrome = await bundle("google-chrome");
chrome.n();
const chromeIcon = chrome.t({ title: "Chrome" });
assert.equal(chromeIcon.type, "svg");
assert.equal(chromeIcon.props.width, 256);
assert.equal(chromeIcon.props.children.length, 5);
assert.deepEqual(
  chromeIcon.props.children.map((child) => child.props.fill),
  ["#fff", "#229342", "#fbc116", "#1a73e8", "#e33b2e"],
);

const chevron = await bundle("model-picker-chevron-down-sm");
chevron.n();
const chevronIcon = chevron.t({ className: "chevron" });
assert.equal(chevronIcon.type, "svg");
assert.equal(chevronIcon.props.width, 16);
assert.equal(chevronIcon.props.fill, "currentColor");

const warning = await bundle("triangle-warning");
warning.n();
const warningIcon = warning.t({ className: "warning" });
assert.equal(warningIcon.type, "svg");
assert.equal(warningIcon.props.width, 20);
assert.equal(warningIcon.props.children.length, 3);

const drive = await bundle("google-drive-resource-icon");
drive.n();
assert.deepEqual(globalThis.__assetFacadeTest.driveInitializations, [
  "spreadsheet",
  "document",
  "presentation",
  "drive",
]);
assert.equal(
  drive.t({ resourceKind: "document", className: "kind" }).type,
  globalThis.__assetFacadeTest.components.document,
);
assert.equal(
  drive.t({ resourceKind: "spreadsheet" }).type,
  globalThis.__assetFacadeTest.components.spreadsheet,
);
assert.equal(
  drive.t({ resourceKind: "presentation" }).type,
  globalThis.__assetFacadeTest.components.presentation,
);
assert.equal(
  drive.t({ resourceKind: "drive" }).type,
  globalThis.__assetFacadeTest.components.drive,
);
assert.equal(
  drive.t({ resourceKind: "document", className: "kind" }).props.className,
  "kind",
);

const logoStack = await bundle("connector-logo-stack");
logoStack.n();
assert.equal(logoStack.t({ children: [] }), null);
const stack = logoStack.t({
  ariaLabel: "Connected apps",
  children: ["A", "B"],
  size: "medium",
  surface: "white",
});
assert.equal(stack.type, "span");
assert.equal(stack.props.role, "img");
assert.equal(stack.props["aria-label"], "Connected apps");
assert.equal(stack.props.children.length, 2);
assert.equal(stack.props.children[0].props.className.includes("size-6"), true);

const historyAssetSource = fs.readFileSync(
  path.join(ROOT, "src/renderer/computer-history-plugin-icon/index.ts"),
  "utf8",
);
assert.equal(
  historyAssetSource.includes("computer-history-plugin-icon-cc68b3ed4fe9.png"),
  true,
);
assert.equal(historyAssetSource.includes("new URL"), true);
const setupAssetSource = fs.readFileSync(
  path.join(ROOT, "src/renderer/setup-artwork/index.ts"),
  "utf8",
);
assert.equal(setupAssetSource.includes("setup-artwork-8805a57043b0.png"), true);
assert.equal(setupAssetSource.includes("new URL"), true);

const countries = await bundle("country-codes");
countries.n();
assert.equal(countries.t.has("GB"), true);
assert.equal(countries.t.has("CH"), true);
assert.equal(countries.t.has("US"), false);
assert.equal(countries.t.size, 41);

const fontSources = await bundle("portable-thumbnail-font-face-sources");
assert.deepEqual(fontSources.getPopcornCarlitoFontFaceSourcesFromDocument(), [
  "carlito",
]);
assert.deepEqual(fontSources.getPopcornFontDebugState(), { debug: true });
assert.equal(await fontSources.installPopcornFontFaces([1, 2]), 2);
const portableFonts = await bundle("portable-thumbnail-fonts");
assert.equal(portableFonts.arePopcornSpreadsheetFontsReady(), true);
assert.equal(
  await portableFonts.ensurePopcornSpreadsheetFontsLoaded(),
  "loaded",
);
const pdfRuntime = await bundle("portable-thumbnail-pdf-runtime");
assert.deepEqual(pdfRuntime.getPdfjs(), { GlobalWorkerOptions: {} });

const algorithm = await bundle("diff-worker-algorithm");
assert.equal(algorithm.parser, "diff-worker-algorithm-parser");
const model = await bundle("diff-worker-model");
assert.equal(model.parser, "diff-worker-model-parser");
const renderer = await bundle("diff-worker-renderer");
assert.equal(renderer.parser, "diff-worker-renderer-parser");
const runtime = await bundle("diff-worker-runtime");
assert.equal(runtime.parser, "diff-worker-runtime-parser");
const utils = await bundle("diff-worker-utils");
assert.equal(utils.parser, "diff-worker-utils-parser");

console.log("47 icon, asset and facade cluster assertions passed");
