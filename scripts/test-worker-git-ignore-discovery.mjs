import assert from "node:assert/strict";
import path from "node:path";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const {
  discoverGitIgnoreConfigurationFiles,
  parseGitConfigurationPathOutput,
  readGitWatcherIgnoredDirectories,
} = require("../app/.vite/build/worker/git-ignore-discovery.js");

let assertions = 0;
const equal = (actual, expected) => { assertions += 1; assert.equal(actual, expected); };
const deepEqual = (actual, expected) => { assertions += 1; assert.deepEqual(actual, expected); };
const rejects = async (promise, pattern) => { assertions += 1; await assert.rejects(promise, pattern); };

const host = { platformPath: async () => path.posix };
const repository = { root: "/repo", host };
const success = (stdout = "", code = 0) => ({ success: true, code, stdout });

function createRunGit({ system = success("/etc/gitconfig\n"), ignore = success(), local = success(".git/config\n"), worktree = success(".git/config.worktree\n"), origins = success() } = {}) {
  const calls = [];
  const runGit = async (cwd, args, calledHost, options) => {
    calls.push({ cwd, args, host: calledHost, options });
    if (args[0] === "var") return system;
    if (args[0] === "config" && args.includes("--get-regexp")) return ignore;
    if (args[0] === "config") return origins;
    if (args.at(-1) === "config") return local;
    if (args.at(-1) === "config.worktree") return worktree;
    throw Error(`Unexpected command: ${args.join(" ")}`);
  };
  return { calls, runGit };
}

equal(parseGitConfigurationPathOutput("config\n"), "config");
equal(parseGitConfigurationPathOutput("config\n\n"), "config\n");
await rejects(Promise.resolve().then(() => parseGitConfigurationPathOutput("config")), /Invalid Git configuration path output/);
await rejects(Promise.resolve().then(() => parseGitConfigurationPathOutput("\n")), /Invalid Git configuration path output/);

const modern = createRunGit({
  ignore: success([
    "file:.git/config", "include.path\n../shared/gitconfig",
    "file:/home/user/.gitconfig", "core.excludesfile\n.ignore-global",
    "command line:", "includeIf.gitdir:work.path\nconditional.cfg",
    "",
  ].join("\0")),
});
const modernResult = await discoverGitIgnoreConfigurationFiles(
  repository,
  { defaultExcludesFile: "default-ignore", globalConfigFiles: ["global.cfg", "/etc/gitconfig"] },
  { runGit: modern.runGit },
);
equal(modernResult.ignoreFile, "/repo/.ignore-global");
deepEqual(modernResult.configFiles, [
  "/etc/gitconfig",
  "/home/user/.gitconfig",
  "/repo/.git/../shared/gitconfig",
  "/repo/.git/config",
  "/repo/.git/config.worktree",
  "/repo/conditional.cfg",
  "/repo/global.cfg",
].sort());
equal(modern.calls.length, 4);
deepEqual(modern.calls[0].args, ["var", "GIT_CONFIG_SYSTEM"]);
deepEqual(modern.calls[0].options, {
  trim: false,
  allowedNonZeroExitCodes: [1, 129],
  maxOutputBytes: 1048576,
  timeoutMs: 60000,
});
const regexpCall = modern.calls.find((call) => call.args.includes("--get-regexp"));
equal(regexpCall.cwd, "/repo");
equal(regexpCall.host, host);
equal(regexpCall.options.env.GIT_CONFIG, undefined);
equal(regexpCall.options.allowedNonZeroExitCodes[0], 1);
equal(regexpCall.options.maxOutputBytes, 1048576);

const clearsIgnore = createRunGit({
  system: success("\n"),
  ignore: success("file:.git/config\0core.excludesfile\n\0"),
});
const cleared = await discoverGitIgnoreConfigurationFiles(
  repository,
  { defaultExcludesFile: "default-ignore", globalConfigFiles: [] },
  { runGit: clearsIgnore.runGit },
);
equal(cleared.ignoreFile, null);
equal(cleared.configFiles.includes("/etc/gitconfig"), false);

const oldGit = createRunGit({
  system: success("usage\n", 129),
  origins: success("file:/old/system.gitconfig\0core.editor\0blob:abc\0user.name\0"),
});
const oldResult = await discoverGitIgnoreConfigurationFiles(
  repository,
  { defaultExcludesFile: null, globalConfigFiles: [] },
  { runGit: oldGit.runGit },
);
deepEqual(oldResult.configFiles, [
  "/etc/gitconfig",
  "/old/system.gitconfig",
  "/repo/.git/config",
  "/repo/.git/config.worktree",
].sort());
equal(oldGit.calls.length, 5);
const fallbackCall = oldGit.calls.find((call) => call.args.includes("--name-only"));
deepEqual(fallbackCall.args, ["config", "--includes", "--null", "--show-origin", "--name-only", "--list"]);
equal(fallbackCall.options.env.GIT_CONFIG, undefined);

const noSystem = createRunGit({ system: success("", 1) });
const noSystemResult = await discoverGitIgnoreConfigurationFiles(
  repository,
  { defaultExcludesFile: null, globalConfigFiles: [] },
  { runGit: noSystem.runGit },
);
equal(noSystemResult.configFiles.includes("/etc/gitconfig"), false);
equal(noSystem.calls.length, 4);

const windowsRepository = {
  root: "C:\\repo",
  host: { platformPath: async () => path.win32 },
};
const windowsGit = createRunGit({
  system: success("\n"),
  local: success(".git/config\n"),
  worktree: success(".git/config.worktree\n"),
});
deepEqual(
  await discoverGitIgnoreConfigurationFiles(
    windowsRepository,
    { defaultExcludesFile: "global-ignore", globalConfigFiles: ["global.cfg"] },
    { runGit: windowsGit.runGit },
  ),
  {
    ignoreFile: "C:\\repo\\global-ignore",
    configFiles: [
      "C:\\repo\\.git/config",
      "C:\\repo\\.git/config.worktree",
      "C:\\repo\\global.cfg",
    ].sort(),
  },
);

await rejects(
  discoverGitIgnoreConfigurationFiles(repository, { defaultExcludesFile: null, globalConfigFiles: [] }, {
    runGit: createRunGit({ system: { success: false, code: 2, stdout: "" } }).runGit,
  }),
  /Failed to discover Git ignore configuration files/,
);
for (const failedResult of [
  { ignore: { success: false, code: 2, stdout: "" } },
  { local: { success: false, code: 2, stdout: "" } },
  { worktree: { success: false, code: 2, stdout: "" } },
  { system: success("usage\n", 129), origins: { success: false, code: 2, stdout: "" } },
]) {
  await rejects(
    discoverGitIgnoreConfigurationFiles(
      repository,
      { defaultExcludesFile: null, globalConfigFiles: [] },
      { runGit: createRunGit(failedResult).runGit },
    ),
    /Failed to discover Git ignore configuration files/,
  );
}

await rejects(
  discoverGitIgnoreConfigurationFiles(
    repository,
    { defaultExcludesFile: null, globalConfigFiles: [] },
    { runGit: createRunGit({ system: success("usage\n", 129), origins: success("file:/bad\0name") }).runGit },
  ),
  /Invalid Git configuration origin output/,
);
for (const malformed of ["file:.git/config\0include.path", "file:.git/config\0include.path-no-newline\0"]) {
  await rejects(
    discoverGitIgnoreConfigurationFiles(
      repository,
      { defaultExcludesFile: null, globalConfigFiles: [] },
      { runGit: createRunGit({ ignore: success(malformed) }).runGit },
    ),
    /Invalid Git ignore configuration output/,
  );
}

const readCalls = [];
const ignoredDirectories = await readGitWatcherIgnoredDirectories(repository, {
  readPathStatus: async (repo, paths) => {
    readCalls.push(["status", repo, paths]);
    return {
      success: true,
      ignoredPaths: ["z/", "build/", "linked/cache/", "same/", "ignored-file", "sibling/", "alpha/"],
    };
  },
  readTrackedPaths: async (repo, paths) => {
    readCalls.push(["tracked", repo, paths]);
    return { success: true, paths: ["sibling2/file", "build/keep.txt", "linked", "same"] };
  },
});
deepEqual(ignoredDirectories, ["/repo/alpha", "/repo/sibling", "/repo/z"]);
equal(readCalls.length, 2);
equal(readCalls.every(([, repo, paths]) => repo === repository && paths.length === 0), true);

deepEqual(
  await readGitWatcherIgnoredDirectories(repository, {
    readPathStatus: async () => ({ success: true, ignoredPaths: ["cache/", "cache/"] }),
    readTrackedPaths: async () => ({ success: true, paths: [] }),
  }),
  ["/repo/cache", "/repo/cache"],
);

await rejects(
  readGitWatcherIgnoredDirectories(repository, {
    readPathStatus: async () => ({ success: false, ignoredPaths: [] }),
    readTrackedPaths: async () => ({ success: true, paths: [] }),
  }),
  /Failed to read Git watcher ignored directories/,
);
await rejects(
  readGitWatcherIgnoredDirectories(repository, {
    readPathStatus: async () => ({ success: true, ignoredPaths: [] }),
    readTrackedPaths: async () => ({ success: false, paths: [] }),
  }),
  /Failed to read Git watcher ignored directories/,
);

console.log(`${assertions} worker git ignore discovery assertions passed`);
