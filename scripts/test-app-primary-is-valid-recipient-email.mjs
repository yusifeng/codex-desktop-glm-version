import assert from "node:assert/strict";
import esbuild from "esbuild";

const sourcePath = new URL("../src/renderer/app-primary/runtime/is-valid-recipient-email.ts", import.meta.url).pathname;
const built = await esbuild.build({ entryPoints: [sourcePath], bundle: true, format: "esm", platform: "node", target: "node22", write: false, logLevel: "silent" });
const mod = await import(`data:text/javascript;base64,${Buffer.from(built.outputFiles[0].text).toString("base64")}`);
assert.equal(mod.isValidRecipientEmail("alice@example.com"), true);
assert.equal(mod.isValidRecipientEmail("alice+codex@example.co.uk"), true);
assert.equal(mod.isValidRecipientEmail("alice@example"), false);
assert.equal(mod.isValidRecipientEmail(" alice@example.com"), false);
console.log("app-primary is-valid recipient email: 4 assertions passed");
