import assert from "node:assert/strict";
import esbuild from "esbuild";
const sourcePath = new URL("../src/renderer/app-shared/runtime/format-scheduled-task-key.ts", import.meta.url).pathname;
const built = await esbuild.build({ entryPoints: [sourcePath], bundle: true, format: "esm", platform: "node", target: "node22", write: false, logLevel: "silent" });
const { formatScheduledTaskKey } = await import(`data:text/javascript;base64,${Buffer.from(built.outputFiles[0].text).toString("base64")}`);
assert.equal(formatScheduledTaskKey("plugin-a", "task-1"), "plugin-a/task-1");
assert.equal(formatScheduledTaskKey("", "task"), "/task");
console.log("app-shared format scheduled task key: 2 assertions passed");
