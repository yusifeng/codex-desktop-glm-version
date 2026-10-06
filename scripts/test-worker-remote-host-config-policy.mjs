import assert from "node:assert/strict";
import { parseRemoteHostConfig } from "../app/.vite/build/worker/remote-host-config-policy.js";
assert.deepEqual(parseRemoteHostConfig({ sshHost: "host", sshAlias: null, sshPort: 22, identity: null }), { sshHost: "host", sshAlias: null, sshPort: 22, identity: null });
assert.equal(parseRemoteHostConfig({ sshHost: 22 }), null);
assert.equal(parseRemoteHostConfig(null), null);
console.log("worker remote host config policy assertions passed (3)");
