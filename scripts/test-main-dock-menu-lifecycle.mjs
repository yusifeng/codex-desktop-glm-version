import assert from "node:assert/strict";
import fs from "node:fs";
import { transform } from "esbuild";

let assertions = 0;
const equal = (actual, expected, message) => {
  assert.deepEqual(actual, expected, message);
  assertions += 1;
};

const source = fs.readFileSync(
  new URL("../src/main/main-app/startup/dock-menu-lifecycle.ts", import.meta.url),
  "utf8",
);
const output = await transform(source, { loader: "ts", format: "cjs", target: "es2022" });
const loaded = { exports: {} };
Function("module", "exports", output.code)(loaded, loaded.exports);
const { createDockMenuLifecycle } = loaded.exports;

{
  let creates = 0;
  const disabled = createDockMenuLifecycle({
    enabled: false,
    createController: () => { creates += 1; return {}; },
  });
  const completed = [{ id: "thread-before-start" }];
  disabled.setCompletedThreads(completed);
  equal(disabled.start(), null);
  equal(disabled.getController(), null);
  disabled.refreshMenu();
  equal(creates, 0);
}

{
  const calls = [];
  let creates = 0;
  const controller = {
    setCompletedThreads: (threads) => calls.push(["threads", threads]),
    refreshMenu: () => calls.push(["refresh"]),
  };
  const lifecycle = createDockMenuLifecycle({
    enabled: true,
    createController: () => { creates += 1; return controller; },
  });
  const beforeStart = [{ id: "thread-1" }];
  lifecycle.setCompletedThreads(beforeStart);
  equal(calls, []);
  equal(lifecycle.getController(), null);
  equal(lifecycle.start(), controller);
  equal(creates, 1);
  equal(calls, [["threads", beforeStart]]);
  equal(lifecycle.getController(), controller);
  const afterStart = [{ id: "thread-2" }];
  lifecycle.setCompletedThreads(afterStart);
  equal(calls.at(-1), ["threads", afterStart]);
  lifecycle.refreshMenu();
  equal(calls.at(-1), ["refresh"]);
  equal(lifecycle.start(), controller);
  equal(creates, 1);
  equal(calls.filter(([type]) => type === "threads").length, 2);
}

console.log(`${assertions} dock-menu lifecycle assertions passed`);
