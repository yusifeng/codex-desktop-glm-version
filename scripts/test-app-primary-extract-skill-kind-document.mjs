import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import * as esbuild from "esbuild";

const result = await esbuild.build({
  entryPoints: ["src/renderer/app-primary/runtime/extract-skill-kind.ts"],
  bundle: true,
  format: "esm",
  platform: "node",
  write: false,
  logLevel: "silent",
});
const { extractSkillKindFromDocument } = await import(
  `data:text/javascript;base64,${Buffer.from(result.outputFiles[0].text).toString("base64")}`
);

const document = {
  descendants(callback) {
    callback({ type: "paragraph" });
    callback({ type: "pluginMention", attrs: { path: "plugin://documents@v2" } });
    callback({ type: "skillMention", attrs: { path: "C:\\tmp\\skills\\spreadsheets\\skill.md" } });
  },
};
assert.equal(extractSkillKindFromDocument(document), "spreadsheet");
assert.equal(extractSkillKindFromDocument(document, "spreadsheet"), "spreadsheet");
assert.equal(
  extractSkillKindFromDocument({ descendants: (callback) => { callback({ type: "paragraph" }); } }),
  null,
);
assert.equal(
  extractSkillKindFromDocument({ descendants: (callback) => { callback({ type: "pluginMention", attrs: { path: "plugin://unknown" } }); } }, "document"),
  "document",
);
console.log("test-app-primary-extract-skill-kind-document: 4 assertions passed");
