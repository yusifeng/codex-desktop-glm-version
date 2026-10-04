import assert from "node:assert/strict";
import path from "node:path";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const {
  AGENTS_OVERRIDE_FILE,
  WORKTREE_FILE_COPY_CONCURRENCY,
  WORKTREE_INCLUDE_FILE,
  copyAgentOverrideFiles,
  copyWorktreeFileIfAbsent,
  copyWorktreeFiles,
  ensureCopyTargetPath,
  findAgentOverrideFiles,
  findWorktreeIncludeFiles,
  hasErrorCode,
  resolveWorktreeLocalEnvironmentConfig,
  splitNullSeparatedPaths,
} = require("../app/.vite/build/worker/git-worktree-copy-files.js");

let assertions = 0;
const equal = (...args) => { assertions += 1; assert.equal(...args); };
const deepEqual = (...args) => { assertions += 1; assert.deepEqual(...args); };
const rejects = async (...args) => { assertions += 1; await assert.rejects(...args); };
const error = (code) => Object.assign(new Error(code), { code });

equal(AGENTS_OVERRIDE_FILE, "AGENTS.override.md");
equal(WORKTREE_INCLUDE_FILE, ".worktreeinclude");
equal(WORKTREE_FILE_COPY_CONCURRENCY, 16);
equal(hasErrorCode(error("ENOENT"), "ENOENT"), true);
equal(hasErrorCode(null, "ENOENT"), false);
deepEqual(splitNullSeparatedPaths("a\0\0b\0"), ["a", "b"]);

function fixture(overrides = {}) {
  const calls = [];
  const stats = new Map();
  const host = {
    isLocal: true,
    platformPath: async () => path.posix,
    stat: async (target, options) => {
      calls.push(["stat", target, options]);
      const value = stats.get(target);
      if (value instanceof Error) throw value;
      if (value == null) throw error("ENOENT");
      return value;
    },
    createDirectory: async (...args) => { calls.push(["mkdir", ...args]); },
    copyFile: async (...args) => { calls.push(["copy", ...args]); },
    ...overrides.host,
  };
  let semaphoreCapacity;
  const dependencies = {
    createSemaphore: (capacity) => {
      semaphoreCapacity = capacity;
      return {
        acquire: async () => { calls.push(["acquire"]); },
        release: () => { calls.push(["release"]); },
      };
    },
    runGit: async (...args) => { calls.push(["git", ...args]); return { success: true, code: 0, stdout: "" }; },
    ...overrides.dependencies,
  };
  return { calls, dependencies, get semaphoreCapacity() { return semaphoreCapacity; }, host, stats };
}

{
  const state = fixture();
  state.stats.set("/worktree/a", { isSymbolicLink: () => false });
  state.stats.set("/worktree/a/b", error("ENOENT"));
  await ensureCopyTargetPath("/worktree", "/worktree/a/b", path.posix, state.host, "files");
  deepEqual(state.calls.filter((call) => call[0] === "mkdir"), [
    ["mkdir", "/worktree/a/b", { recursive: true }],
  ]);
}

{
  const state = fixture();
  state.stats.set("/worktree/link", { isSymbolicLink: () => true });
  await rejects(
    ensureCopyTargetPath("/worktree", "/worktree/link/nested", path.posix, state.host, "selected file"),
    /Cannot copy selected file through a symlinked workspace path/,
  );
  equal(state.calls.some((call) => call[0] === "mkdir"), false);
}

{
  const state = fixture();
  equal(await copyWorktreeFileIfAbsent("/source", "/worktree/file", "/worktree", path.posix, "files", state.host), false);
  equal(state.calls.some((call) => call[0] === "copy"), false);
  state.stats.set("/source", { isFile: () => false });
  equal(await copyWorktreeFileIfAbsent("/source", "/worktree/file", "/worktree", path.posix, "files", state.host), false);
}

{
  const state = fixture();
  state.stats.set("/source", { isFile: () => true });
  equal(await copyWorktreeFileIfAbsent("/source", "/worktree/file", "/worktree", path.posix, "files", state.host), true);
  deepEqual(state.calls.find((call) => call[0] === "copy"), ["copy", "/source", "/worktree/file", { exclusive: true }]);
  state.host.copyFile = async () => { throw error("EEXIST"); };
  equal(await copyWorktreeFileIfAbsent("/source", "/worktree/file", "/worktree", path.posix, "files", state.host), false);
}

{
  const state = fixture();
  state.stats.set("/source/a", { isFile: () => true });
  state.stats.set("/source/b", { isFile: () => true });
  const logs = [];
  equal(await copyWorktreeFiles({
    sourceGitRoot: "/source",
    worktreeGitRoot: "/worktree",
    relativePaths: ["a", "b"],
    label: "included files",
    host: state.host,
    onLog: (kind, bytes) => logs.push([kind, new TextDecoder().decode(bytes)]),
  }, state.dependencies), 2);
  equal(state.semaphoreCapacity, 16);
  equal(state.calls.filter((call) => call[0] === "acquire").length, 2);
  equal(state.calls.filter((call) => call[0] === "release").length, 2);
  deepEqual(logs, [["info", "Copied 2 files from included files\n"]]);
  equal(await copyWorktreeFiles({ relativePaths: [] }, state.dependencies), 0);
}

{
  const state = fixture({ dependencies: {
    runGit: async (...args) => {
      state.calls.push(["git", ...args]);
      return { success: true, stdout: "AGENTS.override.md\0nested/AGENTS.override.md\0other\0nested/AGENTS.override.md\0" };
    },
  } });
  deepEqual(await findAgentOverrideFiles("/source", state.host, state.dependencies), [
    "AGENTS.override.md", "nested/AGENTS.override.md",
  ]);
  deepEqual(state.calls[0][2], [
    "ls-files", "--others", "--ignored", "--exclude-standard", "-z", "--", ":(glob)**/AGENTS.override.md",
  ]);
  state.dependencies.runGit = async () => ({ success: false, stdout: "" });
  await rejects(findAgentOverrideFiles("/source", state.host, state.dependencies), /while locating AGENTS.override.md/);
}

{
  const state = fixture();
  state.stats.set("/source/AGENTS.override.md", { isFile: () => true });
  state.dependencies.runGit = async () => ({ success: true, stdout: "AGENTS.override.md\0" });
  await copyAgentOverrideFiles("/source", "/worktree", state.host, state.dependencies);
  equal(state.calls.some((call) => call[0] === "copy" && call[1] === "/source/AGENTS.override.md"), true);
}

{
  const state = fixture();
  deepEqual(await findWorktreeIncludeFiles("/source", state.host, state.dependencies), []);
  equal(state.calls.some((call) => call[0] === "git"), false);
}

{
  const state = fixture();
  state.stats.set("/source/.worktreeinclude", { isFile: () => true });
  const outputs = [
    { success: true, stdout: "a\0b\0c\0" },
    { success: true, stdout: "b\0d\0b\0" },
  ];
  state.dependencies.runGit = async (...args) => { state.calls.push(["git", ...args]); return outputs.shift(); };
  deepEqual(await findWorktreeIncludeFiles("/source", state.host, state.dependencies), ["b"]);
  equal(state.calls.length >= 3, true);
  deepEqual(state.calls.filter((call) => call[0] === "git").map((call) => call[2]), [
    ["ls-files", "--others", "--ignored", "--exclude-standard", "-z"],
    ["ls-files", "--others", "--ignored", "--exclude-from=.worktreeinclude", "-z"],
  ]);
}

function environmentState({ local = true, target = error("ENOENT"), source = { isFile: () => true } } = {}) {
  const state = fixture();
  state.host.isLocal = local;
  state.host.copyFile = async (...args) => {
    state.calls.push(["copy", ...args]);
    state.stats.set(args[1], { isFile: () => true });
  };
  state.stats.set("/worktree/.codex/environment.toml", target);
  state.stats.set("/source/.codex/environment.toml", source);
  return state;
}

const environmentInput = (state) => ({
  localEnvironmentConfigPath: "/source/.codex/environment.toml",
  sourceGitRoot: "/source",
  worktreeGitRoot: "/worktree",
  host: state.host,
  signal: new AbortController().signal,
});

{
  const state = environmentState({ target: { isFile: () => true } });
  equal(await resolveWorktreeLocalEnvironmentConfig(environmentInput(state), state.dependencies), "/worktree/.codex/environment.toml");
  equal(state.calls.some((call) => call[0] === "git"), false);
}

{
  const state = environmentState({ target: { isFile: () => false } });
  await rejects(resolveWorktreeLocalEnvironmentConfig(environmentInput(state), state.dependencies), /not a regular file/);
}

{
  const state = environmentState({ local: false });
  equal(await resolveWorktreeLocalEnvironmentConfig(environmentInput(state), state.dependencies), "/source/.codex/environment.toml");
  equal(state.calls.some((call) => call[0] === "copy"), false);
}

{
  const state = environmentState();
  state.dependencies.runGit = async (...args) => {
    state.calls.push(["git", ...args]);
    return { success: true, code: 0, stdout: "" };
  };
  equal(await resolveWorktreeLocalEnvironmentConfig(environmentInput(state), state.dependencies), null);
  equal(state.calls.filter((call) => call[0] === "git").length, 1);
}

{
  const state = environmentState();
  const outputs = [
    { success: true, code: 1 },
    { success: true, code: 0 },
    { success: true, code: 1 },
  ];
  state.dependencies.runGit = async (...args) => { state.calls.push(["git", ...args]); return outputs.shift(); };
  equal(
    await resolveWorktreeLocalEnvironmentConfig(environmentInput(state), state.dependencies),
    "/source/.codex/environment.toml",
  );
  equal(state.calls.some((call) => call[0] === "copy"), false);
}

{
  const state = environmentState();
  const outputs = [
    { success: true, code: 1 },
    { success: true, code: 0 },
    { success: true, code: 0 },
  ];
  state.dependencies.runGit = async (...args) => { state.calls.push(["git", ...args]); return outputs.shift(); };
  equal(
    await resolveWorktreeLocalEnvironmentConfig(environmentInput(state), state.dependencies),
    "/worktree/.codex/environment.toml",
  );
  equal(state.calls.some((call) => call[0] === "copy"), true);
  deepEqual(state.calls.filter((call) => call[0] === "git").map((call) => call[2][0]), ["ls-files", "check-ignore", "check-ignore"]);
}

{
  const state = environmentState();
  state.dependencies.runGit = async () => ({ success: false, code: 1 });
  await rejects(resolveWorktreeLocalEnvironmentConfig(environmentInput(state), state.dependencies), /Failed to check selected environment tracking/);
}

console.log(`${assertions} worker git worktree copy files assertions passed`);
