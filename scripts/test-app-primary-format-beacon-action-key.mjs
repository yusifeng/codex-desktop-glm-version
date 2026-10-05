import assert from "node:assert/strict";
import esbuild from "esbuild";
const sourcePath = new URL("../src/renderer/app-primary/runtime/format-beacon-action-key.ts", import.meta.url).pathname;
const built = await esbuild.build({ entryPoints: [sourcePath], bundle: true, format: "esm", platform: "node", target: "node22", write: false, logLevel: "silent" });
const mod = await import(`data:text/javascript;base64,${Buffer.from(built.outputFiles[0].text).toString("base64")}`);
assert.equal(mod.formatBeaconActionKey({ beaconId: "beacon-1", actionId: "open" }), "beacon-1:open");
assert.equal(mod.formatBeaconActionKey({ beaconId: "", actionId: "" }), ":");
console.log("app-primary format beacon action key: 2 assertions passed");
