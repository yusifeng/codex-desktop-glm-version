import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { parseShellEnvironmentOutput, getEnvironmentValue } = require('../app/.vite/build/worker/shell-environment-parser.js');

const marker = 'CODEX_SHELL';
const parsed = parseShellEnvironmentOutput(`noise${marker}A=1\nB=value\n${marker}tail`, marker, '\n');
assert.deepEqual(parsed, { A: '1', B: 'value' });

const nul = parseShellEnvironmentOutput(`x\0${marker}\0A=1\0B=two\0${marker}\0y`, marker, '\0');
assert.deepEqual(nul, { A: '1', B: 'two' });

assert.equal(getEnvironmentValue({ path: '/bin', PATH: '/usr/bin' }, 'PaTh'), '/bin');
assert.equal(getEnvironmentValue({ EMPTY: '', Other: undefined }, 'empty'), undefined);
assert.throws(() => parseShellEnvironmentOutput('missing markers', marker, '\n'), /env delimiters/);

console.log('5 worker shell environment parser assertions passed');
