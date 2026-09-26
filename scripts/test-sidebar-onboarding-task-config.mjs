import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const appInitialMock = `
export const Pdn = { FREE: "free", GO: "go" };
export const Mwt = {};
export const Nwt = ["checked-in-fallback"];
export const Kyt = value => value === "chatgpt";
export const dun = (key, initial) => ({ key, initial });
export const afn = () => ({ value: null });
export const lZt = "report_onboarding_completion";
export const $Dt = undefined, GU = undefined, Mpn = undefined, N1t = undefined, Nmn = undefined, O4 = undefined, UDt = undefined, Ugn = undefined, VDt = undefined, egt = undefined, gpt = undefined, hdn = undefined, k0t = undefined, mpt = undefined, n$t = undefined, ngn = undefined, ogn = undefined, pnt = undefined;
`;

const appSharedMock = `
let nextId = 0;
const signal = (initial = undefined) => ({ id: ++nextId, initial });
export const ZI = Symbol("scope");
export const pZ = (_scope, initial) => signal(initial);
export const sZ = () => signal();
export const rZ = () => signal();
export const oZ = () => signal();
export const cX = () => false;
`;

const mockModules = {
  "app-initial": appInitialMock,
  "app-shared": appSharedMock,
  "onboarding-mail-provider": "export const a = value => value;",
  "rolldown-runtime": "export {};",
};

const result = await esbuild.build({
  entryPoints: [
    path.join(
      ROOT,
      "src/renderer/sidebar-onboarding-checklist-task-config/index.ts",
    ),
  ],
  bundle: true,
  format: "esm",
  platform: "node",
  target: "node22",
  write: false,
  logLevel: "silent",
  plugins: [
    {
      name: "mock-renderer-chunks",
      setup(build) {
        build.onResolve({ filter: /^@rchunk\// }, ({ path: importPath }) => ({
          path: importPath.slice("@rchunk/".length),
          namespace: "mock-renderer-chunk",
        }));
        build.onLoad(
          { filter: /.*/, namespace: "mock-renderer-chunk" },
          ({ path: importPath }) => ({
            contents: mockModules[importPath],
            loader: "js",
          }),
        );
      },
    },
  ],
});

const source = result.outputFiles[0].text;
const moduleUrl = `data:text/javascript;base64,${Buffer.from(source).toString("base64")}`;
const taskConfig = await import(moduleUrl);

class Store {
  values = new Map();

  get(signal) {
    return this.values.has(signal) ? this.values.get(signal) : signal?.initial;
  }

  set(signal, value) {
    const previous = this.get(signal);
    this.values.set(
      signal,
      typeof value === "function" ? value(previous) : value,
    );
  }
}

let assertionCount = 0;
function check(value, message) {
  assert.ok(value, message);
  assertionCount += 1;
}

taskConfig.G();
const store = new Store();
check(taskConfig.W(store).phase === "role", "workflow starts at role");

taskConfig.Y(store, "design");
check(taskConfig.W(store).phase === "task", "role selection advances to task");

taskConfig.X(store, "computer_use");
check(
  taskConfig.W(store).phase === "permission",
  "ordinary tasks require permission",
);

taskConfig.Z(store, "allowed");
check(
  taskConfig.W(store).computerUseAccessGranted === true,
  "computer-use permission is remembered",
);

taskConfig.X(store, "csv_chart");
check(taskConfig.W(store).phase === "execution", "CSV task skips permission");

taskConfig.Q(store, [{ id: "mail", status: "checking" }]);
check(
  taskConfig.W(store).phase === "execution",
  "checking capabilities do not advance",
);

taskConfig.Q(store, [{ id: "mail", status: "needs-setup" }]);
check(
  taskConfig.W(store).phase === "capabilities",
  "actionable capabilities advance",
);

taskConfig.V(store);
check(
  taskConfig.W(store).advancedCapabilitiesStatus === "completed",
  "capabilities can complete",
);

taskConfig.J(store, "csv_chart");
check(
  taskConfig.W(store).declinedTasks.includes("csv_chart"),
  "declined tasks are retained",
);

taskConfig.q(store);
check(taskConfig.W(store).phase === "role", "workflow resets");

check(taskConfig.I.safeParse("remote-task").success, "task IDs accept text");
check(!taskConfig.L.safeParse("remote-task").success, "local IDs are closed");
check(taskConfig._("gmail", null), "unknown plans remain eligible");
check(!taskConfig._("gmail", "free"), "free plans exclude Google plugins");
check(
  !taskConfig._("linear", "pro", ["business"]),
  "explicit plan allowlists are honored",
);
check(
  taskConfig.p("design") === "review_design_briefs",
  "roles map to fallback tasks",
);

const message = (id, text, translations) => ({
  id,
  defaultMessage: text,
  description: id,
  ...(translations == null ? {} : { translations }),
});
const remoteTask = {
  instructions: "Use {mail}",
  pluginSlots: { mail: "gmail" },
  messages: {
    label: message("label", "Summarize mail", { zh: "总结邮件" }),
    prompt: message("prompt", "Summarize {mail}"),
  },
};
const parsed = taskConfig.i({
  fallback_tasks: ["remote-task"],
  remotePluginIds: { mail: "gmail-remote" },
  tasks: {
    "remote-task": remoteTask,
    create_project: remoteTask,
    malformed: { ...remoteTask, instructions: "Use {missing}" },
  },
});
check(
  parsed.fallbackTaskIds[0] === "remote-task",
  "remote fallback tasks parse",
);
check(parsed.taskDefinitions["remote-task"] != null, "remote tasks parse");
check(
  parsed.taskDefinitions.create_project == null &&
    parsed.taskDefinitions.malformed == null,
  "reserved and malformed tasks are rejected",
);
check(
  !Object.hasOwn(parsed, "remotePluginIds"),
  "task config keeps plugin IDs separate",
);
check(
  taskConfig.n(parsed.taskDefinitions["remote-task"], "label", "zh-CN")
    .defaultMessage === "总结邮件",
  "remote messages localize",
);
check(
  taskConfig.r({ remotePluginIds: { mail: "gmail-remote" } })?.mail ===
    "gmail-remote",
  "remote plugin IDs parse independently",
);

assert.equal(assertionCount, 22);
console.log(
  `${assertionCount} sidebar onboarding task-config assertions passed`,
);
