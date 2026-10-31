import assert from "node:assert/strict";
import fs from "node:fs";
import { createArtifactRpcServices } from "../src/main/main-app/artifacts/artifact-rpc-services.ts";

const { ExternalDocumentBindingSession, ArtifactSessionOperationsSubscription } =
  createArtifactRpcServices({ RpcHandlerBase: class {} });

const bindingCalls = [];
const binding = new ExternalDocumentBindingSession(
  (request) => { bindingCalls.push(["activate", request]); return "active"; },
  () => { bindingCalls.push(["unbind"]); return "unbound"; },
);
assert.equal(binding.activate({ documentId: "document" }), "active");
assert.equal(binding.unbind(), "unbound");
binding[Symbol.dispose]();
assert.deepEqual(bindingCalls, [
  ["activate", { documentId: "document" }],
  ["unbind"],
  ["unbind"],
]);

const operationCalls = [];
const subscription = new ArtifactSessionOperationsSubscription({
  append: (request) => { operationCalls.push(["append", request]); return "appended"; },
  markDirty: () => operationCalls.push(["dirty"]),
  readAsset: (request) => { operationCalls.push(["read", request]); return "asset"; },
  unsubscribe: () => { operationCalls.push(["unsubscribe"]); return "done"; },
});
assert.equal(subscription.append({ updateId: "update" }), "appended");
assert.equal(subscription.markDirty(), undefined);
assert.equal(subscription.readAsset({ assetId: "asset" }), "asset");
assert.equal(subscription.unsubscribe(), undefined);
subscription[Symbol.dispose]();
assert.deepEqual(operationCalls, [
  ["append", { updateId: "update" }],
  ["dirty"],
  ["read", { assetId: "asset" }],
  ["unsubscribe"],
  ["unsubscribe"],
]);

const main = fs.readFileSync(new URL("../.reference/originals/main/main-C-Mhak1n.ts", import.meta.url), "utf8");
assert.match(main, /ExternalDocumentBindingSession: Met/);
assert.match(main, /ArtifactSessionOperationsSubscription: Het/);
assert.doesNotMatch(main, /Met = class/);
assert.doesNotMatch(main, /Het = class/);
assert.match(main, /createBinding: \(e, t\) => new Met\(e, t\)/);
assert.match(main, /createSubscription: \(e\) => new Het\(e\)/);

console.log("artifact rpc services assertions: 15");
