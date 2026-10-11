import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { createShellEnvironmentResolver } = require('../app/.vite/build/worker/git-shell-environment.js');

let spawns = 0;
const warnings = [];
const resolver = createShellEnvironmentResolver({
  runProcess: async (process) => {
    spawns++;
    const command = process.options?.args?.at(-1);
    if (command?.startsWith(`entry=`)) return { code: 0, stdout: `/bin/bash\n` };
    return { code: 0, stdout: `noise\0_SHELL_ENV_DELIMITER_\0PATH=/bin\0TERM=xterm\0_SHELL_ENV_DELIMITER_\0tail` };
  },
  logger: { warning: (...args) => warnings.push(args) },
});

const host = { id: `host-1`, spawn: async (options) => ({ options }) };
const first = await resolver(host, `linux`, { USER: `codex`, CODEX_SHELL: `old` }, `/workspace`);
assert.deepEqual(first, { USER: `codex`, PATH: `/bin`, TERM: `xterm` });
const second = await resolver(host, `linux`, { USER: `changed` }, `/other`);
assert.deepEqual(second, first);
assert.equal(spawns, 2, `login-shell probe and environment load should be cached per host`);

const windows = await resolver({ id: `win`, spawn: async () => { throw new Error(`should not spawn`); } }, `win32`, { Path: `C:\\Windows` }, `C:\\workspace`);
assert.deepEqual(windows, { Path: `C:\\Windows` });

const failing = createShellEnvironmentResolver({
  runProcess: async () => { throw new Error(`spawn failed`); },
  logger: { warning: (...args) => warnings.push(args) },
});
assert.deepEqual(await failing({ id: `failed`, spawn: async () => ({}) }, `linux`, { USER: `codex` }, `/workspace`), { USER: `codex` });
assert.equal(warnings.length, 1);

console.log(`worker git shell environment tests passed (5 assertions)`);
