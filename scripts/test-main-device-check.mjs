import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { createRequire } from "node:module";
import * as esbuild from "esbuild";

const root = path.resolve(import.meta.dirname, "..");
const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "codex-device-check-"));
const output = path.join(tempDir, "device-check.cjs");
await esbuild.build({
  entryPoints: [path.join(root, "src/main/main-app/security/device-check.ts")],
  outfile: output,
  bundle: true,
  format: "cjs",
  platform: "node",
  target: "esnext",
  logLevel: "silent",
});
const deviceCheck = createRequire(import.meta.url)(output);

assert.equal(deviceCheck.isDeviceCheckPlatform("darwin"), true);
assert.equal(deviceCheck.isDeviceCheckPlatform("linux"), false);
assert.equal(deviceCheck.isAppleSilicon("arm64", "darwin"), true);
assert.equal(deviceCheck.isAppleSilicon("x64", "darwin"), false);
assert.equal(deviceCheck.isDeviceCheckSupported({ platform: "darwin", arch: "arm64", addon: { isSupported: () => true } }), true);
assert.equal(deviceCheck.isDeviceCheckSupported({ platform: "darwin", arch: "arm64", addon: { isSupported: () => false } }), false);

const signals = {
  schemaVersion: 1,
  preferredLanguages: ["zh-CN", "en-US"],
  locale: "zh-CN",
  timezone: "Asia/Shanghai",
  screenSizeSum: 3840,
  screenScale: 2,
  appSessionId: "session-1",
};
const loggerEvents = [];
const logger = {
  info: (message, details) => loggerEvents.push(["info", message, details]),
  warning: (message, details) => loggerEvents.push(["warning", message, details]),
};
const addon = { generateToken: async () => ({ supported: true, tokenBase64: "token", latencyMs: 3 }) };
const handler = deviceCheck.createDeviceAttestationHandler({ platform: "darwin", arch: "arm64", bundleIdentifier: "com.example.app", getSignals: () => signals, addon, logger });
assert.equal(await handler({ method: "other" }), null);
const generated = await handler({ method: "attestation/generate" });
assert.match(generated.token, /^v1\./);
assert.equal(loggerEvents[0][0], "info");

const unavailable = deviceCheck.createDeviceAttestationHandler({ platform: "linux", bundleIdentifier: "com.example.app", getSignals: () => signals, logger });
const unavailableResult = await unavailable({ method: "attestation/generate" });
assert.match(unavailableResult.token, /^v1\./);
assert.equal(loggerEvents.at(-1)[1], "DeviceCheck attestation unavailable");

assert.equal(await deviceCheck.generateDeviceCheckToken({ platform: "darwin", arch: "x64", addon }), null);
assert.match(deviceCheck.encodeAttestation({ bundleIdentifier: "com.example.app", errorCode: 2 }), /^v1\./);
console.log("main DeviceCheck assertions passed (13 assertions)");
