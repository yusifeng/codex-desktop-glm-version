import assert from "node:assert/strict";
import esbuild from "esbuild";
const sourcePath = new URL("../src/renderer/app-primary/runtime/resolve-skill-repo-label.ts", import.meta.url).pathname;
const built = await esbuild.build({ entryPoints: [sourcePath], bundle: true, format: "esm", platform: "node", target: "node22", write: false, logLevel: "silent" });
const mod = await import(`data:text/javascript;base64,${Buffer.from(built.outputFiles[0].text).toString("base64")}`);
assert.equal(mod.resolveSkillRepoLabel({ skillPath: "/repo/skills/foo", roots: ["/repo", "/repo/skills"], fallbackLabel: "Repo" }), "skills");
assert.equal(mod.resolveSkillRepoLabel({ skillPath: "/other/foo", roots: ["/repo"], fallbackLabel: "Repo" }), "Repo");
assert.equal(mod.resolveSkillRepoLabel({ skillPath: "C:\\skills\\foo", roots: ["C:\\skills\\"], fallbackLabel: "Repo" }), "skills");
console.log("app-primary resolve skill repo label: 3 assertions passed");
