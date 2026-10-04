import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const {
  GitMetadataResolutionError,
  isNonRepositoryError,
  resolveGitCommonDir,
  resolveGitRoot,
  resolveGitRootAndCommonDir,
} = require("../app/.vite/build/worker/git-root-resolution.js");

let assertions = 0;
const equal = (...args) => { assertions += 1; assert.equal(...args); };
const deepEqual = (...args) => { assertions += 1; assert.deepEqual(...args); };
const rejects = async (...args) => { assertions += 1; await assert.rejects(...args); };

function fixture(result = { success: true, code: 0, stdout: "/repo", stderr: "" }, overrides = {}) {
  const calls = { debug: [], normalizeCommon: [], normalizeRoot: [], run: [], stat: [] };
  const platformPath = { isAbsolute: (path) => path.startsWith("/") };
  platformPath.resolve = (...parts) => parts.join("/");
  const host = {
    isLocal: true,
    platformPath: async () => platformPath,
    stat: async (...args) => { calls.stat.push(args); },
  };
  const dependencies = {
    createGitUnavailableError: () => Object.assign(new Error("Git is unavailable"), { name: "GitUnavailableError" }),
    isMissingPathError: (error) => error?.code === "ENOENT",
    logger: { debug: (...args) => calls.debug.push(args) },
    normalizeCommonDir: (path) => { calls.normalizeCommon.push(path); return `common:${path}`; },
    normalizeRoot: (path) => { calls.normalizeRoot.push(path); return `root:${path}`; },
    runGit: async (...args) => { calls.run.push(args); return result; },
    ...overrides,
  };
  return { calls, dependencies, host, platformPath };
}

for (const message of [
  "fatal: not a git repository",
  "Cannot use bare repository",
  "invalid gitfile format",
  "no path in gitfile",
  "invalid gitdir",
]) equal(isNonRepositoryError(message), true);
equal(isNonRepositoryError("permission denied"), false);

const signal = new AbortController().signal;
let state = fixture();
equal(await resolveGitRoot("/cwd", state.host, signal, state.dependencies), "root:/repo");
deepEqual(state.calls.stat[0], ["/cwd", { bypassCache: true }]);
deepEqual(state.calls.run[0], ["/cwd", ["rev-parse", "--show-toplevel"], state.host, { allowedNonZeroExitCodes: [128], signal }]);

state = fixture();
state.host.isLocal = false;
await resolveGitRoot("/cwd", state.host, signal, state.dependencies);
equal(state.calls.stat.length, 0);
state = fixture();
state.host.stat = async () => { throw Object.assign(new Error("missing"), { code: "ENOENT" }); };
equal(await resolveGitRoot("/missing", state.host, signal, state.dependencies), null);
equal(state.calls.run.length, 0);
state = fixture();
const statFailure = new Error("denied");
state.host.stat = async () => { throw statFailure; };
await rejects(resolveGitRoot("/cwd", state.host, signal, state.dependencies), (error) => error === statFailure);

state = fixture({ success: false, code: 128, stdout: "", stderr: "fatal: not a git repository" });
equal(await resolveGitRoot("/cwd", state.host, signal, state.dependencies), null);
state = fixture({ success: false, code: 2, stdout: "", stderr: "fatal: not a git repository" });
await rejects(resolveGitRoot("/cwd", state.host, signal, state.dependencies), /Failed to resolve git root/);
state = fixture({ success: false, code: 127, stdout: "", stderr: "Git is unavailable" });
await rejects(resolveGitRoot("/cwd", state.host, signal, state.dependencies), (error) => error.name === "GitUnavailableError");
state = fixture({ success: false, code: 2, stdout: "", stderr: "denied" });
await rejects(resolveGitRoot("/cwd", state.host, signal, state.dependencies), /Failed to resolve git root: denied/);
equal(state.calls.debug.length, 1);

state = fixture({ success: true, code: 0, stdout: "/repo\n/git-common", stderr: "" });
deepEqual(await resolveGitRootAndCommonDir("/cwd", state.host, signal, state.dependencies), { root: "root:/repo", commonDir: "common:/git-common" });
deepEqual(state.calls.run[0][1], ["rev-parse", "--path-format=absolute", "--show-toplevel", "--git-common-dir"]);
deepEqual(state.calls.normalizeRoot, ["/repo"]);
deepEqual(state.calls.normalizeCommon, ["/git-common"]);
state = fixture({ success: true, code: 0, stdout: "relative-root\r\n/git-common", stderr: "" });
deepEqual(await resolveGitRootAndCommonDir("/cwd", state.host, signal, state.dependencies), { root: "root:relative-root", commonDir: "common:/git-common" });

for (const stdout of ["", "/repo", "/repo\n", "/repo\n/common\nextra"]) {
  state = fixture({ success: true, code: 0, stdout, stderr: "" });
  await rejects(resolveGitRootAndCommonDir("/cwd", state.host, signal, state.dependencies), GitMetadataResolutionError);
}
state = fixture({ success: true, code: 0, stdout: "/repo\nrelative", stderr: "" });
await rejects(resolveGitRootAndCommonDir("/cwd", state.host, signal, state.dependencies), /relative common dir output/);
state = fixture({ success: false, code: 128, stdout: "", stderr: "invalid gitdir" });
equal(await resolveGitRootAndCommonDir("/cwd", state.host, signal, state.dependencies), null);
state = fixture({ success: false, code: 127, stdout: "", stderr: "Git is unavailable" });
await rejects(resolveGitRootAndCommonDir("/cwd", state.host, signal, state.dependencies), (error) => error.name === "GitUnavailableError");
state = fixture({ success: false, code: 129, stdout: "", stderr: "Git is unavailable" });
await rejects(resolveGitRootAndCommonDir("/cwd", state.host, signal, state.dependencies), (error) => error.name === "GitUnavailableError");
for (const result of [
  { success: false, code: 129, stdout: "", stderr: "usage" },
  { success: false, code: 2, stdout: "", stderr: "fatal: unknown option" },
]) {
  state = fixture(result);
  await rejects(resolveGitRootAndCommonDir("/cwd", state.host, signal, state.dependencies), GitMetadataResolutionError);
}
state = fixture({ success: false, code: 2, stdout: "fallback", stderr: "" });
await rejects(resolveGitRootAndCommonDir("/cwd", state.host, signal, state.dependencies), /common dir: fallback/);

state = fixture({ success: true, code: 0, stdout: "/git-common", stderr: "" });
equal(await resolveGitCommonDir("/repo", state.host, signal, state.dependencies), "common:/git-common");
deepEqual(state.calls.run[0], ["/repo", ["rev-parse", "--git-common-dir"], state.host, { signal }]);
state = fixture({ success: true, code: 0, stdout: ".git", stderr: "" });
equal(await resolveGitCommonDir("/repo", state.host, signal, state.dependencies), "common:/repo/.git");
state = fixture();
state.host.isLocal = false;
state.dependencies.runGit = async (...args) => { state.calls.run.push(args); return { success: true, code: 0, stdout: "/common", stderr: "" }; };
equal(await resolveGitCommonDir("/repo", state.host, signal, state.dependencies), "common:/common");
equal(state.calls.stat.length, 0);
state = fixture();
state.host.stat = async () => { throw Object.assign(new Error("missing"), { code: "ENOENT" }); };
await rejects(resolveGitCommonDir("/missing", state.host, signal, state.dependencies), /ENOENT: path does not exist: \/missing/);
state = fixture();
const commonStatFailure = new Error("denied");
state.host.stat = async () => { throw commonStatFailure; };
await rejects(resolveGitCommonDir("/repo", state.host, signal, state.dependencies), (error) => error === commonStatFailure);
state = fixture({ success: false, code: 128, stdout: "", stderr: "fatal: not a git repository" });
equal(await resolveGitCommonDir("/repo", state.host, signal, state.dependencies), null);
state = fixture({ success: false, code: 2, stdout: "", stderr: "invalid gitdir" });
await rejects(resolveGitCommonDir("/repo", state.host, signal, state.dependencies), /Failed to resolve git common dir: invalid gitdir/);

console.log(`${assertions} worker git root resolution assertions passed`);
