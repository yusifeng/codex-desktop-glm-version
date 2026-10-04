import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const {
  NESTED_DIRECTORY_BATCH_SIZE,
  PATH_QUERY_CACHE_MS,
  expandUntrackedDirectories,
  getPathStatus,
  getTrackedPaths,
  readPathStatus,
  readTrackedPaths,
  readUntrackedPaths,
} = require("../app/.vite/build/worker/git-path-status.js");

let assertions = 0;
const equal = (...args) => { assertions += 1; assert.equal(...args); };
const deepEqual = (...args) => { assertions += 1; assert.deepEqual(...args); };

function fixture(results = []) {
  const queue = [...results];
  const calls = { fetch: [], queryKey: [], run: [] };
  const host = { platformPath: async () => ({ join: (...parts) => parts.join(`/`) }) };
  const repository = {
    root: `/repo`,
    host,
    queryClient: { fetchQuery: async (options) => { calls.fetch.push(options); return options.queryFn(); } },
  };
  const dependencies = {
    chunk: (values, size) => Array.from({ length: Math.ceil(values.length / size) }, (_, index) => values.slice(index * size, (index + 1) * size)),
    compact: (values) => values.filter(Boolean),
    getQueryMeta: () => ({ type: `short-lived` }),
    queryKey: (...parts) => { calls.queryKey.push(parts); return parts; },
    runGit: async (...args) => { calls.run.push(args); return queue.shift() ?? { success: false, stdout: ``, code: 2 }; },
  };
  return { calls, dependencies, host, repository };
}

equal(PATH_QUERY_CACHE_MS, 250);
equal(NESTED_DIRECTORY_BATCH_SIZE, 8);
const signal = new AbortController().signal;
let state = fixture();
deepEqual(await expandUntrackedDirectories(`/repo`, state.host, [], signal, state.dependencies), { success: true, paths: [], gitRoot: `/repo` });
equal(state.calls.run.length, 0);

state = fixture([{ success: false, stdout: `` }]);
deepEqual(await expandUntrackedDirectories(`/repo`, state.host, [`dir/`], signal, state.dependencies), { success: false, paths: [], gitRoot: `/repo` });
state = fixture([{ success: true, stdout: `a.txt\0b.txt\0` }]);
deepEqual(await expandUntrackedDirectories(`/repo`, state.host, [`dir/`], signal, state.dependencies), { success: true, paths: [`a.txt`, `b.txt`], gitRoot: `/repo` });

state = fixture([
  { success: true, stdout: `plain.txt\0loose/\0nested/\0` },
  { success: false, code: 1, stdout: `` },
  { success: true, code: 0, stdout: `abc` },
]);
deepEqual(await expandUntrackedDirectories(`/repo`, state.host, [`loose/`, `nested/`], signal, state.dependencies), { success: true, paths: [`plain.txt`, `nested`], gitRoot: `/repo` });
deepEqual(state.calls.run[1], [`/repo/loose/`, [`rev-parse`, `--verify`, `--quiet`, `HEAD^{commit}`], state.host, { allowedNonZeroExitCodes: [1], signal }]);
equal(state.calls.run.length, 3);

const aborted = new AbortController();
aborted.abort();
state = fixture([{ success: true, stdout: `dir/\0` }]);
deepEqual(await expandUntrackedDirectories(`/repo`, state.host, [`dir/`], aborted.signal, state.dependencies), { success: false, paths: [], gitRoot: `/repo` });
equal(state.calls.run.length, 1);

state = fixture([{ success: true, stdout: `?? file.txt\0 R old.txt\0new.txt\0?? dir/\0` }, { success: true, stdout: `dir/a.txt\0` }]);
let statusOutput = null;
deepEqual(await readUntrackedPaths(`/repo`, state.host, { configOverrides: [`safe`], onStatus: (value) => { statusOutput = value; }, signal }, state.dependencies), { success: true, paths: [`file.txt`, `dir/a.txt`], gitRoot: `/repo` });
equal(statusOutput, `?? file.txt\0 R old.txt\0new.txt\0?? dir/\0`);
deepEqual(state.calls.run[0], [`/repo`, [`status`, `--renames`, `--porcelain=v1`, `-z`, `--untracked-files=normal`], state.host, { configOverrides: [`safe`], signal, trim: false }]);
state = fixture([{ success: false, stdout: `` }]);
deepEqual(await readUntrackedPaths(`/repo`, state.host, {}, state.dependencies), { success: false, paths: [], gitRoot: `/repo` });
equal(state.calls.run[0][1][1], `--no-renames`);

state = fixture([{ success: true, stdout: `a\0b\0` }]);
deepEqual(await readTrackedPaths(state.repository, [`src`], state.dependencies), { success: true, paths: [`a`, `b`], gitRoot: `/repo` });
deepEqual(state.calls.run[0][1], [`ls-files`, `--cached`, `-z`, `--`, `src`]);
state = fixture([{ success: false, stdout: `a\0` }]);
deepEqual(await readTrackedPaths(state.repository, [], state.dependencies), { success: false, paths: [], gitRoot: `/repo` });

state = fixture([{ success: true, stdout: `a\0` }]);
deepEqual(await getTrackedPaths(state.repository, [`src`], state.dependencies), { success: true, paths: [`a`], gitRoot: `/repo` });
deepEqual(state.calls.queryKey[0], [`/repo`, state.host, `tracked-paths`, [`src`]]);
equal(state.calls.fetch[0].gcTime, 250);
equal(state.calls.fetch[0].staleTime, 250);
equal(state.calls.fetch[0].meta.type, `short-lived`);

state = fixture([{ success: true, stdout: ` M tracked.txt\0?? new.txt\0!! ignored.txt\0x\0` }]);
deepEqual(await readPathStatus(state.repository, [`src`], state.dependencies), { success: true, trackedPaths: [`tracked.txt`], untrackedPaths: [`new.txt`], ignoredPaths: [`ignored.txt`], gitRoot: `/repo` });
deepEqual(state.calls.run[0][1], [`status`, `--no-renames`, `--ignored=matching`, `--untracked-files=all`, `--porcelain=v1`, `-z`, `--`, `src`]);
state = fixture([{ success: false, stdout: `` }]);
deepEqual(await readPathStatus(state.repository, [], state.dependencies), { success: false, trackedPaths: [], untrackedPaths: [], ignoredPaths: [], gitRoot: `/repo` });

state = fixture([{ success: true, stdout: `?? new.txt\0` }]);
deepEqual(await getPathStatus(state.repository, [`new.txt`], state.dependencies), { success: true, trackedPaths: [], untrackedPaths: [`new.txt`], ignoredPaths: [], gitRoot: `/repo` });
deepEqual(state.calls.queryKey[0], [`/repo`, state.host, `path-status`, [`new.txt`]]);
equal(state.calls.fetch[0].gcTime, 250);
equal(state.calls.fetch[0].staleTime, 250);

console.log(`${assertions} worker git path status assertions passed`);
