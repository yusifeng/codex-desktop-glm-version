import assert from "node:assert/strict";
import fs from "node:fs";
import { transform } from "esbuild";

let assertions = 0;
const equal = (actual, expected) => {
  assert.deepEqual(actual, expected);
  assertions += 1;
};
const throws = (callback, expected) => {
  assert.throws(callback, expected);
  assertions += 1;
};

async function load(relativePath) {
  const source = fs.readFileSync(new URL(relativePath, import.meta.url), "utf8");
  const transpiled = await transform(source, { loader: "ts", format: "cjs", target: "es2022" });
  const module = { exports: {} };
  Function("module", "exports", transpiled.code)(module, module.exports);
  return module.exports;
}

const { AppServerConnectionRegistry } = await load("../src/main/main-app/app-server/connection-registry.ts");
const registry = new AppServerConnectionRegistry();
const connectionA = { id: "a" };
const connectionB = { id: "b" };
const changes = [];
const unsubscribe = registry.subscribe((change) => changes.push(change));
registry.addConnection("local", connectionA);
registry.addConnection("local", connectionA);
registry.addConnection("local", connectionB);
equal(changes, [
  { type: "added", hostId: "local", connection: connectionA },
  { type: "removed", hostId: "local", connection: connectionA },
  { type: "added", hostId: "local", connection: connectionB },
]);
equal(registry.getConnection("local"), connectionB);
equal(registry.getMaybeConnection("missing"), null);
equal(registry.getAllHostIds(), ["local"]);
const replayed = [];
const stopReplay = registry.subscribe((change) => replayed.push(change));
equal(replayed, [{ type: "added", hostId: "local", connection: connectionB }]);
stopReplay();
registry.removeConnection("local");
equal(registry.getAllHostIds(), []);
throws(() => registry.getConnection("local"), /Connection for host ID local not found/);
unsubscribe();

const { QueuedMessageLocks } = await load("../src/main/main-app/conversation/queued-message-locks.ts");
let now = 1_000;
const locks = new QueuedMessageLocks(() => now);
equal(locks.tryAcquireStartTurn("thread"), true);
equal(locks.tryAcquireStartTurn("thread"), false);
locks.releaseStartTurn("thread");
equal(locks.tryAcquireStartTurn("thread"), true);
const first = { conversationId: "thread", messageId: "message", lockId: "lock-1" };
equal(locks.tryAcquire(first), true);
equal(locks.tryAcquire({ ...first, lockId: "lock-2" }), false);
locks.release({ ...first, lockId: "wrong", sent: false });
equal(locks.tryAcquire({ ...first, lockId: "lock-2" }), false);
now += 120_000;
equal(locks.tryAcquire({ ...first, lockId: "lock-2" }), true);
locks.release({ ...first, lockId: "lock-2", sent: true });
equal(locks.tryAcquire({ ...first, lockId: "lock-3" }), false);
now += 600_000;
equal(locks.tryAcquire({ ...first, lockId: "lock-3" }), true);

const { SharedObjectRepository } = await load("../src/main/main-app/window/shared-object-repository.ts");
const shared = new SharedObjectRepository();
const publications = [];
const removeSubscriber = shared.addSubscriber((key, value) => publications.push([key, value]));
shared.set("one", { value: 1 });
equal(shared.get("one"), { value: 1 });
const snapshot = shared.getSnapshot();
snapshot.two = 2;
equal(shared.get("two"), undefined);
shared.set("one", undefined);
equal(shared.get("one"), undefined);
equal(publications, [["one", { value: 1 }], ["one", undefined]]);
removeSubscriber();
shared.set("two", 2);
equal(publications.length, 2);

const sqlite = await load("../src/main/main-app/app-server/sqlite-recovery-warning.ts");
equal(sqlite.parseSqliteRecoveryText("unrelated"), null);
equal(sqlite.parseSqliteRecoveryText(`
  Codex rebuilt its local database.
  Database path: /data/state.sqlite
  Backup folder: /data/backup
`), { databasePath: "/data/state.sqlite", backupFolder: "/data/backup" });
equal(sqlite.parseSqliteRecoveryText("Codex rebuilt its local database.\nDatabase path: /data\nBackup folder: unavailable"), null);
equal(sqlite.parseSqliteRecoveryNotification({ method: "other" }), null);
equal(sqlite.parseSqliteRecoveryNotification({
  method: "configWarning",
  params: {
    summary: "Codex rebuilt its local database.",
    details: "Database path: C:\\state.db\r\nBackup folder: C:\\backup",
  },
}), { databasePath: "C:\\state.db", backupFolder: "C:\\backup" });

const main = fs.readFileSync(new URL("../.reference/originals/main/main-C-Mhak1n.ts", import.meta.url), "utf8");
for (const wiring of [
  'require("./main-app/app-server/connection-registry.js")',
  'require("./main-app/conversation/queued-message-locks.js")',
  'require("./main-app/window/shared-object-repository.js")',
  'require("./main-app/app-server/sqlite-recovery-warning.js")',
  "QueuedMessageLocks,",
  "SharedObjectRepository,",
  "AppServerConnectionRegistry,",
  "parseSqliteRecoveryNotification,",
]) equal(main.includes(wiring), true);
equal(main.includes("var cee = class"), false);
equal(main.includes("Vee = class"), false);
equal(main.includes("Hee = class"), false);
equal(/^function Gee\(/m.test(main), false);
equal(/^function Kee\(/m.test(main), false);
equal(/^function qee\(/m.test(main), false);

console.log(`${assertions} runtime registry assertions passed`);
