import assert from "node:assert/strict";
import fs from "node:fs";
import * as acorn from "acorn";
import { transform } from "esbuild";

let assertions = 0;
const equal = (actual, expected) => { assert.deepEqual(actual, expected); assertions += 1; };
const source = fs.readFileSync(new URL("../src/main/main-app/computer-use/approvals.ts", import.meta.url), "utf8");
const transpiled = await transform(source, { loader: "ts", format: "esm", target: "es2022" });
const ast = acorn.parse(transpiled.code, { ecmaVersion: "latest", sourceType: "module" });
const classNode = ast.body.find((node) => node.type === "ClassDeclaration" && node.id?.name === "ComputerUseSettingsService");
assert.ok(classNode); assertions += 1;
equal(classNode.body.body.length, 17);
equal(classNode.body.body.map((member) => member.key?.name ?? member.key?.value).at(-1), "openChromeExtensionInstallPage");

class EventEmitterBase {}
const calls = [];
const names = [
  "getAppApprovals", "removeAppApproval", "getMessagesReadDecisions", "setMessagesReadPolicy",
  "setMessagesChatDecision", "removeMessagesChatDecision", "getMessagesSendApprovals",
  "setMessagesAllowAllChats", "removeMessagesSendApproval", "getCuaSoundMode", "setCuaSoundMode",
  "isLockedUseInstalled", "lockedUseIcons", "setLockedUseInstalled", "openChromeExtensionSettings",
];
const dependencies = Object.fromEntries(names.map((name) => [name, async (...args) => (calls.push([name, ...args]), name)]));
const Service = Function(
  "EventEmitterBase", ...names,
  `${transpiled.code.slice(classNode.start, classNode.end)}; return ComputerUseSettingsService;`,
)(EventEmitterBase, ...names.map((name) => dependencies[name]));
const workerCalls = [];
const service = new Service(async (request) => (workerCalls.push(request), "search-result"));
equal(await service.searchMessagesChats("query"), process.platform === "darwin" ? "search-result" : null);
if (process.platform === "darwin") equal(workerCalls, [{ method: "messagesSearchChats", params: { query: "query" } }]);
equal(await service.getAppApprovals(), "getAppApprovals");
equal(await service.removeAppApproval("bundle"), "removeAppApproval");
equal(await service.setSoundMode("quiet"), "setCuaSoundMode");
equal(await service.setLockedUseEnabled(true), "setLockedUseInstalled");
equal(await service.openChromeExtensionInstallPage(), "openChromeExtensionSettings");
equal(calls.at(-1), ["openChromeExtensionSettings", {}]);

const main = fs.readFileSync(new URL("../.reference/originals/main/main-C-Mhak1n.ts", import.meta.url), "utf8");
equal(
  main.includes(
    'const { ComputerUseSettingsService, macAppIconPng: VAe, setCuaAppshotSoundEnabled: tje } = require("./main-app/computer-use/approvals.js");',
  ),
  true,
);
equal(main.includes("var nje = ComputerUseSettingsService;"), true);
equal(main.includes("nje = class"), false);
equal(main.includes("var bM ="), false);
equal(main.includes("async function tje("), false);
const windowContext = fs.readFileSync(new URL("../src/main/main-app/window/window-context.ts", import.meta.url), "utf8");
equal(windowContext.includes("this.computerUseSettings = new nje(e.requestComputerUseWorker)"), true);
const fetchHandler = fs.readFileSync(new URL("../src/main/main-app/fetch-handler/electron-fetch-handler.ts", import.meta.url), "utf8");
equal(fetchHandler.includes("tje(t === !0).catch((t) => {"), true);
console.log(`${assertions} main Computer Use settings owner assertions passed`);
