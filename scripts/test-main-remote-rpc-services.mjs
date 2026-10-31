import assert from "node:assert/strict";
import fs from "node:fs";
import { EventEmitter } from "node:events";
import { createRemoteRpcServices } from "../src/main/main-app/remote/remote-rpc-services.ts";

const calls = [];
const controller = {
  completeTurn: (...args) => calls.push(["complete", ...args]),
  getTaskState: () => ({ task: true }),
  getBrowserFrameState: () => ({ frame: true }),
  hideTask: (...args) => calls.push(["hide", ...args]),
  hideAllActiveTasks: () => calls.push(["hide-all"]),
  importLegacyHiddenTaskIds: (...args) => calls.push(["import", ...args]),
  interactWithPresentation: (...args) => calls.push(["interact", ...args]),
  showTask: (...args) => calls.push(["show", ...args]),
  setPlacement: (...args) => calls.push(["placement", ...args]),
  setNativeVideoReady: (...args) => calls.push(["ready", ...args]),
  startNativeVideo: (...args) => calls.push(["start-video", ...args]),
  stopNativeVideo: (...args) => calls.push(["stop-video", ...args]),
};
const { RemoteControlEnvironmentService, RemoteHostedPipContentService } =
  createRemoteRpcServices({
    RpcHandlerBase: class {},
    getContentLayoutState: () => ({ layout: true }),
  });

const renameRequests = [];
const environments = new RemoteControlEnvironmentService({
  renameRemoteControlEnvironmentIfDefault: (request) => { renameRequests.push(request); return "renamed"; },
});
assert.equal(environments.renameIfDefault({ envId: "env", name: "host" }), "renamed");
assert.deepEqual(renameRequests, [{ envId: "env", name: "host" }]);

const origin = new EventEmitter();
const service = new RemoteHostedPipContentService(controller, origin);
await service.completeTurn("thread", "turn");
assert.deepEqual(await service.getState(), { task: true });
assert.deepEqual(await service.getBrowserFrameState(), { frame: true });
assert.deepEqual(await service.getContentLayoutState(), { layout: true });
await service.hideTask("thread");
await service.hideForAllActiveTasks();
await service.importLegacyHiddenTaskIds(["old"]);
await service.interactWithPresentation("thread", "presentation", { type: "click" });
await service.showTask("thread", { focus: true });
await service.setPlacement("thread", "overlay");
await service.setNativeVideoReady("thread", true);
assert.equal(calls.length, 8);

await service.startNativeVideo("thread");
await service.startNativeVideo("thread");
assert.equal(calls.filter(([name]) => name === "start-video").length, 2);
await service.stopNativeVideo("thread");
assert.equal(calls.filter(([name]) => name === "stop-video").length, 1);
origin.emit("did-navigate");
assert.equal(calls.filter(([name]) => name === "stop-video").length, 2);
assert.equal(service.disposed, true);
assert.equal(origin.listenerCount("destroyed"), 0);
assert.equal(origin.listenerCount("did-navigate"), 0);
assert.equal(origin.listenerCount("render-process-gone"), 0);
await service.startNativeVideo("thread");
await service.stopNativeVideo("missing");
assert.equal(calls.filter(([name]) => name === "start-video").length, 2);
service[Symbol.dispose]();
assert.equal(calls.filter(([name]) => name === "stop-video").length, 2);

const main = fs.readFileSync(new URL("../.reference/originals/main/main-C-Mhak1n.ts", import.meta.url), "utf8");
assert.match(main, /RemoteControlEnvironmentService: R5e/);
assert.match(main, /RemoteHostedPipContentService: z5e/);
assert.doesNotMatch(main, /R5e = class/);
assert.doesNotMatch(main, /z5e = class/);
assert.match(main, /this\.remoteControlEnvironmentService = new R5e/);
assert.match(main, /new z5e\(this\.options\.remoteHostedPIPContentController, e\)/);

console.log("remote rpc services assertions: 27");
