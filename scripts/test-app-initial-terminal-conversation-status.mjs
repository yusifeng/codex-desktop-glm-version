import assert from "node:assert/strict";
import esbuild from "esbuild";

const sourcePath = "src/renderer/app-initial/runtime/is-terminal-conversation-status.ts";
const result = await esbuild.build({ entryPoints: [sourcePath], bundle: true, format: "esm", platform: "node", target: "node22", write: false, logLevel: "silent" });
const module = await import(`data:text/javascript;base64,${Buffer.from(result.outputFiles[0].text).toString("base64")}`);
let assertions = 0;
const equal = (actual, expected) => { assertions += 1; assert.equal(actual, expected); };
for (const status of ["active-async-turn", "active-tpp-turn", "streaming"]) equal(module.isTerminalConversationStatus(status), true);
for (const status of ["error", "idle", "unknown", ""]) equal(module.isTerminalConversationStatus(status), false);
console.log(`app-initial terminal conversation status tests passed (${assertions} assertions)`);
