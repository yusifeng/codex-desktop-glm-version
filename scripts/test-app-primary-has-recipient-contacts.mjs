import assert from "node:assert/strict";
import esbuild from "esbuild";
const sourcePath = new URL("../src/renderer/app-primary/runtime/has-recipient-contacts.ts", import.meta.url).pathname;
const built = await esbuild.build({ entryPoints: [sourcePath], bundle: true, format: "esm", platform: "node", target: "node22", write: false, logLevel: "silent" });
const { hasRecipientContacts } = await import(`data:text/javascript;base64,${Buffer.from(built.outputFiles[0].text).toString("base64")}`);
assert.equal(hasRecipientContacts({ to: [], cc: [], bcc: [] }), false);
assert.equal(hasRecipientContacts({ to: ["alice@example.com"], cc: [], bcc: [] }), true);
assert.equal(hasRecipientContacts({ to: [], cc: [], bcc: ["audit@example.com"] }), true);
console.log("app-primary has recipient contacts: 3 assertions passed");
