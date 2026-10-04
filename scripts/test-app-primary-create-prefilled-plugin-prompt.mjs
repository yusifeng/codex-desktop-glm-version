import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const sourcePath = path.join(root, "src/renderer/app-primary/runtime/create-prefilled-plugin-prompt.ts");
const source = fs.readFileSync(sourcePath, "utf8");
assert.equal(/\bany\b/.test(source), false);
const result = await esbuild.build({
  entryPoints: [sourcePath],
  bundle: true,
  format: "esm",
  platform: "node",
  target: "node22",
  write: false,
  logLevel: "silent",
});
const module = await import(`data:text/javascript;base64,${Buffer.from(result.outputFiles[0].text).toString("base64")}`);
let assertions = 1;
assert.equal(
  module.createPrefilledPluginPrompt({
    defaultPrompt: "  Review the workflow  ",
    pluginDisplayName: "Computer History",
    pluginId: "  chronicle\\desktop)  ",
  }),
  "[@Computer History](plugin://chronicle\\\\desktop\\)) Review the workflow",
);
assertions++;
assert.equal(
  module.createPrefilledPluginPrompt({ defaultPrompt: null, pluginDisplayName: "Plugin", pluginId: "plugin" }),
  "[@Plugin](plugin://plugin) ",
);
assertions++;
console.log(`app-primary create prefilled plugin prompt: ${assertions} assertions passed`);
