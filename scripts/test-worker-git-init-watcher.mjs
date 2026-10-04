import assert from "node:assert/strict";
import path from "node:path";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { GitInitWatcher } = require(
  "../app/.vite/build/worker/git-init-watcher.js",
);
const {
  isGitInitWatchSetReady,
  nextGitInitReconnectDelay,
  shouldReconnectGitInitWatch,
} = require("../app/.vite/build/worker/git-init-watcher-policy.js");

let count = 0;
const equal = (...args) => {
  count++;
  assert.equal(...args);
};
const deepEqual = (...args) => {
  count++;
  assert.deepEqual(...args);
};

equal(shouldReconnectGitInitWatch("connection-closed"), true);
equal(shouldReconnectGitInitWatch("watch-error"), true);
equal(shouldReconnectGitInitWatch("disposed"), false);
equal(nextGitInitReconnectDelay(250, 1000), 500);
equal(nextGitInitReconnectDelay(800, 1000), 1000);
const rootSession = {};
const gitSession = {};
equal(isGitInitWatchSetReady(new Set([rootSession]), rootSession), true);
equal(isGitInitWatchSetReady(new Set([rootSession]), rootSession, gitSession), false);
equal(
  isGitInitWatchSetReady(new Set([rootSession, gitSession]), rootSession, gitSession),
  true,
);

const deferred = () => {
  let resolve;
  const promise = new Promise((done) => {
    resolve = done;
  });
  return { promise, resolve };
};

function createSession() {
  const closed = deferred();
  return {
    closed,
    disposed: 0,
    session: {
      closed: closed.promise,
      dispose() {
        this.owner.disposed++;
      },
      owner: null,
    },
  };
}

function fixture(options = {}) {
  const warnings = [];
  const timers = [];
  const clearedTimers = [];
  const watchCalls = [];
  const debounceCalls = [];
  const sessions = [];
  const watchResults = [...(options.watchResults ?? [])];
  let initialized = 0;
  const host = {
    platformPath: async () => {
      if (options.platformError) throw options.platformError;
      return path.posix;
    },
    stat: async (...args) => {
      if (options.stat) return options.stat(...args);
      throw Object.assign(new Error("missing"), { code: "ENOENT" });
    },
    startFileWatch: async (config) => {
      watchCalls.push(config);
      const next = watchResults.shift();
      if (next instanceof Error) throw next;
      if (next?.then) return next;
      const holder = next ?? createSession();
      holder.session.owner = holder;
      sessions.push(holder);
      return holder.session;
    },
  };
  const deps = {
    createLogger: () => ({
      warning: (...args) => warnings.push(args),
    }),
    debounce: (callback, delayMs) => {
      const wrapped = (...args) => {
        debounceCalls.push(args);
        if (options.runDebounce) callback(...args);
      };
      wrapped.delayMs = delayMs;
      wrapped.canceled = false;
      wrapped.cancel = () => {
        wrapped.canceled = true;
      };
      return wrapped;
    },
    isMissingPathError: (error) => error?.code === "ENOENT",
    randomUUID: () => `uuid-${watchCalls.length + 1}`,
    setTimeout: (callback, delayMs) => {
      const timer = { callback, delayMs };
      timers.push(timer);
      return timer;
    },
    clearTimeout: (timer) => clearedTimers.push(timer),
    initialReconnectDelayMs: 250,
    maxReconnectDelayMs: 5000,
  };
  const watcher = new GitInitWatcher(
    {
      cwd: "/repo",
      host,
      onGitInit: () => initialized++,
      watchMode: options.watchMode ?? "detect-git-path",
    },
    deps,
  );
  return {
    debounceCalls,
    deps,
    get initialized() {
      return initialized;
    },
    host,
    sessions,
    timers,
    clearedTimers,
    warnings,
    watchCalls,
    watcher,
  };
}

let state = fixture();
equal(await state.watcher.start(), true);
equal(state.watchCalls.length, 1);
deepEqual(
  {
    path: state.watchCalls[0].path,
    recursive: state.watchCalls[0].recursive,
    renameEventHandling: state.watchCalls[0].renameEventHandling,
    watchId: state.watchCalls[0].watchId,
  },
  {
    path: "/repo",
    recursive: false,
    renameEventHandling: "changed-path",
    watchId: "git-init-uuid-1",
  },
);
state.watchCalls[0].onChange({ changedPaths: ["/other"] });
equal(state.debounceCalls.length, 0);
state.watchCalls[0].onChange({ changedPaths: [] });
state.watchCalls[0].onChange({ changedPaths: ["/repo/.git/config"] });
deepEqual(state.debounceCalls, [["/repo/.git"], ["/repo/.git"]]);
equal(state.watcher.checkForGitDebounced.delayMs, 250);

state = fixture({ watchMode: "watch-git-metadata" });
equal(await state.watcher.start(), true);
deepEqual(state.watchCalls.map(({ path }) => path), ["/repo", "/repo/.git"]);
state.watchCalls[1].onChange({ changedPaths: ["anything"] });
deepEqual(state.debounceCalls, [["/repo/.git"]]);
state.watcher.dispose();
deepEqual(state.sessions.map(({ disposed }) => disposed), [1, 1]);
equal(state.watcher.checkForGitDebounced.canceled, true);

const missingWatchError = new Error("cannot watch git dir");
state = fixture({
  watchMode: "watch-git-metadata",
  watchResults: [createSession(), missingWatchError],
});
equal(await state.watcher.start(), true);
equal(state.watcher.sessions.size, 1);
equal(state.warnings[0][0], "Failed to watch git path; keeping workspace root watch");
equal(state.timers.length, 0);

const watchError = new Error("watch failed");
state = fixture({
  watchMode: "watch-git-metadata",
  watchResults: [createSession(), watchError],
  stat: async () => ({ isDirectory: () => true }),
});
equal(await state.watcher.start(), true);
equal(state.sessions[0].disposed, 1);
equal(state.warnings[0][0], "Failed to watch workspace root for git init");
equal(state.timers[0].delayMs, 250);

state = fixture({ platformError: new Error("no path api") });
equal(await state.watcher.start(), false);
equal(state.warnings[0][0], "Failed to watch workspace root for git init");
equal(state.watchCalls.length, 0);

const pendingWatch = deferred();
const pendingSession = createSession();
pendingSession.session.owner = pendingSession;
state = fixture({ watchResults: [pendingWatch.promise] });
const pendingStart = state.watcher.start();
await Promise.resolve();
state.watcher.dispose();
pendingWatch.resolve(pendingSession.session);
equal(await pendingStart, false);
equal(pendingSession.disposed, 1);

state = fixture({ stat: async () => ({ isDirectory: () => true }) });
equal(await state.watcher.start(), false);
equal(state.initialized, 1);
equal(state.sessions[0].disposed, 1);
equal(state.watcher.disposed, true);

state = fixture({ watchResults: [new Error("offline"), new Error("offline") ] });
state.watcher.scheduleReconnect("/repo/.git", "/");
equal(state.timers[0].delayMs, 250);
state.timers[0].callback();
await new Promise((resolve) => setImmediate(resolve));
equal(state.timers[1].delayMs, 500);
equal(state.warnings.length, 1);
state.watcher.dispose();
deepEqual(state.clearedTimers, [state.timers[1]]);

state = fixture();
equal(await state.watcher.start(), true);
const closedError = new Error("closed");
state.sessions[0].closed.resolve({ reason: "watch-error", error: closedError });
await Promise.resolve();
equal(state.warnings.at(-1)[0], "Git init watcher failed");
equal(state.timers.at(-1).delayMs, 250);

console.log(`${count} worker git init watcher assertions passed`);
