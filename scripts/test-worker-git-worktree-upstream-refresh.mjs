import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const {
  GIT_PROGRESS_PATTERN,
  MAX_PROGRESS_LINE_LENGTH,
  UPSTREAM_REFRESH_PROGRESS_INTERVAL_MS,
  createGitProgressParser,
  createWorktreeUpstreamRefresh,
  readCredentialConfigOverrides,
} = require("../app/.vite/build/worker/git-worktree-upstream-refresh.js");

const encoder = new TextEncoder();
const decoder = new TextDecoder();
let assertions = 0;
const equal = (...args) => { assertions += 1; assert.equal(...args); };
const deepEqual = (...args) => { assertions += 1; assert.deepEqual(...args); };
const match = (...args) => { assertions += 1; assert.match(...args); };
const rejects = async (...args) => { assertions += 1; await assert.rejects(...args); };

function parseProgress(chunks) {
  const output = [];
  const parser = createGitProgressParser((bytes) => output.push(decoder.decode(bytes)));
  for (const chunk of chunks) parser.write(encoder.encode(chunk));
  parser.finish();
  return output;
}

equal(UPSTREAM_REFRESH_PROGRESS_INTERVAL_MS, 15_000);
equal(MAX_PROGRESS_LINE_LENGTH, 1_024);
equal(GIT_PROGRESS_PATTERN.test(`remote: Enumerating objects: 12`), true);
equal(GIT_PROGRESS_PATTERN.test(`Receiving objects: 42% (21/50), 1.00 MiB | 2.00 MiB/s`), true);
equal(GIT_PROGRESS_PATTERN.test(`Receiving objects: complete`), false);
deepEqual(parseProgress([
  `remote: Enumerating obj`,
  `ects: 7\rCounting objects: 25% (1/4)\r\nCompressing objects: 50% (2/4)\n`,
]), [
  `Enumerating objects: 7\r`,
  `Counting objects: 25% (1/4)\n`,
  `Compressing objects: 50% (2/4)\n`,
]);
deepEqual(parseProgress([`noise\nReceiving objects: 100% (4/4)`]), [`Receiving objects: 100% (4/4)\n`]);
deepEqual(parseProgress([`Resolving deltas: 3\r`]), [`Resolving deltas: 3\r`, `\n`]);
deepEqual(parseProgress([`x`.repeat(MAX_PROGRESS_LINE_LENGTH + 1), `\nCounting objects: 2\n`]), [`Counting objects: 2\n`]);
deepEqual(parseProgress([`x`.repeat(MAX_PROGRESS_LINE_LENGTH), `\n`]), []);

{
  const calls = [];
  const repository = { root: `/repo`, host: { id: `host` } };
  const signal = new AbortController().signal;
  const upstreamRefreshSignal = new AbortController().signal;
  const outputs = [
    { success: true, stdout: `credential.helper\nmanager\0credential.https://example.test.username\nalice\0invalid\0\nempty-key\0` },
    { success: false, stdout: `credential.helper\nignored\0` },
  ];
  const overrides = await readCredentialConfigOverrides(repository, signal, upstreamRefreshSignal, {
    runGit: async (...args) => { calls.push(args); return outputs.shift(); },
  });
  deepEqual(overrides, [`-c`, `credential.helper=manager`, `-c`, `credential.https://example.test.username=alice`]);
  equal(calls.length, 2);
  deepEqual(calls.map((call) => call[1]), [
    [`config`, `--system`, `--includes`, `--null`, `--get-regexp`, `^credential\\.`],
    [`config`, `--global`, `--includes`, `--null`, `--get-regexp`, `^credential\\.`],
  ]);
  deepEqual(calls[0][3], {
    allowedNonZeroExitCodes: [1],
    signal,
    trim: false,
    waitForExitOnAbortSignal: upstreamRefreshSignal,
  });
}

function fixture(overrides = {}) {
  const calls = [];
  let now = 1_000;
  let intervalCallback;
  const host = {
    platformFamily: async () => `linux`,
  };
  const config = new Map([
    [`branch.main.remote`, `origin`],
    [`branch.main.merge`, `refs/heads/main`],
    [`remote.origin.url`, `https://example.test/repo.git`],
  ]);
  const worktreeRepo = {
    root: `/repo`,
    host,
    getConfigValue: async (...args) => {
      calls.push([`config`, ...args]);
      return config.get(args[0]) ?? null;
    },
    invalidateGitReadCachesForRepoChange: (...args) => calls.push([`invalidate`, ...args]),
  };
  const dependencies = {
    classifyGitError: () => `other`,
    clearInterval: (...args) => calls.push([`clear-interval`, ...args]),
    getCurrentBranch: async (...args) => { calls.push([`current-branch`, ...args]); return `main`; },
    logger: { warning: (...args) => calls.push([`warning`, ...args]) },
    now: () => now,
    runGit: async (root, args, targetHost, options) => {
      calls.push([`git`, root, args, targetHost, options]);
      if (args[0] === `config`) return { success: true, stdout: `` };
      if (args[0] === `for-each-ref`) return { success: true, stdout: `refs/remotes/origin/main` };
      return { success: true, code: 0, stderr: `` };
    },
    setInterval: (callback, delay) => {
      intervalCallback = callback;
      calls.push([`set-interval`, delay]);
      return `timer`;
    },
    ...overrides,
  };
  const logs = [];
  const onLog = (stream, bytes) => logs.push([stream, decoder.decode(bytes)]);
  return {
    calls,
    config,
    dependencies,
    host,
    logs,
    onLog,
    setNow(value) { now = value; },
    tick() { intervalCallback?.(); },
    worktreeRepo,
  };
}

const baseInput = (state, overrides = {}) => ({
  worktreeRepo: state.worktreeRepo,
  startingState: { type: `branch`, branchName: `main`, remoteRef: null },
  mode: `always`,
  onLog: state.onLog,
  signal: new AbortController().signal,
  upstreamRefreshSignal: new AbortController().signal,
  ...overrides,
});

for (const inputOverride of [
  { mode: `never` },
  { startingState: { type: `commit`, sha: `abc` } },
  { startingState: { type: `branch`, branchName: `main`, remoteRef: `origin/main` } },
]) {
  const state = fixture();
  await createWorktreeUpstreamRefresh(state.dependencies)(baseInput(state, inputOverride));
  equal(state.calls.length, 0);
}

{
  const state = fixture({ getCurrentBranch: async () => null });
  await createWorktreeUpstreamRefresh(state.dependencies)(baseInput(state, {
    startingState: { type: `branch`, branchName: `HEAD`, remoteRef: null },
  }));
  equal(state.calls.some((call) => call[0] === `git`), false);
}

for (const [key, value] of [
  [`branch.main.remote`, null],
  [`branch.main.merge`, null],
  [`branch.main.remote`, `.`],
]) {
  const state = fixture();
  state.config.set(key, value);
  await createWorktreeUpstreamRefresh(state.dependencies)(baseInput(state));
  equal(state.calls.some((call) => call[0] === `git`), false);
}

{
  const state = fixture();
  state.config.set(`remote.origin.url`, null);
  await createWorktreeUpstreamRefresh(state.dependencies)(baseInput(state));
  equal(state.calls.filter((call) => call[0] === `git` && call[2][0] === `fetch`).length, 0);
}

{
  const state = fixture();
  state.host.platformFamily = async () => `windows`;
  state.dependencies.runGit = async (root, args, targetHost, options) => {
    state.calls.push([`git`, root, args, targetHost, options]);
    if (args[0] === `config`)
      return args[1] === `--system`
        ? { success: true, stdout: `credential.helper\nmanager-core\0` }
        : { success: true, stdout: `credential.useHttpPath\ntrue\0` };
    if (args[0] === `for-each-ref`) return { success: true, stdout: `refs/remotes/origin/main` };
    options.onStderrRaw(encoder.encode(`remote: Counting obj`));
    options.onStderrRaw(encoder.encode(`ects: 40% (2/5)\rReceiving objects: 5\r`));
    return { success: true, code: 0, stderr: `` };
  };
  const input = baseInput(state);
  await createWorktreeUpstreamRefresh(state.dependencies)(input);
  const fetch = state.calls.find((call) => call[0] === `git` && call[2][0] === `fetch`);
  deepEqual(fetch.slice(1, 4), [
    `/repo`,
    [`fetch`, `--progress`, `--no-tags`, `--no-recurse-submodules`, `--`, `https://example.test/repo.git`, `+refs/heads/main:refs/remotes/origin/main`],
    state.host,
  ]);
  deepEqual(fetch[4].configOverrides, [
    `-c`, `credential.helper=manager-core`,
    `-c`, `credential.useHttpPath=true`,
    `-c`, `protocol.file.allow=always`,
  ]);
  deepEqual(fetch[4].env, {
    GIT_CONFIG: `NUL`,
    GIT_CONFIG_GLOBAL: `NUL`,
    GIT_CONFIG_NOSYSTEM: `1`,
    GIT_PROTOCOL_FROM_USER: `0`,
  });
  equal(fetch[4].signal, input.signal);
  equal(fetch[4].waitForExitOnAbortSignal, input.upstreamRefreshSignal);
  deepEqual(state.logs, [
    [`info`, `[info] Refreshing upstream before creating worktree`],
    [`info`, `\n`],
    [`stderr`, `Counting objects: 40% (2/5)\r`],
    [`stderr`, `Receiving objects: 5\r`],
    [`stderr`, `\n`],
    [`info`, `[info] Upstream refreshed\n`],
  ]);
  equal(state.calls.some((call) => call[0] === `invalidate` && call[1] === `remote-refs`), true);
  deepEqual(state.calls.filter((call) => call[0] === `set-interval`), [[`set-interval`, UPSTREAM_REFRESH_PROGRESS_INTERVAL_MS]]);
  deepEqual(state.calls.filter((call) => call[0] === `clear-interval`), [[`clear-interval`, `timer`]]);
}

{
  const state = fixture();
  let resolveFetch;
  state.dependencies.runGit = async (root, args, host, options) => {
    state.calls.push([`git`, root, args, host, options]);
    if (args[0] === `config`) return { success: true, stdout: `` };
    if (args[0] === `for-each-ref`) return { success: true, stdout: `refs/remotes/origin/main` };
    return new Promise((resolve) => { resolveFetch = resolve; });
  };
  const pending = createWorktreeUpstreamRefresh(state.dependencies)(baseInput(state));
  while (resolveFetch == null) await new Promise((resolve) => setImmediate(resolve));
  state.setNow(16_000);
  state.tick();
  state.setNow(31_500);
  state.tick();
  resolveFetch({ success: true, code: 0, stderr: `` });
  await pending;
  equal(state.logs.some((entry) => entry[1].includes(`15s elapsed`)), true);
  equal(state.logs.some((entry) => entry[1].includes(`30s elapsed`)), true);
}

{
  const state = fixture({ classifyGitError: () => `authentication` });
  state.dependencies.runGit = async (root, args, host, options) => {
    state.calls.push([`git`, root, args, host, options]);
    if (args[0] === `config`) return { success: true, stdout: `` };
    if (args[0] === `for-each-ref`) return { success: true, stdout: `refs/remotes/origin/main` };
    return { success: false, code: 128, stderr: `fatal: auth` };
  };
  await createWorktreeUpstreamRefresh(state.dependencies)(baseInput(state));
  equal(state.calls.some((call) => call[0] === `invalidate`), false);
  const warning = state.calls.find((call) => call[0] === `warning`);
  deepEqual(warning.slice(1), [`[worktree-create] upstream-refresh-failed`, {
    safe: { exitCode: 128 },
    sensitive: { branchName: `main`, remote: `origin`, stderr: `fatal: auth` },
  }]);
  equal(state.logs.at(-1)[1], `[warning] Git authentication failed; sign in again before retrying\n[warning] Could not refresh upstream; using cached Git state\n`);
}

{
  const state = fixture();
  const controller = new AbortController();
  controller.abort();
  await createWorktreeUpstreamRefresh(state.dependencies)(baseInput(state, { signal: controller.signal }));
  equal(state.calls.some((call) => call[0] === `git` && call[2][0] === `fetch`), false);
  equal(state.logs.length, 0);
}

{
  const state = fixture();
  const controller = new AbortController();
  controller.abort();
  await createWorktreeUpstreamRefresh(state.dependencies)(baseInput(state, { upstreamRefreshSignal: controller.signal }));
  equal(state.calls.some((call) => call[0] === `git` && call[2][0] === `fetch`), false);
  deepEqual(state.logs, [[`info`, `[info] Continuing without updating\n`]]);
}

for (const kind of [`signal`, `upstream`]) {
  const state = fixture();
  const controller = new AbortController();
  state.dependencies.runGit = async (root, args, host, options) => {
    state.calls.push([`git`, root, args, host, options]);
    if (args[0] === `config`) return { success: true, stdout: `` };
    if (args[0] === `for-each-ref`) return { success: true, stdout: `refs/remotes/origin/main` };
    controller.abort();
    return { success: false, code: 1, stderr: `aborted` };
  };
  const input = baseInput(state, kind === `signal`
    ? { signal: controller.signal }
    : { upstreamRefreshSignal: controller.signal });
  await createWorktreeUpstreamRefresh(state.dependencies)(input);
  equal(state.calls.some((call) => call[0] === `warning`), false);
  equal(state.calls.some((call) => call[0] === `clear-interval`), true);
  if (kind === `upstream`)
    equal(state.logs.at(-1)[1], `[info] Continuing without updating\n`);
}

{
  const thrown = new Error(`fetch exploded`);
  const state = fixture();
  state.dependencies.runGit = async (root, args, host, options) => {
    state.calls.push([`git`, root, args, host, options]);
    if (args[0] === `config`) return { success: true, stdout: `` };
    if (args[0] === `for-each-ref`) return { success: true, stdout: `refs/remotes/origin/main` };
    throw thrown;
  };
  await rejects(createWorktreeUpstreamRefresh(state.dependencies)(baseInput(state)), (error) => error === thrown);
  equal(state.calls.some((call) => call[0] === `clear-interval`), true);
  equal(state.logs.at(-1)[1], `\n`);
}

console.log(`${assertions} worker git worktree upstream refresh assertions passed`);
