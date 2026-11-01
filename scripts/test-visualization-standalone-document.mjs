import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const runtimeMock =
  "export const n=initializer=>{let done=false;return()=>{if(!done){done=true;initializer();}}};";
const initialMock = String.raw`
export const Cnt = "light-dark(rgb(255 255 255), rgb(24 24 24))";
export const Dnt = {
  resourceDomains: [
    "blob:",
    "data:",
    "https://cdn.example.test",
    "https://fonts.example.test",
  ],
};
export const Ent = () => {};
export const knt = () => {};
export const Ont = (fragment, options) =>
  "<main data-treatment=\"" + String(options.treatment) +
  "\" data-lock=\"" + String(options.lockDocumentOverflow) +
  "\" data-report=\"" + String(options.reportToHost) +
  "\"><style>" + options.styles + "</style>" + fragment + "</main>";
`;

async function bundle(entry, exact) {
  const result = await esbuild.build({
    entryPoints: [path.join(ROOT, entry)],
    bundle: true,
    format: "esm",
    platform: "node",
    target: "node22",
    write: false,
    logLevel: "silent",
    plugins: [
      {
        name: "visualization-standalone-document-runtime",
        setup(build) {
          build.onResolve(
            { filter: exact ? /^\.\/.*\.js$/ : /^@rchunk\// },
            ({ path: modulePath }) => ({
              path: modulePath.includes("rolldown-runtime")
                ? "runtime"
                : "app-initial",
              namespace: "mock",
            }),
          );
          build.onLoad({ filter: /.*/, namespace: "mock" }, ({ path: id }) => ({
            contents: id === "runtime" ? runtimeMock : initialMock,
            loader: "js",
          }));
        },
      },
    ],
  });
  return import(
    `data:text/javascript;base64,${Buffer.from(result.outputFiles[0].text).toString("base64")}#${exact ? "exact" : "semantic"}`
  );
}

const semantic = await bundle(
  "src/renderer/visualization-standalone-document/index.ts",
  false,
);
const exact = await bundle(
  ".reference/app-original/webview/assets/visualization-standalone-document-45332507e418.js",
  true,
);

semantic.n();
exact.n();

const cases = [
  {
    fragment: "<svg><text>hello</text></svg>",
    options: {
      locale: "en-US",
      title: 'Chart & \"details\"',
      treatment: true,
    },
  },
  {
    fragment: "<section>custom</section>",
    options: {
      locale: "zh-CN",
      styles: ":root{--background:rebeccapurple}",
      title: "<unsafe>",
      treatment: false,
    },
  },
];

for (const testCase of cases) {
  const semanticDocument = semantic.t(testCase.fragment, testCase.options);
  const exactDocument = exact.t(testCase.fragment, testCase.options);
  assert.equal(
    semanticDocument,
    exactDocument,
    `standalone document differs for ${testCase.options.locale}`,
  );
}

const document = semantic.t("<p>security</p>", {
  locale: "en-US",
  title: '<script>alert("x")</script>',
});
assert.match(document, /sandbox="allow-scripts"/);
assert.match(document, /frame-src 'self'/);
assert.match(document, /frame-src 'none'/);
assert.match(document, /connect-src blob: data:/);
assert.match(document, /codex-visualization-widget-state/);
assert.match(document, /sendFollowUpMessage/);
assert.match(document, /open-external/);
assert.match(document, /widget_state_persistence_failed/);
assert.ok(!document.includes("<title><script>"));
assert.ok(
  document.includes("&lt;script&gt;alert(&quot;x&quot;)&lt;/script&gt;"),
);

console.log("13 visualization standalone document parity assertions passed");
