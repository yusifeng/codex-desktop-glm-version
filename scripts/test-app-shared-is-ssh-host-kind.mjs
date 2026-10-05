import assert from "node:assert/strict";
import esbuild from "esbuild";
const sourcePath = new URL("../src/renderer/app-shared/runtime/is-ssh-host-kind.ts", import.meta.url).pathname;
const built = await esbuild.build({ entryPoints: [sourcePath], bundle: true, format: "esm", platform: "node", target: "node22", write: false, logLevel: "silent" });
const { isSshHostKind } = await import(`data:text/javascript;base64,${Buffer.from(built.outputFiles[0].text).toString("base64")}`);
assert.equal(isSshHostKind({ kind: "ssh" }), true);
assert.equal(isSshHostKind({ kind: "wsl" }), false);
assert.equal(isSshHostKind(null), false);
console.log("app-shared is ssh host kind: 3 assertions passed");
