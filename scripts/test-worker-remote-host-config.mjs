#!/usr/bin/env node
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import * as esbuild from "esbuild";

const source = await fs.readFile("src/main/worker/remote-host-config.ts", "utf8");
const { code } = await esbuild.transform(source, { loader: "ts", format: "cjs" });
const module = { exports: {} };
new Function("module", "exports", code)(module, module.exports);
const { parseRemoteHostConfig, resolveHostDisplayName, resolveHostSshIdentity } = module.exports;

assert.deepEqual(parseRemoteHostConfig({ sshAlias: "prod", sshHost: "host", sshPort: 22, identity: null }), {
  sshAlias: "prod", sshHost: "host", sshPort: 22, identity: null,
});
assert.equal(resolveHostDisplayName({ kind: "ssh", ssh_websocket_v0: { sshAlias: "prod", sshHost: "host", sshPort: null, identity: null } }), "prod");
assert.equal(resolveHostSshIdentity({ kind: "ssh", ssh_websocket_v0: { sshAlias: null, sshHost: "user@2001:db8::1", sshPort: 2222, identity: null } }), "user@[2001:db8::1]:2222");
assert.equal(resolveHostSshIdentity({ kind: "ssh", terminal_command: ["ssh", "-i", "/tmp/key", "user@example.com"], id: "ssh/example" }), null);
assert.equal(resolveHostSshIdentity({ kind: "ssh", terminal_command: ["ssh", "-p2222", "user@example.com"] }), "user@example.com:2222");
assert.equal(resolveHostDisplayName({ id: "ssh/example" }), "example");
console.log("6 worker remote host config assertions passed");
