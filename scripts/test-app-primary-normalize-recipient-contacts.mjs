import assert from "node:assert/strict";
import esbuild from "esbuild";
const sourcePath = new URL("../src/renderer/app-primary/runtime/normalize-recipient-contacts.ts", import.meta.url).pathname;
const built = await esbuild.build({ entryPoints: [sourcePath], bundle: true, format: "esm", platform: "node", target: "node22", write: false, logLevel: "silent" });
const mod = await import(`data:text/javascript;base64,${Buffer.from(built.outputFiles[0].text).toString("base64")}`);
assert.deepEqual(mod.normalizeRecipientContacts({ contacts: { recipient: [{ email: "a@example.com", name: "A" }, { email: 4 }], cc: [], bcc: [] } }), { recipient: [{ email: "a@example.com", name: "A" }], cc: [], bcc: [] });
assert.deepEqual(mod.normalizeRecipientContacts({ recipient: "a@example.com; b@example.com", cc: "", bcc: "b@example.com\n" }), { recipient: [{ email: "a@example.com" }, { email: "b@example.com" }], cc: [], bcc: [{ email: "b@example.com" }] });
assert.deepEqual(mod.normalizeRecipientContacts(null), { recipient: [], cc: [], bcc: [] });
console.log("app-primary normalize recipient contacts: 3 assertions passed");
