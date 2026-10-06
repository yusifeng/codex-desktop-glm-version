import assert from "node:assert/strict";
import esbuild from "esbuild";
const sourcePath = new URL("../src/renderer/app-shared/runtime/is-realtime-voice-command.ts", import.meta.url).pathname;
const built = await esbuild.build({ entryPoints: [sourcePath], bundle: true, format: "esm", platform: "node", target: "node22", write: false, logLevel: "silent" });
const { isRealtimeVoiceCommand } = await import(`data:text/javascript;base64,${Buffer.from(built.outputFiles[0].text).toString("base64")}`);
assert.equal(isRealtimeVoiceCommand("composer.startVoiceMode"), true);
assert.equal(isRealtimeVoiceCommand("realtimeVoice.experimental"), true);
assert.equal(isRealtimeVoiceCommand("composer.send"), false);
console.log("app-shared realtime voice command predicate: 3 assertions passed");
