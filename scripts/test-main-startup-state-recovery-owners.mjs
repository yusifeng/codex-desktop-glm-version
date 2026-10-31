import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { build } from "esbuild";

const root = path.resolve(new URL("..", import.meta.url).pathname);
const bundleModule = async (relativePath) => {
  const bundle = await build({
    entryPoints: [path.join(root, relativePath)],
    bundle: true,
    external: ["better-sqlite3"],
    format: "esm",
    platform: "node",
    write: false,
  });
  return import(
    `data:text/javascript;base64,${Buffer.from(bundle.outputFiles[0].text).toString("base64")}`
  );
};

const [remote, devtools, legacyConfig, recovery, sqlite, childDiagnostics, bundledGit] =
  await Promise.all([
    bundleModule("src/main/main-app/misc/remote-control-state.ts"),
    bundleModule("src/main/main-app/startup/react-devtools-extension.ts"),
    bundleModule("src/main/main-app/startup/legacy-remote-control-config.ts"),
    bundleModule("src/main/main-app/app-server/sqlite-recovery.ts"),
    bundleModule("src/main/main-app/app-server/sqlite-state-reconciliation.ts"),
    bundleModule("src/main/main-app/startup/child-process-gone-diagnostics.ts"),
    bundleModule("src/main/main-app/startup/bundled-git-environment.ts"),
  ]);

let assertions = 0;
const equal = (actual, expected) => {
  assert.deepEqual(actual, expected);
  assertions += 1;
};
const rejects = async (operation, pattern) => {
  await assert.rejects(operation, pattern);
  assertions += 1;
};

// Remote-control state has one canonical owner shared by window and update consumers.
remote.setRemoteControlEnabled(true, "window-a");
equal(remote.isRemoteControlEnabled(), true);
remote.setRemoteControlSessionActive(true, "window-a", {
  accountId: "account",
  userId: "user",
  threadIds: ["thread-a"],
});
remote.setRemoteControlSessionActive(true, "window-b", {
  accountId: "account",
  userId: "user",
  threadIds: ["thread-a", "thread-b"],
});
equal(remote.isRemoteControlSessionActive(), true);
equal(remote.getAggregatedRemoteControlSession().threadIds, ["thread-a", "thread-b"]);
remote.setRemoteControlSessionActive(true, "window-c", {
  accountId: "other",
  userId: "user",
  threadIds: ["thread-c"],
});
equal(remote.getAggregatedRemoteControlSession(), null);
remote.setRemoteControlSessionActive(false, "window-c");
const snapshots = [];
const installSnapshot = remote.createRemoteControlInstallSnapshot((value) => snapshots.push(value));
equal(installSnapshot.saveForInstall({ quitImmediately: false }).threadIds, ["thread-a", "thread-b"]);
equal(installSnapshot.clearAfterAbort(), true);
equal(snapshots.at(-1), null);
equal(installSnapshot.clearAfterAbort(), false);
remote.setRemoteControlSessionActive(false, "window-a");
remote.setRemoteControlSessionActive(false, "window-b");
remote.setRemoteControlEnabled(false, "window-a");

const temporaryRoot = fs.mkdtempSync(path.join(os.tmpdir(), "codex-startup-owners-"));
try {
  // React DevTools discovery prefers the numerically highest installed version.
  const extensionRoot = path.join(
    temporaryRoot,
    "user-data",
    "extensions",
    devtools.REACT_DEVTOOLS_EXTENSION_ID,
  );
  fs.mkdirSync(path.join(extensionRoot, "1.9.0"), { recursive: true });
  fs.mkdirSync(path.join(extensionRoot, "1.10.0"), { recursive: true });
  equal(
    devtools.findReactDevToolsExtension({
      platform: "freebsd",
      homeDirectory: temporaryRoot,
      userDataDirectory: path.join(temporaryRoot, "user-data"),
    }),
    path.join(extensionRoot, "1.10.0"),
  );
  const devtoolsLogs = [];
  equal(
    await devtools.loadReactDevToolsExtension({
      loadExtension: async (extensionPath) => ({
        id: devtools.REACT_DEVTOOLS_EXTENSION_ID,
        name: path.basename(extensionPath),
        version: "1.10.0",
      }),
      logger: () => ({
        error: (...args) => devtoolsLogs.push(["error", ...args]),
        info: (...args) => devtoolsLogs.push(["info", ...args]),
        trace: (...args) => devtoolsLogs.push(["trace", ...args]),
      }),
      platform: "freebsd",
      homeDirectory: temporaryRoot,
      userDataDirectory: path.join(temporaryRoot, "user-data"),
    }),
    true,
  );
  equal(devtoolsLogs[0][0], "info");

  // Legacy config removal records completion only after app-server success.
  const configValues = new Map();
  const configRequests = [];
  const configWarnings = [];
  const configState = {
    getStored: (key) => configValues.get(key),
    set: (key, value) => configValues.set(key, value),
  };
  await legacyConfig.removeLegacyRemoteControlConfig({
    appServerConnection: {
      sendAppServerRequest: async (method, params) => configRequests.push([method, params]),
    },
    completedStateKey: legacyConfig.LEGACY_REMOTE_CONTROL_CONFIG_MIGRATION_KEY,
    globalState: configState,
    logger: { info: () => {}, warning: (...args) => configWarnings.push(args) },
  });
  await legacyConfig.removeLegacyRemoteControlConfig({
    appServerConnection: {
      sendAppServerRequest: async (method, params) => configRequests.push([method, params]),
    },
    completedStateKey: legacyConfig.LEGACY_REMOTE_CONTROL_CONFIG_MIGRATION_KEY,
    globalState: configState,
    logger: { info: () => {}, warning: (...args) => configWarnings.push(args) },
  });
  equal(configRequests.length, 1);
  equal(configRequests[0][1].edits.map(({ keyPath }) => keyPath), [
    "remote_control",
    "features.remote_control",
  ]);
  equal(configWarnings.length, 0);

  // Recovery notifications stay queued before enable, dedupe, and drain serially.
  const recoveryCalls = [];
  const recoveryLogs = [];
  const recoveryQueue = recovery.createSqliteRecoveryConfirmationQueue({
    ensureWindow: async () => ({ id: "primary" }),
    logger: () => ({
      info: (...args) => recoveryLogs.push(["info", ...args]),
      warning: (...args) => recoveryLogs.push(["warning", ...args]),
    }),
    showPrimaryWindow: (options) => recoveryCalls.push(["focus", options]),
    showRecoveryConfirmation: async (databasePath, backupFolder, window) => {
      recoveryCalls.push(["dialog", databasePath, backupFolder, window.id]);
      if (databasePath === "broken") throw Error("dialog failed");
    },
  });
  recoveryQueue.onRecovery({ databasePath: "first", backupFolder: "backup-a" });
  recoveryQueue.onRecovery({ databasePath: "first", backupFolder: "backup-a" });
  recoveryQueue.onRecovery({ databasePath: "broken", backupFolder: "backup-b" });
  equal(recoveryCalls.length, 0);
  await recoveryQueue.enable();
  equal(recoveryCalls, [
    ["focus", { stealFocus: true }],
    ["dialog", "first", "backup-a", "primary"],
    ["focus", { stealFocus: true }],
    ["dialog", "broken", "backup-b", "primary"],
  ]);
  equal(recoveryLogs.some(([level]) => level === "warning"), true);

  // Rollout cwd parsing validates the first record and matching thread identity.
  const rolloutPath = path.join(temporaryRoot, "rollout.jsonl");
  fs.writeFileSync(
    rolloutPath,
    `${JSON.stringify({ type: "session_meta", payload: { id: "thread-a", cwd: "/workspace" } })}\n`,
  );
  equal(await sqlite.readRolloutSessionCwd(rolloutPath, "thread-a"), "/workspace");
  equal(await sqlite.readRolloutSessionCwd(rolloutPath, "thread-b"), null);
  equal(sqlite.quoteSqliteIdentifier(`a"b`), `"a""b"`);

  class MemoryDatabase {
    constructor(tables, columns) {
      this.tables = structuredClone(tables);
      this.columns = columns;
      this.transactions = [];
    }
    exec(sql) { this.transactions.push(sql); }
    close() {}
    async backup() {}
    prepare(sql) {
      const tableInfo = sql.match(/^PRAGMA table_info\("([^"]+)"\)$/);
      if (tableInfo) return { all: () => this.columns[tableInfo[1]].map((name) => ({ name })) };
      const selectedColumns = [...sql.matchAll(/"((?:""|[^"])*)"/g)].map((match) => match[1].replaceAll(`""`, `"`));
      if (/^SELECT .* FROM threads WHERE id = \?$/.test(sql))
        return { get: (id) => this.tables.threads.find((row) => row.id === id) };
      if (/^SELECT .* FROM threads$/.test(sql)) return { all: () => this.tables.threads };
      if (/^INSERT INTO threads /.test(sql))
        return { run: (...values) => (this.tables.threads.push(Object.fromEntries(selectedColumns.map((name, index) => [name, values[index]]))), { changes: 1 }) };
      if (/^UPDATE threads SET /.test(sql))
        return {
          run: (...values) => {
            const id = values.at(-1);
            const row = this.tables.threads.find((entry) => entry.id === id);
            selectedColumns.forEach((name, index) => { row[name] = values[index]; });
            return { changes: 1 };
          },
        };
      if (/^SELECT .* FROM thread_spawn_edges$/.test(sql))
        return { all: () => this.tables.thread_spawn_edges };
      if (/^INSERT OR IGNORE INTO thread_spawn_edges /.test(sql))
        return {
          run: (...values) => {
            const row = Object.fromEntries(selectedColumns.map((name, index) => [name, values[index]]));
            if (this.tables.thread_spawn_edges.some((entry) => JSON.stringify(entry) === JSON.stringify(row))) return { changes: 0 };
            this.tables.thread_spawn_edges.push(row);
            return { changes: 1 };
          },
        };
      if (/^SELECT .* FROM thread_dynamic_tools WHERE thread_id = \?$/.test(sql))
        return { all: (threadId) => this.tables.thread_dynamic_tools.filter((row) => row.thread_id === threadId) };
      if (/^INSERT OR IGNORE INTO thread_dynamic_tools /.test(sql))
        return {
          run: (...values) => {
            const row = Object.fromEntries(selectedColumns.map((name, index) => [name, values[index]]));
            if (this.tables.thread_dynamic_tools.some((entry) => JSON.stringify(entry) === JSON.stringify(row))) return { changes: 0 };
            this.tables.thread_dynamic_tools.push(row);
            return { changes: 1 };
          },
        };
      throw Error(`Unexpected SQL: ${sql}`);
    }
  }
  const columns = {
    threads: ["id", "cwd", "updated_at_ms"],
    thread_spawn_edges: ["parent_id", "child_id"],
    thread_dynamic_tools: ["thread_id", "tool"],
  };
  const destination = new MemoryDatabase({
    threads: [{ id: "thread-a", cwd: "", updated_at_ms: 1 }],
    thread_spawn_edges: [],
    thread_dynamic_tools: [],
  }, columns);
  const source = new MemoryDatabase({
    threads: [
      { id: "thread-a", cwd: "/new", updated_at_ms: 2 },
      { id: "thread-b", cwd: "/inserted", updated_at_ms: 3 },
    ],
    thread_spawn_edges: [{ parent_id: "thread-a", child_id: "thread-b" }],
    thread_dynamic_tools: [
      { thread_id: "thread-a", tool: "a" },
      { thread_id: "thread-b", tool: "b" },
    ],
  }, columns);
  equal(sqlite.mergeAppServerSqliteState(destination, source), {
    dynamicToolsInserted: 2,
    inserted: 1,
    repaired: 1,
    spawnEdgesInserted: 1,
  });
  equal(destination.tables.threads, [
    { id: "thread-a", cwd: "/new", updated_at_ms: 2 },
    { id: "thread-b", cwd: "/inserted", updated_at_ms: 3 },
  ]);
  equal(destination.transactions, ["BEGIN IMMEDIATE", "COMMIT"]);

  // Child-process diagnostics classify fatal/recoverable events and rate-limit identical GPU reports.
  let childListener;
  const fatalReports = [];
  const nonFatalReports = [];
  const childWarnings = [];
  const childRuntime = new childDiagnostics.ChildProcessGoneDiagnostics(
    { on: (_event, listener) => { childListener = listener; } },
    {
      reportFatal: (...args) => fatalReports.push(args),
      reportNonFatal: (...args) => nonFatalReports.push(args),
    },
    { warning: (...args) => childWarnings.push(args) },
    () => 100,
    () => ({ unref() {} }),
  );
  childRuntime.register();
  childListener({}, { type: "GPU", reason: "crashed", exitCode: 9 });
  childListener({}, { type: "GPU", reason: "crashed", exitCode: 9 });
  childListener({}, { type: "Utility", reason: "crashed", exitCode: 1, serviceName: "other" });
  childListener({}, { type: "Utility", reason: "clean-exit", exitCode: 0 });
  equal(nonFatalReports.length, 1);
  equal(childWarnings.length, 1);
  equal(fatalReports.length, 1);
  equal(childDiagnostics.isRecoverableChildProcessGone({
    type: "Utility",
    reason: "crashed",
    exitCode: 1,
    serviceName: "audio.mojom.AudioService",
  }), true);

  // Bundled Git keeps a patched OpenAI executable first while installing bundle fallbacks.
  const resourcesPath = path.join(temporaryRoot, "resources");
  for (const relative of [
    "git/bin/git",
    "git/etc/gitconfig",
    "git/libexec/git-core",
    "git/share/git-core/templates",
  ]) {
    const target = path.join(resourcesPath, relative);
    fs.mkdirSync(path.dirname(target), { recursive: true });
    if (!relative.endsWith("git-core") && !relative.endsWith("templates")) fs.writeFileSync(target, "");
    else fs.mkdirSync(target, { recursive: true });
  }
  const gitEnv = { PATH: "/custom:/usr/bin" };
  equal(
    await bundledGit.configureBundledGitEnvironment({
      arch: "arm64",
      env: gitEnv,
      platform: "darwin",
      readGitVersion: async () => "git version 2.50.0-openai.1",
      resolveExecutable: () => "/custom/git",
      resourcesPath,
    }),
    path.join(resourcesPath, "git", "bin", "git"),
  );
  equal(gitEnv.CODEX_PREFERRED_GIT_EXECUTABLE, "/custom/git");
  equal(gitEnv.PATH.split(":"), ["/custom", path.join(resourcesPath, "git", "bin"), "/usr/bin"]);
  await rejects(
    () => bundledGit.configureBundledGitEnvironment({
      arch: "x64",
      env: {},
      platform: "linux",
      resourcesPath,
    }),
    /does not support/,
  );
} finally {
  fs.rmSync(temporaryRoot, { recursive: true, force: true });
}

const main = fs.readFileSync(path.join(root, ".reference/originals/main/main-C-Mhak1n.ts"), "utf8");
for (const modulePath of [
  "misc/remote-control-state.js",
  "startup/react-devtools-extension.js",
  "startup/legacy-remote-control-config.js",
  "app-server/sqlite-recovery.js",
  "app-server/sqlite-state-reconciliation.js",
  "startup/child-process-gone-diagnostics.js",
  "startup/bundled-git-environment.js",
]) equal(main.includes(`require("./main-app/${modulePath}")`), true);
for (const oldDefinition of [
  "function Lce(",
  "function Gce(",
  "function Zce(",
  "function due(",
  "async function _ue(",
  "Cue = class",
  "async function Oue(",
]) equal(main.includes(oldDefinition), false);
equal(main.includes("await reconcileAppServerSqliteState({"), true);
equal(main.includes("createSqliteRecoveryConfirmationQueue({"), true);
equal(main.includes("new ChildProcessGoneDiagnostics(l.app, u, r.n()).register()"), true);

console.log(`${assertions} main startup state/recovery owner assertions passed`);
