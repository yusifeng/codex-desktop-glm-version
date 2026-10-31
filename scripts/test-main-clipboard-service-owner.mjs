import assert from "node:assert/strict";
import fs from "node:fs";
import * as acorn from "acorn";
import { transform } from "esbuild";

let assertions = 0;
const equal = (actual, expected) => { assert.deepEqual(actual, expected); assertions += 1; };
const source = fs.readFileSync(new URL("../src/main/main-app/clipboard/service.ts", import.meta.url), "utf8");
const transpiled = await transform(source, { loader: "ts", format: "esm", target: "es2022" });
const ast = acorn.parse(transpiled.code, { ecmaVersion: "latest", sourceType: "module" });
const classNode = ast.body.find((node) => node.type === "ClassDeclaration" && node.id?.name === "ClipboardService");
assert.ok(classNode); assertions += 1;
equal(classNode.body.body.length, 3);

class EventEmitterBase {}
const writes = [];
let bookmark = { title: "Codex", url: "https://example.com" };
const clipboard = {
  readBookmark: () => bookmark,
  readText: () => "copied text",
  writeText: (text) => writes.push(text),
};
const load = (platform) => Function(
  "EventEmitterBase", "clipboard", "process",
  `${transpiled.code.slice(classNode.start, classNode.end)}; return ClipboardService;`,
)(EventEmitterBase, clipboard, { platform });
const darwinService = new (load("darwin"))();
equal(darwinService.bookmark, bookmark);
bookmark = { title: "", url: "https://example.com" };
equal(darwinService.bookmark, undefined);
equal(new (load("win32"))().bookmark, undefined);
equal(await darwinService.readText(), "copied text");
await darwinService.writeText("next text");
equal(writes, ["next text"]);

const main = fs.readFileSync(new URL("../.reference/originals/main/main-C-Mhak1n.ts", import.meta.url), "utf8");
equal(main.includes('const { ClipboardService: VO } = require("./main-app/clipboard/service.js");'), true);
equal(main.includes("VO = class"), false);
const windowContext = fs.readFileSync(new URL("../src/main/main-app/window/window-context.ts", import.meta.url), "utf8");
equal(windowContext.includes("clipboard: new VO()"), true);
console.log(`${assertions} main ClipboardService owner assertions passed`);
