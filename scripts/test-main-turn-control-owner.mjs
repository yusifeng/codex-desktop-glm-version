import assert from "node:assert/strict";
import fs from "node:fs";
import { transform } from "esbuild";

let assertions = 0;
const equal = (actual, expected) => {
  assert.deepEqual(actual, expected);
  assertions += 1;
};

const read = (relativePath) =>
  fs.readFileSync(new URL(`../${relativePath}`, import.meta.url), "utf8");

const workspace = read("src/main/main-app/conversation/workspace-resolution.ts");
const dispatch = read("src/main/main-app/conversation/turn-dispatch.ts");
const steer = read("src/main/main-app/conversation/turn-steer.ts");
for (const source of [workspace, dispatch, steer]) {
  const result = await transform(source, { loader: "ts", format: "esm", target: "es2022" });
  equal(result.warnings.length, 0);
  equal(result.code.length > 1_000, true);
}

equal(workspace.includes("export function isNewerRuntimeModel"), true);
equal(workspace.includes("export function resolveWorkspaceView"), true);
equal(workspace.includes("export const MULTI_AGENT_MODE_EXPLICIT_REQUEST_ONLY"), true);
equal(dispatch.includes("export function createExecuteTurnStart"), true);
equal(dispatch.includes("export function assertNoUnconfirmedSubmission"), true);
equal(dispatch.includes("export function recordUnconfirmedSubmission"), true);
equal(dispatch.includes("export function clearUnconfirmedSubmission"), true);
equal(steer.includes("export async function steerTurn"), true);
equal(steer.includes("export async function stopConversation"), true);
equal(steer.includes("export function isSteerTurnInactiveError"), true);
equal(steer.includes("export function isNoActiveTurnError"), true);

const manager = read("src/main/main-app/conversation/app-server-manager.ts");
equal(manager.includes('import { createExecuteTurnStart } from "./turn-dispatch";'), true);
equal(manager.includes('import { steerTurn, stopConversation } from "./turn-steer";'), true);
equal(manager.includes("this.executeTurnStart = createExecuteTurnStart("), true);
equal(manager.includes("return steerTurn({"), true);
equal(manager.includes("return stopConversation({"), true);

const main = read(".reference/originals/main/main-C-Mhak1n.ts");
for (const legacyDefinition of [
  "var rC = [`luna`",
  "function Nxe(",
  "async function Vxe(",
  "function Zxe(",
  "async function Qxe(",
  "function eSe(",
  "async function rSe(",
  "async function sSe(",
]) {
  equal(main.includes(legacyDefinition), false);
}

console.log(`${assertions} main turn control owner assertions passed`);
