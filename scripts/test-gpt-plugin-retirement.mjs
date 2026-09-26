import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const result = await esbuild.build({
  entryPoints: [path.join(ROOT, "src/renderer/gpt-plugin-retirement/index.ts")],
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
              importPath === "app-initial"
                ? `export const iN = user => user; export const sN = () => {};`
                : "export {};",
            loader: "js",
          }),
        );
      },
    },
  ],
});
const retirement = await import(
  `data:text/javascript;base64,${Buffer.from(result.outputFiles[0].text).toString("base64")}`
);
const fallbackDate = Date.UTC(2026, 11, 11);
assert.equal(retirement.t("2027-03-15"), Date.UTC(2027, 2, 15));
assert.equal(retirement.t("2027-02-29"), fallbackDate);
assert.equal(retirement.t("March 15"), fallbackDate);
assert.equal(
  retirement.n(
    { locale: "fr-FR" },
    "https://help.openai.com/{lang}/articles/migration",
  ),
  "https://help.openai.com/fr-fr/articles/migration",
);
assert.equal(
  retirement.n({ locale: "en-US" }, "https://example.com/{lang}/help"),
  "https://example.com/en/help",
);
assert.equal(
  retirement.n({ locale: "de-DE" }, "http://example.com/{lang}/help"),
  "https://help.openai.com/de-de/collections/8475420-gpts",
);
assert.equal(
  retirement.n({}, "not a url"),
  "https://help.openai.com/en/collections/8475420-gpts",
);
console.log("7 GPT plugin retirement assertions passed");
