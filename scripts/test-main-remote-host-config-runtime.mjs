import assert from "node:assert/strict";
import fs from "node:fs";
import { createRemoteHostConfigRuntime } from "../src/main/main-app/remote/host-config-runtime.ts";

const calls = [];
const runtime = {
  cn: "ssh_options",
  vs: "remote-control",
  ws: (entry) => entry.source === "remote-control",
  ks: (entry) => entry.source === "wsl",
};
const { projectSshHostConfig, projectCatalogEntry, RequestUserInputAutoResolutionService } =
  createRemoteHostConfigRuntime({
    runtime,
    RpcHandlerBase: class {},
    buildSshArguments: ({ alias, hostname, sshPort, identity }) => [alias ?? hostname, "-p", String(sshPort), "-i", identity],
    buildWslCodexCommand: (distro) => ["wsl.exe", "-d", distro, "codex"],
  });

const direct = projectSshHostConfig({
  id: "host",
  displayName: "Host",
  codexCliCommand: ["codex"],
  terminalCommand: ["ssh", "host"],
  sshAlias: null,
  sshHost: "host.example",
  sshPort: 2222,
  identity: "/id",
  homeDir: "/home/user",
});
assert.equal(direct.kind, "ssh");
assert.equal(direct.home_dir, "/home/user");
assert.deepEqual(direct.default_workspaces, []);
assert.deepEqual(direct.ssh_options, { sshAlias: null, sshHost: "host.example", sshPort: 2222, identity: "/id" });

const ssh = projectCatalogEntry({
  source: "codex-managed", hostId: "ssh", displayName: "Dev", sshAlias: "dev", sshHost: "dev.example", sshPort: 22, identity: "/id",
});
assert.equal(ssh.display_name, "(remote) Dev");
assert.deepEqual(ssh.terminal_command, ["ssh", "dev", "-p", "22", "-i", "/id"]);
assert.equal(ssh.ssh_options.sshAlias, "dev");

const wsl = projectCatalogEntry({ source: "wsl", hostId: "wsl:Ubuntu", displayName: "WSL", distro: "Ubuntu" });
assert.equal(wsl.kind, "wsl");
assert.deepEqual(wsl.codex_cli_command, ["wsl.exe", "-d", "Ubuntu", "codex"]);
assert.deepEqual(wsl.terminal_command, ["wsl.exe", "-d", "Ubuntu"]);

const remoteControl = projectCatalogEntry({
  source: "remote-control", hostId: "rc", displayName: "Laptop", envId: "env", hostName: "laptop", environmentKind: "desktop",
  online: true, busy: false, os: "macos", arch: "arm64", appServerVersion: "1", lastSeenAt: 123,
});
assert.equal(remoteControl.kind, "remote-control");
assert.equal(remoteControl.env_id, "env");
assert.equal(remoteControl.online, true);
assert.deepEqual(remoteControl.codex_cli_command, []);

const autoResolution = {
  recordConversationActivity: (...args) => calls.push(["activity", ...args]),
  setConversationPresented: (...args) => calls.push(["presented", ...args]),
  snoozeRequest: (...args) => calls.push(["snooze", ...args]),
};
const service = new RequestUserInputAutoResolutionService(
  { getConnection: (hostId) => { assert.equal(hostId, "host"); return { requestUserInputAutoResolution: autoResolution }; } },
  "surface",
);
service.recordConversationActivity({ hostId: "host", conversationId: "thread" });
service.setConversationPresented({ hostId: "host", conversationId: "thread", presented: true });
service.snooze({ hostId: "host", conversationId: "thread", requestId: "request" });
assert.deepEqual(calls, [
  ["activity", "surface", "thread"],
  ["presented", "surface", "thread", true],
  ["snooze", "thread", "request"],
]);

const main = fs.readFileSync(new URL("../.reference/originals/main/main-C-Mhak1n.ts", import.meta.url), "utf8");
assert.match(main, /projectCatalogEntry: m4/);
assert.match(main, /RequestUserInputAutoResolutionService: G5e/);
assert.doesNotMatch(main, /function V5e\(/);
assert.doesNotMatch(main, /G5e = class/);
assert.match(main, /new G5e\(this\.appServerConnectionRegistry, e\.id\)/);

console.log("remote host config runtime assertions: 22");
