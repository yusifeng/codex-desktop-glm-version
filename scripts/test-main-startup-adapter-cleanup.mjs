import assert from "node:assert/strict";
import fs from "node:fs";
import { transform } from "esbuild";

const loadModule = async (path) => {
  const source = fs.readFileSync(new URL(path, import.meta.url), "utf8");
  const output = await transform(source, { loader: "ts", format: "cjs", target: "es2022" });
  const loaded = { exports: {} };
  Function("module", "exports", output.code)(loaded, loaded.exports);
  return loaded.exports;
};
const { createSentryRpcHandlerClass } = await loadModule(
  "../src/main/main-app/worker/sentry-envelope-transport.ts",
);
const { createWorkerRuntimeFactory } = await loadModule(
  "../src/main/main-app/worker/worker-runtime.ts",
);
const { createWorkspacePolicyRuntime } = await loadModule(
  "../src/main/main-app/startup/workspace-policy-runtime.ts",
);
const { createWorkspacePolicyChecker } = await loadModule(
  "../src/main/main-app/startup/workspace-policy-checker.ts",
);
const { showWorkspacePolicyRestartDialog } = await loadModule(
  "../src/main/main-app/startup/workspace-policy-restart-dialog.ts",
);

let assertions = 0;
function equal(actual, expected, message) {
  assertions += 1;
  assert.deepEqual(actual, expected, message);
}

{
  class RpcHandlerBase {
    base = true;
  }
  const envelopes = [];
  const SentryRpcHandler = createSentryRpcHandlerClass({
    RpcHandlerBase,
    getClient: () => ({
      getOptions: () => ({ enabled: true }),
      getTransport: () => ({
        send: async (envelope) => {
          envelopes.push(envelope);
          return { statusCode: 202 };
        },
      }),
    }),
  });
  const handler = new SentryRpcHandler();
  equal(handler.base, true);
  equal(await handler.sendEnvelope({ event: "worker" }), { statusCode: 202 });
  equal(envelopes, [{ event: "worker" }]);
}

{
  const dialogs = [];
  const errors = [];
  let approved = 0;
  let relaunched = 0;
  const createChecker = createWorkspacePolicyRuntime({
    createWorkspacePolicyChecker,
    showWorkspacePolicyRestartDialog,
    getIntl: () => ({
      formatMessage: (descriptor) => descriptor.values?.appName == null
        ? descriptor.messageId
        : `${descriptor.messageId}:${descriptor.values.appName}`,
    }),
    getAppName: () => "Codex Test",
    showMessageBoxSync: (options) => dialogs.push(options),
    relaunchAndQuit: () => { relaunched += 1; },
    onError: (error) => errors.push(error),
  });
  const checker = createChecker({
    quitState: { markQuitApproved: () => { approved += 1; } },
    isAppQuitting: () => false,
    getAuthMethod: async () => "chatgpt",
    hasStartupPolicyChanges: async () => true,
  });
  await checker.checkForChanges();
  equal(dialogs.length, 1);
  equal(dialogs[0].message, "desktop.workspacePolicyRestart.title");
  equal(dialogs[0].detail, "desktop.workspacePolicyRestart.detail:Codex Test");
  equal(dialogs[0].buttons, ["desktop.workspacePolicyRestart.restart"]);
  equal(approved, 1);
  equal(relaunched, 1);
  equal(errors, []);
  await checker.checkForChanges();
  equal(dialogs.length, 1, "restart dialog remains one-shot");
}

{
  const failure = Error("policy lookup failed");
  const errors = [];
  const createChecker = createWorkspacePolicyRuntime({
    createWorkspacePolicyChecker,
    showWorkspacePolicyRestartDialog,
    getIntl: () => ({ formatMessage: () => "unused" }),
    getAppName: () => "Codex",
    showMessageBoxSync: () => {},
    relaunchAndQuit: () => {},
    onError: (error) => errors.push(error),
  });
  const checker = createChecker({
    quitState: { markQuitApproved: () => {} },
    isAppQuitting: () => false,
    getAuthMethod: async () => { throw failure; },
    hasStartupPolicyChanges: async () => true,
  });
  await checker.checkForChanges();
  equal(errors, [failure]);
}

{
  class WorkerBus {
    static instances = [];
    constructor(id, options) {
      this.id = id;
      this.options = options;
      WorkerBus.instances.push(this);
    }
    setMainRpcHandler(handler) { this.mainRpcHandler = handler; }
    subscribeFromHost() { return () => {}; }
    subscribeWorkerExit() { return () => {}; }
    requestFromHost(request) { return Promise.resolve(request); }
    setTracingSampleRate() {}
    emitGitTurnComplete() {}
    flushAndDisposeWorker() {}
    dispose() {}
    setSentryUser() {}
    emitAppEvent() {}
    startWorker() {}
    handleMessage() {}
  }
  const ipcHandlers = [];
  const createRuntime = createWorkerRuntimeFactory({
    AppEventPublisher: class { addListener() { return () => {}; } emit() {} },
    createGitInvocationSampler: () => ({ recordInvocation() {} }),
    WorkerBus,
    createShortcutLinkReader: (read) => read,
    readShortcutLink: (path) => ({ path }),
    ipcMain: { handle: (...args) => ipcHandlers.push(args) },
    workerChannel: (id) => `worker:${id}`,
    registeredWorkerIds: ["git"],
    localHostId: "local",
    isWorkerStartResult: () => false,
    isWorkerEventType: () => false,
    isWorkerNotificationType: () => false,
  });
  const runtime = createRuntime({
    disposables: { add() {} },
    isTrustedIpcEvent: () => true,
    startupConfig: "startup-config",
    applicationNetwork: "application-network",
  });
  equal(WorkerBus.instances.map((instance) => instance.id), ["git", "open-in"]);
  equal(WorkerBus.instances[0].options.startupConfig, "startup-config");
  equal(WorkerBus.instances[0].options.applicationNetwork, "application-network");
  equal(await runtime.requestGitWorker({ method: "status" }), { method: "status" });
}

const main = fs.readFileSync(
  new URL("../.reference/originals/main/main-C-Mhak1n.ts", import.meta.url),
  "utf8",
);
equal(main.includes("createSentryRpcHandlerClass({"), true);
equal(main.includes("var hst = class"), false);
equal(main.includes("createRpcSession: n.Wf"), true);
equal(main.includes("isWorkerMainRpcCancel,"), true);
equal(main.includes("isWorkerMainRpcRequest,"), true);
equal(main.includes("var xst = createWorkerRuntimeFactory({"), true);
equal(main.includes("function xst("), false);
equal(main.includes("var Tst = createWorkspacePolicyRuntime({"), true);
equal(main.includes("function Tst("), false);
equal(main.includes("function Est("), false);
equal(main.includes("function V9("), false);
equal(main.includes("function gst("), false);
equal(main.includes("function Ist("), false);
equal(main.includes("function Lst("), false);
equal(main.includes('require("./main-app/startup/quit-for-update-policy.js")'), true);
equal(main.includes("appUpdateLifecycle = createAppUpdateLifecycle({"), true);
equal(main.includes("createComputerUseRpcHandler({"), true);

console.log(`${assertions} main startup adapter-cleanup assertions passed`);
