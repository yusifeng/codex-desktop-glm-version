import assert from "node:assert/strict";
import fs from "node:fs";
import { transform } from "esbuild";

let assertions = 0;
const equal = (actual, expected, message) => {
  assert.deepEqual(actual, expected, message);
  assertions += 1;
};

const source = fs.readFileSync(
  new URL("../src/main/main-app/computer-use/managed-service-lifecycle.ts", import.meta.url),
  "utf8",
);
const output = await transform(source, { loader: "ts", format: "cjs", target: "es2022" });
const loaded = { exports: {} };
Function("module", "exports", "require", output.code)(loaded, loaded.exports, (specifier) => {
  if (specifier.endsWith("/app-resolution"))
    return {
      canonicalServiceAppPath: (codexHome) => `${codexHome}/canonical.app`,
      refreshCanonicalServiceAppCopy: async () => {},
      resolveComputerUseAppPath: () => "/bundled/source.app",
    };
  if (specifier.endsWith("/managed-service")) return { ManagedComputerUseService: class {} };
  if (specifier.endsWith("/thread-config"))
    return { NODE_REPL_HOST_SERVICES_PIPE_PATH: "NODE_REPL_HOST_SERVICES_PIPE_PATH" };
  if (specifier.endsWith("/host-services-server"))
    return { createHostServicesServer: async () => { throw new Error("unexpected default server"); } };
  throw new Error(`unexpected require: ${specifier}`);
});
const { createManagedComputerUseLifecycle } = loaded.exports;

const noOpLogger = { warning() {} };
const baseOptions = {
  codexHome: "/codex",
  environment: {},
  logger: noOpLogger,
  onServiceAvailable() {},
  onServiceRespawned() {},
  registerDispose() {},
  createSocketPeerAuthorizer: () => () => ({ authorized: true }),
};

{
  let creates = 0;
  const lifecycle = createManagedComputerUseLifecycle({
    ...baseOptions,
    enabled: false,
    internalBuild: true,
    createManagedService: () => { creates += 1; return {}; },
    refreshCanonicalCopy: async () => { throw new Error("disabled lifecycle must not refresh"); },
    startHostServicesServer: async () => { throw new Error("disabled lifecycle must not listen"); },
  });
  equal(lifecycle.getService(), null);
  equal(await lifecycle.start(), null);
  equal(creates, 0);
  assert.throws(() => lifecycle.ensureService(), /unavailable/);
  assertions += 1;
  equal(await lifecycle.invalidateService(12), undefined);
}

{
  const events = [];
  const environment = { NODE_REPL_HOST_SERVICES_PIPE_PATH: "stale.sock" };
  const disposers = [];
  let callbacks;
  let hostServices;
  const service = {
    dispose: () => events.push(["service-dispose"]),
    ensureServicePid: async () => { events.push(["ensure"]); return 42; },
    invalidateServicePid: async (pid) => { events.push(["invalidate", pid]); },
  };
  const lifecycle = createManagedComputerUseLifecycle({
    ...baseOptions,
    enabled: true,
    environment,
    internalBuild: true,
    logger: { warning: (...args) => events.push(["warning", ...args]) },
    onServiceAvailable: (pid) => events.push(["available", pid]),
    onServiceRespawned: () => events.push(["respawned"]),
    registerDispose: (dispose) => disposers.push(dispose),
    resolveSourceServiceAppPath: () => "/source.app",
    refreshCanonicalCopy: async (input) => events.push(["refresh", input]),
    createManagedService: (path, receivedCallbacks) => {
      events.push(["create", path]);
      callbacks = receivedCallbacks;
      return service;
    },
    createSocketPeerAuthorizer: () => {
      events.push(["create-authorizer"]);
      return () => ({ authorized: true });
    },
    startHostServicesServer: async (options) => {
      equal(environment.NODE_REPL_HOST_SERVICES_PIPE_PATH, undefined, "stale pipe is cleared before listen");
      hostServices = options.services;
      events.push(["listen", options.socketPeerAuthorizer({})]);
      return { pipePath: "fresh.sock", dispose: () => events.push(["server-dispose"]) };
    },
  });
  equal(await lifecycle.start(), service);
  equal(await lifecycle.start(), service, "start is idempotent");
  equal(events.filter(([type]) => type === "refresh").length, 1);
  equal(events[0], ["refresh", { sourceServiceAppPath: "/source.app", codexHome: "/codex" }]);
  equal(events[1], ["create", "/codex/canonical.app"]);
  equal(events[2], ["create-authorizer"], "peer authorizer remains lazy until pipe startup");
  equal(lifecycle.getService(), service);
  equal(environment.NODE_REPL_HOST_SERVICES_PIPE_PATH, "fresh.sock");
  equal(disposers.length, 2);
  callbacks.onServiceAvailable(7);
  callbacks.onServiceRespawned();
  equal(events.slice(-2), [["available", 7], ["respawned"]]);
  equal(await lifecycle.ensureService(), 42);
  await lifecycle.invalidateService(42);
  equal(events.slice(-2), [["ensure"], ["invalidate", 42]]);
  equal(await hostServices.get("computer-use")(), {});
  equal(events.at(-1), ["ensure"]);
  disposers[0].dispose();
  environment.NODE_REPL_HOST_SERVICES_PIPE_PATH = "replacement.sock";
  disposers[1]();
  equal(environment.NODE_REPL_HOST_SERVICES_PIPE_PATH, "replacement.sock", "cleanup preserves a replacement pipe");
  equal(events.slice(-2), [["service-dispose"], ["server-dispose"]]);
}

{
  const environment = { NODE_REPL_HOST_SERVICES_PIPE_PATH: "external.sock" };
  let authorizerCreates = 0;
  let serverStarts = 0;
  const service = { dispose() {}, ensureServicePid: async () => 1, invalidateServicePid: async () => {} };
  const lifecycle = createManagedComputerUseLifecycle({
    ...baseOptions,
    enabled: true,
    environment,
    internalBuild: false,
    createManagedService: () => service,
    createSocketPeerAuthorizer: () => { authorizerCreates += 1; return () => ({ authorized: true }); },
    startHostServicesServer: async () => { serverStarts += 1; throw new Error("must not start"); },
  });
  equal(await lifecycle.start(), service);
  equal(environment.NODE_REPL_HOST_SERVICES_PIPE_PATH, "external.sock");
  equal(authorizerCreates, 0);
  equal(serverStarts, 0);
}

{
  const errors = [];
  const environment = { NODE_REPL_HOST_SERVICES_PIPE_PATH: "stale.sock" };
  const service = { dispose() {}, ensureServicePid: async () => 1, invalidateServicePid: async () => {} };
  const lifecycle = createManagedComputerUseLifecycle({
    ...baseOptions,
    enabled: true,
    environment,
    internalBuild: true,
    logger: { warning: (message, fields) => errors.push([message, fields.sensitive.error.message]) },
    createManagedService: () => service,
    refreshCanonicalCopy: async () => { throw new Error("copy failed"); },
    startHostServicesServer: async () => { throw new Error("listen failed"); },
  });
  equal(await lifecycle.start(), service, "startup failures do not discard the managed service");
  equal(errors, [
    ["Failed to sync canonical Computer Use service app during startup", "copy failed"],
    ["Failed to start node_repl host services native pipe", "listen failed"],
  ]);
  equal(environment.NODE_REPL_HOST_SERVICES_PIPE_PATH, undefined);
}

console.log(`${assertions} managed Computer Use lifecycle assertions passed`);
