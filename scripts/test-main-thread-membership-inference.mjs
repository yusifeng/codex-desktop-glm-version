import assert from "node:assert/strict";
import fs from "node:fs";
import { createThreadMembershipInference } from "../src/main/main-app/projects/thread-membership-inference.ts";

const keys = {
  THREAD_PROJECT_ASSIGNMENTS: "assignments",
  PROJECTLESS_THREAD_IDS: "projectless",
  THREAD_WORKSPACE_ROOT_HINTS: "hints",
};
const projects = {
  repo: { id: "repo", rootPaths: ["/repo"], createdAt: 1 },
  old: { id: "old", rootPaths: ["/old"], createdAt: 2 },
};
const values = new Map([
  [keys.THREAD_PROJECT_ASSIGNMENTS, { existing: { projectKind: "local", projectId: "repo" } }],
  [keys.PROJECTLESS_THREAD_IDS, ["already-projectless"]],
  [keys.THREAD_WORKSPACE_ROOT_HINTS, {
    hinted: "/repo",
    unreadable: "/repo",
    "git-match": "/old",
    existing: "/repo",
    excluded: "/repo",
  }],
]);
const globalState = { get: (key) => values.get(key) };
const canonicalizeCalls = [];
const listCalls = [];
const reads = [];
const originReads = [];
const assignedBatches = [];
const { assignUnassignedThreadsBeforeRootsChange, buildProjectRootIndex } =
  createThreadMembershipInference({
    runtime: {
      iu: keys,
      pa: ["cli", "vscode"],
      zi: () => false,
      _l: (path) => path.toLowerCase(),
      ca: (value) => ({ ...(value ?? {}) }),
      $u: (threadId) => threadId,
      Ko: (candidate, current) => candidate.createdAt > current.createdAt,
    },
    getLocalProjects: () => projects,
    getWorkspaceRootOptions: () => ({ roots: ["/repo", "/old"] }),
    canonicalizeRoots: async (roots) => {
      canonicalizeCalls.push(roots);
      return { "/repo": "/canonical/repo", "/old": "/canonical/old" };
    },
    normalizeRoots: (roots) => [...roots],
    basename: (path) => path.split("/").filter(Boolean).at(-1) ?? "",
    chunk: (items, size) => Array.from(
      { length: Math.ceil(items.length / size) },
      (_, index) => items.slice(index * size, (index + 1) * size),
    ),
    hintReadBatchSize: 2,
    threadListPageSize: 3,
  });

const index = buildProjectRootIndex(
  {
    first: { id: "first", rootPaths: ["/same"], createdAt: 1 },
    newer: { id: "newer", rootPaths: ["/same"], createdAt: 3 },
  },
  { "/same": "/canonical/same" },
  {},
  false,
);
assert.equal(index.get("/same").projectId, "newer");
assert.equal(index.get("/canonical/same").projectId, "newer");
assert.deepEqual(index.get("/same").rootPaths, ["/same"]);

await assignUnassignedThreadsBeforeRootsChange({
  affectedRootPaths: [],
  excludedThreadIds: new Set(),
  getGitOriginUrl: async () => null,
  globalState,
  host: {},
  listThreads: async () => { throw new Error("should not list"); },
  matchRootsByCanonicalHostIdentity: false,
  readThread: async () => null,
  threadProjectAssignments: { assignIfUnassigned: async () => {} },
});
assert.equal(canonicalizeCalls.length, 0);

const pages = [
  {
    data: [
      { id: "direct", cwd: "/repo" },
      { id: "hinted", cwd: "/current/work" },
      { id: "orphan", cwd: "/missing" },
      { id: "existing", cwd: "/repo" },
      { id: "excluded", cwd: "/repo" },
      { id: "already-projectless", cwd: "/repo" },
    ],
    nextCursor: "page-2",
  },
  {
    data: [
      { id: "unreadable", cwd: "/current/unreadable" },
      { id: "git-match", cwd: "/else/repo" },
    ],
    nextCursor: null,
  },
];
await assignUnassignedThreadsBeforeRootsChange({
  affectedRootPaths: ["/repo", "/old", "/missing"],
  excludedThreadIds: new Set(["excluded"]),
  getGitOriginUrl: async (cwd) => {
    originReads.push(cwd);
    return cwd === "/else/repo" || cwd === "/repo" ? "git://same" : "git://other";
  },
  globalState,
  host: { kind: "local" },
  listThreads: async (request) => {
    listCalls.push(request);
    return pages[listCalls.length - 1];
  },
  matchRootsByCanonicalHostIdentity: false,
  readThread: async (threadId) => {
    reads.push(threadId);
    if (threadId === "unreadable") throw new Error("thread not loaded: unreadable");
    if (threadId === "git-match") return { id: threadId, cwd: "/else/repo", gitInfo: null };
    if (threadId === "hinted") return { id: threadId, cwd: "/current/work", gitInfo: null };
    throw new Error(`unexpected read: ${threadId}`);
  },
  threadProjectAssignments: {
    assignIfUnassigned: async (batch) => assignedBatches.push(batch),
  },
});

assert.equal(canonicalizeCalls.length, 1);
assert.deepEqual(new Set(canonicalizeCalls[0]), new Set(["/repo", "/old", "/missing"]));
assert.deepEqual(new Set(reads), new Set(["hinted", "unreadable", "git-match"]));
assert.deepEqual(originReads, ["/else/repo", "/repo"]);
assert.equal(listCalls.length, 2);
assert.equal(listCalls[0].cursor, null);
assert.equal(listCalls[1].cursor, "page-2");
assert.equal(listCalls.every((call) => call.limit === 3), true);
assert.equal(listCalls.every((call) => call.archived === false), true);
assert.equal(listCalls.every((call) => call.useStateDbOnly === true), true);
assert.deepEqual(listCalls[0].sourceKinds, ["cli", "vscode"]);

assert.equal(assignedBatches.length, 1);
assert.deepEqual(assignedBatches[0], [
  {
    threadId: "direct",
    assignment: { projectKind: "local", projectId: "repo" },
    projectless: false,
  },
  {
    threadId: "hinted",
    assignment: { projectKind: "local", projectId: "repo" },
    projectless: false,
  },
  { threadId: "orphan", assignment: null, projectless: true },
]);
assert.equal(assignedBatches[0].some((entry) => entry.threadId === "existing"), false);
assert.equal(assignedBatches[0].some((entry) => entry.threadId === "excluded"), false);
assert.equal(assignedBatches[0].some((entry) => entry.threadId === "already-projectless"), false);
assert.equal(assignedBatches[0].some((entry) => entry.threadId === "unreadable"), false);
assert.equal(assignedBatches[0].some((entry) => entry.threadId === "git-match"), false);

const main = fs.readFileSync(new URL("../.reference/originals/main/main-C-Mhak1n.ts", import.meta.url), "utf8");
assert.match(main, /assignUnassignedThreadsBeforeRootsChange: t8e/);
assert.doesNotMatch(main, /async function t8e\(/);
assert.doesNotMatch(main, /function n8e\(/);
assert.match(main, /await t8e\(\{/);

console.log("thread membership inference assertions: 28");
