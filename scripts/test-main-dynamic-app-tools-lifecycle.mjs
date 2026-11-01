import assert from "node:assert/strict";
import fs from "node:fs";
import { transform } from "esbuild";

let assertions = 0;
const equal = (actual, expected, message) => {
  assert.deepEqual(actual, expected, message);
  assertions += 1;
};

const source = fs.readFileSync(
  new URL("../src/main/main-app/native-pipe/dynamic-app-tools-lifecycle.ts", import.meta.url),
  "utf8",
);
const output = await transform(source, { loader: "ts", format: "cjs", target: "es2022" });
const loaded = { exports: {} };
Function("module", "exports", "require", output.code)(loaded, loaded.exports, (specifier) => {
  if (specifier.endsWith("/codex-app-tools-config"))
    return { CODEX_APP_TOOLS_PIPE_PATH: "CODEX_APP_TOOLS_PIPE_PATH" };
  if (specifier.endsWith("/dynamic-app-tools-server"))
    return { createDynamicAppToolsServer: async () => { throw new Error("unexpected default server"); } };
  throw new Error(`unexpected require: ${specifier}`);
});
const { startDynamicAppToolsLifecycle } = loaded.exports;

{
  const events = [];
  const environment = { CODEX_APP_TOOLS_PIPE_PATH: "stale.sock" };
  const callTool = async () => "called";
  const listTools = async () => ["listed"];
  let serverOptions;
  const lifecycle = await startDynamicAppToolsLifecycle({
    callTool,
    createSocketPeerAuthorizer: () => {
      events.push(["create-authorizer", environment.CODEX_APP_TOOLS_PIPE_PATH]);
      return () => ({ authorized: true });
    },
    environment,
    listTools,
    logger: { warning: (...args) => events.push(["warning", ...args]) },
    startServer: async (options) => {
      serverOptions = options;
      events.push(["start-server"]);
      return { pipePath: "dynamic.sock", dispose: async () => events.push(["dispose-server"]) };
    },
  });
  equal(events.slice(0, 2), [["create-authorizer", undefined], ["start-server"]]);
  equal(serverOptions.callTool, callTool);
  equal(serverOptions.listTools, listTools);
  equal(serverOptions.socketPeerAuthorizer({}), { authorized: true });
  equal(environment.CODEX_APP_TOOLS_PIPE_PATH, "dynamic.sock");
  equal(lifecycle.getPipePath(), "dynamic.sock");

  const context = { setDynamicAppToolsPipePath: (value) => events.push(["context", value]) };
  const disposers = [];
  lifecycle.bindWindowContext(context, (dispose) => disposers.push(dispose));
  equal(events.at(-1), ["context", "dynamic.sock"]);
  equal(disposers.length, 1);
  environment.CODEX_APP_TOOLS_PIPE_PATH = "replacement.sock";
  await disposers[0]();
  equal(events.slice(-2), [["context", null], ["dispose-server"]]);
  equal(environment.CODEX_APP_TOOLS_PIPE_PATH, undefined, "cleanup preserves original unconditional delete ordering");
}

{
  const errors = [];
  const environment = { CODEX_APP_TOOLS_PIPE_PATH: "stale.sock" };
  const lifecycle = await startDynamicAppToolsLifecycle({
    callTool: async () => {},
    createSocketPeerAuthorizer: () => () => ({ authorized: true }),
    environment,
    listTools: async () => [],
    logger: { warning: (message, fields) => errors.push([message, fields.sensitive.error.message]) },
    startServer: async () => { throw new Error("listen failed"); },
  });
  equal(lifecycle.getPipePath(), null);
  equal(environment.CODEX_APP_TOOLS_PIPE_PATH, undefined);
  equal(errors, [["Failed to start the Codex app tools native pipe", "listen failed"]]);
  let bound = 0;
  lifecycle.bindWindowContext({ setDynamicAppToolsPipePath: () => { bound += 1; } }, () => { bound += 10; });
  equal(bound, 0);
}

console.log(`${assertions} dynamic app-tools lifecycle assertions passed`);
