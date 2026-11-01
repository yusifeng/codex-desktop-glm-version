import assert from "node:assert/strict";
import fs from "node:fs";
import { transform } from "esbuild";

let assertions = 0;
const equal = (actual, expected) => {
  assert.deepEqual(actual, expected);
  assertions += 1;
};

const source = fs.readFileSync(
  new URL("../src/main/main-app/window/thread-storage-keys.ts", import.meta.url),
  "utf8",
);
const transpiled = await transform(source, { loader: "ts", format: "cjs", target: "es2022" });
const loaded = { exports: {} };
Function("module", "exports", transpiled.code)(loaded, loaded.exports);
const { threadClientIdStorageKey, localThreadClientIdStorageKey, threadTabRoutesStorageKey } = loaded.exports;

equal(threadClientIdStorageKey("client-id"), "thread-client-id-v1:client-id");
equal(threadClientIdStorageKey("client/a b"), "thread-client-id-v1:client%2Fa%20b");
equal(localThreadClientIdStorageKey("thread/a b"), "thread-client-id-v1:local%3Athread%2Fa%20b");
equal(threadTabRoutesStorageKey("thread/a b"), "thread-tab-routes-v1:thread%2Fa%20b");

const main = fs.readFileSync(new URL("../.reference/originals/main/main-C-Mhak1n.ts", import.meta.url), "utf8");
equal(main.includes('require("./main-app/window/thread-storage-keys.js")'), true);
equal(main.includes("Vt: localThreadClientIdStorageKey"), true);
equal(main.includes("tee: threadTabRoutesStorageKey"), true);
equal(main.includes("function Bt("), false);
equal(main.includes("function Vt("), false);
equal(main.includes("function tee("), false);
equal(main.includes("function Lt("), false);
equal(main.includes("function Rt("), false);
equal(main.includes("function ree("), false);

console.log(`${assertions} thread storage key assertions passed`);
