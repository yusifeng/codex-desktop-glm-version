import assert from "node:assert/strict";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const built = await esbuild.build({
  bundle: true,
  entryPoints: [path.join(root, "src/main/main-app/startup/system-permissions-service.ts")],
  format: "esm",
  logLevel: "silent",
  platform: "node",
  target: "node22",
  write: false,
});
const { SystemPermissionsService } = await import(
  `data:text/javascript;base64,${Buffer.from(built.outputFiles[0].text).toString("base64")}`
);

let assertions = 0;
const equal = (actual, expected) => {
  assert.deepEqual(actual, expected);
  assertions += 1;
};
const ok = (value) => {
  assert.ok(value);
  assertions += 1;
};

function createHarness(overrides = {}) {
  const calls = [];
  const errors = [];
  let microphoneStatus = overrides.microphoneStatus ?? "not-determined";
  const service = new SystemPermissionsService({
    async askForMicrophoneAccess() {
      calls.push(["ask-microphone"]);
      if (overrides.askError != null) throw overrides.askError;
      microphoneStatus = overrides.microphoneStatusAfter ?? "granted";
      return overrides.askResult ?? true;
    },
    async delay(milliseconds) {
      calls.push(["delay", milliseconds]);
      if (overrides.delayError != null) throw overrides.delayError;
    },
    getMicrophoneAccessStatus() {
      calls.push(["microphone-status"]);
      return microphoneStatus;
    },
    async getNotificationPermissionStatus() {
      calls.push(["notification-status"]);
      if (overrides.notificationError != null) throw overrides.notificationError;
      return overrides.notificationStatus ?? "granted";
    },
    logger() {
      return { error: (message, context) => errors.push({ context, message }) };
    },
    notificationAuthorizationUnavailable: overrides.unavailable ?? false,
    notificationSettingsAppBundleIdentifier: "com.example Agent/App",
    async openExternal(url) {
      calls.push(["open", url]);
      if (overrides.openError != null) throw overrides.openError;
    },
    permissionSettingsAppPath: "/Applications/Permissions.app",
    platform: overrides.platform ?? "darwin",
    requestNotificationAuthorization() {
      calls.push(["request-notification"]);
    },
    showItemInFolder(value) {
      calls.push(["show-item", value]);
      if (overrides.showError != null) throw overrides.showError;
    },
  });
  return { calls, errors, service };
}

for (const [status, expected] of [
  ["granted", "enabled"],
  ["denied", "disabled"],
  ["not-determined", "not-determined"],
  ["unexpected", null],
]) {
  const harness = createHarness({ notificationStatus: status });
  equal(await harness.service.getNotificationPermissionStatus(), expected);
  equal(harness.calls, [["notification-status"]]);
}

{
  const harness = createHarness({ unavailable: true });
  equal(await harness.service.getNotificationPermissionStatus(), null);
  equal(harness.calls, []);
}

for (const platform of ["win32", "linux"]) {
  const harness = createHarness({ platform });
  equal(await harness.service.requestMicrophoneAccess(), {
    requestResult: "not_requested",
    statusAfter: "unknown",
    statusBefore: "unknown",
  });
  equal(harness.calls, []);
}

{
  const harness = createHarness({ microphoneStatus: "granted" });
  equal(await harness.service.requestMicrophoneAccess(), {
    requestResult: "not_requested",
    statusAfter: "granted",
    statusBefore: "granted",
  });
  equal(harness.calls, [["microphone-status"]]);
}

for (const [askResult, expectedResult, statusAfter] of [
  [true, "granted", "granted"],
  [false, "denied", "denied"],
]) {
  const harness = createHarness({ askResult, microphoneStatusAfter: statusAfter });
  equal(await harness.service.requestMicrophoneAccess(), {
    requestResult: expectedResult,
    statusAfter,
    statusBefore: "not-determined",
  });
  equal(harness.calls, [
    ["microphone-status"],
    ["ask-microphone"],
    ["microphone-status"],
  ]);
}

{
  const failure = Error("ask failed");
  const harness = createHarness({ askError: failure, microphoneStatus: "denied" });
  equal(await harness.service.requestMicrophoneAccess(), {
    requestResult: "error",
    statusAfter: "unknown",
    statusBefore: "denied",
  });
  equal(harness.errors.length, 1);
  equal(harness.errors[0].message, "Microphone permission request failed");
  equal(harness.errors[0].context.sensitive.error, failure);
}

for (const [platform, expectedUrl] of [
  ["darwin", "x-apple.systempreferences:com.apple.preference.security?Privacy_Microphone"],
  ["win32", "ms-settings:privacy-microphone"],
  ["linux", null],
]) {
  const harness = createHarness({ platform });
  await harness.service.openMicrophoneSettings();
  equal(
    harness.calls.find((call) => call[0] === "open")?.[1] ?? null,
    expectedUrl,
  );
}

{
  const harness = createHarness({ platform: "win32" });
  await harness.service.openNotificationSettings();
  equal(harness.calls, [["open", "ms-settings:notifications"]]);
}

{
  const harness = createHarness({ unavailable: true });
  await harness.service.openNotificationSettings();
  equal(harness.calls, []);
}

{
  const harness = createHarness({ notificationStatus: "granted" });
  await harness.service.openNotificationSettings();
  equal(harness.calls, [
    ["notification-status"],
    [
      "open",
      "x-apple.systempreferences:com.apple.Notifications-Settings.extension?id=com.example%20Agent%2FApp",
    ],
  ]);
}

for (const notificationStatus of ["not-determined", "unexpected"]) {
  const harness = createHarness({ notificationStatus });
  await harness.service.openNotificationSettings();
  equal(harness.calls.slice(0, 3), [
    ["notification-status"],
    ["request-notification"],
    ["delay", 2_000],
  ]);
  ok(harness.calls.at(-1)[1].includes("Notifications-Settings.extension?id="));
}

for (const [method, expectedUrl] of [
  ["openScreenRecordingSettings", "x-apple.systempreferences:com.apple.preference.security?Privacy_ScreenCapture"],
  ["openAccessibilitySettings", "x-apple.systempreferences:com.apple.preference.security?Privacy_Accessibility"],
]) {
  const harness = createHarness();
  await harness.service[method]();
  equal(harness.calls, [["open", expectedUrl]]);
  const otherPlatform = createHarness({ platform: "win32" });
  await otherPlatform.service[method]();
  equal(otherPlatform.calls, []);
}

{
  const harness = createHarness();
  await harness.service.showPermissionSettingsAppInFinder();
  equal(harness.calls, [["show-item", "/Applications/Permissions.app"]]);
  const windows = createHarness({ platform: "win32" });
  await windows.service.showPermissionSettingsAppInFinder();
  equal(windows.calls, []);
}

for (const [method, message, overrides] of [
  ["openMicrophoneSettings", "Open microphone settings failed", { openError: Error("open") }],
  ["openNotificationSettings", "Open notification settings failed", { notificationError: Error("status") }],
  ["openScreenRecordingSettings", "Open screen recording settings failed", { openError: Error("open") }],
  ["openAccessibilitySettings", "Open accessibility settings failed", { openError: Error("open") }],
  ["showPermissionSettingsAppInFinder", "Show permission settings app in Finder failed", { showError: Error("show") }],
]) {
  const harness = createHarness(overrides);
  await harness.service[method]();
  equal(harness.errors.length, 1);
  equal(harness.errors[0].message, message);
  ok(harness.errors[0].context.sensitive.error instanceof Error);
}

console.log(`${assertions} main system permissions service assertions passed`);
