#!/usr/bin/env node
import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { buildPyrightSessionOptions } = require("../app/.vite/build/main-app/language-server/pyright-session-options.js");

assert.deepEqual(buildPyrightSessionOptions({ platform: `windows`, pathEntries: [`C:/Python`, `C:/Windows`], pythonCommand: `C:/Python/python.exe` }), {
  env: { PATH: `C:/Python;C:/Windows`, PYTHONHOME: ``, PYTHONPATH: ``, VIRTUAL_ENV: `` },
  workspaceConfiguration: { python: { pythonPath: `C:/Python/python.exe` } },
});
assert.deepEqual(buildPyrightSessionOptions({ platform: `linux`, pathEntries: [`/usr/bin`, `/bin`], pythonCommand: null }), {
  env: { PATH: `/usr/bin:/bin`, PYTHONHOME: ``, PYTHONPATH: ``, VIRTUAL_ENV: `` },
  workspaceConfiguration: undefined,
});
console.log(`2 main Pyright session options assertions passed`);
