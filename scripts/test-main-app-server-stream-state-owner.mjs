import assert from "node:assert/strict";
import fs from "node:fs";
import * as acorn from "acorn";
import { transform } from "esbuild";

const source = fs.readFileSync(
  new URL("../src/main/main-app/threads/stream-roles.ts", import.meta.url),
  "utf8",
);
const transpiled = await transform(source, {
  loader: "ts",
  format: "esm",
  target: "es2022",
});
const ast = acorn.parse(transpiled.code, {
  ecmaVersion: "latest",
  sourceType: "module",
});
const classNode = ast.body.find(
  (node) => node.type === "ClassDeclaration" && node.id?.name === "AppServerManagerStreamState",
);
assert.ok(classNode, "app-server stream state class should survive TypeScript transformation");
const classSource = transpiled.code.slice(classNode.start, classNode.end);
const AppServerManagerStreamState = Function(
  `${classSource}; return AppServerManagerStreamState;`,
)();

let assertions = 1;
const equal = (actual, expected) => {
  assert.deepEqual(actual, expected);
  assertions += 1;
};

const cleanup = [];
let transportHandlers;
const streamState = new AppServerManagerStreamState({
  hostId: "local",
  transport: {
    register(handlers) {
      transportHandlers = handlers;
      return () => cleanup.push("transport");
    },
  },
  events: {
    addConversationPatchesListener() {
      return () => cleanup.push("patches");
    },
  },
});
equal(streamState.collectSnapshotFields(), {
  manager_stream_threads_with_followers: 0,
  manager_stream_follower_subscriptions: 0,
  manager_stream_snapshot_publications_total: 0,
  manager_stream_snapshot_recipients_total: 0,
  manager_stream_patch_publications_total: 0,
  manager_stream_patch_recipients_total: 0,
});
equal(streamState.getStreamRole("thread-a"), null);
equal(streamState.getConversationRevision("thread-a"), null);
equal(streamState.hasFollowersOrPendingFollowerReconnect("thread-a"), false);
streamState.attach();
equal(typeof transportHandlers.onStreamStateChanged, "function");
assert.throws(() => streamState.attach(), /already attached/);
assertions += 1;
streamState.dispose();
equal(cleanup, ["transport", "patches"]);

equal(classNode.body.body.length, 53);
const memberNames = classNode.body.body
  .map((member) => member.key?.name ?? member.key?.value)
  .filter(Boolean);
equal(memberNames.includes("waitForConversationRevision"), true);
equal(memberNames.includes("handleIpcConnectionReset"), true);

const main = fs.readFileSync(
  new URL("../.reference/originals/main/main-C-Mhak1n.ts", import.meta.url),
  "utf8",
);
equal(main.includes('require("./main-app/threads/stream-roles.js")'), true);
equal(main.includes("Yge = class"), false);
const manager = fs.readFileSync(
  new URL("../src/main/main-app/conversation/app-server-manager.ts", import.meta.url),
  "utf8",
);
equal(manager.includes('import { AppServerManagerStreamState } from "../threads/stream-roles"'), true);
equal(manager.includes("this.streamState = new AppServerManagerStreamState({"), true);

console.log(`${assertions} main app-server stream state owner assertions passed`);
