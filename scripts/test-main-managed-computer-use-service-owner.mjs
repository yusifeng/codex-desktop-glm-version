import assert from "node:assert/strict";
import fs from "node:fs";
import * as acorn from "acorn";
import { transform } from "esbuild";

let assertions = 0;
const equal = (actual, expected) => { assert.deepEqual(actual, expected); assertions += 1; };
const source = fs.readFileSync(new URL("../src/main/main-app/computer-use/managed-service.ts", import.meta.url), "utf8");
const transpiled = await transform(source, { loader: "ts", format: "esm", target: "es2022" });
const ast = acorn.parse(transpiled.code, { ecmaVersion: "latest", sourceType: "module" });
const classNode = ast.body.find((node) => node.type === "ClassDeclaration" && node.id?.name === "ManagedComputerUseService");
const joinNode = ast.body.find((node) => node.type === "FunctionDeclaration" && node.id?.name === "joinServiceExecutablePath");
assert.ok(classNode && joinNode); assertions += 1;
equal(classNode.body.body.length, 24);
const logs = [];
const ManagedComputerUseService = Function(
  "memoizedTaggedLogger", "computerUseServiceProcessMatchesExecutablePath", "isProcessAlive",
  "spawnComputerUseService", "join",
  `${transpiled.code.slice(classNode.start, classNode.end)}\n${transpiled.code.slice(joinNode.start, joinNode.end)}; return ManagedComputerUseService;`,
)(
  () => () => ({ debug: (...args) => logs.push(["debug", ...args]), info: (...args) => logs.push(["info", ...args]), warning: (...args) => logs.push(["warning", ...args]) }),
  () => true,
  () => true,
  async () => 1,
  (...parts) => parts.join("/"),
);

let nextPid = 41;
let running = true;
let expected = true;
const available = [];
let respawned = 0;
const service = new ManagedComputerUseService("/Applications/Codex Computer Use.app", {
  isExpectedServiceProcess: () => expected,
  isProcessRunning: () => running,
  onServiceAvailable: (pid) => available.push(pid),
  onServiceRespawned: () => { respawned += 1; },
  spawnService: async (path) => {
    equal(path, "/Applications/Codex Computer Use.app/Contents/MacOS/SkyComputerUseService");
    return nextPid;
  },
});
await assert.rejects(() => service.ensureServicePid(), /not enabled/); assertions += 1;
await service.setEnabledFeatures({ appshotsEnabled: false, computerUseEnabled: true, skysightEnabled: false });
equal(service.getServiceProcessIdentifier(), 41);
equal(available, [41]);
equal(await service.ensureServicePid(), 41);
await service.invalidateServicePid(41);
equal(service.getServiceProcessIdentifier(), 41);
running = false;
await service.invalidateServicePid(41);
equal(service.getServiceProcessIdentifier(), null);
nextPid = 42;
running = true;
expected = true;
equal(await service.ensureServicePid(), 42);
equal(available, [41, 42]);
equal(respawned, 1);
service.dispose();
await assert.rejects(() => service.ensureServicePid(), /not enabled/); assertions += 1;

const main = fs.readFileSync(new URL("../.reference/originals/main/main-C-Mhak1n.ts", import.meta.url), "utf8");
equal(main.includes('const { ManagedComputerUseService: Eoe } = require("./main-app/computer-use/managed-service.js");'), true);
equal(main.includes("Eoe = class"), false);
equal(main.includes("function Doe("), false);
equal(main.includes("new Eoe(Mi(V.codexHome)"), true);
console.log(`${assertions} main managed computer-use service assertions passed`);
