import assert from "node:assert/strict";
import fs from "node:fs";
import * as acorn from "acorn";
import { transform } from "esbuild";

let assertions = 0;
const equal = (actual, expected) => { assert.deepEqual(actual, expected); assertions += 1; };
const source = fs.readFileSync(new URL("../src/main/main-app/window/query-cache-host-service.ts", import.meta.url), "utf8");
const transpiled = await transform(source, { loader: "ts", format: "esm", target: "es2022" });
const ast = acorn.parse(transpiled.code, { ecmaVersion: "latest", sourceType: "module" });
const factoryNode = ast.body.find((node) => node.type === "FunctionDeclaration" && node.id?.name === "createQueryCacheHostServiceClass");
assert.ok(factoryNode); assertions += 1;
const createQueryCacheHostServiceClass = Function(
  "QUERY_CACHE_TIMEOUT_MS",
  `${transpiled.code.slice(factoryNode.start, factoryNode.end)}; return createQueryCacheHostServiceClass;`,
)(500);

const events = [];
class HostServiceBase {
  constructor(client, context, timeoutMs) { events.push(["construct", client, context, timeoutMs]); }
  invalidateQueryCache(request) { events.push(["base", request]); return "broadcast"; }
}
const connection = { id: "local" };
const QueryCacheHostService = createQueryCacheHostServiceClass({
  HostServiceBase,
  invalidatePluginCache: (value) => events.push(["plugins", value]),
});
const service = new QueryCacheHostService("client", connection, "context", (key) => events.push(["host", key]));
equal(events, [["construct", "client", "context", 500]]);
const pluginRequest = { queryKey: ["plugins", "list"] };
equal(service.invalidateQueryCache(pluginRequest), "broadcast");
equal(events.slice(1), [["host", pluginRequest.queryKey], ["plugins", connection], ["base", pluginRequest]]);
events.length = 0;
const threadRequest = { queryKey: ["threads"] };
equal(service.invalidateQueryCache(threadRequest), "broadcast");
equal(events, [["host", threadRequest.queryKey], ["base", threadRequest]]);

const main = fs.readFileSync(new URL("../.reference/originals/main/main-C-Mhak1n.ts", import.meta.url), "utf8");
equal(main.includes('require("./main-app/window/query-cache-host-service.js")'), true);
equal(main.includes("BO = class extends"), false);
equal(main.includes("zO = 500"), false);
equal(main.includes("BO = createQueryCacheHostServiceClass({ HostServiceBase: n.p, invalidatePluginCache: Oo })"), true);
const windowContext = fs.readFileSync(new URL("../src/main/main-app/window/window-context.ts", import.meta.url), "utf8");
equal(windowContext.includes("hostService: new BO("), true);
console.log(`${assertions} main query-cache host service owner assertions passed`);
