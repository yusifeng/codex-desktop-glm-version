import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const state = (globalThis.__appgenProjectRowTest = {
  screenshotSrc: null,
  screenshotUrl: null,
  platform: "macos",
  initialized: [],
  jsx: { jsx: (type, props, key) => ({ type, props, key }) },
});
const result = await esbuild.build({
  entryPoints: [path.join(ROOT, "src/renderer/appgen-project-row/index.ts")],
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
                  export const I3 = () => globalThis.__appgenProjectRowTest.jsx;
                  export const m4 = (...values) => values.filter(Boolean).join(" ");
                  export const $3 = () => globalThis.__appgenProjectRowTest.initialized.push("$3");
                  export const h4 = () => globalThis.__appgenProjectRowTest.initialized.push("h4");
                  export const FX = () => globalThis.__appgenProjectRowTest.initialized.push("FX");
                  export const QI = () => globalThis.__appgenProjectRowTest.initialized.push("QI");
                `,
                "app-initial": `
                  export const wan = (url) => { globalThis.__appgenProjectRowTest.screenshotUrl = url; return { data: globalThis.__appgenProjectRowTest.screenshotSrc }; };
                  export const E6t = () => ({ platform: globalThis.__appgenProjectRowTest.platform });
                  export const Dft = () => {}; export const a7 = () => {}; export const RS = () => {}; export const T6t = () => {}; export const yZ = () => {}; export const _an = () => {};
                `,
                "appgen-access": `export const s = () => {};`,
                "appgen-access-state-messages": `export const o = () => {}; export const i = () => {};`,
                "appgen-card-layout": `export const a = () => globalThis.__appgenProjectRowTest.initialized.push("layout"); export const n = "ThumbnailLayout";`,
                "open-appgen-share-dialog": `export const t = () => {};`,
                "sites-default-thumbnail": `export const o = () => {}; export const i = () => {}; export const n = () => {}; export const r = "WindowsThumbnail"; export const t = "MacThumbnail";`,
              }[importPath] ?? "export {};",
            loader: "js",
          }),
        );
      },
    },
  ],
});
const row = await import(
  `data:text/javascript;base64,${Buffer.from(result.outputFiles[0].text).toString("base64")}`
);

let assertions = 0;
function check(value, message) {
  assert.ok(value, message);
  assertions += 1;
}
row.n();
check(
  state.initialized.includes("layout"),
  "initializes the card layout dependency",
);

state.screenshotSrc = "blob:screenshot";
let node = row.t({
  aspectRatio: "landscape",
  screenshotUrl: "https://example.com/screenshot.png",
  viewMode: "grid",
});
check(
  state.screenshotUrl.endsWith("screenshot.png"),
  "queries the requested screenshot",
);
check(
  node.type === "ThumbnailLayout",
  "renders screenshots in the shared layout",
);
check(
  node.props.aspectRatio === "landscape" && node.props.viewMode === "grid",
  "forwards layout geometry",
);
let image = node.props.children;
check(
  image.type === "img" && image.props.src === "blob:screenshot",
  "renders the resolved screenshot",
);
check(
  image.props.alt === "" && image.props.loading === "lazy",
  "uses decorative lazy image semantics",
);
check(
  image.props.className.includes("_gridAsset_1l7k7_2") &&
    image.props.className.includes("max-h-[72%]") &&
    image.props.className.includes("object-contain"),
  "applies grid screenshot sizing",
);

state.screenshotSrc = "blob:list";
node = row.t({ screenshotUrl: "list.png", viewMode: "list" });
check(
  node.props.children.props.className.includes("_listAsset_1l7k7_2") &&
    node.props.children.props.className.includes("max-h-full"),
  "applies list screenshot sizing",
);

state.screenshotSrc = null;
state.platform = "macos";
node = row.t({ screenshotUrl: null, viewMode: "grid" });
check(
  typeof node.type === "function",
  "renders the default-thumbnail component when no screenshot exists",
);
let fallback = node.type(node.props);
check(
  fallback.props.children.type === "MacThumbnail",
  "uses the macOS default thumbnail",
);
check(
  fallback.props.children.props["aria-hidden"] === true,
  "marks the default artwork decorative",
);
check(
  fallback.props.children.props.className.includes("h-auto w-[72%]"),
  "sizes grid fallback artwork",
);

state.platform = "windows";
node = row.t({ screenshotUrl: null, viewMode: "list" });
fallback = node.type(node.props);
check(
  fallback.props.children.type === "WindowsThumbnail",
  "uses the Windows default thumbnail",
);
check(
  fallback.props.children.props.className.includes("size-full") &&
    fallback.props.children.props.className.includes("_listAsset_1l7k7_2"),
  "sizes list fallback artwork",
);

console.log(`${assertions} Appgen project-row assertions passed`);
