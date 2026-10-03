import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { getGitIndexInfo } = require("../app/.vite/build/worker/git-index-info.js");

let count = 0;
const equal = (...args) => { count += 1; assert.equal(...args); };
const deepEqual = (...args) => { count += 1; assert.deepEqual(...args); };
const signal = new AbortController().signal;

function fixture(options = {}) {
  const calls = [];
  const path = { join: (...parts) => parts.join("/") };
  const host = {
    platformPath: async () => path,
    stat: async (...args) => {
      calls.push(["stat", ...args]);
      if (options.statError) throw options.statError;
      return { mtimeMs: options.mtimeMs ?? 42 };
    },
  };
  const repository = { host };
  const dependencies = {
    getGitDir: async (...args) => {
      calls.push(["git-dir", ...args]);
      return options.gitDir === undefined ? "/repo/.git" : options.gitDir;
    },
    logger: { error: (...args) => calls.push(["error", ...args]) },
  };
  return { calls, dependencies, host, repository };
}

let state = fixture({ gitDir: null });
deepEqual(await getGitIndexInfo(state.repository, signal, state.dependencies), { lastModified: 0 });
deepEqual(state.calls, [["git-dir", state.repository, signal]]);

state = fixture({ mtimeMs: 99 });
deepEqual(await getGitIndexInfo(state.repository, signal, state.dependencies), { lastModified: 99 });
deepEqual(state.calls[1], ["stat", "/repo/.git/index"]);

state = fixture({ statError: Object.assign(new Error("missing"), { code: "ENOENT" }) });
deepEqual(await getGitIndexInfo(state.repository, signal, state.dependencies), { lastModified: 0 });
equal(state.calls.some((call) => call[0] === "error"), false);

const denied = Object.assign(new Error("denied"), { code: "EACCES" });
state = fixture({ statError: denied });
deepEqual(await getGitIndexInfo(state.repository, signal, state.dependencies), { lastModified: 0 });
equal(state.calls.at(-1)[0], "error");
equal(state.calls.at(-1)[1], "Failed to read index info");
deepEqual(state.calls.at(-1)[2], {
  safe: { indexPath: "/repo/.git/index" },
  sensitive: { error: denied },
});

console.log(`${count} worker git index info assertions passed`);
