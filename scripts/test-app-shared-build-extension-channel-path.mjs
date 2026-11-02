import assert from "node:assert/strict";
import esbuild from "esbuild";
const sourcePath = new URL("../src/renderer/app-shared/runtime/build-extension-channel-path.ts", import.meta.url).pathname;
const built = await esbuild.build({ entryPoints: [sourcePath], bundle: true, format: "esm", platform: "node", target: "node22", write: false, logLevel: "silent" });
const mod = await import(`data:text/javascript;base64,${Buffer.from(built.outputFiles[0].text).toString("base64")}`);
assert.equal(mod.buildChromeExtensionStoreUrl("abcdefghijklmnopabcdefghijklmnop"), "https://chromewebstore.google.com/detail/abcdefghijklmnopabcdefghijklmnop");
assert.equal(mod.buildChromeExtensionStoreUrl("  abcdefghijklmnopabcdefghijklmnop  "), "https://chromewebstore.google.com/detail/abcdefghijklmnopabcdefghijklmnop");
assert.throws(() => mod.buildChromeExtensionStoreUrl("invalid-extension-id"), /Invalid Chromium extension ID/);
console.log("app-shared Chrome extension store URL: 3 assertions passed");
