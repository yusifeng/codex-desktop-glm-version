import assert from "node:assert/strict";
import { createRequire } from "node:module";

globalThis.isSecureContext = true;
globalThis.originAgentCluster = true;
const require = createRequire(import.meta.url);
const { createWebMcpRegistry } = require("../app/.vite/build/browser-page-preload/webmcp-registry.js");
const registry = createWebMcpRegistry({ locationLike: { protocol: "https:", origin: "https://example.test", href: "https://example.test/page" } });
const changed = [];
let receivedInput;
let contextFrozen;
const tool = {
  name: "sum",
  description: "Add values",
  inputSchema: { type: "object" },
  execute: async (input, context) => {
    receivedInput = input;
    contextFrozen = Object.isFrozen(context);
    return { value: input.value + 1 };
  },
};
const registration = registry.registerTool(tool, { signal: new AbortController().signal });
await registration;
const tools = await registry.getTools();
assert.equal(tools.length, 1);
assert.equal(tools[0].pageUrl, "https://example.test/page");
const input = Object.assign(Object.create({ inherited: true }), { value: 2, omitted: undefined });
assert.equal(await registry.executeTool({ name: "sum" }, input), JSON.stringify({ value: 3 }));
assert.deepEqual(receivedInput, { value: 2 });
assert.equal(contextFrozen, false);
const circular = {};
circular.self = circular;
await assert.rejects(() => registry.executeTool({ name: "sum" }, circular), /JSON-serializable object input/);
const codexTools = registry.codexGetTools();
assert.equal(codexTools[0].registrationId.length > 0, true);
await assert.rejects(() => registry.codexExecuteTool({ name: "sum", registrationId: "stale" }, JSON.stringify({ value: 1 })), /stale/);
await assert.rejects(() => registry.registerTool(tool), /already registered/);

console.log("9 preload WebMCP registry assertions passed");
