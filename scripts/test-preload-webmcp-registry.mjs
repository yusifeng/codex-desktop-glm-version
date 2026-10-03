import assert from "node:assert/strict";
import { createRequire } from "node:module";

globalThis.isSecureContext = true;
globalThis.originAgentCluster = true;
const require = createRequire(import.meta.url);
const { createWebMcpRegistry } = require("../app/.vite/build/browser-page-preload/webmcp-registry.js");
const registry = createWebMcpRegistry({ locationLike: { protocol: "https:", origin: "https://example.test", href: "https://example.test/page" } });
const changed = [];
const tool = { name: "sum", description: "Add values", inputSchema: { type: "object" }, execute: async ({ value }) => ({ value: value + 1 }) };
const registration = registry.registerTool(tool, { signal: new AbortController().signal });
await registration;
const tools = await registry.getTools();
assert.equal(tools.length, 1);
assert.equal(tools[0].pageUrl, "https://example.test/page");
assert.equal(await registry.executeTool({ name: "sum" }, { value: 2 }), JSON.stringify({ value: 3 }));
const codexTools = registry.codexGetTools();
assert.equal(codexTools[0].registrationId.length > 0, true);
await assert.rejects(() => registry.codexExecuteTool({ name: "sum", registrationId: "stale" }, JSON.stringify({ value: 1 })), /stale/);
await assert.rejects(() => registry.registerTool(tool), /already registered/);

console.log("7 preload WebMCP registry assertions passed");
