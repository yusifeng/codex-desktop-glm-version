import assert from "node:assert/strict";
import fs from "node:fs";
import * as acorn from "acorn";
import { transform } from "esbuild";

let assertions = 0;
const equal = (actual, expected) => { assert.deepEqual(actual, expected); assertions += 1; };
const source = fs.readFileSync(new URL("../src/main/main-app/browser-use/origin-state.ts", import.meta.url), "utf8");
const transpiled = await transform(source, { loader: "ts", format: "esm", target: "es2022" });
const ast = acorn.parse(transpiled.code, { ecmaVersion: "latest", sourceType: "module" });
const classNode = ast.body.find((node) => node.type === "ClassDeclaration" && node.id?.name === "BrowserUseOriginState");
assert.ok(classNode); assertions += 1;
equal(classNode.body.body.length, 7);

class EventEmitterBase {}
const calls = [];
const config = {};
const BrowserUseOriginState = Function(
  "EventEmitterBase", "setWebMcpEnabled", "setIabHistoryApprovalMode", "assertIabModeAllowedByPolicy",
  "originRuleUpdateSchema", "readBrowserConfig", "computeRuleUpdates", "writeBrowserConfig", "projectOriginState",
  `${transpiled.code.slice(classNode.start, classNode.end)}; return BrowserUseOriginState;`,
)(
  EventEmitterBase,
  async (...args) => { calls.push(["webmcp", ...args]); return "webmcp-updated"; },
  async (...args) => { calls.push(["history", ...args]); return "history-updated"; },
  async (...args) => calls.push(["policy", ...args]),
  { parse: (rules) => rules },
  async () => config,
  (_config, updates) => { calls.push(["rules", updates]); return []; },
  async (...args) => calls.push(["write", ...args]),
  (value) => ({ projected: value }),
);
const sync = async () => false;
const service = new BrowserUseOriginState("/codex", async () => ({ requirements: {} }), sync);
equal(await service.updateWebMcpEnabled(true), "webmcp-updated");
equal(calls[0], ["webmcp", true, "/codex", sync]);
equal(await service.updateIabHistoryApprovalMode("alwaysAsk"), "history-updated");
equal(calls[1].slice(0, 4), ["history", "alwaysAsk", "/codex", sync]);
const rules = [{ action: "add", kind: "allowed", origin: "example.com", resource: "origin" }];
equal(await service.updateOriginRules(rules), { projected: config });
equal(calls.some((entry) => entry[0] === "write"), true);

const main = fs.readFileSync(new URL("../.reference/originals/main/main-C-Mhak1n.ts", import.meta.url), "utf8");
equal(main.includes("BrowserUseOriginState: XOe"), true);
equal(main.includes("XOe = class"), false);
equal(main.includes("browserUsePermissions: new XOe("), false);
const windowContext = fs.readFileSync(new URL("../src/main/main-app/window/window-context.ts", import.meta.url), "utf8");
equal(windowContext.includes("browserUsePermissions: new XOe("), true);
console.log(`${assertions} main BrowserUseOriginState owner assertions passed`);
