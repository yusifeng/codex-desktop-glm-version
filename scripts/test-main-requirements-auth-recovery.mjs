import assert from "node:assert/strict";
import fs from "node:fs";
import { createRequirementsAuthRecoveryRuntime } from "../src/main/main-app/app-server/requirements-auth-recovery.ts";

let assertions = 0;
function equal(actual, expected, message) {
  assertions += 1;
  assert.deepEqual(actual, expected, message);
}

function deferred() {
  let resolve;
  let reject;
  const promise = new Promise((resolvePromise, rejectPromise) => {
    resolve = resolvePromise;
    reject = rejectPromise;
  });
  return { promise, resolve, reject };
}

function createHarness() {
  const state = {
    dialogs: [],
    dialogResults: [],
    logoutResults: [],
    logoutCalls: [],
    warnings: [],
    quitApproved: 0,
    quitCalls: 0,
    formatCalls: [],
  };
  const createRecovery = createRequirementsAuthRecoveryRuntime({
    isCloudRequirementsAuthError: (error) => error?.code === "cloud-auth",
    getNativeIntl: () => ({
      formatMessage(descriptor) {
        state.formatCalls.push(descriptor);
        return descriptor.values == null
          ? descriptor.messageId
          : `${descriptor.messageId}:${descriptor.values.appName}`;
      },
    }),
    dialog: {
      async showMessageBox(options) {
        state.dialogs.push(options);
        const result = state.dialogResults.shift();
        return result instanceof Promise ? result : (result ?? { response: 0 });
      },
    },
    app: {
      getName: () => "Codex Test",
      quit: () => {
        state.quitCalls += 1;
      },
    },
    logger: {
      warning: (message, fields) => state.warnings.push({ message, fields }),
    },
  });
  const connection = {
    async sendAppServerRequest(method, params) {
      state.logoutCalls.push({ method, params });
      const result = state.logoutResults.shift();
      if (result instanceof Error) throw result;
      return result;
    },
  };
  const quitState = {
    markQuitApproved: () => {
      state.quitApproved += 1;
    },
  };
  return { state, recovery: createRecovery(connection, quitState) };
}

{
  const harness = createHarness();
  const failure = { code: "unrelated" };
  await assert.rejects(harness.recovery(failure, () => true), (error) => error === failure);
  assertions += 1;
  equal(harness.state.dialogs.length, 0);
}

{
  const harness = createHarness();
  equal(await harness.recovery({ code: "cloud-auth" }, () => false), "stop");
  equal(harness.state.dialogs.length, 0);
  equal(harness.state.logoutCalls.length, 0);
}

{
  const harness = createHarness();
  harness.state.dialogResults.push({ response: 0 });
  equal(await harness.recovery({ code: "cloud-auth" }, () => true), "retry");
  equal(harness.state.dialogs.length, 1);
  equal(harness.state.dialogs[0], {
    type: "warning",
    message: "desktop.requirementsAuthRecovery.title",
    detail: "desktop.requirementsAuthRecovery.detail:Codex Test",
    buttons: [
      "desktop.requirementsAuthRecovery.signIn",
      "desktop.requirementsAuthRecovery.quit",
    ],
    defaultId: 0,
    cancelId: 1,
    noLink: true,
  });
  equal(harness.state.logoutCalls, [{ method: "account/logout", params: undefined }]);
  equal(harness.state.quitApproved, 0);
  equal(harness.state.quitCalls, 0);
}

{
  const harness = createHarness();
  harness.state.dialogResults.push({ response: 1 });
  equal(await harness.recovery({ code: "cloud-auth" }, () => true), "stop");
  equal(harness.state.quitApproved, 1);
  equal(harness.state.quitCalls, 1);
  equal(harness.state.logoutCalls.length, 0);
}

{
  const harness = createHarness();
  let active = true;
  const dialog = deferred();
  harness.state.dialogResults.push(dialog.promise);
  const pending = harness.recovery({ code: "cloud-auth" }, () => active);
  equal(harness.state.dialogs.length, 1);
  active = false;
  dialog.resolve({ response: 1 });
  equal(await pending, "stop");
  equal(harness.state.quitApproved, 0, "stale dialogs must not approve quit");
  equal(harness.state.quitCalls, 0);
  equal(harness.state.logoutCalls.length, 0);
}

{
  const harness = createHarness();
  const logoutFailure = Error("logout failed");
  harness.state.logoutResults.push(logoutFailure, undefined);
  harness.state.dialogResults.push({ response: 0 }, { response: 0 });
  equal(await harness.recovery({ code: "cloud-auth" }, () => true), "retry");
  equal(harness.state.dialogs.length, 2);
  equal(harness.state.dialogs[0].detail, "desktop.requirementsAuthRecovery.detail:Codex Test");
  equal(harness.state.dialogs[1].detail, "desktop.requirementsAuthRecovery.retryDetail:Codex Test");
  equal(harness.state.logoutCalls.length, 2);
  equal(harness.state.warnings, [{
    message: "Failed to sign out for requirements recovery",
    fields: { safe: {}, sensitive: { error: logoutFailure } },
  }]);
}

{
  const harness = createHarness();
  const firstDialog = deferred();
  harness.state.dialogResults.push(firstDialog.promise, { response: 0 });
  const first = harness.recovery({ code: "cloud-auth" }, () => true);
  const second = harness.recovery({ code: "cloud-auth" }, () => true);
  equal(harness.state.dialogs.length, 1, "concurrent recovery must wait for the active dialog");
  firstDialog.resolve({ response: 0 });
  equal(await first, "retry");
  await Promise.resolve();
  equal(harness.state.dialogs.length, 2, "waiting recovery starts only after the first settles");
  equal(await second, "retry");
  equal(harness.state.logoutCalls.length, 2);
}

{
  const harness = createHarness();
  const dialogFailure = Error("dialog unavailable");
  harness.state.dialogResults.push(Promise.reject(dialogFailure), { response: 0 });
  await assert.rejects(harness.recovery({ code: "cloud-auth" }, () => true), dialogFailure);
  assertions += 1;
  equal(await harness.recovery({ code: "cloud-auth" }, () => true), "retry");
  equal(harness.state.dialogs.length, 2, "single-flight state must clear after rejection");
}

{
  const legacyMessages = [
    "Your access token could not be refreshed because your refresh token has expired. Please log out and sign in again.",
    "Your access token could not be refreshed because your refresh token was already used. Please log out and sign in again.",
    "Your access token could not be refreshed because your refresh token was revoked. Please log out and sign in again.",
    "Your access token could not be refreshed. Please log out and sign in again.",
    "Your access token could not be refreshed because you have since logged out or signed in to another account. Please sign in again.",
  ];
  for (const message of legacyMessages) {
    const harness = createHarness();
    harness.state.dialogResults.push({ response: 1 });
    equal(
      await harness.recovery(Error(`failed to read configuration layers: ${message}`), () => true),
      "stop",
    );
    equal(harness.state.dialogs.length, 1);
  }
}

{
  const harness = createHarness();
  const almostLegacy = Error(
    "failed to read configuration layers: Your access token could not be refreshed. Please log out and sign in again. ",
  );
  await assert.rejects(harness.recovery(almostLegacy, () => true), (error) => error === almostLegacy);
  assertions += 1;
}

const main = fs.readFileSync(
  new URL("../.reference/originals/main/main-C-Mhak1n.ts", import.meta.url),
  "utf8",
);
equal(main.includes("var rrt = createRequirementsAuthRecoveryRuntime({"), true);
equal(main.includes("function rrt("), false);
equal(main.includes("async function irt("), false);
equal(main.includes("rrt(le, i)"), true, "application-network requirements must consume the migrated controller");
equal(main.includes("desktop.requirementsAuthRecovery.title"), false);

console.log(`${assertions} main requirements auth-recovery assertions passed`);
