import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { getRepositoryIdentity } = require(
  "../app/.vite/build/worker/git-repository-identity.js",
);

let assertions = 0;
const equal = (...args) => {
  assertions += 1;
  assert.equal(...args);
};
const deepEqual = (...args) => {
  assertions += 1;
  assert.deepEqual(...args);
};

function fixture(overrides = {}) {
  const calls = { fetch: [], hash: [], parse: [], run: [] };
  const querySignal = new AbortController().signal;
  const repository = { root: "/Repo", host: { id: "local" }, queryClient: {} };
  const dependencies = {
    fetchQueryWithSignal: async (queryClient, options, signal) => {
      calls.fetch.push({ options, queryClient, signal });
      return options.queryFn(querySignal);
    },
    getConfigQueryMeta: () => ({ invalidation: "config" }),
    getWorktreeId: async (root) => {
      calls.hash.push(root);
      return `hash:${root}`;
    },
    isCancelledError: (error) => error?.cancelled === true,
    originTimeoutMs: 5000,
    parseRemoteUrl: (url) => {
      calls.parse.push(url);
      return { host: "GitHub.COM", owner: "OpenAI", repo: "Codex" };
    },
    queryKey: (...parts) => ["key", ...parts],
    runGit: async (...args) => {
      calls.run.push(args);
      return { success: true, stdout: "git@github.com:OpenAI/Codex.git/" };
    },
    staleTime: Infinity,
    ...overrides,
  };
  return { calls, dependencies, querySignal, repository };
}

const callerSignal = new AbortController().signal;
let state = fixture();
deepEqual(await getRepositoryIdentity(state.repository, { signal: callerSignal }, state.dependencies), {
  repositoryFullName: "openai/codex",
  worktreeId: "hash:/Repo",
});
deepEqual(state.calls.run[0][1], ["remote", "get-url", "origin"]);
equal(state.calls.run[0][0], "/Repo");
equal(state.calls.run[0][2], state.repository.host);
deepEqual(state.calls.run[0][3], { signal: callerSignal, timeoutMs: 5000 });
deepEqual(state.calls.parse, ["git@github.com:OpenAI/Codex.git"]);
deepEqual(state.calls.hash, ["/Repo"]);

state = fixture();
await getRepositoryIdentity(
  state.repository,
  { isRepoWatched: true, signal: callerSignal },
  state.dependencies,
);
equal(state.calls.fetch.length, 1);
equal(state.calls.fetch[0].signal, callerSignal);
deepEqual(state.calls.fetch[0].options.queryKey, [
  "key",
  "/Repo",
  state.repository.host,
  "effective-origin-url",
]);
deepEqual(state.calls.fetch[0].options.meta, { invalidation: "config" });
equal(state.calls.fetch[0].options.staleTime, Infinity);
equal(state.calls.run[0][3].signal, state.querySignal);

const cancelled = Object.assign(new Error("cancelled"), { cancelled: true });
state = fixture({ fetchQueryWithSignal: async () => { throw cancelled; } });
await getRepositoryIdentity(
  state.repository,
  { isRepoWatched: true, signal: callerSignal },
  state.dependencies,
);
equal(state.calls.run.length, 1);
equal(state.calls.run[0][3].signal, callerSignal);

const aborted = new AbortController();
aborted.abort();
state = fixture({ fetchQueryWithSignal: async () => { throw cancelled; } });
deepEqual(
  await getRepositoryIdentity(
    state.repository,
    { isRepoWatched: true, signal: aborted.signal },
    state.dependencies,
  ),
  { repositoryFullName: null, worktreeId: "hash:/Repo" },
);
equal(state.calls.run.length, 0);

for (const runGit of [
  async () => ({ success: false, code: 1, stdout: "" }),
  async () => ({ success: false, code: null, stderr: "transport" }),
  async () => ({ success: true, stdout: "" }),
  async () => { throw new Error("failed"); },
]) {
  state = fixture({ runGit });
  deepEqual(await getRepositoryIdentity(state.repository, {}, state.dependencies), {
    repositoryFullName: null,
    worktreeId: "hash:/Repo",
  });
}

for (const [origin, parsed, expected] of [
  ["https://github.com/OpenAI/Codex.git", { host: "GitHub.COM", owner: "OpenAI", repo: "Codex" }, "openai/codex"],
  ["ssh://git@github.com:2222/OpenAI/Codex.git", { host: "github.com", owner: "OpenAI", repo: "Codex" }, "github.com:2222/openai/codex"],
  ["ssh://git@Example.COM:22/Owner/Repo.git", { host: "Example.COM", owner: "Owner", repo: "Repo" }, "example.com/Owner/Repo"],
  ["git://Example.COM:9418/Owner/Repo.git", { host: "Example.COM", owner: "Owner", repo: "Repo" }, "example.com/Owner/Repo"],
  ["ssh://git@Example.COM:2200/Owner/Repo.git", { host: "Example.COM", owner: "Owner", repo: "Repo" }, "example.com:2200/Owner/Repo"],
  ["git@example.com:Group/Repo.git", { host: "Example.COM", owner: "Group", repo: "Repo" }, "example.com/Group/Repo"],
]) {
  state = fixture({
    parseRemoteUrl: () => parsed,
    runGit: async () => ({ success: true, stdout: origin }),
  });
  equal((await getRepositoryIdentity(state.repository, {}, state.dependencies)).repositoryFullName, expected);
}

state = fixture({ parseRemoteUrl: () => null });
deepEqual(await getRepositoryIdentity(state.repository, {}, state.dependencies), {
  repositoryFullName: null,
  worktreeId: "hash:/Repo",
});

console.log(`${assertions} worker git repository identity assertions passed`);
