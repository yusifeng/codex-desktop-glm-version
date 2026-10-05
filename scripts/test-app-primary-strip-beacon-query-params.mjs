import assert from "node:assert/strict";
import esbuild from "esbuild";
const sourcePath = new URL("../src/renderer/app-primary/runtime/strip-beacon-query-params.ts", import.meta.url).pathname;
const built = await esbuild.build({ entryPoints: [sourcePath], bundle: true, format: "esm", platform: "node", target: "node22", write: false, logLevel: "silent" });
const { stripBeaconQueryParams } = await import(`data:text/javascript;base64,${Buffer.from(built.outputFiles[0].text).toString("base64")}`);
assert.equal(stripBeaconQueryParams("?beacon_checkout_mode=x&keep=1&beacon_return_path=%2Fhome"), "?keep=1");
assert.equal(stripBeaconQueryParams("?entry_point=a&promo_campaign=b"), "");
assert.equal(stripBeaconQueryParams("?keep=a+b"), "?keep=a+b");
console.log("app-primary strip beacon query params: 3 assertions passed");
