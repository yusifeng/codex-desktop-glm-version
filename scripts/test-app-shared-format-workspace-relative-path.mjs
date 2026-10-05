import assert from "node:assert/strict";
import esbuild from "esbuild";
const sourcePath = new URL("../src/renderer/app-shared/runtime/format-workspace-relative-path.ts", import.meta.url).pathname;
const built = await esbuild.build({ entryPoints: [sourcePath], bundle: true, format: "esm", platform: "node", target: "node22", write: false, logLevel: "silent" });
const mod = await import(`data:text/javascript;base64,${Buffer.from(built.outputFiles[0].text).toString("base64")}`);
const normalize = (value) => value.replace(/^\/+|\/+$/g, "");
assert.equal(mod.formatWorkspaceRelativePath({ root: "/workspace", relativePath: "src/index.ts", includeWorkspaceRootLabel: true, normalize, rootLabel: () => "workspace" }), "workspace/src/index.ts");
assert.equal(mod.formatWorkspaceRelativePath({ root: "/workspace", relativePath: "src/index.ts", includeWorkspaceRootLabel: false, normalize, rootLabel: () => "workspace" }), "src/index.ts");
console.log("app-shared format workspace relative path: 2 assertions passed");
