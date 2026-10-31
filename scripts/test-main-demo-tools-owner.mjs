import assert from "node:assert/strict";
import fs from "node:fs";
import * as acorn from "acorn";
import { transform } from "esbuild";

let assertions = 0;
const equal = (actual, expected) => {
  assert.deepEqual(actual, expected);
  assertions += 1;
};

const source = fs.readFileSync(
  new URL("../src/main/main-app/debug/export-logs.ts", import.meta.url),
  "utf8",
);
const transpiled = await transform(source, { loader: "ts", format: "esm", target: "es2022" });
const ast = acorn.parse(transpiled.code, { ecmaVersion: "latest", sourceType: "module" });
for (const [name, members] of [
  ["ChatGPTAppDemoBackend", 5],
  ["DemoTools", 9],
  ["DemoToolsService", 8],
]) {
  const node = ast.body.find((entry) => entry.type === "ClassDeclaration" && entry.id?.name === name);
  assert.ok(node, `${name} must exist`);
  assertions += 1;
  equal(node.body.body.length, members);
}

const factoryNode = ast.body.find(
  (node) => node.type === "FunctionDeclaration" && node.id?.name === "createDemoTools",
);
assert.ok(factoryNode);
assertions += 1;
class DemoTools {
  constructor(backend) { this.backend = backend; }
}
class ChatGPTAppDemoBackend {}
const createDemoTools = Function(
  "BUILD_FLAVOR_VALUES",
  "DemoTools",
  "ChatGPTAppDemoBackend",
  `${transpiled.code.slice(factoryNode.start, factoryNode.end)}; return createDemoTools;`,
)({ Dev: "dev" }, DemoTools, ChatGPTAppDemoBackend);

equal(createDemoTools({ buildFlavor: "prod", isPackaged: false, platform: "darwin" }), undefined);
equal(createDemoTools({ buildFlavor: "dev", isPackaged: true, platform: "darwin" }), undefined);
equal(createDemoTools({ buildFlavor: "prod", isPackaged: true, platform: "linux" }), undefined);
const enabled = createDemoTools({ buildFlavor: "prod", isPackaged: true, platform: "darwin" });
equal(enabled instanceof DemoTools, true);
equal(enabled.backend instanceof ChatGPTAppDemoBackend, true);

const main = fs.readFileSync(
  new URL("../.reference/originals/main/main-C-Mhak1n.ts", import.meta.url),
  "utf8",
);
equal(main.includes('const { createDemoTools } = require("./main-app/debug/export-logs.js");'), true);
equal(main.includes("Wje = createDemoTools;"), true);
equal(main.includes("Bje = class"), false);
equal(main.includes("Hje = class"), false);
equal(main.includes("Uje = class"), false);

const windowContext = fs.readFileSync(
  new URL("../src/main/main-app/window/window-context.ts", import.meta.url),
  "utf8",
);
equal(windowContext.includes("this.demoTools = Wje({"), true);

console.log(`${assertions} main demo tools owner assertions passed`);
