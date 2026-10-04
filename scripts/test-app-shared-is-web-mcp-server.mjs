#!/usr/bin/env node
import assert from "node:assert/strict";
import path from "node:path";
import { build } from "esbuild";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const output = path.join(root, ".tmp-test-is-web-mcp-server.mjs");
await build({ entryPoints: [path.join(root, "src/renderer/app-shared/runtime/is-web-mcp-server.ts")], bundle: true, format: "esm", platform: "node", outfile: output });
const { isWebMcpServer } = await import(`${output}?test=${Date.now()}`);
assert.equal(isWebMcpServer("node_repl"), true);
assert.equal(isWebMcpServer("cua_repl"), true);
assert.equal(isWebMcpServer("filesystem"), false);
assert.equal(isWebMcpServer(null), false);
console.log("4 app-shared web MCP server assertions passed");
