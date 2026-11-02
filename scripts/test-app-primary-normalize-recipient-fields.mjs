import assert from "node:assert/strict";
import esbuild from "esbuild";
const sourcePath = new URL("../src/renderer/app-primary/runtime/normalize-recipient-fields.ts", import.meta.url).pathname;
const built = await esbuild.build({ entryPoints: [sourcePath], bundle: true, format: "esm", platform: "node", target: "node22", write: false, logLevel: "silent" });
const mod = await import(`data:text/javascript;base64,${Buffer.from(built.outputFiles[0].text).toString("base64")}`);
assert.deepEqual(mod.normalizeRecipientFields({ recipient: "alice@example.com, bad", cc: "", bcc: "bob@example.com", contacts: { recipient: [{ email: "alice@example.com", name: "Alice" }], bcc: [] } }), [
  { value: "Alice", isInvalid: false }, { value: "bad", isInvalid: true }, { value: "bob@example.com", isInvalid: false, prefix: "Bcc: " },
]);
assert.deepEqual(mod.normalizeRecipientFields({ recipient: null }), []);
const alice = { email: "alice@example.com", id: "1", name: "Alice" };
assert.deepEqual(mod.parseRecipientField("Alice@Example.com, unfinished, bob@example.com", [alice]), {
  recipients: [
    { email: "Alice@Example.com", id: "1", name: "Alice" },
    { email: "bob@example.com" },
  ],
  unfinishedValue: "unfinished",
});
const recipient = [{ email: "alice@example.com" }];
const projected = mod.projectRecipientContacts({ recipient, cc: [], bcc: [{ email: "hidden@example.com" }] });
assert.deepEqual(projected, {
  recipient: [{ email: "alice@example.com" }],
  bcc: [{ email: "hidden@example.com" }],
});
assert.notEqual(projected.recipient, recipient);
console.log("app-primary normalize recipient fields: 6 assertions passed");
