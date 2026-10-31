import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createCloudCommandSessionRuntime } from "../src/main/main-app/terminal/cloud-command-session.ts";

let assertions = 0;
function equal(actual, expected, message) {
  assertions += 1;
  assert.deepEqual(actual, expected, message);
}

const type = (kind, nullable = false) => ({
  kind,
  nullable,
  nullish() { return type(kind, true); },
});
const schema = {
  Of: () => type("string"),
  Cf: () => type("number"),
  gf: () => type("boolean"),
  wf(shape) {
    const validate = (value) => {
      if (value == null || typeof value !== "object") throw new Error("invalid object");
      const output = {};
      for (const [key, descriptor] of Object.entries(shape)) {
        const field = value[key];
        if (field == null && descriptor.nullable) output[key] = field;
        else if (typeof field !== descriptor.kind) throw new Error(`invalid ${key}`);
        else output[key] = field;
      }
      return output;
    };
    return {
      parse: validate,
      safeParse(value) {
        try { return { success: true, data: validate(value) }; }
        catch (error) { return { success: false, error }; }
      },
    };
  },
};

class FakeBackend {
  constructor(sessionPromise, callbacks, options) {
    this.callbacks = callbacks;
    this.options = options;
    this.output = [];
    this.ready = sessionPromise.then((session) => {
      this.session = session;
      session.response.then(
        (response) => callbacks.onExit({ code: response.exitCode, signal: null }),
        (error) => callbacks.onExit({ code: null, signal: null, error: error.message }),
      );
      return session;
    });
  }
  handleOutputDelta(event) {
    this.output.push(event);
    this.callbacks.onData(event.chunk.toString("utf8"));
  }
}

let nextProcess = 1;
let abortRaces = 0;
const runtime = createCloudCommandSessionRuntime({
  schema,
  posixPath: path.posix,
  fileUrlToPath: fileURLToPath,
  randomUUID: () => `process-${nextProcess++}`,
  raceWithAbort: (promise, signal) => {
    abortRaces += 1;
    signal.throwIfAborted();
    return promise;
  },
  getShellCommand: () => ["bash", "-l"],
  CommandSessionBackend: FakeBackend,
});

function createConnection({ environmentCwd = "file:///reported", validDirectories = ["/cwd", "/reported"] } = {}) {
  const requests = [];
  const response = Promise.withResolvers();
  let notificationHandler = null;
  let unregisterCalls = 0;
  const connection = {
    requests,
    response,
    async sendAppServerExtensionRequest(method, params, extra, options) {
      requests.push([method, params, extra, options]);
      if (method === "fs/getMetadata") {
        if (params.path === "/not-directory")
          throw new Error("Not a directory (os error 20)");
        if (params.path === "/missing")
          throw new Error("No such file or directory (os error 2)");
        return { isDirectory: validDirectories.includes(params.path) };
      }
      if (method === "environment/info") return { cwd: environmentCwd };
      if (method === "command/exec") return response.promise;
      return {};
    },
    registerInternalNotificationHandler(handler) {
      notificationHandler = handler;
      return () => { unregisterCalls += 1; notificationHandler = null; };
    },
    notify(notification) { notificationHandler?.(notification); },
    get unregisterCalls() { return unregisterCalls; },
  };
  return connection;
}

const explicitConnection = createConnection();
equal(
  await runtime.resolveCloudEnvironmentCwd(explicitConnection, {
    environmentId: "environment-1",
    cwd: "/cwd",
  }),
  "/cwd",
);
equal(explicitConnection.requests.map(([method]) => method), ["fs/getMetadata"]);

const fallbackConnection = createConnection();
equal(
  await runtime.resolveCloudEnvironmentCwd(fallbackConnection, {
    environmentId: "environment-1",
    cwd: "/missing",
  }),
  "/reported",
);
equal(fallbackConnection.requests.map(([method]) => method), [
  "fs/getMetadata",
  "environment/info",
  "fs/getMetadata",
]);
equal(fallbackConnection.requests[0][1], { environmentId: "environment-1", path: "/missing" });

const invalidConnection = createConnection({ environmentCwd: "relative/path" });
equal(
  await runtime.resolveCloudEnvironmentCwd(invalidConnection, {
    environmentId: "environment-1",
    cwd: "relative",
  }),
  null,
);
const emptyConnection = createConnection({ environmentCwd: null });
equal(
  await runtime.resolveCloudEnvironmentCwd(emptyConnection, { environmentId: "environment-1" }),
  null,
);

const abortController = new AbortController();
await runtime.resolveCloudEnvironmentCwd(createConnection(), {
  environmentId: "environment-1",
  cwd: "/cwd",
  signal: abortController.signal,
});
equal(abortRaces > 0, true);
abortController.abort();
await assert.rejects(
  () => runtime.resolveCloudEnvironmentCwd(createConnection(), {
    environmentId: "environment-1",
    cwd: "/cwd",
    signal: abortController.signal,
  }),
  /aborted/i,
);
assertions += 1;

const connection = createConnection();
const data = [];
const exits = [];
const sessionResult = await runtime.createCloudCommandSession(connection, {
  environmentId: "environment-1",
  cwd: "/cwd",
  cols: 100,
  rows: 30,
  callbacks: { onData: (value) => data.push(value), onExit: (value) => exits.push(value) },
});
equal(sessionResult.cwd, "/cwd");
equal(sessionResult.shell, "sh");
equal(sessionResult.backend.options, { serializeWrites: true });
equal(data[0], "[Temporary Cloud terminal: fixed 100x30 PTY; closes at 1 MiB of output.]\r\n");
const execRequest = connection.requests.find(([method]) => method === "command/exec");
equal(execRequest[1].processId, "process-1");
equal(execRequest[1].cwd, "/cwd");
equal(execRequest[1].command.slice(-2), ["bash", "-l"]);
equal(execRequest[1].command.slice(0, 6), [
  "sh",
  "-c",
  `stty cols "$1" rows "$2"; printf "\\033[0m"; shift 2; exec "$@"`,
  "sh",
  "100",
  "30",
]);
equal(execRequest[1].outputBytesCap, 1_048_576);
equal(execRequest[3], { timeoutMs: null });

await sessionResult.backend.ready;
let writeSettled = false;
const pendingWrite = sessionResult.backend.session.write("input").then(() => { writeSettled = true; });
await Promise.resolve();
equal(writeSettled, false);
connection.notify({ method: "other", params: { processId: "process-1" } });
equal(writeSettled, false);
connection.notify({
  method: "command/exec/outputDelta",
  params: { processId: "process-1", deltaBase64: Buffer.from("output").toString("base64"), capReached: false },
});
await pendingWrite;
equal(sessionResult.backend.output[0].chunk.toString("utf8"), "output");
equal(data.at(-1), "output");
const writeRequest = connection.requests.find(([method]) => method === "command/exec/write");
equal(writeRequest[1], {
  processId: "process-1",
  deltaBase64: Buffer.from("input").toString("base64"),
});
equal(await sessionResult.backend.session.resize({ cols: 1, rows: 1 }), {});

connection.response.resolve({ exitCode: 0, stdout: "", stderr: "" });
await connection.response.promise;
await new Promise((resolve) => setTimeout(resolve, 0));
equal(connection.unregisterCalls, 1);
equal(exits, [{ code: 0, signal: null, error: undefined }]);

const terminateConnection = createConnection();
const terminateData = [];
const terminateExits = [];
const terminatingSession = await runtime.createCloudCommandSession(terminateConnection, {
  environmentId: "environment-1",
  cwd: "/cwd",
  cols: 80,
  rows: 24,
  callbacks: {
    onData: (value) => terminateData.push(value),
    onExit: (value) => terminateExits.push(value),
  },
});
await terminatingSession.backend.ready;
await terminatingSession.backend.session.terminate();
equal(terminateConnection.requests.some(([method]) => method === "command/exec/terminate"), false);
terminateConnection.notify({
  method: "command/exec/outputDelta",
  params: { processId: "process-2", deltaBase64: "", capReached: false },
});
await new Promise((resolve) => setTimeout(resolve, 0));
equal(terminateConnection.requests.filter(([method]) => method === "command/exec/terminate").length, 1);
equal(terminatingSession.backend.output.length, 0);
terminateConnection.response.resolve({ exitCode: 0, stdout: "", stderr: "" });

const capConnection = createConnection();
const capData = [];
const capExits = [];
const cappedSession = await runtime.createCloudCommandSession(capConnection, {
  environmentId: "environment-1",
  cwd: "/cwd",
  cols: 90,
  rows: 20,
  callbacks: { onData: (value) => capData.push(value), onExit: (value) => capExits.push(value) },
});
await cappedSession.backend.ready;
capConnection.notify({
  method: "command/exec/outputDelta",
  params: { processId: "process-3", deltaBase64: Buffer.from("last").toString("base64"), capReached: true },
});
await new Promise((resolve) => setTimeout(resolve, 0));
equal(capData.some((value) => value.includes("1 MiB output limit")), true);
equal(capConnection.requests.filter(([method]) => method === "command/exec/terminate").length, 1);
capConnection.response.resolve({ exitCode: 1, stdout: "", stderr: "" });
await new Promise((resolve) => setTimeout(resolve, 0));
equal(capExits[0].error, "Cloud terminal reached the server's 1 MiB output limit");

const invalidOutputConnection = createConnection();
const invalidData = [];
const invalidExits = [];
const invalidSession = await runtime.createCloudCommandSession(invalidOutputConnection, {
  environmentId: "environment-1",
  cwd: "/cwd",
  cols: 90,
  rows: 20,
  callbacks: { onData: (value) => invalidData.push(value), onExit: (value) => invalidExits.push(value) },
});
await invalidSession.backend.ready;
invalidOutputConnection.notify({
  method: "command/exec/outputDelta",
  params: { processId: "process-4", deltaBase64: 7, capReached: false },
});
await new Promise((resolve) => setTimeout(resolve, 0));
equal(invalidData.some((value) => value.includes("invalid output")), true);
invalidOutputConnection.response.resolve({ exitCode: 1, stdout: "", stderr: "" });
await new Promise((resolve) => setTimeout(resolve, 0));
equal(invalidExits[0].error, "Cloud terminal received invalid output");

await assert.rejects(
  () => runtime.createCloudCommandSession(createConnection({ environmentCwd: null }), {
    environmentId: "environment-1",
    cwd: null,
    cols: 80,
    rows: 24,
    callbacks: { onData() {}, onExit() {} },
  }),
  /valid working directory/,
);
assertions += 1;

const main = fs.readFileSync(
  new URL("../.reference/originals/main/main-C-Mhak1n.ts", import.meta.url),
  "utf8",
);
const windowContext = fs.readFileSync(
  new URL("../src/main/main-app/window/window-context.ts", import.meta.url),
  "utf8",
);
equal(main.includes("createCloudCommandSessionRuntime({"), true);
equal(main.includes("async function K$e("), false);
equal(main.includes("async function J$e("), false);
equal(windowContext.includes("createCloudCommandSession("), true);

console.log(`${assertions} main cloud-command-session assertions passed`);
