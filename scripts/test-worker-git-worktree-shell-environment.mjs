import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const {
  WORKTREE_SHELL_ENVIRONMENT_FILE,
  readWorktreeShellEnvironment,
  removeWorktreeShellEnvironment,
  resolveWorktreeShellEnvironmentPath,
  writeWorktreeShellEnvironment,
} = require("../app/.vite/build/worker/git-worktree-shell-environment.js");

let assertions = 0;
const equal = (...args) => { assertions += 1; assert.equal(...args); };
const deepEqual = (...args) => { assertions += 1; assert.deepEqual(...args); };
const rejects = async (...args) => { assertions += 1; await assert.rejects(...args); };

function fixture(overrides = {}) {
  const calls = [];
  const repository = {
    host: {
      readFile: async (...args) => {
        calls.push(["read", ...args]);
        return new TextEncoder().encode(
          '{"version":1,"set":{"NODE_ENV":"test"},"exclude":["TOKEN"]}',
        );
      },
      writeFile: async (...args) => { calls.push(["write", ...args]); },
      remove: async (...args) => { calls.push(["remove", ...args]); },
      ...overrides.host,
    },
  };
  const dependencies = {
    logger: { warning: (...args) => calls.push(["warning", ...args]) },
    parseSchema: (value) =>
      value?.version === 1 &&
      value.set != null &&
      !Array.isArray(value.set) &&
      Object.values(value.set).every((entry) => typeof entry === "string") &&
      Array.isArray(value.exclude) &&
      value.exclude.every((entry) => typeof entry === "string")
        ? {
            success: true,
            data: { version: 1, set: value.set, exclude: value.exclude },
          }
        : { success: false, error: { message: "invalid shell environment" } },
    resolveGitPath: async (...args) => {
      calls.push(["resolve", ...args]);
      return "/repo/.git/codex-shell-environment.json";
    },
    ...overrides.dependencies,
  };
  return { calls, dependencies, repository };
}

equal(WORKTREE_SHELL_ENVIRONMENT_FILE, "codex-shell-environment.json");

{
  const state = fixture();
  const signal = new AbortController().signal;
  equal(
    await resolveWorktreeShellEnvironmentPath(state.repository, signal, state.dependencies),
    "/repo/.git/codex-shell-environment.json",
  );
  deepEqual(state.calls[0], [
    "resolve",
    state.repository,
    "codex-shell-environment.json",
    signal,
  ]);
}

{
  const state = fixture();
  deepEqual(await readWorktreeShellEnvironment(state.repository, undefined, state.dependencies), {
    version: 1,
    set: { NODE_ENV: "test" },
    exclude: ["TOKEN"],
  });
  deepEqual(state.calls.map((call) => call[0]), ["resolve", "read"]);
}

{
  const state = fixture({ dependencies: { resolveGitPath: async () => null } });
  equal(await readWorktreeShellEnvironment(state.repository, undefined, state.dependencies), null);
  equal(state.calls.some((call) => call[0] === "read"), false);
}

{
  const state = fixture({
    host: { readFile: async () => new TextEncoder().encode('{"version":2}') },
  });
  equal(await readWorktreeShellEnvironment(state.repository, undefined, state.dependencies), null);
  deepEqual(state.calls.at(-1), [
    "warning",
    "Invalid worktree shell environment config",
    { safe: {}, sensitive: { error: "invalid shell environment" } },
  ]);
}

{
  const state = fixture({ host: { readFile: async () => new TextEncoder().encode("{") } });
  equal(await readWorktreeShellEnvironment(state.repository, undefined, state.dependencies), null);
  equal(state.calls.at(-1)[1], "Failed to read worktree shell environment config");
  equal(state.calls.at(-1)[2].sensitive.error instanceof SyntaxError, true);
}

{
  const missing = Object.assign(new Error("missing"), { code: "ENOENT" });
  const state = fixture({ host: { readFile: async () => { throw missing; } } });
  equal(await readWorktreeShellEnvironment(state.repository, undefined, state.dependencies), null);
  equal(state.calls.some((call) => call[0] === "warning"), false);
}

{
  const denied = Object.assign(new Error("denied"), { code: "EACCES" });
  const state = fixture({ host: { readFile: async () => { throw denied; } } });
  equal(await readWorktreeShellEnvironment(state.repository, undefined, state.dependencies), null);
  equal(state.calls.at(-1)[1], "Failed to read worktree shell environment config");
  equal(state.calls.at(-1)[2].sensitive.error, denied);
}

{
  const state = fixture();
  const signal = new AbortController().signal;
  await writeWorktreeShellEnvironment(
    state.repository,
    { version: 1, set: { A: "1" }, exclude: ["B"] },
    signal,
    state.dependencies,
  );
  deepEqual(state.calls[0], [
    "resolve",
    state.repository,
    "codex-shell-environment.json",
    signal,
  ]);
  deepEqual(state.calls[1], [
    "write",
    "/repo/.git/codex-shell-environment.json",
    '{\n  "version": 1,\n  "set": {\n    "A": "1"\n  },\n  "exclude": [\n    "B"\n  ]\n}\n',
  ]);
}

{
  const state = fixture({ dependencies: { resolveGitPath: async () => null } });
  await rejects(
    writeWorktreeShellEnvironment(state.repository, {}, undefined, state.dependencies),
    /No git repository found for worktree shell env/,
  );
}

{
  const failure = new Error("write denied");
  const state = fixture({ host: { writeFile: async () => { throw failure; } } });
  await rejects(
    writeWorktreeShellEnvironment(state.repository, {}, undefined, state.dependencies),
    (value) => value === failure,
  );
}

{
  const state = fixture();
  const signal = new AbortController().signal;
  await removeWorktreeShellEnvironment(state.repository, signal, state.dependencies);
  deepEqual(state.calls.at(-1), ["remove", "/repo/.git/codex-shell-environment.json"]);
  equal(state.calls[0].at(-1), signal);
}

{
  const state = fixture({ dependencies: { resolveGitPath: async () => null } });
  await removeWorktreeShellEnvironment(state.repository, undefined, state.dependencies);
  equal(state.calls.some((call) => call[0] === "remove"), false);
}

{
  const failure = new Error("remove denied");
  const state = fixture({ host: { remove: async () => { throw failure; } } });
  await rejects(
    removeWorktreeShellEnvironment(state.repository, undefined, state.dependencies),
    (value) => value === failure,
  );
}

console.log(`${assertions} worker git worktree shell environment assertions passed`);
