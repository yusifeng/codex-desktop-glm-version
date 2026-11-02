#!/usr/bin/env node
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { build } from "esbuild";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const output = path.join(root, ".tmp-test-app-primary-extract-skill-kind.mjs");
await build({ entryPoints: [path.join(root, "src/renderer/app-primary/runtime/extract-skill-kind.ts")], bundle: true, format: "esm", platform: "node", outfile: output });
const m = await import(`${output}?test=${Date.now()}`);
assert.equal(m.extractSkillKindFromPath("plugin://Documents@1"), "document");
assert.equal(m.extractSkillKindFromPath("C:\\x\\skills\\.system\\presentations\\skill.md"), "presentation");
assert.equal(m.extractSkillKindFromPath("/skills/unknown/skill.md"), null);
assert.equal(m.extractSkillKindFromMentions([{ type: "paragraph" }, { type: "pluginMention", attrs: { path: "plugin://google-sheets" } }]), "google-sheets");
assert.equal(m.extractSkillKindFromMentions([{ type: "pluginMention", attrs: { path: "plugin://documents" } }], "spreadsheet"), "document");
assert.equal(m.extractSkillKindFromPrompt("Use [Sheets](plugin://spreadsheets@1)"), "spreadsheet");
assert.equal(m.extractSkillKindFromPrompt("[Doc](plugin://documents\\@1) then [Slides](plugin://presentations@2)"), "presentation");
assert.equal(m.extractSkillKindFromPrompt("[Doc](plugin://documents) [unknown](plugin://unknown)"), "document");
assert.equal(m.extractSkillKindFromPrompt("[empty]()\n[broken](plugin://documents"), null);
fs.unlinkSync(output);
console.log("9 app-primary extract-skill-kind assertions passed");
