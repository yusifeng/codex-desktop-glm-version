import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
globalThis.self = globalThis;
globalThis.__xtermContract = { opened: [], fontChecks: [], fontLoads: [] };

const result = await esbuild.build({
  entryPoints: [path.join(ROOT, "src/renderer/xterm-window-zoom/index.ts")],
  bundle: true,
  format: "esm",
  platform: "node",
  target: "node22",
  write: false,
  logLevel: "silent",
  plugins: [{ name: "rchunk-mocks", setup(build) {
    build.onResolve({ filter: /^@rchunk\// }, ({ path: importPath }) => ({ path: importPath.slice(8), namespace: "mock" }));
    build.onLoad({ filter: /.*/, namespace: "mock" }, ({ path: moduleName }) => moduleName === "app-initial"
      ? { loader: "js", contents: "export const Dft=()=>{};export const Oft=input=>globalThis.__xtermContract.opened.push(input);" }
      : moduleName === "theme-font-family"
        ? { loader: "js", contents: "export const i=value=>value.split(',')[0].trim().replace(/^['\\\"]|['\\\"]$/g,'');export const o=(family,face)=>face==null?family:`\\\"Codex selected ${face.postscriptName}\\\", ${family}`;" }
        : { loader: "js", contents: "export {};" });
  } }],
});
const module = await import(`data:text/javascript;base64,${Buffer.from(result.outputFiles[0].text).toString("base64")}`);

assert.deepEqual(Object.keys(module).sort(), ["_", "a", "c", "d", "f", "g", "h", "i", "l", "m", "n", "o", "p", "r", "s", "t", "u", "v", "y"]);
assert.equal(typeof module._().Terminal, "function");
assert.equal(typeof module.y().FitAddon, "function");
assert.equal(typeof module.v().WebLinksAddon, "function");
assert.equal(module.o("one\ntwo\r\nthree"), "one\r\ntwo\r\nthree");
assert.equal(module.a({ code: "Berkeley Mono" }), "Berkeley Mono, monospace");
assert.equal(module.a({ code: "'JetBrains Mono', monospace" }), "'JetBrains Mono', monospace");
assert.equal(module.a({ code: "Mono", codeFace: { family: "Mono", fullName: "Mono Regular", postscriptName: "Mono-Regular" } }), '"Codex selected Mono-Regular", Mono, monospace');

const bottomTerminal = { buffer: { active: { viewportY: 8, baseY: 8 } } };
assert.equal(module.c(bottomTerminal), true);
bottomTerminal.buffer.active.viewportY = 7;
assert.equal(module.c(bottomTerminal), false);

const writes = []; let resets = 0;
const writableTerminal = {
  buffer: { active: { type: "normal", baseY: 0, cursorY: 0, getLine: () => ({ isWrapped: false }) } },
  options: {},
  reset() { resets += 1; },
  write(value, callback) { writes.push(value); callback?.(); },
};
const writer = module.r(writableTerminal);
writer.write("hello\nworld");
assert.deepEqual(writes, ["hello\nworld"]);
let replacementDone = 0; writer.replaceOutput("replacement", () => { replacementDone += 1; });
assert.equal(writes.at(-2), "\0");
assert.equal(writes.at(-1), "replacement");
assert.equal(resets, 1);
assert.equal(replacementDone, 1);
writer.dispose();

const style = { color: "#010203", backgroundColor: undefined, fontWeight: undefined, fontStyle: undefined, textDecorationLine: undefined };
const cells = [
  { getWidth: () => 1, isInvisible: () => false, getChars: () => "A", isInverse: () => false, getFgColor: () => 0x010203, isFgRGB: () => true, isFgDefault: () => false, getBgColor: () => 0, isBgRGB: () => false, isBgDefault: () => true, isBold: () => false, isDim: () => false, isItalic: () => false, isUnderline: () => false, isStrikethrough: () => false, isOverline: () => false },
  { getWidth: () => 1, isInvisible: () => false, getChars: () => "B", isInverse: () => false, getFgColor: () => 0x010203, isFgRGB: () => true, isFgDefault: () => false, getBgColor: () => 0, isBgRGB: () => false, isBgDefault: () => true, isBold: () => false, isDim: () => false, isItalic: () => false, isUnderline: () => false, isStrikethrough: () => false, isOverline: () => false },
];
const outputTerminal = { cols: 2, options: {}, buffer: { active: { baseY: 0, cursorY: 0, getNullCell: () => ({}), getLine: () => ({ length: 2, getCell: (index) => cells[index] }) } } };
assert.deepEqual(module.l(outputTerminal), [{ text: "AB", style }]);

const elementStyle = { backgroundColor: "rgb(0, 0, 0)", color: "rgb(255, 255, 255)", getPropertyValue: (name) => name === "--color-codex-terminal-background" ? "#101010" : name === "--color-codex-terminal-foreground" ? "#f0f0f0" : "" };
const probe = { style: {}, remove() {} };
const element = { append(value) { assert.equal(value, probe); } };
globalThis.document = { documentElement: {}, createElement: () => probe, fonts: { check(value) { globalThis.__xtermContract.fontChecks.push(value); return false; }, async load(value) { globalThis.__xtermContract.fontLoads.push(value); } } };
globalThis.getComputedStyle = (target) => target === probe ? { color: probe.style.color } : elementStyle;
const theme = module.d(element);
assert.equal(theme.background, "#101010");
assert.equal(theme.foreground, "#f0f0f0");
await module.i("'JetBrains Mono', monospace", 13);
assert.deepEqual(globalThis.__xtermContract.fontChecks, ["13px JetBrains Mono"]);
assert.deepEqual(globalThis.__xtermContract.fontLoads, ["13px JetBrains Mono"]);

module.m({ type: "click" }, "https://example.com");
assert.equal(globalThis.__xtermContract.opened[0].href, "https://example.com");
assert.equal(globalThis.__xtermContract.opened[0].initiator, "terminal_link_click");
assert.equal(module.h.activate, module.m);

let scaledEvent;
const screen = { getBoundingClientRect: () => ({ left: 10, top: 20 }) };
const mouse = { getCoords(event) { scaledEvent = event; return event; }, getMouseReportCoords(event) { return event; } };
const terminalWithPrivateCore = { _core: { _mouseService: mouse, _selectionService: { _screenElement: screen, _getMouseEventScrollAmount: (event) => event.clientY } } };
const detach = module.n(terminalWithPrivateCore, () => 2);
mouse.getCoords({ clientX: 30, clientY: 60 }, screen);
assert.deepEqual(scaledEvent, { clientX: 20, clientY: 40 });
detach();
assert.equal(typeof mouse.getCoords, "function");

for (const initializer of [module.f, module.g, module.p, module.s, module.t, module.u]) assert.equal(initializer(), undefined);
console.log("32 xterm window/zoom contract assertions passed");
