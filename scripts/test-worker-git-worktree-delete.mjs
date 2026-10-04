import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const {
  WORKTREE_DELETE_CONCURRENCY,
  cleanupWorktreeEnvironment,
  createWorktreeDelete,
  removeWorktreeDirectory,
} = require("../app/.vite/build/worker/git-worktree-delete.js");

let assertions = 0;
const equal = (...args) => { assertions += 1; assert.equal(...args); };
const deepEqual = (...args) => { assertions += 1; assert.deepEqual(...args); };
const rejects = async (...args) => { assertions += 1; await assert.rejects(...args); };

function fixture(overrides = {}) {
  const calls = [];
  const host = {
    id: `local`,
    platformPath: async () => ({ dirname: (path) => path.slice(0, path.lastIndexOf(`/`)) || `/` }),
    readDirectory: async (...args) => { calls.push([`read-directory`, ...args]); return []; },
    remove: async (...args) => { calls.push([`remove`, ...args]); },
  };
  const dependencies = {
    createSemaphore: () => ({
      acquire: async () => { calls.push([`acquire`]); },
      release: () => { calls.push([`release`]); },
    }),
    getHostId: (target) => target.id,
    getLocalEnvironmentConfigPath: async (...args) => { calls.push([`config-path`, ...args]); return null; },
    getWorktreeId: async (...args) => { calls.push([`worktree-id`, ...args]); return `id`; },
    logger: {
      debug: (...args) => calls.push([`debug`, ...args]),
      info: (...args) => calls.push([`info`, ...args]),
      warning: (...args) => calls.push([`warning`, ...args]),
    },
    readLocalEnvironmentConfig: async (...args) => { calls.push([`read-config`, ...args]); return { environment: {} }; },
    runCleanupScript: async (...args) => { calls.push([`cleanup`, ...args]); return null; },
    runGit: async (...args) => { calls.push([`git`, ...args]); return { success: true, code: 0 }; },
    ...overrides,
  };
  return { calls, dependencies, host };
}

equal(WORKTREE_DELETE_CONCURRENCY, 3);
const signal = new AbortController().signal;
let state = fixture();
await cleanupWorktreeEnvironment(`/worktree`, `id`, state.host, signal, state.dependencies);
equal(state.calls.some((call) => call[0] === `read-config`), false);
state = fixture({ getLocalEnvironmentConfigPath: async () => `__none__` });
await cleanupWorktreeEnvironment(`/worktree`, `id`, state.host, signal, state.dependencies);
equal(state.calls.length, 0);

state = fixture({
  getLocalEnvironmentConfigPath: async () => `/config.toml`,
  readLocalEnvironmentConfig: async () => ({ type: `error`, error: `bad config` }),
});
await cleanupWorktreeEnvironment(`/worktree`, `id`, state.host, signal, state.dependencies);
equal(state.calls.at(-1)[0], `warning`);
deepEqual(state.calls.at(-1)[2], { safe: { worktreeId: `id` }, sensitive: { configPath: `/config.toml`, error: `bad config` } });

state = fixture({
  getLocalEnvironmentConfigPath: async () => `/config.toml`,
  readLocalEnvironmentConfig: async () => ({ environment: {} }),
});
await cleanupWorktreeEnvironment(`/worktree`, `id`, state.host, signal, state.dependencies);
equal(state.calls.some((call) => call[0] === `cleanup`), false);

state = fixture({
  getLocalEnvironmentConfigPath: async () => `/config.toml`,
  readLocalEnvironmentConfig: async () => ({ environment: { cleanup: { script: `clean` } } }),
  runCleanupScript: async (...args) => { state.calls.push([`cleanup`, ...args]); return { status: `succeeded` }; },
});
await cleanupWorktreeEnvironment(`/worktree`, `id`, state.host, signal, state.dependencies);
deepEqual(state.calls.find((call) => call[0] === `cleanup`).slice(1), [`/worktree`, { environment: { cleanup: { script: `clean` } } }, signal, state.host]);
equal(state.calls.filter((call) => call[0] === `info`).length, 2);

for (const result of [{ status: `failed`, error: `cleanup failed` }, { status: `failed` }]) {
  state = fixture({
    getLocalEnvironmentConfigPath: async () => `/config.toml`,
    readLocalEnvironmentConfig: async () => ({ environment: { cleanup: true } }),
    runCleanupScript: async () => result,
  });
  await rejects(cleanupWorktreeEnvironment(`/worktree`, `id`, state.host, signal, state.dependencies), result.error ? /cleanup failed/ : /Cleanup script failed/);
  equal(state.calls.at(-1)[0], `warning`);
}

state = fixture();
await removeWorktreeDirectory(`/parent/worktree`, `id`, state.host, state.dependencies);
deepEqual(state.calls.slice(0, 3), [
  [`remove`, `/parent/worktree`, { recursive: true, force: true }],
  [`read-directory`, `/parent`],
  [`remove`, `/parent`, { recursive: true, force: true }],
]);
deepEqual(state.calls.at(-1)[2], { safe: { worktreeId: `id` }, sensitive: { removedWorktreeDir: true, removedParentDir: true } });

state = fixture();
state.host.readDirectory = async (...args) => { state.calls.push([`read-directory`, ...args]); return [`other`]; };
await removeWorktreeDirectory(`/parent/worktree`, `id`, state.host, state.dependencies);
equal(state.calls.filter((call) => call[0] === `remove`).length, 1);
equal(state.calls.at(-1)[2].sensitive.removedParentDir, false);
state = fixture();
state.host.remove = async (...args) => { state.calls.push([`remove`, ...args]); throw new Error(`denied`); };
await removeWorktreeDirectory(`/parent/worktree`, `id`, state.host, state.dependencies);
equal(state.calls.filter((call) => call[0] === `warning`).length, 2);
equal(state.calls.at(-1)[0], `debug`);
state = fixture();
state.host.platformPath = async () => ({ dirname: (path) => path });
await removeWorktreeDirectory(`/`, `id`, state.host, state.dependencies);
equal(state.calls.some((call) => call[0] === `debug`), false);

state = fixture();
let remover = createWorktreeDelete(state.dependencies).removeWorktree;
await remover(`/worktree`, state.host, false, signal);
deepEqual(state.calls.find((call) => call[0] === `git`).slice(1), [`/worktree`, [`worktree`, `remove`, `/worktree`], state.host, { signal }]);
equal(state.calls[0][0], `worktree-id`);
equal(state.calls[1][0], `acquire`);
equal(state.calls.at(-1)[0], `release`);

state = fixture({ runGit: async (...args) => { state.calls.push([`git`, ...args]); return { success: false, code: 1 }; } });
remover = createWorktreeDelete(state.dependencies).removeWorktree;
await remover(`/worktree`, state.host, false, signal);
equal(state.calls.some((call) => call[0] === `remove`), false);
equal(state.calls.at(-1)[0], `release`);

state = fixture({ runGit: async (...args) => { state.calls.push([`git`, ...args]); return { success: false, code: 1, outputLimitExceeded: {} }; } });
remover = createWorktreeDelete(state.dependencies).removeWorktree;
await remover(`/worktree`, state.host, true, signal);
deepEqual(state.calls.find((call) => call[0] === `git`)[2], [`worktree`, `remove`, `--force`, `/worktree`]);
equal(state.calls.some((call) => call[0] === `remove`), true);
equal(state.calls.find((call) => call[0] === `info` && call[1].includes(`git-remove-result`))[2].safe.outputLimitExceeded, true);

const cleanupError = new Error(`cleanup failed`);
state = fixture({
  getLocalEnvironmentConfigPath: async () => { throw cleanupError; },
});
remover = createWorktreeDelete(state.dependencies).removeWorktree;
await rejects(remover(`/worktree`, state.host), (error) => error === cleanupError);
equal(state.calls.some((call) => call[0] === `git`), false);
equal(state.calls.at(-1)[0], `release`);

const gitError = new Error(`git failed`);
state = fixture({ runGit: async () => { throw gitError; } });
remover = createWorktreeDelete(state.dependencies).removeWorktree;
await rejects(remover(`/worktree`, state.host), (error) => error === gitError);
equal(state.calls.at(-1)[0], `release`);

{
  let active = 0;
  let maximum = 0;
  const waiters = [];
  const semaphore = {
    async acquire() {
      if (active >= 3) await new Promise((resolve) => waiters.push(resolve));
      active += 1;
      maximum = Math.max(maximum, active);
    },
    release() {
      active -= 1;
      waiters.shift()?.();
    },
  };
  const gates = [];
  state = fixture({
    createSemaphore: () => semaphore,
    runGit: async () => new Promise((resolve) => gates.push(() => resolve({ success: false, code: 1 }))),
  });
  remover = createWorktreeDelete(state.dependencies).removeWorktree;
  const pending = Array.from({ length: 4 }, (_, index) => remover(`/worktree-${index}`, state.host));
  await new Promise((resolve) => setImmediate(resolve));
  equal(maximum, 3);
  equal(gates.length, 3);
  gates.shift()();
  await new Promise((resolve) => setImmediate(resolve));
  equal(gates.length, 3);
  while (gates.length > 0) gates.shift()();
  await Promise.all(pending);
  equal(active, 0);
}

console.log(`${assertions} worker git worktree delete assertions passed`);
