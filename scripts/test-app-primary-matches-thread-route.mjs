import assert from "node:assert/strict";
import esbuild from "esbuild";
const sourcePath = new URL("../src/renderer/app-primary/runtime/matches-thread-route.ts", import.meta.url).pathname;
const built = await esbuild.build({ entryPoints: [sourcePath], bundle: true, format: "esm", platform: "node", target: "node22", write: false, logLevel: "silent" });
const mod = await import(`data:text/javascript;base64,${Buffer.from(built.outputFiles[0].text).toString("base64")}`);
assert.equal(mod.matchesThreadRoute({ conversationId: "c1" }, { routeKind: "chatgpt-thread", conversationId: "c1" }), true);
assert.equal(mod.matchesThreadRoute({ hostId: "local", conversationId: "c1" }, { routeKind: "local-thread", hostId: "local", conversationId: "c1" }), true);
assert.equal(mod.matchesThreadRoute({ hostId: "remote", conversationId: "c1" }, { routeKind: "local-thread", hostId: "local", conversationId: "c1" }), false);
console.log("app-primary matches thread route: 3 assertions passed");
