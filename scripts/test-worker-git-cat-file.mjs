import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const {
  MAX_OBJECT_BYTES,
  parseCatFileBatch,
  readGitCatFile,
  readStreamPrefix,
  splitContentLines,
} = require("../app/.vite/build/worker/git-cat-file.js");

let assertions = 0;
const equal = (...args) => {
  assertions += 1;
  assert.equal(...args);
};
const deepEqual = (...args) => {
  assertions += 1;
  assert.deepEqual(...args);
};
const encoder = new TextEncoder();

function successBatch(oid, content, extra = {}) {
  const payload = encoder.encode(`${oid} blob ${encoder.encode(content).byteLength}\n${content}\n`);
  return { success: true, stdoutBuffer: payload, ...extra };
}

function streamFixture(chunks) {
  const calls = { cancel: 0, release: 0 };
  let index = 0;
  return {
    calls,
    stream: {
      getReader: () => ({
        read: async () => index < chunks.length
          ? { done: false, value: chunks[index++] }
          : { done: true },
        cancel: async () => { calls.cancel += 1; },
        releaseLock: () => { calls.release += 1; },
      }),
    },
  };
}

function fixture(overrides = {}) {
  const calls = { git: [], platform: 0, read: [], stat: [] };
  const host = {
    platformPath: async () => {
      calls.platform += 1;
      return { join: (...parts) => parts.join("/") };
    },
    stat: async (...args) => {
      calls.stat.push(args);
      return { size: 3 };
    },
    readFile: async (...args) => {
      calls.read.push(args);
      return streamFixture([encoder.encode("abc")]).stream;
    },
  };
  const repository = { root: "/repo", host };
  const outputs = [...(overrides.outputs ?? [])];
  const dependencies = {
    runGit: async (...args) => {
      calls.git.push(args);
      return outputs.shift() ?? successBatch("a", "one\ntwo\n");
    },
  };
  return { calls, dependencies, host, repository };
}

deepEqual(splitContentLines(""), []);
deepEqual(splitContentLines("one"), ["one"]);
deepEqual(splitContentLines("one\ntwo\n"), ["one\n", "two\n"]);
deepEqual(splitContentLines("one\r\ntwo"), ["one\r\n", "two"]);
equal(MAX_OBJECT_BYTES, 5_242_880);

let parsed = parseCatFileBatch(2, {
  success: true,
  stdout: "abc missing\ndef blob 3\nhey\n",
}, 3);
deepEqual(parsed, {
  results: [
    { type: "error", error: { type: "not-found" } },
    { type: "success", lines: ["hey"] },
  ],
  retryStartIndex: null,
});
deepEqual(parseCatFileBatch(2, { success: false, code: 128 }, 4).results, [
  { type: "error", error: { type: "not-found" } },
  { type: "error", error: { type: "not-found" } },
]);
deepEqual(parseCatFileBatch(1, {
  success: false,
  code: null,
  outputLimitExceeded: { limitBytes: 9 },
}, 4).results, [{ type: "error", error: { type: "too-large", limitBytes: 4 } }]);
deepEqual(parseCatFileBatch(1, { success: true, stdout: "bad header\n" }, 4).results, [
  { type: "error", error: { type: "unknown" } },
]);

let stream = streamFixture([encoder.encode("abc"), encoder.encode("def")]);
deepEqual(Array.from(await readStreamPrefix(stream.stream, 4)), Array.from(encoder.encode("abcd")));
equal(stream.calls.cancel, 1);
equal(stream.calls.release, 1);
stream = streamFixture([encoder.encode("ab")]);
deepEqual(Array.from(await readStreamPrefix(stream.stream, 4)), Array.from(encoder.encode("ab")));
equal(stream.calls.cancel, 0);
equal(stream.calls.release, 1);

const signal = new AbortController().signal;
let state = fixture();
deepEqual(await readGitCatFile(
  state.repository,
  { requests: [{ oid: "a", path: "a" }] },
  signal,
  state.dependencies,
), [{ type: "success", lines: ["one\n", "two\n"] }]);
deepEqual(state.calls.git[0][0], "/repo");
deepEqual(state.calls.git[0][1], ["cat-file", "--batch"]);
equal(state.calls.git[0][2], state.host);
deepEqual(state.calls.git[0][3].env, { GIT_NO_LAZY_FETCH: "1" });
equal(state.calls.git[0][3].collectStdoutBuffer, true);
equal(state.calls.git[0][3].timeoutMs, 30_000);
equal(state.calls.git[0][3].trim, false);
equal(state.calls.git[0][3].stdin, "a\n");
equal(state.calls.git[0][3].signal, signal);
equal(state.calls.git[0][3].maxOutputBytes, MAX_OBJECT_BYTES + 1 + 64);

state = fixture();
deepEqual(await readGitCatFile(
  state.repository,
  { requests: Array.from({ length: 5 }, () => ({ oid: "a", path: "a" })) },
  signal,
  state.dependencies,
), Array.from({ length: 5 }, () => ({ type: "error", error: { type: "unknown" } })));
equal(state.calls.git.length, 0);

state = fixture();
deepEqual(await readGitCatFile(
  state.repository,
  { requests: [
    { oid: "a", path: "a" },
    { oid: "a", path: "again" },
    { oid: "0000", path: "zero" },
    { oid: null, path: "none" },
  ] },
  signal,
  state.dependencies,
), [
  { type: "success", lines: ["one\n", "two\n"] },
  { type: "success", lines: ["one\n", "two\n"] },
  { type: "error", error: { type: "not-found" } },
  { type: "error", error: { type: "not-found" } },
]);
equal(state.calls.git[0][3].stdin, "a\n");

state = fixture({ outputs: [
  {
    success: true,
    stdoutBuffer: encoder.encode("a blob 3\nabc\n"),
    outputLimitExceeded: { limitBytes: 10 },
  },
  successBatch("b", "z"),
] });
deepEqual(await readGitCatFile(
  state.repository,
  { maxObjectBytes: 2, requests: [{ oid: "a" }, { oid: "b" }] },
  signal,
  state.dependencies,
), [
  { type: "error", error: { type: "too-large", limitBytes: 2 } },
  { type: "success", lines: ["z"] },
]);
equal(state.calls.git.length, 2);
equal(state.calls.git[1][3].stdin, "b\n");

state = fixture({ outputs: [{ success: true, stdout: "0000 missing\n" }] });
deepEqual(await readGitCatFile(
  state.repository,
  { maxObjectBytes: 3, requests: [{ oid: "0000", path: "disk.txt", fallbackToDisk: true }] },
  signal,
  state.dependencies,
), [{ type: "success", lines: ["abc"] }]);
equal(state.calls.git.length, 0);
equal(state.calls.platform, 1);
deepEqual(state.calls.stat[0], ["/repo/disk.txt", { bypassCache: true }]);

state = fixture();
state.host.stat = async () => ({ size: 4 });
deepEqual(await readGitCatFile(
  state.repository,
  { maxObjectBytes: 3, requests: [{ oid: null, path: "large", fallbackToDisk: true }] },
  signal,
  state.dependencies,
), [{ type: "error", error: { type: "too-large", limitBytes: 3 } }]);

state = fixture();
state.host.stat = async () => { throw Object.assign(new Error("missing"), { code: "ENOENT" }); };
deepEqual(await readGitCatFile(
  state.repository,
  { requests: [{ oid: null, path: "missing", fallbackToDisk: true }] },
  signal,
  state.dependencies,
), [{ type: "error", error: { type: "not-found" } }]);

let snapshotReads = 0;
const snapshot = {
  git: async () => successBatch("a", "snap"),
  read: async (read) => { snapshotReads += 1; return read(); },
};
state = fixture();
deepEqual(await readGitCatFile(
  state.repository,
  { requests: [{ oid: "a" }], reviewSnapshot: snapshot },
  signal,
  state.dependencies,
), [{ type: "success", lines: ["snap"] }]);
equal(state.calls.git.length, 0);
equal(snapshotReads, 0);

state = fixture();
state.dependencies.runGit = async () => { throw new Error("aborted"); };
deepEqual(await readGitCatFile(
  state.repository,
  { requests: [{ oid: "a" }] },
  signal,
  state.dependencies,
), [{ type: "error", error: { type: "unknown" } }]);

console.log(`${assertions} worker git cat-file assertions passed`);
