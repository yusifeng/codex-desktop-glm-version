import assert from "node:assert/strict";
import esbuild from "esbuild";
const bundle = await esbuild.build({
  entryPoints: ["src/renderer/app-initial/runtime/flatten-conversation-items.ts"],
  bundle: true,
  format: "esm",
  platform: "node",
  write: false,
});
const { flattenConversationItems } = await import(`data:text/javascript;base64,${Buffer.from(bundle.outputFiles[0].text).toString("base64")}`);

assert.deepEqual(flattenConversationItems([1, null, 2, undefined, 3]), [1, 2, 3]);
assert.deepEqual(flattenConversationItems([]), []);
const object = { id: "turn-item" };
assert.deepEqual(flattenConversationItems([null, object]), [object]);
assert.equal(flattenConversationItems([false, 0, ""]).length, 3);
console.log("4 app-initial flatten conversation item assertions passed");
