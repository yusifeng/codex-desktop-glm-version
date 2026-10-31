import assert from "node:assert/strict";
import fs from "node:fs";
import * as acorn from "acorn";
import { transform } from "esbuild";

let assertions = 0;
const equal = (actual, expected) => { assert.deepEqual(actual, expected); assertions += 1; };
const source = fs.readFileSync(new URL("../src/main/main-app/util/cross-instance-lock.ts", import.meta.url), "utf8");
const transpiled = await transform(source, { loader: "ts", format: "esm", target: "es2022" });
const ast = acorn.parse(transpiled.code, { ecmaVersion: "latest", sourceType: "module" });
const node = ast.body.find((entry) => entry.type === "FunctionDeclaration" && entry.id?.name === "tryAcquire");
assert.ok(node); assertions += 1;
const functionSource = transpiled.code.slice(node.start, node.end);

function buildTryAcquire({ owners, stale, events }) {
  return Function(
    "ownsLock", "readLockOwner", "isLockStale", "mkdirSync", "isDirectoryExistsError",
    "rmSync", "createLockDirectory", "CLAIM_SUFFIX",
    `${functionSource}; return tryAcquire;`,
  )(
    () => false,
    () => owners.shift() ?? null,
    () => stale,
    (path) => events.push(["mkdir", path]),
    () => false,
    (path) => events.push(["rm", path]),
    (path, owner) => { events.push(["create", path, owner.token]); return true; },
    ".claim",
  );
}

const owner = { pid: 1, priority: 5, token: "ours" };
let events = [];
let tryAcquire = buildTryAcquire({
  owners: [{ pid: 2, priority: 1, token: "old" }, { pid: 3, priority: 1, token: "changed" }],
  stale: true,
  events,
});
equal(tryAcquire("/lock", owner, false), false);
equal(events, [["mkdir", "/lock.claim"], ["rm", "/lock.claim"]]);

events = [];
tryAcquire = buildTryAcquire({
  owners: [{ pid: 2, priority: 10, token: "same" }, { pid: 2, priority: 10, token: "same" }],
  stale: false,
  events,
});
equal(tryAcquire("/lock", owner, true), true);
equal(events, [
  ["mkdir", "/lock.claim"],
  ["rm", "/lock"],
  ["create", "/lock", "ours"],
  ["rm", "/lock.claim"],
]);

events = [];
tryAcquire = buildTryAcquire({
  owners: [{ pid: 2, priority: 10, token: "active" }],
  stale: false,
  events,
});
equal(tryAcquire("/lock", owner, false), false);
equal(events, []);

equal(source.includes("currentOwner?.token !== ownerAfterClaim?.token"), true);
equal(source.includes("owner.priority <= (ownerAfterClaim?.priority ?? 0)"), true);
const main = fs.readFileSync(new URL("../.reference/originals/main/main-C-Mhak1n.ts", import.meta.url), "utf8");
equal(main.includes('const { acquireCrossInstanceLock: jN, CROSS_INSTANCE_LOCKS: AN } = require("./main-app/util/cross-instance-lock.js");'), true);
equal(main.includes("function jN("), false);
equal(main.includes("function hje("), false);
equal(main.includes("function MN("), false);
equal(main.includes("function FN("), false);
equal((main.match(/acquireCrossInstanceLock: jN/g) ?? []).length, 3);
equal((main.match(/crossInstanceLocks: AN/g) ?? []).length, 2);
console.log(`${assertions} main cross-instance lock owner assertions passed`);
