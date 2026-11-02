#!/usr/bin/env node
import assert from "node:assert/strict";
import esbuild from "esbuild";

const sourcePath = new URL("../src/renderer/app-initial/runtime/markdown-links.ts", import.meta.url).pathname;
const built = await esbuild.build({
  entryPoints: [sourcePath],
  bundle: true,
  format: "esm",
  platform: "node",
  target: "node22",
  write: false,
  logLevel: "silent",
});
const mod = await import(`data:text/javascript;base64,${Buffer.from(built.outputFiles[0].text).toString("base64")}`);

assert.equal(mod.unescapeMarkdownPunctuation(String.raw`plugin://documents\@1`), "plugin://documents@1");
assert.equal(mod.unescapeMarkdownPunctuation(String.raw`keep\a`), String.raw`keep\a`);
assert.deepEqual(mod.findNextMarkdownLink("before [label](plugin://documents@1) after", 0), {
  start: 7,
  end: 36,
  label: "label",
  path: "plugin://documents@1",
});
assert.deepEqual(mod.findNextMarkdownLink(String.raw`[a](plugin://documents\@1)`, 0), {
  start: 0,
  end: 26,
  label: "a",
  path: String.raw`plugin://documents\@1`,
});
assert.equal(mod.findNextMarkdownLink("[](/empty-label)", 0), null);
assert.equal(mod.findNextMarkdownLink("[empty]()", 0), null);
assert.equal(mod.findNextMarkdownLink("[line\nbreak](plugin://documents)", 0), null);
assert.equal(mod.findNextMarkdownLink("[unterminated](plugin://documents", 0), null);

console.log("8 app-initial Markdown-link assertions passed");
