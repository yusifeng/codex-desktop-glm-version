import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
globalThis.__appgenBrowserSiteTest = { initialized: 0 };
const result = await esbuild.build({
  entryPoints: [
    path.join(ROOT, "src/renderer/appgen-browser-site-core/index.ts"),
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
              importPath === "app-primary"
                ? `
                  export const Sf = () => globalThis.__appgenBrowserSiteTest.initialized++;
                  export const yf = (current, candidate) => { const a = new URL(current); const b = new URL(candidate); const base = b.pathname.replace(/\\/+$/, ""); return a.origin === b.origin && (a.pathname === base || a.pathname.startsWith(base + "/")); };
                `
                : "export {};",
            loader: "js",
          }),
        );
      },
    },
  ],
});
const browserSite = await import(
  `data:text/javascript;base64,${Buffer.from(result.outputFiles[0].text).toString("base64")}`
);

let assertions = 0;
function check(value, message) {
  assert.ok(value, message);
  assertions += 1;
}
browserSite.n();
check(
  globalThis.__appgenBrowserSiteTest.initialized === 1,
  "initializes URL matching support",
);
const broad = {
  id: "broad",
  type: "appgen-app",
  url: "https://example.com/apps/",
};
const specific = {
  id: "specific",
  type: "appgen-app",
  url: "https://example.com/apps/store/",
};
const alternate = {
  id: "alternate",
  type: "appgen-app",
  url: null,
  alternateUrls: [null, "https://example.com/preview/special"],
};
const ignored = {
  id: "ignored",
  type: "website",
  url: "https://example.com/apps/store/item",
};

let match = browserSite.t(
  [ignored, broad, specific],
  "https://example.com/apps/store/item",
);
check(match === specific, "selects the most specific matching Site URL");
match = browserSite.t(
  [broad, alternate],
  "https://example.com/preview/special/page",
);
check(match === alternate, "matches alternate Site URLs");
check(
  browserSite.t([ignored], ignored.url) === null,
  "ignores non-Appgen browser entries",
);
check(
  browserSite.t([broad], "https://other.example/apps") === null,
  "rejects another origin",
);
check(
  browserSite.t([], "https://example.com/apps") === null,
  "returns null for an empty list",
);

const first = {
  id: "first",
  type: "appgen-app",
  url: "https://example.com/equal",
};
const second = {
  id: "second",
  type: "appgen-app",
  url: "https://example.com/equal/",
};
check(
  browserSite.t([first, second], "https://example.com/equal/page") === first,
  "keeps the first Site when specificity ties",
);
check(
  browserSite.t([second, broad], "https://example.com/equal/page") === second,
  "trims trailing slashes when scoring specificity",
);
check(
  browserSite.t([alternate], "https://example.com/preview/special") ===
    alternate,
  "accepts an exact alternate URL",
);

console.log(`${assertions} Appgen browser-site assertions passed`);
