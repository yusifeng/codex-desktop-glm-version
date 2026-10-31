import assert from "node:assert/strict";
import fs from "node:fs";
import { createRemoteControlDeviceKeyClientClass } from "../src/main/main-app/remote/remote-control-device-key-client.ts";

const loads = [];
const calls = [];
const addon = {
  createDeviceKey: (storage) => { calls.push(["create", storage]); return { keyId: "key" }; },
  deleteDeviceKey: (keyId) => { calls.push(["delete", keyId]); return true; },
  getDeviceKeyPublic: (keyId) => { calls.push(["public", keyId]); return "public"; },
  signDeviceKey: async (keyId, payload) => { calls.push(["sign", keyId, payload]); return { signatureBase64: "sig" }; },
};
const Client = createRemoteControlDeviceKeyClientClass({
  createRequire: (filename) => {
    assert.equal(filename, "/bundle/main.js");
    return (path) => { loads.push(path); return addon; };
  },
  moduleFilename: "/bundle/main.js",
  pathJoin: (...parts) => parts.join("/"),
});

const missing = new Client(null);
assert.throws(() => missing.createDeviceKey(), /require resourcesPath/);

const client = new Client("/resources");
assert.deepEqual(client.createDeviceKey(), { keyId: "key" });
assert.equal(client.createDeviceKey("software" ).keyId, "key");
assert.equal(client.deleteDeviceKey("key"), true);
assert.equal(client.getDeviceKeyPublic("key"), "public");
assert.deepEqual(loads, ["/resources/native/remote-control-device-key.node"]);
assert.deepEqual(calls.slice(0, 4), [
  ["create", "hardware_only"],
  ["create", "software"],
  ["delete", "key"],
  ["public", "key"],
]);

const nonce = Buffer.alloc(32, 1).toString("base64url");
const digest = Buffer.alloc(32, 2).toString("base64url");
const connectionPayload = {
  type: "remoteControlClientConnection",
  accountUserId: "user",
  audience: "remote_control_client_websocket",
  clientId: "client",
  nonce,
  scopes: ["remote_control_controller_websocket"],
  sessionId: "session",
  targetOrigin: "https://example.test",
  targetPath: "/socket",
  tokenExpiresAt: 123,
  tokenSha256Base64url: digest,
  ignored: "not-signed",
};
const connectionSignature = await client.signDeviceKey("key", connectionPayload);
assert.equal(connectionSignature.signatureBase64, "sig");
const signedConnection = JSON.parse(Buffer.from(connectionSignature.signedPayloadBase64, "base64").toString("utf8"));
assert.equal(signedConnection.domain, "codex-device-key-sign-payload/v1");
assert.equal(signedConnection.payload.type, "remoteControlClientConnection");
assert.equal(signedConnection.payload.ignored, undefined);
assert.deepEqual(signedConnection.payload.scopes, ["remote_control_controller_websocket"]);

const enrollmentPayload = {
  type: "remoteControlClientEnrollment",
  accountUserId: "user",
  audience: "remote_control_client_enrollment",
  challengeExpiresAt: 456,
  challengeId: "challenge",
  clientId: "client",
  deviceIdentitySha256Base64url: digest,
  nonce,
  targetOrigin: "https://example.test",
  targetPath: "/enroll",
};
const enrollmentSignature = await client.signDeviceKey("key", enrollmentPayload);
const signedEnrollment = JSON.parse(Buffer.from(enrollmentSignature.signedPayloadBase64, "base64").toString("utf8"));
assert.equal(signedEnrollment.payload.type, "remoteControlClientEnrollment");
assert.equal(signedEnrollment.payload.challengeId, "challenge");

await assert.rejects(
  () => client.signDeviceKey("key", { ...connectionPayload, audience: "wrong" }),
  /connection audience/,
);
await assert.rejects(
  () => client.signDeviceKey("key", { ...connectionPayload, scopes: [] }),
  /connection scopes/,
);
await assert.rejects(
  () => client.signDeviceKey("key", { ...connectionPayload, nonce: "short" }),
  /device-key nonce/,
);
await assert.rejects(
  () => client.signDeviceKey("key", { ...connectionPayload, tokenSha256Base64url: nonce + "a" }),
  /SHA-256 digest/,
);
await assert.rejects(
  () => client.signDeviceKey("key", { ...enrollmentPayload, audience: "wrong" }),
  /enrollment audience/,
);
assert.equal(loads.length, 1);

const main = fs.readFileSync(new URL("../.reference/originals/main/main-C-Mhak1n.ts", import.meta.url), "utf8");
assert.match(main, /F5e = createRemoteControlDeviceKeyClientClass\(\{/);
assert.doesNotMatch(main, /F5e = class/);
assert.doesNotMatch(main, /function I5e\(/);
assert.match(main, /this\.remoteControlDeviceKeyClient = new F5e\(/);

console.log("remote control device key client assertions: 25");
