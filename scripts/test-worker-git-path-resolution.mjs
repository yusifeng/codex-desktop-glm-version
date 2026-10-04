import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const {
  getGitDir,
  getIndexContext,
  getIndexPath,
  readIndexFingerprint,
  readSharedIndexPath,
  resolveGitPath,
  resolveSharedIndexPath,
} = require("../app/.vite/build/worker/git-path-resolution.js");

let assertions = 0;
const equal = (...args) => { assertions += 1; assert.equal(...args); };
const deepEqual = (...args) => { assertions += 1; assert.deepEqual(...args); };

function fixture(results = []) {
  const calls = { fetch: [], queryKey: [], run: [], stat: [] };
  const queue = [...results];
  const platformPath = {
    isAbsolute: (path) => path.startsWith(`/`),
    join: (...parts) => parts.join(`/`),
    resolve: (...parts) => parts.join(`/`),
  };
  const host = {
    platformPath: async () => platformPath,
    stat: async (...args) => { calls.stat.push(args); return { size: 1, mtimeMs: 2, ctimeMs: 3, ino: 4 }; },
  };
  const repository = {
    root: `/repo`,
    host,
    queryClient: {
      fetchQuery: async (options) => { calls.fetch.push(options); return options.queryFn(); },
    },
  };
  const dependencies = {
    queryKey: (...parts) => { calls.queryKey.push(parts); return parts; },
    runGit: async (...args) => { calls.run.push(args); return queue.shift() ?? { success: false, stdout: `` }; },
    staleTime: Infinity,
  };
  return { calls, dependencies, host, platformPath, repository };
}

const signal = new AbortController().signal;
let state = fixture([{ success: true, stdout: `/repo/.git` }]);
equal(await getGitDir(state.repository, signal, state.dependencies), `/repo/.git`);
deepEqual(state.calls.queryKey[0], [`/repo`, state.host, `git-dir`]);
equal(state.calls.fetch[0].staleTime, Infinity);
deepEqual(state.calls.run[0], [`/repo`, [`rev-parse`, `--git-dir`], state.host, { signal }]);

state = fixture([{ success: true, stdout: `.git` }]);
equal(await getGitDir(state.repository, signal, state.dependencies), `/repo/.git`);
state = fixture([{ success: false, stdout: `/ignored` }]);
equal(await getGitDir(state.repository, signal, state.dependencies), null);
state = fixture([{ success: true, stdout: `` }]);
equal(await getGitDir(state.repository, signal, state.dependencies), null);

state = fixture([{ success: true, stdout: `/custom/index` }]);
equal(await resolveGitPath(state.repository, `index`, signal, state.dependencies), `/custom/index`);
deepEqual(state.calls.queryKey[0], [`/repo`, state.host, `git-path`, `index`]);
deepEqual(state.calls.run[0][1], [`rev-parse`, `--git-path`, `index`]);
state = fixture([{ success: true, stdout: `.git/index` }]);
equal(await resolveGitPath(state.repository, `index`, signal, state.dependencies), `/repo/.git/index`);
equal(state.calls.run.length, 1);
state = fixture([
  { success: true, stdout: `worktrees/topic/index` },
  { success: true, stdout: `/repo/.git` },
]);
equal(await resolveGitPath(state.repository, `index`, signal, state.dependencies), `/repo/.git/worktrees/topic/index`);
equal(state.calls.run.length, 2);
state = fixture([{ success: false, stdout: `` }]);
equal(await resolveGitPath(state.repository, `index`, signal, state.dependencies), null);

state = fixture([{ success: true, stdout: `/repo/.git/index` }]);
equal(await getIndexPath(state.repository, state.dependencies), `/repo/.git/index`);
equal(state.calls.run[0][3].signal, undefined);

state = fixture();
equal(await readIndexFingerprint(`/repo/.git/index`, state.repository), `1:2:3:4`);
deepEqual(state.calls.stat[0], [`/repo/.git/index`, { bypassCache: true }]);
state.host.stat = async () => ({ size: undefined, mtimeMs: undefined, ctimeMs: undefined, ino: undefined });
equal(await readIndexFingerprint(`/index`, state.repository), `0:0:0:0`);
state.host.stat = async () => { throw Object.assign(new Error(`missing`), { code: `ENOENT` }); };
equal(await readIndexFingerprint(`/index`, state.repository), `missing`);
state.host.stat = async () => { throw Object.assign(new Error(`denied`), { code: `EACCES` }); };
equal(await readIndexFingerprint(`/index`, state.repository), null);

state = fixture([{ success: true, stdout: `/shared/index` }]);
equal(await readSharedIndexPath(state.repository, signal, state.dependencies), `/shared/index`);
state = fixture([{ success: true, stdout: `.git/sharedindex.1` }]);
equal(await readSharedIndexPath(state.repository, signal, state.dependencies), `/repo/.git/sharedindex.1`);
state = fixture([{ success: true, stdout: `` }]);
equal(await readSharedIndexPath(state.repository, signal, state.dependencies), null);
state = fixture([{ success: false, stdout: `/ignored` }]);
equal(await readSharedIndexPath(state.repository, signal, state.dependencies), undefined);

state = fixture([{ success: true, stdout: `/shared/one` }]);
equal(await resolveSharedIndexPath(state.repository, `/index`, signal, state.dependencies), `/shared/one`);
equal(await resolveSharedIndexPath(state.repository, `/index`, signal, state.dependencies), `/shared/one`);
equal(state.calls.run.length, 1);
state.host.stat = async () => ({ size: 2, mtimeMs: 2, ctimeMs: 3, ino: 4 });
state.dependencies.runGit = async (...args) => { state.calls.run.push(args); return { success: true, stdout: `/shared/two` }; };
equal(await resolveSharedIndexPath(state.repository, `/index`, signal, state.dependencies), `/shared/two`);
equal(state.calls.run.length, 2);

state = fixture([{ success: false, stdout: `` }, { success: true, stdout: `/shared` }]);
state.host.stat = async () => { throw Object.assign(new Error(`denied`), { code: `EACCES` }); };
equal(await resolveSharedIndexPath(state.repository, `/index`, signal, state.dependencies), null);
equal(await resolveSharedIndexPath(state.repository, `/index`, signal, state.dependencies), `/shared`);
equal(state.calls.run.length, 2);

state = fixture([{ success: false, stdout: `` }]);
equal(await getIndexContext(state.repository, signal, state.dependencies), null);
state = fixture([
  { success: true, stdout: `/index` },
  { success: true, stdout: `/shared` },
]);
deepEqual(await getIndexContext(state.repository, signal, state.dependencies), { indexPath: `/index`, sharedIndexPath: `/shared` });

console.log(`${assertions} worker git path resolution assertions passed`);
