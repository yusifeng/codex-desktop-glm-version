import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { parseThreadConfig, readThreadConfig, setWorktreeOwnerThread, writeThreadConfig } = require("../app/.vite/build/worker/git-thread-config.js");

const files = new Map();
const warnings = [];
const repository = {
  host: {
    readFile: async (path) => {
      if (!files.has(path)) throw Object.assign(new Error("missing"), { code: "ENOENT" });
      return files.get(path);
    },
    writeFile: async (path, value) => files.set(path, value),
  },
};
let configPath = "/repo/codex-thread.json";
const deps = {
  configFileName: "codex-thread.json",
  findConfigFile: async (_repo, name) => name === "codex-thread.json" ? configPath : null,
  parseSchema: (value) => value?.version === 1 && typeof value.ownerThreadId === "string"
    ? { success: true, data: value }
    : { success: false, error: { message: "invalid" } },
  isMissingError: (error) => error?.code === "ENOENT",
  warn: (...args) => warnings.push(args),
};

assert.deepEqual(parseThreadConfig('{"version":1,"ownerThreadId":"thread"}', deps), { version: 1, ownerThreadId: "thread" });
assert.equal(parseThreadConfig('{"version":2}', deps), null);
assert.deepEqual(warnings.at(-1), ["Invalid thread config}", "invalid"]);
assert.equal(parseThreadConfig('{', deps), null);
assert.equal(warnings.at(-1)[0], "Failed to parse thread config");

files.set(configPath, '{"version":1,"ownerThreadId":"owner"}');
assert.deepEqual(await readThreadConfig(repository, undefined, deps), { version: 1, ownerThreadId: "owner" });
files.clear();
const warningCount = warnings.length;
assert.equal(await readThreadConfig(repository, undefined, deps), null);
assert.equal(warnings.length, warningCount);

await writeThreadConfig(repository, { version: 1, ownerThreadId: "written" }, undefined, deps);
assert.equal(files.get(configPath), '{\n  "version": 1,\n  "ownerThreadId": "written"\n}\n');
await setWorktreeOwnerThread(repository, "updated", undefined, deps);
assert.equal(files.get(configPath).includes('"ownerThreadId": "updated"'), true);

configPath = null;
await assert.rejects(writeThreadConfig(repository, {}, undefined, deps), /No git repository found/);

console.log("11 worker git thread config assertions passed");
