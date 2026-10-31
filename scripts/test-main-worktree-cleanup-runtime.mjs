import assert from "node:assert/strict";
import fs from "node:fs";
import { createWorktreeCleanupRuntime } from "../src/main/main-app/workspace/worktree-cleanup-runtime.ts";

let assertions = 0;
function equal(actual, expected, message) {
  assertions += 1;
  assert.deepEqual(actual, expected, message);
}

const stateValues = new Map();
const stateWrites = [];
const errors = [];
const statCalls = [];
let now = Date.parse("2026-11-01T00:00:00.000Z");
const globalState = {
  get: (key) => stateValues.get(key),
  set(key, value) {
    stateValues.set(key, value);
    stateWrites.push([key, value]);
  },
};
const runtime = createWorktreeCleanupRuntime({
  async stat(path, executionHost) {
    statCalls.push([path, executionHost]);
    if (path === "/missing") throw new Error("missing path");
    return { mtimeMs: path === "/newer" ? 9_000 : Number.NaN };
  },
  normalizePath: (path) => String(path).replaceAll("\\", "/"),
  parseDesktopConfiguration: (value) => ({ keepCount: 3, ...value }),
  getLocalProjectRoots: () => ({ roots: ["/worktrees/active/project", "/source"] }),
  getRemoteProjectRoots: (_state, hostId) => ({ roots: [`/remote/${hostId}/worktree/project`] }),
  pinnedThreadIdsKey: "pinned-thread-ids",
  autoCleanupOverrideKey: "auto-cleanup-override",
  preMigrationProtectionStartedAtKey: "migration-protection-started-at",
  logger: { error: (...args) => errors.push(args) },
  now: () => now,
});

const record = (dir, ownerThreadId, createdAtMs) => ({
  worktree: { dir },
  ownerThreadId,
  createdAtMs,
});
const hour = 60 * 60 * 1_000;
const oldOwnerless = record("/worktrees/ownerless-old", null, now - 10 * hour);
const olderOwned = record("/worktrees/owned-older", "thread-old", now - 20 * hour);
const newerOwned = record("/worktrees/owned-newer", "thread-new", now - 20 * hour);
const pinnedOwned = record("/worktrees/pinned", "thread-pinned", now - 20 * hour);
const activeOwned = record("/worktrees/active", "thread-active", now - 20 * hour);
const newOwnerless = record("/worktrees/ownerless-new", null, now - 30 * 60 * 1_000);
const explicitProtected = record("/worktrees/explicit", null, now - 20 * hour);
const plan = runtime.planWorktreeCleanup({
  records: [newerOwned, activeOwned, oldOwnerless, explicitProtected, pinnedOwned, olderOwned, newOwnerless],
  keepCount: 1,
  threadMetadataById: {
    "thread-old": { updatedAtMs: 100, isInProgress: false, cwd: null, readFailed: false },
    "thread-new": { updatedAtMs: 200, isInProgress: false, cwd: null, readFailed: false },
    "thread-pinned": { updatedAtMs: 50, isInProgress: false, cwd: null, readFailed: false },
    "thread-active": { updatedAtMs: 25, isInProgress: true, cwd: null, readFailed: false },
  },
  pinnedThreadIds: ["thread-pinned"],
  protectedWorktreeDirs: ["/worktrees/explicit"],
  nowMs: now,
});
equal(plan.candidates.map((entry) => entry.worktree.dir), [
  "/worktrees/ownerless-old",
  "/worktrees/owned-older",
]);
equal(
  runtime.planWorktreeCleanup({
    records: [oldOwnerless],
    keepCount: 1,
    threadMetadataById: {},
    pinnedThreadIds: [],
  }),
  { candidates: [] },
);

const preMigration = record(
  "/worktrees/pre-migration",
  null,
  Date.parse("2026-02-01T00:00:00.000Z"),
);
equal(
  runtime.planWorktreeCleanup({
    records: [preMigration, oldOwnerless],
    keepCount: 0,
    threadMetadataById: {},
    pinnedThreadIds: [],
    protectPreMigrationOwnerlessWorktrees: true,
    nowMs: now,
  }).candidates.map((entry) => entry.worktree.dir),
  ["/worktrees/ownerless-old"],
);
equal(
  runtime.planWorktreeCleanup({
    records: [record("/z", null, null), record("/a", null, null)],
    keepCount: 0,
    threadMetadataById: {},
    pinnedThreadIds: [],
    nowMs: now,
  }).candidates.map((entry) => entry.worktree.dir),
  ["/a", "/z"],
);
equal(
  runtime.planWorktreeCleanup({
    records: [record("/boundary", null, now - hour), record("/fresh", null, now - hour + 1)],
    keepCount: 0,
    threadMetadataById: {},
    pinnedThreadIds: [],
    nowMs: now,
  }).candidates.map((entry) => entry.worktree.dir),
  ["/boundary"],
);

const executionHost = { id: "host" };
const readCounts = new Map();
const metadata = await runtime.readThreadMetadata(
  {
    async readThread(threadId, options) {
      equal(options, { includeTurns: false });
      readCounts.set(threadId, (readCounts.get(threadId) ?? 0) + 1);
      if (threadId === "missing-thread") return null;
      if (threadId === "failure") throw new Error("read failed");
      if (threadId === "newer-file")
        return { updatedAt: 5, path: "/newer", status: { type: "idle" }, cwd: "/cwd/newer" };
      return { updatedAt: 7, path: "/missing", status: { type: "active" }, cwd: null };
    },
  },
  executionHost,
  ["newer-file", "active-thread", "missing-thread", "failure", "newer-file"],
);
equal(readCounts.get("newer-file"), 1);
equal(metadata["newer-file"], {
  updatedAtMs: 9_000,
  isInProgress: false,
  cwd: "/cwd/newer",
  readFailed: false,
});
equal(metadata["active-thread"], {
  updatedAtMs: 7_000,
  isInProgress: true,
  cwd: null,
  readFailed: false,
});
equal(metadata["missing-thread"], null);
equal(metadata.failure, {
  updatedAtMs: now,
  isInProgress: true,
  cwd: null,
  readFailed: true,
});
equal(statCalls, [["/newer", executionHost], ["/missing", executionHost]]);
equal(errors.length, 1);
equal(errors[0][1].safe.threadId, "failure");

stateValues.set("pinned-thread-ids", ["thread-1", 4, null, "thread-2"]);
equal(runtime.getPinnedThreadIds(globalState), ["thread-1", "thread-2"]);
stateValues.set("pinned-thread-ids", "invalid");
equal(runtime.getPinnedThreadIds(globalState), []);

const pinnedMetadata = {
  "thread-1": { updatedAtMs: 1, isInProgress: false, cwd: "/worktrees/a/project/", readFailed: false },
  "thread-2": { updatedAtMs: 2, isInProgress: false, cwd: "/outside", readFailed: false },
};
equal(
  runtime.getPinnedProtectedRoots({
    pinnedThreadIds: ["thread-1", "thread-2"],
    threadMetadataById: pinnedMetadata,
    worktrees: [{ dir: "/worktrees/a/" }, { dir: "/worktrees/b" }],
  }),
  ["/worktrees/a/"],
);
equal(
  runtime.hasUnavailablePinnedMetadata({
    pinnedThreadIds: ["thread-1"],
    threadMetadataById: pinnedMetadata,
  }),
  false,
);
equal(
  runtime.hasUnavailablePinnedMetadata({
    pinnedThreadIds: ["missing"],
    threadMetadataById: pinnedMetadata,
  }),
  true,
);
equal(
  runtime.hasUnavailablePinnedMetadata({
    pinnedThreadIds: ["failure"],
    threadMetadataById: metadata,
  }),
  true,
);

const settingsConnection = {
  async getUserSavedConfiguration() {
    return { desktop: { autoCleanupEnabled: true, worktreesRoot: "/worktrees" } };
  },
};
stateValues.delete("auto-cleanup-override");
equal(
  await runtime.readHostWorktreeSettings({
    appServerConnection: settingsConnection,
    globalState,
    isPackaged: false,
  }),
  { autoCleanupEnabled: false, keepCount: 3, worktreesRoot: "/worktrees" },
);
stateValues.set("auto-cleanup-override", true);
equal(
  (await runtime.readHostWorktreeSettings({
    appServerConnection: settingsConnection,
    globalState,
    isPackaged: false,
  })).autoCleanupEnabled,
  true,
);
stateValues.delete("auto-cleanup-override");
equal(
  (await runtime.readHostWorktreeSettings({
    appServerConnection: settingsConnection,
    globalState,
    isPackaged: true,
  })).autoCleanupEnabled,
  true,
);

stateValues.delete("migration-protection-started-at");
stateWrites.length = 0;
equal(runtime.isPreMigrationProtectionActive(globalState, now), true);
equal(stateWrites, [["migration-protection-started-at", now]]);
equal(runtime.isPreMigrationProtectionActive(globalState, now + 5 * 24 * hour - 1), true);
equal(runtime.isPreMigrationProtectionActive(globalState, now + 5 * 24 * hour), false);
stateValues.set("migration-protection-started-at", Number.NaN);
stateWrites.length = 0;
equal(runtime.isPreMigrationProtectionActive(globalState, now + 1), true);
equal(stateWrites, [["migration-protection-started-at", now + 1]]);

equal(
  runtime.isProtectedWorkspaceRoot({
    globalState,
    hostId: "local",
    worktreeDir: "/worktrees/active/",
  }),
  true,
);
equal(
  runtime.isProtectedWorkspaceRoot({
    globalState,
    hostId: "local",
    worktreeDir: "/worktrees/inactive",
  }),
  false,
);
equal(
  runtime.isProtectedWorkspaceRoot({
    globalState,
    hostId: "ssh-host",
    worktreeDir: "/remote/ssh-host/worktree",
  }),
  true,
);
equal(
  runtime.getProtectedWorkspaceRoots({
    globalState,
    hostId: "local",
    worktrees: [{ dir: "/worktrees/active" }, { dir: "/worktrees/inactive" }],
  }),
  ["/worktrees/active"],
);

const main = fs.readFileSync(
  new URL("../.reference/originals/main/main-C-Mhak1n.ts", import.meta.url),
  "utf8",
);
const service = fs.readFileSync(
  new URL("../src/main/main-app/workspace/worktree-service.ts", import.meta.url),
  "utf8",
);
equal(main.includes("createWorktreeCleanupRuntime({"), true);
equal(main.includes("function Ree("), false);
equal(main.includes("async function qZ("), false);
equal(main.includes("function YZ("), false);
equal(main.includes("function WQe("), false);
equal(service.includes("planWorktreeCleanup({"), true);
equal(service.includes("readThreadMetadata("), true);
equal(service.includes("isProtectedWorkspaceRoot({"), true);

console.log(`${assertions} main worktree-cleanup runtime assertions passed`);
