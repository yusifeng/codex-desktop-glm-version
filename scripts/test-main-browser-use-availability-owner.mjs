import assert from "node:assert/strict";
import fs from "node:fs";
import * as acorn from "acorn";
import { transform } from "esbuild";

let assertions = 0;
const equal = (actual, expected) => { assert.deepEqual(actual, expected); assertions += 1; };
const source = fs.readFileSync(new URL("../src/main/main-app/browser-use/availability.ts", import.meta.url), "utf8");
const transpiled = await transform(source, { loader: "ts", format: "esm", target: "es2022" });
const ast = acorn.parse(transpiled.code, { ecmaVersion: "latest", sourceType: "module" });
const fn = (name) => ast.body.find((node) => node.type === "FunctionDeclaration" && node.id?.name === name);
const registerNode = fn("registerInAppBrowserAvailabilityProbe");
const readNode = fn("readInAppBrowserAvailability");
assert.ok(registerNode && readNode); assertions += 1;
const warnings = [];
const createDeferred = () => {
  let resolve;
  const promise = new Promise((done) => { resolve = done; });
  return { promise, resolve };
};
const definitions = [readNode, registerNode].map((node) => transpiled.code.slice(node.start, node.end)).join("\n");
const registerInAppBrowserAvailabilityProbe = Function(
  "createDeferred", "getLogger", "IN_APP_BROWSER_FEATURE_NAME", "FEATURE_LIST_PAGE_SIZE",
  `${definitions}; return registerInAppBrowserAvailabilityProbe;`,
)(createDeferred, () => ({ warning: (...args) => warnings.push(args) }), "in_app_browser", 100);

const registered = [];
const registry = { register: (...args) => registered.push(args) };
const cursors = [];
const read = registerInAppBrowserAvailabilityProbe(registry, async ({ cursor, limit }) => {
  cursors.push([cursor, limit]);
  return cursor == null
    ? { data: [{ name: "other", enabled: false }], nextCursor: "page-2" }
    : { data: [{ name: "in_app_browser", enabled: false }], nextCursor: null };
});
equal(registered.length, 1);
equal(typeof registered[0][1], "function");
equal(await read(), false);
equal(cursors, [[null, 100], ["page-2", 100]]);
equal(await registered[0][0], false);

const fallbackRegistered = [];
const fallbackRead = registerInAppBrowserAvailabilityProbe(
  { register: (...args) => fallbackRegistered.push(args) },
  async () => { throw new Error("offline"); },
);
equal(await fallbackRead(), true);
equal(await fallbackRegistered[0][0], true);
equal(warnings.length, 1);

const main = fs.readFileSync(new URL("../.reference/originals/main/main-C-Mhak1n.ts", import.meta.url), "utf8");
equal(main.includes('const { registerInAppBrowserAvailabilityProbe: Jse } = require("./main-app/browser-use/availability.js");'), true);
equal(main.includes("function Jse("), false);
equal(main.includes("async function Yse("), false);
equal(main.includes("Fe = Jse(m, (e) => Pe().sendAppServerRequest(`experimentalFeature/list`, e))"), true);
console.log(`${assertions} main browser-use availability owner assertions passed`);
