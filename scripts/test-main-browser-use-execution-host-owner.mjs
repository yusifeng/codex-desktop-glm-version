import assert from "node:assert/strict";
import fs from "node:fs";
import * as acorn from "acorn";
import { transform } from "esbuild";

let assertions = 0;
const equal = (actual, expected) => { assert.deepEqual(actual, expected); assertions += 1; };
const source = fs.readFileSync(new URL("../src/main/main-app/browser-use/execution-host.ts", import.meta.url), "utf8");
const transpiled = await transform(source, { loader: "ts", format: "esm", target: "es2022" });
const ast = acorn.parse(transpiled.code, { ecmaVersion: "latest", sourceType: "module" });
const declaration = (name) => ast.body.find((node) =>
  (node.type === "FunctionDeclaration" || node.type === "ClassDeclaration") && node.id?.name === name,
);
const slice = (name) => {
  const node = declaration(name);
  assert.ok(node, `missing ${name}`);
  assertions += 1;
  return transpiled.code.slice(node.start, node.end);
};

const toStatSnapshot = Function(`${slice("toStatSnapshot")}; return toStatSnapshot;`)();
equal(toStatSnapshot({
  birthtimeMs: 1,
  ctimeMs: 2,
  ino: 3,
  mtimeMs: 4,
  size: 5,
  isDirectory: () => true,
  isFile: () => false,
  isSymbolicLink: () => true,
}), {
  birthtimeMs: 1,
  ctimeMs: 2,
  ino: 3,
  isDirectory: true,
  isFile: false,
  isSymbolicLink: true,
  mtimeMs: 4,
  size: 5,
});

class SharedEventEmitter {}
const FileChangeBatcher = Function(
  "FILE_WATCH_BATCH_DELAY_MS",
  "FILE_WATCH_BATCH_MAX_PATHS",
  `${slice("FileChangeBatcher")}; return FileChangeBatcher;`,
)(16, 256);
const changed = [];
let resultDisposed = 0;
let callbackDisposed = 0;
const onChange = (event) => {
  changed.push(event.changedPaths);
  const result = Promise.resolve();
  result[Symbol.dispose] = () => { resultDisposed += 1; };
  return result;
};
onChange[Symbol.dispose] = () => { callbackDisposed += 1; };
const batcher = new FileChangeBatcher(onChange);
batcher.enqueue({ changedPaths: ["b", "a", "a"] });
batcher.flush();
await Promise.resolve();
equal(changed, [["b", "a"]]);
equal(resultDisposed, 1);
batcher.enqueue({ changedPaths: [] });
batcher.flush();
await Promise.resolve();
equal(changed, [["b", "a"], []]);
batcher[Symbol.dispose]();
batcher[Symbol.dispose]();
equal(callbackDisposed, 1);

const ChildProcessHandle = Function(
  "SharedEventEmitter",
  `${slice("ChildProcessHandle")}; return ChildProcessHandle;`,
)(SharedEventEmitter);
let resolveWait;
let killCount = 0;
const processHandle = new ChildProcessHandle({
  kill: () => { killCount += 1; },
  resize: (size) => size,
  wait: () => new Promise((resolve) => { resolveWait = resolve; }),
});
equal(processHandle.resize({ cols: 80 }), { cols: 80 });
processHandle[Symbol.dispose]();
equal(killCount, 1);
resolveWait("done");
equal(await processHandle.wait(), "done");
processHandle[Symbol.dispose]();
equal(killCount, 1);

const registryFactory = Function(
  "SharedEventEmitter",
  `${slice("RemoteExecutionHostAdapter")}; ${slice("ExecutionHostRegistry")}; return ExecutionHostRegistry;`,
);
const ExecutionHostRegistry = registryFactory(SharedEventEmitter);
const registry = new ExecutionHostRegistry((hostId) => ({ hostId }));
equal(registry.getHost("local"), registry.getHost("local"));
assert.notEqual(registry.getHost("local"), registry.getHost("remote"));
assertions += 1;

const main = fs.readFileSync(new URL("../.reference/originals/main/main-C-Mhak1n.ts", import.meta.url), "utf8");
equal(main.includes('const { ExecutionHostRegistry: fte } = require("./main-app/browser-use/execution-host.js");'), true);
for (const name of ["fte", "pte", "mte", "hte", "gte"]) equal(main.includes(`${name} = class`), false);
equal(main.includes("function _te("), false);
equal(main.includes("new fte((e) => {"), true);
equal(main.includes("Se.setGitWorkerMainRpcTarget("), true);

console.log(`${assertions} main browser-use execution host owner assertions passed`);
