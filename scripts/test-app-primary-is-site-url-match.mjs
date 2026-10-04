import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const result = await esbuild.build({
  entryPoints: [
    path.join(ROOT, "src/renderer/app-primary/runtime/is-site-url-match.ts"),
  ],
  bundle: true,
  format: "esm",
  platform: "node",
  target: "node22",
  write: false,
  logLevel: "silent",
});
const matcher = await import(
  `data:text/javascript;base64,${Buffer.from(result.outputFiles[0].text).toString("base64")}`
);
let assertions = 0;
function check(value, message) {
  assert.equal(value, true, message);
  assertions += 1;
}

matcher.initializeSiteUrlMatcher();
check(
  matcher.isSiteUrlMatch(
    "https://demo.chatgpt-team.site/apps/demo/page",
    "https://demo.chatgpt.site/apps/demo",
  ),
  "matches team and public ChatGPT site host aliases",
);
check(
  matcher.isSiteUrlMatch(
    "https://example.com/apps/demo/item",
    "https://example.com/apps/demo/",
  ),
  "matches descendants after normalizing trailing slashes",
);
check(
  !matcher.isSiteUrlMatch(
    "https://example.com/apps/demonstration",
    "https://example.com/apps/demo",
  ),
  "does not match a path with only a textual prefix",
);
check(
  !matcher.isSiteUrlMatch("https://example.com/apps/demo", "not a URL"),
  "rejects malformed candidate URLs",
);
check(
  !matcher.isSiteUrlMatch(
    "https://example.com:443/apps/demo",
    "https://example.com:8443/apps/demo",
  ),
  "keeps port matching strict",
);

console.log(`${assertions} app-primary site URL matcher assertions passed`);
