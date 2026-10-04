import assert from "node:assert/strict";
import fs from "node:fs/promises";
import * as esbuild from "esbuild";

const source = await fs.readFile("src/main/main-app/open-target/remote-host.ts", "utf8");
const { code } = await esbuild.transform(source, { loader: "ts", format: "cjs" });
const module = { exports: {} };
new Function("module", "exports", code)(module, module.exports);
const {
  fallbackTargetIdentifier,
  readSshAlias,
  readTerminalCommandLastArg,
  readTerminalCommandPort,
  terminalCommandHasIdentity,
  formatHostWithPort,
  bracketIpv6Host,
} = module.exports;

assert.equal(fallbackTargetIdentifier("ssh://user@example.com:22"), "22");
assert.equal(fallbackTargetIdentifier("  host/name  "), "name");
assert.equal(readSshAlias({ sshAlias: "  prod  " }), "prod");
assert.equal(readSshAlias({ sshAlias: "   " }), null);
assert.equal(readTerminalCommandLastArg(["ssh", "user@example.com"]), "user@example.com");
assert.equal(readTerminalCommandPort(["ssh", "-p2222", "host"]), 2222);
assert.equal(readTerminalCommandPort(["ssh", "-p", "2200", "host"]), 2200);
assert.equal(terminalCommandHasIdentity(["ssh", "-i~/.ssh/id_ed25519"]), true);
assert.equal(terminalCommandHasIdentity(["ssh", "host"]), false);
assert.equal(bracketIpv6Host("user@2001:db8::1"), "user@[2001:db8::1]");
assert.equal(formatHostWithPort("2001:db8::1", 22), "[2001:db8::1]:22");
console.log("main remote host helpers passed (11 assertions)");
