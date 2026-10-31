import assert from "node:assert/strict";
import fs from "node:fs";
import { createElectronFetchHandlerClass } from "../src/main/main-app/fetch-handler/electron-fetch-handler.ts";

let assertions = 0;
const equal = (actual, expected) => { assert.deepEqual(actual, expected); assertions += 1; };
const throws = (operation, pattern) => { assert.throws(operation, pattern); assertions += 1; };
class UnsupportedElectronHandlerError extends Error {}
class QueueLocks {}
class AutomationsService { constructor(...args) { this.args = args; } }
class PinnedThreadsService { constructor(...args) { this.args = args; } }
const traced = [];
const specific = {
  CMe: AutomationsService,
  GH: false,
  KH: () => ({ warning: () => {} }),
  NBe: { getState: () => ({ supported: false }) },
  Vee: QueueLocks,
  XH: UnsupportedElectronHandlerError,
  bundledSkillsRoot: () => "/skills",
  jH: PinnedThreadsService,
  n: {
    Fs: (kind) => kind === "git-operation",
    W: (context, operation) => { traced.push(context); return operation(); },
    l: async () => {},
  },
};
const dependencies = new Proxy(specific, {
  get(target, property) {
    return Object.hasOwn(target, property) ? target[property] : (() => undefined);
  },
});
const ElectronFetchHandler = createElectronFetchHandlerClass(dependencies);
const globalState = {};
const projectsManager = {};
const assignments = {};
const registry = {};
const appServerClient = {};
const windowManager = {};
const constructorArgs = [globalState, projectsManager, assignments, registry, appServerClient, null, null, windowManager];
while (constructorArgs.length < 42) constructorArgs.push(null);
const handler = new ElectronFetchHandler(...constructorArgs);
equal(handler.globalState, globalState);
equal(handler.projectsManager, projectsManager);
equal(handler.appServerClient, appServerClient);
equal(handler.bundledSkillsRoot, "/skills");
equal(handler.queuedFollowUpSendLocks instanceof QueueLocks, true);
equal(handler.automationsService.args, [globalState, registry, null]);
equal(handler.pinnedThreadsService.args, [globalState, registry, windowManager, null]);

throws(() => handler.handleVSCodeRequest({}, "missing", {}, null, null), /not implemented in the current Electron process/);
handler.handlers["git-operation"] = () => "git";
throws(() => handler.handleVSCodeRequest({}, "git-operation", {}, null, null), /Missing git operation source/);
const origin = { id: 7 };
const signal = new AbortController().signal;
handler.handlers.echo = (request) => request;
equal(handler.handleVSCodeRequest(origin, "echo", { value: 3 }, null, signal), { origin, signal, value: 3 });
equal(handler.handleVSCodeRequest(origin, "echo", { value: 4 }, "sidebar", signal), { origin, signal, value: 4 });
equal(traced, [{ source: "sidebar", requestKind: "echo" }]);
handler.handlers.unsupported = () => { throw new UnsupportedElectronHandlerError(); };
throws(() => handler.handleVSCodeRequest(origin, "unsupported", {}, null, signal), /unsupported not implemented in Electron/);

const main = fs.readFileSync(new URL("../.reference/originals/main/main-C-Mhak1n.ts", import.meta.url), "utf8");
equal(main.includes("PBe = createElectronFetchHandlerClass({"), true);
equal(main.includes("PBe = class"), false);
equal(main.includes("new PBe("), true);
equal(main.includes("computeScreenshotTarget: (...args) => computeScreenshotTarget(...args)"), true);
const owner = fs.readFileSync(new URL("../src/main/main-app/fetch-handler/electron-fetch-handler.ts", import.meta.url), "utf8");
equal(owner.includes("return class ElectronFetchHandler"), true);
equal(owner.includes("not wired"), false);

console.log(`${assertions} main electron fetch-handler owner assertions passed`);
