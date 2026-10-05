import assert from "node:assert/strict";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const policy = require("../app/.vite/build/worker/host-path-policy.js");

assert.equal(policy.isWslMountedPath("/mnt/c/Users"), true);
assert.equal(policy.isWslMountedPath("\\\\MNT\\d\\tmp"), true);
assert.equal(policy.isWindowsPath("C:/Users"), true);
assert.equal(policy.isWindowsPath("\\\\server\\share"), true);
assert.equal(policy.isWslUncPath("\\\\wsl.localhost\\Ubuntu\\home"), true);
assert.equal(policy.wslUncDistro("\\\\wsl$\\Ubuntu\\home"), "Ubuntu");
assert.equal(policy.mountedPathToWindows("/mnt/c/Users/david"), "C:\\Users\\david");
assert.equal(policy.mountedPathToWindows("C:\\mnt\\c\\tmp"), "C:\\tmp");
assert.equal(policy.windowsPathToWsl("C:\\Users\\david"), "/mnt/c/Users/david");
assert.equal(policy.windowsPathToWsl("\\\\wsl$\\Ubuntu\\home\\david"), "/home/david");
assert.equal(policy.windowsPathToWsl("\\\\?\\C:\\tmp"), "/mnt/c/tmp");
assert.equal(policy.toBackslashes("//server/share"), "\\\\server\\share");
console.log("12 worker host path policy assertions passed");
