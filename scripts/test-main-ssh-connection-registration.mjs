import assert from "node:assert/strict";
import fs from "node:fs";
import { z } from "zod";
import { createSshConnectionRegistrationClass } from "../src/main/main-app/remote/ssh-connection-registration.ts";

const runtime = {
  Uf: class {}, Of: () => z.string(), gf: () => z.boolean(), wf: (shape) => z.object(shape), ys: (alias) => `ssh:${alias}`,
  iu: { CODEX_MANAGED_REMOTE_CONNECTIONS: "managed", REMOTE_CONNECTION_AUTO_CONNECT_BY_HOST_ID: "auto" },
};
const values = new Map();
const state = { get: (key) => values.get(key), set: (key, value) => values.set(key, value) };
const saved = [];
let refreshes = 0;
const connections = {
  saveCodexManagedRemoteSshConnections: async (entries) => { saved.push(entries); },
  refreshRemoteConnections: async () => { refreshes += 1; },
};
const Registration = createSshConnectionRegistrationClass({
  runtime, RpcHandlerBase: runtime.Uf,
  resolveSshAlias: async ({ entrypointPath, sshAlias }) => ({ hostId: `resolved:${sshAlias}`, displayName: sshAlias, source: "discovered", sshAlias, sshHost: "host", sshPort: 22, identity: null }),
  createLogger: () => () => ({ warning: () => {} }),
  pathJoin: (...parts) => parts.join("/"), homeDirectory: () => "/home/test",
});
const registration = new Registration(state, connections);
const added = await registration.add({ sshAlias: "dev", autoConnect: true });
assert.equal(added.hostId, "resolved:dev");
assert.equal(added.autoConnect, true);
assert.equal(saved.length, 1);
assert.equal(saved[0][0].alias, "dev");
assert.deepEqual(values.get("auto"), { "resolved:dev": true });

values.set("managed", saved[0]);
const existing = await registration.add({ sshAlias: "dev", autoConnect: false });
assert.equal(existing.hostId, "resolved:dev");
assert.equal(existing.displayName, "dev");
assert.equal(refreshes, 1);
assert.equal(await registration.remove({ hostId: "missing", sshAlias: "dev" }), false);
assert.equal(await registration.remove({ hostId: "resolved:dev", sshAlias: "dev" }), true);
assert.deepEqual(values.get("managed"), []);
assert.deepEqual(values.get("auto"), {});
assert.equal(refreshes, 2);

const fast = await registration.add({ sshAlias: "fast", autoConnect: false, waitForMetadata: false });
assert.equal(fast.hostId, "ssh:fast");
assert.equal(fast.sshHost, "fast");
assert.equal(fast.autoConnect, false);
await assert.rejects(() => registration.add({ sshAlias: "bad alias" }));

const main = fs.readFileSync(new URL("../.reference/originals/main/main-C-Mhak1n.ts", import.meta.url), "utf8");
assert.match(main, /ett = createSshConnectionRegistrationClass\(\{/);
assert.doesNotMatch(main, /ett = class/);
assert.doesNotMatch(main, /s5 = n\.wf/);
assert.match(main, /sshConnectionRegistration: new ett/);
console.log("ssh connection registration assertions: 20");
