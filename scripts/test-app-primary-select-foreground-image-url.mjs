import assert from "node:assert/strict";
import esbuild from "esbuild";

const sourcePath = new URL("../src/renderer/app-primary/runtime/select-foreground-image-url.ts", import.meta.url).pathname;
const built = await esbuild.build({ entryPoints: [sourcePath], bundle: true, format: "esm", platform: "node", target: "node22", write: false, logLevel: "silent" });
const mod = await import(`data:text/javascript;base64,${Buffer.from(built.outputFiles[0].text).toString("base64")}`);
const { selectForegroundImageUrl } = mod;

const isHttpUrl = (value) => typeof value === "string" && /^https?:\/\//.test(value);

assert.equal(
  selectForegroundImageUrl(
    { foreground_image_url: "https://cdn.test/light.png", foreground_image_url_dark: "https://cdn.test/dark.png" },
    true,
    true,
    isHttpUrl,
  ),
  "https://cdn.test/dark.png",
);
assert.equal(
  selectForegroundImageUrl({ foreground_image_url: "https://cdn.test/light.png" }, true, true, isHttpUrl),
  "https://cdn.test/light.png",
);
assert.equal(
  selectForegroundImageUrl({ foreground_image_url: "https://cdn.test/light.png" }, false, false, isHttpUrl),
  null,
);
assert.equal(
  selectForegroundImageUrl({ foreground_image_url: "javascript:alert(1)" }, false, true, isHttpUrl),
  null,
);

console.log("app-primary select foreground image url: 4 assertions passed");
