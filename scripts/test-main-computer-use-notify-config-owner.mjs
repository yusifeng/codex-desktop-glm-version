import assert from "node:assert/strict";
import fs from "node:fs";
import * as acorn from "acorn";
import { transform } from "esbuild";

let assertions = 0;
const equal = (actual, expected) => { assert.deepEqual(actual, expected); assertions += 1; };
const source = fs.readFileSync(new URL("../src/main/main-app/computer-use/notify-config.ts", import.meta.url), "utf8");
const transpiled = await transform(source, { loader: "ts", format: "esm", target: "es2022" });
const ast = acorn.parse(transpiled.code, { ecmaVersion: "latest", sourceType: "module" });
const fn = (name) => ast.body.find((node) => node.type === "FunctionDeclaration" && node.id?.name === name);
const slice = (name) => { const node = fn(name); assert.ok(node); assertions += 1; return transpiled.code.slice(node.start, node.end); };

const helperDefinitions = [
  "isStringArray",
  "isComputerUseHelperNotifyEntry",
  "parsePreviousNotify",
  "unwrapPreviousNotifyChain",
].map(slice).join("\n");
const unwrapPreviousNotifyChain = Function(
  "PREVIOUS_NOTIFY_ARG", "TURN_ENDED_ARG", "HELPER_EXECUTABLE_PATTERN",
  `${helperDefinitions}; return unwrapPreviousNotifyChain;`,
)("--previous-notify", "turn-ended", /^codex-computer-use(?:-arm64)?\.exe$/i);
const original = ["notify-send", "done"];
const inner = ["C:\\tools\\codex-computer-use.exe", "turn-ended", "--previous-notify", JSON.stringify(original)];
const outer = ["C:\\tools\\codex-computer-use-arm64.exe", "turn-ended", "--previous-notify", JSON.stringify(inner)];
equal(unwrapPreviousNotifyChain(outer), original);
equal(unwrapPreviousNotifyChain(["custom", "event"]), ["custom", "event"]);
equal(unwrapPreviousNotifyChain(null), null);

const insertNotifyLine = Function(`${slice("insertNotifyLine")}; return insertNotifyLine;`)();
equal(
  insertNotifyLine('model = "gpt"\nnotify = [\n  "old",\n  "event"\n]\n[tools]\nenabled = true\n', 'notify = ["new", "turn-ended"]'),
  'model = "gpt"\nnotify = ["new", "turn-ended"]\n[tools]\nenabled = true\n',
);

const notifyArraysEqual = Function(`${slice("notifyArraysEqual")}; return notifyArraysEqual;`)();
equal(notifyArraysEqual(["a", "b"], ["a", "b"]), true);
equal(notifyArraysEqual(["a"], ["a", "b"]), false);

equal(source.includes("unwrapPreviousNotifyChain(parsePreviousNotify(notify))"), true);
const main = fs.readFileSync(new URL("../.reference/originals/main/main-C-Mhak1n.ts", import.meta.url), "utf8");
equal(main.includes('const { ensureComputerUseNotifyConfig: iie } = require("./main-app/computer-use/notify-config.js");'), true);
equal(main.includes("async function iie("), false);
equal(main.includes("function aie("), false);
equal(main.includes("function Vo("), false);
equal(main.includes("ensureNotifyConfig: t = iie"), true);
console.log(`${assertions} main computer-use notify config owner assertions passed`);
