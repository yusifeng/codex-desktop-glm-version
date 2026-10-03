import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const {
  blameFile,
  getRepositoryWebUrl,
  parseBlamePorcelain,
  parseGitHubAuthorLogin,
} = require("../app/.vite/build/worker/git-blame-file.js");

let assertions = 0;
const equal = (...args) => {
  assertions += 1;
  assert.equal(...args);
};
const deepEqual = (...args) => {
  assertions += 1;
  assert.deepEqual(...args);
};

equal(parseGitHubAuthorLogin("<123+octocat@users.noreply.github.com>"), "octocat");
equal(parseGitHubAuthorLogin("User@users.noreply.GitHub.com"), "User");
equal(parseGitHubAuthorLogin("<user@example.com>"), null);

const sha = "a".repeat(40);
deepEqual(parseBlamePorcelain([
  `${sha} 1 7 1`,
  "author Alice",
  "author-mail <123+alice@users.noreply.github.com>",
  "author-time 1700000000",
  "summary First line",
  "\tcontent one",
  `${sha} 2 8 1`,
  "\tcontent two",
].join("\n")), [
  {
    author: "Alice",
    authorLogin: "alice",
    authorTime: 1700000000,
    commitSha: sha,
    lineNumber: 7,
    summary: "First line",
  },
  {
    author: "Alice",
    authorLogin: "alice",
    authorTime: 1700000000,
    commitSha: sha,
    lineNumber: 8,
    summary: "First line",
  },
]);
deepEqual(parseBlamePorcelain("bad-header\nauthor-time nope\n\tline\n"), [{
  author: null,
  authorLogin: null,
  authorTime: null,
  commitSha: "bad-header",
  lineNumber: 0,
  summary: null,
}]);
deepEqual(parseBlamePorcelain(`${sha} 1 1 1\nauthor Dangling`), []);

function fixture(overrides = {}) {
  const calls = { origin: [], query: [], run: [] };
  const host = {
    id: "local",
    platformPath: async () => ({ isAbsolute: (path) => path.startsWith("/") }),
  };
  const repository = {
    root: "/repo",
    host,
    queryClient: {
      fetchQuery: async (options) => {
        calls.query.push(options);
        return options.queryFn();
      },
    },
  };
  const gitManager = {
    getStableMetadata: async () => ({ root: "/repo" }),
    getWorktreeRepositoryForRoot: () => repository,
    getRepoRepository: async () => ({
      getOriginUrl: async (...args) => {
        calls.origin.push(args);
        return "git@github.com:OpenAI/Codex.git";
      },
    }),
    ...overrides.gitManager,
  };
  const dependencies = {
    getQueryMeta: () => ({ family: "short" }),
    parseRemoteUrl: () => ({ host: "github.com", owner: "OpenAI", repo: "Codex" }),
    queryKey: (...parts) => ["key", ...parts],
    resolveGitPath: (_platformPath, _root, _cwd, path) => path,
    runGit: async (...args) => {
      calls.run.push(args);
      return { code: 0, stdout: `${sha} 1 1 1\nauthor Alice\n\tline\n` };
    },
    ...overrides.dependencies,
  };
  return { calls, dependencies, gitManager, host, repository };
}

const signal = new AbortController().signal;
let state = fixture();
deepEqual(await blameFile(
  state.gitManager,
  { cwd: "/repo/sub", path: "src/a.ts" },
  state.host,
  signal,
  state.dependencies,
), {
  type: "success",
  lines: [{
    author: "Alice",
    authorLogin: null,
    authorTime: null,
    commitSha: sha,
    lineNumber: 1,
    summary: null,
  }],
  repositoryWebUrl: "https://github.com/OpenAI/Codex",
});
deepEqual(state.calls.query[0].queryKey, ["key", "/repo", state.host, "blame-file", "src/a.ts"]);
equal(state.calls.query[0].gcTime, 250);
equal(state.calls.query[0].staleTime, 250);
deepEqual(state.calls.query[0].meta, { family: "short" });
deepEqual(state.calls.run[0], [
  "/repo",
  ["blame", "--porcelain", "--", "src/a.ts"],
  state.host,
  {
    env: { GIT_NO_LAZY_FETCH: "1" },
    maxOutputBytes: 20_971_520,
    signal,
    timeoutMs: 30_000,
    trim: false,
  },
]);
equal(state.calls.origin[0][0], signal);

for (const path of ["/absolute", "..", "../outside", "..\\outside"]) {
  state = fixture({ dependencies: { resolveGitPath: () => path } });
  deepEqual(await blameFile(
    state.gitManager,
    { cwd: "/repo", path: "x" },
    state.host,
    signal,
    state.dependencies,
  ), { type: "error", error: { type: "not-found" } });
  equal(state.calls.run.length, 0);
}

state = fixture({ gitManager: { getStableMetadata: async () => null } });
deepEqual(await blameFile(state.gitManager, { cwd: "/repo", path: "x" }, state.host, signal, state.dependencies), {
  type: "error", error: { type: "unknown" },
});

for (const result of [
  { code: 128, stdout: "" },
  { code: 1, stdout: "" },
  { code: 0, stdout: "", outputLimitExceeded: { limitBytes: 1 } },
]) {
  state = fixture({ dependencies: { runGit: async () => result } });
  deepEqual(
    await blameFile(state.gitManager, { cwd: "/repo", path: "x" }, state.host, signal, state.dependencies),
    { type: "error", error: { type: result.code === 128 ? "not-found" : "unknown" } },
  );
}

state = fixture({ dependencies: { runGit: async () => { throw new Error("failed"); } } });
deepEqual(await blameFile(state.gitManager, { cwd: "/repo", path: "x" }, state.host, signal, state.dependencies), {
  type: "error", error: { type: "unknown" },
});

state = fixture({ dependencies: { parseRemoteUrl: () => ({ host: "git.example.com", owner: "O", repo: "R" }) } });
equal(await getRepositoryWebUrl(state.gitManager, "/repo", state.host, signal, state.dependencies), null);
state = fixture({ dependencies: { parseRemoteUrl: () => ({ host: "enterprise.github.com", owner: "O", repo: "R" }) } });
equal(
  await getRepositoryWebUrl(state.gitManager, "/repo", state.host, signal, state.dependencies),
  "https://enterprise.github.com/O/R",
);
state = fixture({ gitManager: { getRepoRepository: async () => { throw new Error("failed"); } } });
equal(await getRepositoryWebUrl(state.gitManager, "/repo", state.host, signal, state.dependencies), null);

console.log(`${assertions} worker git blame-file assertions passed`);
