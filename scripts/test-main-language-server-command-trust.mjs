import assert from "node:assert/strict";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const policy = require("../app/.vite/build/main-app/language-server/command-trust.js");

const posix = {
  sep: "/",
  isAbsolute: (value) => value.startsWith("/"),
  relative: (from, to) => {
    if (to === from) return "";
    if (to.startsWith(`${from}/`)) return to.slice(from.length + 1);
    return to.startsWith("/") ? `../${to.slice(1)}` : to;
  },
  dirname: (value) => value.slice(0, value.lastIndexOf("/")) || "/",
  join: (...parts) => parts.join("/").replace(/\/+/g, "/"),
};
const win32 = {
  sep: "\\",
  isAbsolute: (value) => /^[A-Za-z]:\\/.test(value),
  relative: (from, to) => (to === from ? "" : to.startsWith(`${from}\\`) ? to.slice(from.length + 1) : "..\\outside"),
  dirname: (value) => value.slice(0, value.lastIndexOf("\\")),
  join: (...parts) => parts.join("\\"),
};

assert.equal(policy.resolveTrustedLanguageServerPath("/workspace/bin/pyright", "/workspace", posix), null);
assert.equal(policy.resolveTrustedLanguageServerPath("/opt/codex/bin/pyright", "/workspace", posix), "/opt/codex/bin/pyright");
assert.equal(policy.resolveTrustedLanguageServerPath("/workspace/node_modules/.bin/pyright", "/workspace", posix), null);
assert.equal(policy.resolveTrustedLanguageServerPath("C:\\tools\\server.exe", "C:\\repo", win32), "C:\\tools\\server.exe");
assert.equal(policy.parseUnixTrustedLookup("noise\n__CODEX_LANGUAGE_SERVER__=/workspace/bin/server\n"), "/workspace/bin/server");
assert.equal(policy.parseUnixTrustedLookup("__CODEX_LANGUAGE_SERVER__=\n"), null);
assert.equal(policy.parseWindowsTrustedLookup("C:\\bad\\server\n C:\\tools\\server.CMD\n"), "C:\\tools\\server.CMD");
assert.deepEqual(policy.buildUnixDirectLaunchCommand("/bin/server", ["--stdio"], true, "linux"), ["/bin/server", "--stdio"]);
assert.deepEqual(policy.buildUnixDirectLaunchCommand("server", ["--stdio"], false, "linux"), ["/bin/sh", "-lc", 'exec "$@"', "sh", "server", "--stdio"]);
assert.deepEqual(policy.buildWindowsNodeModuleLaunchCommand("C:\\tools\\ts-language-server.cmd", "typescript-language-server", "lib\\cli.mjs", "C:\\node.exe", win32), ["C:\\node.exe", "C:\\tools\\node_modules\\typescript-language-server\\lib\\cli.mjs"]);
console.log("test-main-language-server-command-trust: 10 assertions passed");
