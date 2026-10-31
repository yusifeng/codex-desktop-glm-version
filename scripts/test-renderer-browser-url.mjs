import assert from "node:assert/strict";
import fs from "node:fs";
import esbuild from "esbuild";

for (const consumer of ["appgen-site-card", "appgen-site-detail-layout"]) {
  const source = fs.readFileSync(`src/renderer/${consumer}/index.ts`, "utf8");
  assert.match(source, /app-primary\/runtime\/format-browser-url/);
  assert.doesNotMatch(source, /\bxf\s*:\s*formatSite/);
}

const sourcePath = "src/renderer/app-primary/runtime/format-browser-url.ts";
const result = await esbuild.build({ entryPoints: [sourcePath], bundle: true, format: "esm", platform: "node", target: "node22", write: false, logLevel: "silent" });
const module = await import(`data:text/javascript;base64,${Buffer.from(result.outputFiles[0].text).toString("base64")}`);
let assertions = 4;
const equal = (actual, expected) => { assertions += 1; assert.equal(actual, expected); };
equal(module.formatBrowserUrl("https://example.test/"), "example.test");
equal(module.formatBrowserUrl("https://example.test/a?x=1#part"), "example.test/a?x=1#part");
equal(module.formatBrowserUrl("https://example.test/a?x=1#part", false), "example.test/a");
equal(module.formatBrowserUrl("not a URL"), null);
equal(module.formatBrowserUrl(null), null);
console.log(`renderer browser URL formatter tests passed (${assertions} assertions)`);
