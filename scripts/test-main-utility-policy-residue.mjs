import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { transform } from "esbuild";

let assertions = 0;
const equal = (actual, expected) => {
  assert.deepEqual(actual, expected);
  assertions += 1;
};

async function load(relativePath) {
  const source = fs.readFileSync(new URL(relativePath, import.meta.url), "utf8");
  const transpiled = await transform(source, { loader: "ts", format: "cjs", target: "es2022" });
  const loaded = { exports: {} };
  Function("module", "exports", transpiled.code)(loaded, loaded.exports);
  return loaded.exports;
}

const { moveThreadBefore } = await load("../src/main/main-app/sidebar/thread-order.ts");
equal(moveThreadBefore({ threadIds: ["a", "b", "c"], threadId: "b", beforeThreadId: "a" }), ["b", "a", "c"]);
equal(moveThreadBefore({ threadIds: ["a", "b", "c"], threadId: "b", beforeThreadId: "c" }), ["a", "b", "c"]);
equal(moveThreadBefore({ threadIds: ["a", "b", "c"], threadId: "b", beforeThreadId: null }), ["a", "c", "b"]);
equal(moveThreadBefore({ threadIds: ["a", "b", "b", "c"], threadId: "b", beforeThreadId: "missing" }), ["a", "c", "b"]);
equal(moveThreadBefore({ threadIds: ["a", "b", "c"], threadId: "b", beforeThreadId: "b" }), ["a", "c", "b"]);

const { homeDirectoryFromCodexHome } = await load("../src/main/main-app/misc/codex-home.ts");
equal(homeDirectoryFromCodexHome({ codexHome: "/Users/test/.codex", path: path.posix }), "/Users/test");
equal(homeDirectoryFromCodexHome({ codexHome: "/Users/test/.codex///", path: path.posix }), "/Users/test");
equal(homeDirectoryFromCodexHome({ codexHome: "/custom/codex", path: path.posix }), "/custom/codex");
equal(homeDirectoryFromCodexHome({ codexHome: "C:\\Users\\test\\.codex\\", path: path.win32 }), "C:\\Users\\test");
equal(homeDirectoryFromCodexHome({ codexHome: "C:\\custom\\codex\\", path: path.win32 }), "C:\\custom\\codex");

const main = fs.readFileSync(new URL("../.reference/originals/main/main-C-Mhak1n.ts", import.meta.url), "utf8");
equal(main.includes('require("./main-app/sidebar/thread-order.js")'), true);
equal(main.includes("reorderPinnedThreadIds: moveThreadBefore"), true);
equal(main.includes('require("./main-app/misc/codex-home.js")'), true);
equal(main.includes("bt: homeDirectoryFromCodexHome"), true);
equal(main.includes("function _t("), false);
equal(main.includes("function bt("), false);
equal(main.includes("function ht("), false);
equal(main.includes("function gt("), false);

console.log(`${assertions} utility policy residue assertions passed`);
