import assert from "node:assert/strict";
import fs from "node:fs";
import { transform } from "esbuild";

const source = fs.readFileSync(
  new URL("../src/main/main-app/environment-config/request-user-input-auto-resolution.ts", import.meta.url),
  "utf8",
);
const output = await transform(source, { loader: "ts", format: "esm", target: "node22" });
const runtime = await import(`data:text/javascript;base64,${Buffer.from(output.code).toString("base64")}`);

let assertions = 0;
function equal(actual, expected, message) {
  assertions += 1;
  assert.deepEqual(actual, expected, message);
}

const snoozed = [];
let registration = null;
const install = runtime.createEnvironmentConfigRequestUserInputAutoResolutionInstaller({
  environmentSetupStateKey: "environment-setup",
  environmentSetupServerConfigsKey: "environment-setup-server-configs-v1",
  isLocalHostId: (hostId) => hostId === "local",
  normalizeThreadId: (threadId) => `thread:${threadId}`,
  normalizeRequestId: (requestId) => `request:${requestId}`,
});
const connection = {
  hostId: "local",
  registerInternalServerRequestHandler(value) { registration = value; },
  requestUserInputAutoResolution: {
    snoozeRequest(...args) { snoozed.push(args); },
  },
};
const state = {
  get(key) {
    equal(key, "environment-setup");
    return {
      "environment-setup-server-configs-v1": {
        configured: { accountId: "account", userId: "user", configId: "config" },
        invalid: { accountId: "account", userId: "", configId: "config" },
      },
    };
  },
};

install({ ...connection, hostId: "remote" }, state);
equal(registration, null, "remote hosts must not register the local auto-resolution handler");
install(connection, state);
equal(registration.methods, ["item/tool/requestUserInput"]);
equal(registration.handler({ method: "other", params: {} }), null);
equal(registration.handler({ method: "item/tool/requestUserInput", params: { isBlocking: true } }), null);
equal(registration.handler({ method: "item/tool/requestUserInput", params: { autoResolutionMs: 100 } }), null);
equal(snoozed.length, 0);
equal(registration.handler({
  id: "one",
  method: "item/tool/requestUserInput",
  params: { threadId: "invalid", isBlocking: false },
}), null);
equal(snoozed.length, 0);
equal(registration.handler({
  id: "two",
  method: "item/tool/requestUserInput",
  params: { threadId: "configured", isBlocking: false },
}), null);
equal(snoozed, [["thread:configured", "request:two"]]);

const main = fs.readFileSync(
  new URL("../.reference/originals/main/main-C-Mhak1n.ts", import.meta.url),
  "utf8",
);
const windowContext = fs.readFileSync(
  new URL("../src/main/main-app/window/window-context.ts", import.meta.url),
  "utf8",
);
equal(main.includes('require("./main-app/environment-config/request-user-input-auto-resolution.js")'), true);
equal(main.includes("createEnvironmentConfigRequestUserInputAutoResolutionInstaller({"), true);
equal(windowContext.includes("installEnvironmentConfigRequestUserInputAutoResolution(p, this.scopedState)"), true);
equal(/^function Zk\(/m.test(main), false);
equal(/^[ ]{0,2}Yk = /m.test(main), false);
equal(/^[ ]{0,2}Xk = /m.test(main), false);

console.log(`${assertions} main environment config auto-resolution assertions passed`);
