import assert from "node:assert/strict";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const bundle = await esbuild.build({
  bundle: true,
  entryPoints: [path.join(root, "src/main/worker/git-stable-metadata-resolver.ts")],
  format: "esm",
  logLevel: "silent",
  platform: "node",
  target: "node22",
  write: false,
});
const { GitStableMetadataResolver } = await import(
  `data:text/javascript;base64,${Buffer.from(bundle.outputFiles[0].text).toString("base64")}`
);

const deferred = () => {
  let resolve;
  let reject;
  const promise = new Promise((resolvePromise, rejectPromise) => {
    resolve = resolvePromise;
    reject = rejectPromise;
  });
  return { promise, reject, resolve };
};
let assertions = 0;
const equal = (actual, expected) => {
  assert.equal(actual, expected);
  assertions += 1;
};
const deepEqual = (actual, expected) => {
  assert.deepEqual(actual, expected);
  assertions += 1;
};

const resolutionError = new Error("combined resolution unsupported");
resolutionError.resolution = true;
let activeTrace = { id: "trace-1" };
const calls = [];
const primaryResults = [];
const rootResults = [];
const commonDirResults = [];
const resolver = new GitStableMetadataResolver({
  cacheRoot: (...args) => calls.push(["cache", ...args]),
  getActiveTrace: () => activeTrace,
  getKey: (cwd, host) => `${host.id}:${cwd}`,
  isResolutionError: (error) => error?.resolution === true,
  resolveCommonDir: async (...args) => {
    calls.push(["common", ...args]);
    const result = commonDirResults.shift();
    if (result instanceof Error) throw result;
    return result;
  },
  resolveRoot: async (...args) => {
    calls.push(["root", ...args]);
    const result = rootResults.shift();
    if (result instanceof Error) throw result;
    return result;
  },
  resolveRootAndCommonDir: async (...args) => {
    calls.push(["primary", ...args]);
    const result = primaryResults.shift();
    if (result instanceof Error) throw result;
    if (result?.promise) return result.promise;
    return result;
  },
  trace: async (span, operation) => {
    calls.push(["trace", span.name, span.attributes["git.host_kind"]]);
    return operation();
  },
});

const local = { id: "local", isLocal: true };
const remote = { id: "remote", isLocal: false };
primaryResults.push({ root: "/repo", commonDir: "/repo/.git" });
deepEqual(await resolver.resolve("/repo/file", local, 7), {
  root: "/repo",
  commonDir: "/repo/.git",
});
deepEqual(calls.at(-1), ["cache", "/repo/file", local, "/repo", 7]);
equal(resolver.getPendingTrace("/repo/file", local), null);
equal(resolver.pendingTraceCount, 0);

calls.length = 0;
primaryResults.push(resolutionError);
rootResults.push("/fallback");
commonDirResults.push("/fallback/.git");
deepEqual(await resolver.resolve("/fallback/file", remote, 8), {
  root: "/fallback",
  commonDir: "/fallback/.git",
});
deepEqual(calls.filter(([kind]) => kind === "trace").map((entry) => entry.slice(1)), [
  ["git.metadata_root", "remote"],
  ["git.metadata_root", "remote"],
  ["git.metadata_common_dir", "remote"],
]);
equal(calls.some(([kind]) => kind === "cache"), false);

primaryResults.push(resolutionError);
rootResults.push(null);
equal(await resolver.resolve("/missing", local, 9), null);
primaryResults.push(resolutionError);
rootResults.push("/no-common");
commonDirResults.push(null);
equal(await resolver.resolve("/no-common", local, 10), null);

const unexpected = new Error("unexpected");
primaryResults.push(unexpected);
await assert.rejects(resolver.resolve("/error", local, 11), (error) => error === unexpected);
assertions += 1;
equal(resolver.getPendingTrace("/error", local), null);

const first = deferred();
const second = deferred();
activeTrace = { id: "first" };
primaryResults.push({ promise: first.promise });
const firstResolve = resolver.resolve("/overlap", local, 12);
equal(resolver.getPendingTrace("/overlap", local), activeTrace);
activeTrace = { id: "second" };
primaryResults.push({ promise: second.promise });
const secondResolve = resolver.resolve("/overlap", local, 13);
equal(resolver.getPendingTrace("/overlap", local), activeTrace);
first.resolve({ root: "/first", commonDir: "/first/.git" });
await firstResolve;
deepEqual(resolver.getPendingTrace("/overlap", local), { id: "second" });
second.resolve({ root: "/second", commonDir: "/second/.git" });
await secondResolve;
equal(resolver.getPendingTrace("/overlap", local), null);

activeTrace = { id: "clear" };
const pending = deferred();
primaryResults.push({ promise: pending.promise });
const pendingResolve = resolver.resolve("/clear", local, 14);
equal(resolver.pendingTraceCount, 1);
resolver.clearPendingTraces();
equal(resolver.pendingTraceCount, 0);
pending.resolve(null);
equal(await pendingResolve, null);

activeTrace = null;
primaryResults.push(null);
equal(await resolver.resolve("/no-trace", local, 15), null);
equal(resolver.pendingTraceCount, 0);

console.log(`${assertions} worker stable metadata resolver lifecycle assertions passed`);
