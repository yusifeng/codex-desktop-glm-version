import assert from "node:assert/strict";
import fs from "node:fs/promises";
import * as esbuild from "esbuild";

const moduleSource = await fs.readFile("src/main/worker/platform-env.ts", "utf8");
const { code } = await esbuild.transform(moduleSource, { loader: "ts", format: "cjs" });
const module = { exports: {} };
new Function("module", "exports", code)(module, module.exports);
const { CHILD_PROCESS_ENV_BLOCKLIST, sanitizeChildProcessEnv } = module.exports;

assert.equal(CHILD_PROCESS_ENV_BLOCKLIST.size, 5);

const inputEnv = {
  PATH: "/bin",
  HOME: "/tmp/home",
  BREAKPAD_DUMP_LOCATION: "/tmp/dump",
  chrome_crashpad_pipe_name: "pipe",
  CrAsHpAd_Handler_Pid: "123",
  ELECTRON_CRASH_REPORTER_PROCESS_TYPE: "renderer",
  __cfbundleidentifier: "com.example.app",
};
const result = sanitizeChildProcessEnv(inputEnv);
assert.deepEqual(result, { PATH: "/bin", HOME: "/tmp/home" });
assert.deepEqual(inputEnv, {
  PATH: "/bin",
  HOME: "/tmp/home",
  BREAKPAD_DUMP_LOCATION: "/tmp/dump",
  chrome_crashpad_pipe_name: "pipe",
  CrAsHpAd_Handler_Pid: "123",
  ELECTRON_CRASH_REPORTER_PROCESS_TYPE: "renderer",
  __cfbundleidentifier: "com.example.app",
});

assert.deepEqual(sanitizeChildProcessEnv({}), {});
assert.deepEqual(sanitizeChildProcessEnv({ path: "/bin", unknown: undefined }), {
  path: "/bin",
  unknown: undefined,
});
assert.notStrictEqual(result, inputEnv);

console.log("worker platform env tests passed (6 assertions)");
