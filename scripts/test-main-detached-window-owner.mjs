import assert from "node:assert/strict";
import fs from "node:fs";
import * as acorn from "acorn";
import { transform } from "esbuild";

const moduleSource = fs.readFileSync(
  new URL("../src/main/main-app/window/detached-window-manager.ts", import.meta.url),
  "utf8",
);
const transpiled = await transform(moduleSource, {
  loader: "ts",
  format: "esm",
  target: "es2022",
});
const ast = acorn.parse(transpiled.code, {
  ecmaVersion: "latest",
  sourceType: "module",
});
const classes = new Map(
  ast.body
    .filter((node) => node.type === "ClassDeclaration")
    .map((node) => [node.id.name, node]),
);

let assertions = 0;
const equal = (actual, expected) => {
  assert.deepEqual(actual, expected);
  assertions += 1;
};

const expectedMethodCounts = {
  PrewarmSlot: 14,
  DetachedWindowPrewarmer: 17,
  DetachedWindowManager: 35,
  DetachedWindowService: 18,
  ThreadHandoffLease: 3,
  DeviceCheckCookieManager: 8,
  CallIdClaimRegistry: 2,
};
for (const [name, expectedCount] of Object.entries(expectedMethodCounts)) {
  const node = classes.get(name);
  assert.ok(node, `${name} should survive TypeScript transformation`);
  assertions += 1;
  equal(node.body.body.length, expectedCount);
}

const registryNode = classes.get("CallIdClaimRegistry");
const registrySource = transpiled.code.slice(registryNode.start, registryNode.end);
const CallIdClaimRegistry = Function(
  "EventEmitterBase",
  "CLAIM_REGISTRY_LIMIT",
  `${registrySource}; return CallIdClaimRegistry;`,
)(class {}, 2);
const registry = new CallIdClaimRegistry();
const call = (callId) => ({ callId, hostId: "local", threadId: "thread", turnId: "turn" });
equal(registry.tryClaimExecution(call("a")), true);
equal(registry.tryClaimExecution(call("a")), false);
equal(registry.tryClaimExecution(call("b")), true);
equal(registry.tryClaimExecution(call("c")), true);
equal(registry.tryClaimExecution(call("a")), true);

const leaseNode = classes.get("ThreadHandoffLease");
const leaseSource = transpiled.code.slice(leaseNode.start, leaseNode.end);
const ThreadHandoffLease = Function(
  "EventEmitterBase",
  `${leaseSource}; return ThreadHandoffLease;`,
)(class {});
let releases = 0;
const lease = new ThreadHandoffLease(() => {
  releases += 1;
});
lease[Symbol.dispose]();
equal(releases, 1);

const main = fs.readFileSync(
  new URL("../.reference/originals/main/main-C-Mhak1n.ts", import.meta.url),
  "utf8",
);
const aliases = {
  GN: "PrewarmSlot",
  qje: "DetachedWindowPrewarmer",
  Jje: "DetachedWindowManager",
  Yje: "DetachedWindowService",
  Xje: "ThreadHandoffLease",
  Qje: "DeviceCheckCookieManager",
  eMe: "CallIdClaimRegistry",
};
for (const [generatedName, semanticName] of Object.entries(aliases)) {
  equal(main.includes(`${generatedName} = ${semanticName}`), true);
  equal(main.includes(`${generatedName} = class`), false);
}
equal(main.includes('require("./main-app/window/detached-window-manager.js")'), true);

console.log(`${assertions} main detached window owner assertions passed`);
