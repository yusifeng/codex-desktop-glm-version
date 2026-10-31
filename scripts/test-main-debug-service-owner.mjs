import assert from "node:assert/strict";
import fs from "node:fs";
import * as acorn from "acorn";
import { transform } from "esbuild";

let assertions = 0;
const equal = (actual, expected) => { assert.deepEqual(actual, expected); assertions += 1; };
const source = fs.readFileSync(new URL("../src/main/main-app/debug/export-logs.ts", import.meta.url), "utf8");
const transpiled = await transform(source, { loader: "ts", format: "esm", target: "es2022" });
const ast = acorn.parse(transpiled.code, { ecmaVersion: "latest", sourceType: "module" });
const classNode = ast.body.find((node) => node.type === "ClassDeclaration" && node.id?.name === "DebugService");
assert.ok(classNode); assertions += 1;
equal(classNode.body.body.length, 19);

class EventEmitterBase {}
let exported;
const DebugService = Function(
  "EventEmitterBase", "exportLogs", "appSessionId", "BrowserWindow",
  `${transpiled.code.slice(classNode.start, classNode.end)}; return DebugService;`,
)(EventEmitterBase, async (value) => { exported = value; }, "session-1", { fromWebContents: () => "window-1" });
const calls = [];
const debugWindowManager = {
  show: async (origin) => calls.push(["show", origin.id]),
  getOwnerWebContentsId: () => 99,
  chatGptConversations: {
    registerSource: (id) => ["source", id],
    runAction: (id, action) => [id, action],
    subscribe: (ownerId, originId) => [ownerId, originId],
  },
};
const browserHostManager = {
  getDebugSnapshot: () => ({ ready: true }),
  openDebugTabOwner: (value) => value,
};
const origin = { id: 7 };
const service = new DebugService(debugWindowManager, browserHostManager, origin, {});
equal(await service.getBrowserSnapshot(), { ready: true });
equal(await service.openBrowserTabOwner("tab-1"), "tab-1");
await service.openWindow();
equal(calls, [["show", 7]]);
equal(service.registerChatGptConversationSource("source"), ["source", 7]);
equal(await service.runChatGptConversationAction("action"), [99, "action"]);
equal(service.subscribeChatGptConversation("listener"), [99, 7]);
await service.exportLogs({ scope: "session" });
equal(exported, { appSessionId: "session-1", parentWindow: "window-1", scope: "session" });
await assert.rejects(service.captureMemoryAllocationProfiles(), /unavailable/); assertions += 1;

const main = fs.readFileSync(new URL("../.reference/originals/main/main-C-Mhak1n.ts", import.meta.url), "utf8");
equal(main.includes('const { DebugService, createDemoTools } = require("./main-app/debug/export-logs.js");'), true);
equal(main.includes("var zje = DebugService,"), true);
equal(main.includes("zje = class"), false);
const windowContext = fs.readFileSync(new URL("../src/main/main-app/window/window-context.ts", import.meta.url), "utf8");
equal(windowContext.includes("debug: new zje("), true);
console.log(`${assertions} main DebugService owner assertions passed`);
