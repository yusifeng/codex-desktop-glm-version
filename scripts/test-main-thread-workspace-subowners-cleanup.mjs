import assert from "node:assert/strict";
import fs from "node:fs";
import * as acorn from "acorn";
import { transform } from "esbuild";

let assertions = 0;
const equal = (actual, expected) => {
  assert.deepEqual(actual, expected);
  assertions += 1;
};

const source = fs.readFileSync(
  new URL("../src/main/main-app/conversation/thread-workspace-storage.ts", import.meta.url),
  "utf8",
);
const transpiled = await transform(source, { loader: "ts", format: "esm", target: "es2022" });
const ast = acorn.parse(transpiled.code, { ecmaVersion: "latest", sourceType: "module" });
const classByName = (name) => ast.body.find(
  (node) => node.type === "ClassDeclaration" && node.id?.name === name,
);
const projectlessNode = classByName("ProjectlessConversations");
const workspaceNode = classByName("ThreadWorkspaceStorage");
assert.ok(projectlessNode && workspaceNode);
assertions += 1;
equal(projectlessNode.body.body.length, 28);
equal(workspaceNode.body.body.length, 12);

const projectlessSource = transpiled.code.slice(projectlessNode.start, projectlessNode.end);
const ProjectlessConversations = Function(
  "extractProjectlessRoot",
  "resolveParentThreadId",
  "normalizeThreadId",
  "pathHintsSchema",
  "zArray",
  "zString",
  `${projectlessSource}; return ProjectlessConversations;`,
)(
  () => null,
  (thread) => thread.parentThreadId ?? null,
  (id) => id,
  { safeParse: (value) => ({ data: value && typeof value === "object" ? value : {} }) },
  () => ({ parse: (value) => value }),
  () => ({}),
);

const updates = [];
const state = new Map([
  ["projectless-thread-ids", []],
  ["thread-projectless-output-directories", {}],
  ["thread-workspace-root-hints", {}],
]);
const storage = {
  async readGlobalState(key) { return state.get(key); },
  async updateGlobalState(key, update) {
    const next = update(state.get(key));
    state.set(key, next);
    updates.push({ key, next });
  },
  async updateProjectlessThread(update) { updates.push(update); },
};
const projectless = new ProjectlessConversations({
  hostId: "local",
  storage,
  threadProjectAssignments: {},
  getConversation: () => null,
  logger: { error() {}, warning() {} },
  getWorkspaceKindOverride: () => null,
});
equal(await projectless.load(), true);
equal(await projectless.hasConversationId("thread-1"), false);
await projectless.saveConversationId("thread-1");
equal(projectless.conversationIds.has("thread-1"), true);
equal(updates.at(-1), { threadId: "thread-1", projectless: true });
await projectless.saveOutputDirectoryHint("thread-1", "/tmp/output");
await projectless.saveWorkspaceRootHint("thread-1", "/tmp/workspace");
equal(projectless.getThreadProjectlessOutputDirectory("thread-1", {}), "/tmp/output");
equal(projectless.getThreadWorkspaceBrowserRoot({ id: "thread-1" }), "/tmp/workspace");
await projectless.removeConversation("thread-1");
equal(projectless.conversationIds.has("thread-1"), false);
equal(updates.at(-1), { threadId: "thread-1", projectless: false, outputDirectory: null });

const workspaceSource = transpiled.code.slice(workspaceNode.start, workspaceNode.end);
const ThreadWorkspaceStorage = Function(
  "parseThreadWorkspaceState",
  "threadWorkspaceStateKey",
  "applyWorkspaceRevision",
  "parseThreadProjectAssignments",
  "parseWritableRootsState",
  "isValidPath",
  "hasMissingRoots",
  "withMergedWritableRoots",
  `${workspaceSource}; return ThreadWorkspaceStorage;`,
)(
  (value) => value ?? null,
  (id) => `workspace:${id}`,
  (current, revision, applied) => ({ current, revision, applied }),
  (value) => value ?? {},
  (value) => value ?? {},
  (value) => typeof value === "string" && value.startsWith("/"),
  (current, incoming) => incoming.some((root) => !current.includes(root)),
  ({ writableRootsByThread, conversationId, writableRoots }) => ({
    ...writableRootsByThread,
    [conversationId]: [...new Set([...(writableRootsByThread[conversationId] ?? []), ...writableRoots])],
  }),
);
const workspaceState = new Map([["thread-writable-roots", { "thread-2": ["/a"] }]]);
const assignments = [];
const workspace = new ThreadWorkspaceStorage({
  storage: {
    readValue: (key) => workspaceState.get(key),
    writeValue: (key, value) => workspaceState.set(key, value),
    readGlobalState: async (key) => workspaceState.get(key),
    updateGlobalState: async (key, update) => workspaceState.set(key, update(workspaceState.get(key))),
  },
  threadProjectAssignments: { setAssignment: async (value) => assignments.push(value) },
  createProjectlessWorkspace: async (title) => ({ cwd: `/cwd/${title}`, workspaceRoot: `/root/${title}` }),
});
equal(await workspace.getWritableRoots("thread-2"), ["/a"]);
await workspace.mergeWritableRoots("thread-2", ["/a", "/b"]);
equal(await workspace.getWritableRoots("thread-2"), ["/a", "/b"]);
await workspace.setProjectAssignment("thread-2", { projectId: "project-1" });
equal(assignments, [{ threadId: "thread-2", assignment: { projectId: "project-1" } }]);
equal(await workspace.createProjectlessThreadWorkspace("Demo"), {
  cwd: "/cwd/Demo",
  workspaceRoot: "/root/Demo",
});

const main = fs.readFileSync(
  new URL("../.reference/originals/main/main-C-Mhak1n.ts", import.meta.url),
  "utf8",
);
equal(main.includes("owe = class"), false);
equal(main.includes("swe = class"), false);

const manager = fs.readFileSync(
  new URL("../src/main/main-app/conversation/app-server-manager.ts", import.meta.url),
  "utf8",
);
equal(manager.includes('import { ProjectlessConversations, ThreadWorkspaceStorage } from "./thread-workspace-storage";'), true);
equal(manager.includes("this.projectlessConversations = new ProjectlessConversations({"), true);
equal(manager.includes("this.threadWorkspaceStorage = new ThreadWorkspaceStorage({"), true);

console.log(`${assertions} main thread workspace subowner cleanup assertions passed`);
