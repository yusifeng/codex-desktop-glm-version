import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const {
  LOCAL_ENVIRONMENT_CONFIG_PATH_KEY,
  getConfigValue,
  getConfigValueForScope,
  getLocalEnvironmentConfigPath,
  readConfigValue,
  readConfigValueForScope,
  setConfigValueForScope,
} = require("../app/.vite/build/worker/git-config-scope.js");

let assertions = 0;
const equal = (...args) => { assertions += 1; assert.equal(...args); };
const deepEqual = (...args) => { assertions += 1; assert.deepEqual(...args); };
const rejects = async (...args) => { assertions += 1; await assert.rejects(...args); };

function fixture(result = { success: true, stdout: "value", stderr: "", code: 0 }) {
  const calls = { fetch: [], queryKey: [], run: [] };
  const querySignal = new AbortController().signal;
  const dependencies = {
    fetchQueryWithSignal: async (queryClient, options, signal) => {
      calls.fetch.push([queryClient, options, signal]);
      return options.queryFn(querySignal);
    },
    getConfigQueryMeta: () => ({ source: "config" }),
    queryKey: (...parts) => { calls.queryKey.push(parts); return parts; },
    runGit: async (...args) => { calls.run.push(args); return result; },
    staleTime: Infinity,
  };
  const repository = {
    root: "/repo",
    host: { id: "local" },
    queryClient: { fetchQuery: async (options) => options.queryFn() },
  };
  return { calls, dependencies, querySignal, repository };
}

equal(LOCAL_ENVIRONMENT_CONFIG_PATH_KEY, "codex.localEnvironmentConfigPath");
const signal = new AbortController().signal;
let state = fixture();
equal(await readConfigValue("/repo", ["remote.origin.url"], state.repository.host, signal, state.dependencies), "value");
deepEqual(state.calls.run[0], ["/repo", ["config", "--get", "remote.origin.url"], state.repository.host, { signal }]);
state = fixture({ success: false, stdout: "ignored", stderr: "failure", code: 2 });
equal(await readConfigValue("/repo", ["missing"], null, undefined, state.dependencies), null);

state = fixture();
equal(await getConfigValue(state.repository, ["remote.origin.url"], signal, state.dependencies), "value");
deepEqual(state.calls.queryKey[0], ["/repo", state.repository.host, "config-value", ["remote.origin.url"]]);
equal(state.calls.fetch.length, 0);
equal(state.calls.run[0][3].signal, signal);
state = fixture({ success: true, stdout: "", stderr: "", code: 0 });
equal(await getConfigValue(state.repository, ["missing"], signal, state.dependencies), null);

state = fixture();
equal(await readConfigValueForScope("/repo", "user.name", "local", state.repository.host, signal, state.dependencies), "value");
deepEqual(state.calls.run[0], ["/repo", ["config", "--local", "--get", "user.name"], state.repository.host, { signal }]);

state = fixture({ success: true, stdout: "", stderr: "", code: 0 });
equal(await readConfigValueForScope("/repo", "missing", "worktree", null, undefined, state.dependencies), null);
deepEqual(state.calls.run[0][1], ["config", "--worktree", "--get", "missing"]);
state = fixture({ success: false, stdout: "ignored", stderr: "failure", code: 2 });
equal(await readConfigValueForScope("/repo", "bad", "local", null, signal, state.dependencies), null);

state = fixture();
equal(await getConfigValueForScope(state.repository, "user.email", "local", signal, state.dependencies), "value");
deepEqual(state.calls.queryKey[0], ["/repo", state.repository.host, "config-value-for-scope", "local", "user.email"]);
equal(state.calls.fetch[0][1].meta.source, "config");
equal(state.calls.fetch[0][1].staleTime, Infinity);
equal(state.calls.fetch[0][2], signal);
deepEqual(state.calls.run[0], ["/repo", ["config", "--local", "--get", "user.email"], state.repository.host, { signal: state.querySignal }]);

state = fixture();
equal(await getConfigValueForScope(state.repository, "user.email", "worktree", undefined, state.dependencies), "value");
equal(state.calls.fetch[0][2], undefined);
equal(state.calls.run[0][3].signal, undefined);

state = fixture({ success: true, stdout: "", stderr: "", code: 0 });
equal(await getConfigValueForScope(state.repository, "missing", "local", signal, state.dependencies), null);
state = fixture({ success: false, stdout: "", stderr: "", code: 1 });
equal(await getConfigValueForScope(state.repository, "missing", "local", signal, state.dependencies), null);
state = fixture({ success: false, stdout: "", stderr: "fatal: WORKTREECONFIG is disabled", code: 128 });
equal(await getConfigValueForScope(state.repository, "missing", "worktree", signal, state.dependencies), null);

state = fixture({ success: false, stdout: "", stderr: "fatal: worktreeconfig is disabled", code: 128 });
await rejects(getConfigValueForScope(state.repository, "missing", "local", signal, state.dependencies), /git config --local --get missing failed: fatal: worktreeconfig is disabled/);
state = fixture({ success: false, stdout: "stdout failure", stderr: "", code: 3 });
await rejects(getConfigValueForScope(state.repository, "bad", "worktree", signal, state.dependencies), /failed: stdout failure/);
state = fixture({ success: false, stdout: "", stderr: "", code: null });
await rejects(getConfigValueForScope(state.repository, "bad", "worktree", signal, state.dependencies), /exit code unknown/);

state = fixture({ success: true, stdout: "/tmp/env.toml", stderr: "", code: 0 });
equal(await getLocalEnvironmentConfigPath("/repo", state.repository.host, undefined, signal, state.dependencies), "/tmp/env.toml");
deepEqual(state.calls.run[0], ["/repo", ["config", "--worktree", "--get", LOCAL_ENVIRONMENT_CONFIG_PATH_KEY], state.repository.host, { signal }]);

state = fixture();
equal(await setConfigValueForScope("/repo", "user.name", "Codex", "local", state.repository.host, signal, state.dependencies), true);
deepEqual(state.calls.run[0], ["/repo", ["config", "--local", "user.name", "Codex"], state.repository.host, { signal }]);
state = fixture({ success: false, stdout: "", stderr: "failure", code: 2 });
equal(await setConfigValueForScope("/repo", "user.name", "Codex", "local", null, signal, state.dependencies), false);
equal(state.calls.run.length, 1);
state = fixture({ success: false, stdout: "", stderr: "failure", code: 2 });
equal(await setConfigValueForScope("/repo", "user.name", "Codex", "worktree", null, signal, state.dependencies), false);
equal(state.calls.run.length, 1);

{
  const results = [
    { success: false, stdout: "", stderr: "fatal: WORKTREECONFIG is disabled", code: 128 },
    { success: true, stdout: "", stderr: "", code: 0 },
    { success: true, stdout: "", stderr: "", code: 0 },
  ];
  state = fixture();
  state.dependencies.runGit = async (...args) => { state.calls.run.push(args); return results.shift(); };
  equal(await setConfigValueForScope("/repo", "user.name", "Codex", "worktree", state.repository.host, signal, state.dependencies), true);
  deepEqual(state.calls.run.map((call) => call[1]), [
    ["config", "--worktree", "user.name", "Codex"],
    ["config", "extensions.worktreeConfig", "true"],
    ["config", "--worktree", "user.name", "Codex"],
  ]);
}
{
  const results = [
    { success: false, stdout: "", stderr: "fatal: worktreeconfig is disabled", code: 128 },
    { success: false, stdout: "", stderr: "denied", code: 2 },
  ];
  state = fixture();
  state.dependencies.runGit = async (...args) => { state.calls.run.push(args); return results.shift(); };
  equal(await setConfigValueForScope("/repo", "user.name", "Codex", "worktree", null, signal, state.dependencies), false);
  equal(state.calls.run.length, 2);
}

console.log(`${assertions} worker git config scope assertions passed`);
