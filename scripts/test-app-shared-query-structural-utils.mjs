import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const result = await esbuild.build({
  entryPoints: [
    path.join(
      ROOT,
      "src/renderer/app-shared/runtime/query-structural-utils.ts",
    ),
  ],
  bundle: true,
  format: "esm",
  platform: "node",
  target: "node22",
  write: false,
  logLevel: "silent",
});
const queryUtils = await import(
  `data:text/javascript;base64,${Buffer.from(result.outputFiles[0].text).toString("base64")}`
);

let assertions = 0;
function equal(actual, expected, message) {
  assert.equal(actual, expected, message);
  assertions += 1;
}
function deepEqual(actual, expected, message) {
  assert.deepEqual(actual, expected, message);
  assertions += 1;
}

const { hashQueryKey, replaceEqualDeep } = queryUtils;
equal(hashQueryKey(["todos"]), '["todos"]', "hashes a simple query key");
equal(
  hashQueryKey(["todos", { status: "open", page: 2 }]),
  '["todos",{"page":2,"status":"open"}]',
  "sorts object keys",
);
equal(
  hashQueryKey(["nested", { z: { b: 2, a: 1 }, a: [3, 2, 1] }]),
  '["nested",{"a":[3,2,1],"z":{"a":1,"b":2}}]',
  "sorts nested objects without reordering arrays",
);
equal(
  hashQueryKey(["nullable", undefined, null]),
  '["nullable",null,null]',
  "preserves JSON array semantics",
);
assert.throws(() => hashQueryKey([1n]), /BigInt/);
assertions += 1;

const stablePrevious = {
  profile: { id: "user-1", name: "Ada" },
  tags: ["a", "b"],
};
const stableNext = {
  profile: { id: "user-1", name: "Ada" },
  tags: ["a", "b"],
};
const stableResult = replaceEqualDeep(stablePrevious, stableNext);
equal(stableResult, stablePrevious, "reuses a deeply equal root");
equal(
  stableResult.profile,
  stablePrevious.profile,
  "reuses equal object branches",
);
equal(stableResult.tags, stablePrevious.tags, "reuses equal array branches");

const changedNext = {
  profile: { id: "user-1", name: "Grace" },
  tags: ["a", "b"],
};
const changedResult = replaceEqualDeep(stablePrevious, changedNext);
assertions += 1;
assert.notEqual(
  changedResult,
  stablePrevious,
  "creates a root for changed data",
);
equal(
  changedResult.tags,
  stablePrevious.tags,
  "retains unchanged sibling branches",
);
equal(changedResult.profile.name, "Grace", "uses changed leaf values");
deepEqual(
  replaceEqualDeep({ keep: 1, remove: 2 }, { keep: 1 }),
  { keep: 1 },
  "removes keys absent from the next value",
);

const sparse = [];
sparse.length = 2;
const sparseNext = [];
sparseNext.length = 2;
equal(
  replaceEqualDeep(sparse, sparseNext),
  sparseNext,
  "does not structurally share sparse arrays",
);
equal(replaceEqualDeep(1, 2), 2, "returns changed primitive values");
equal(replaceEqualDeep(null, null), null, "reuses equal null values");

console.log(
  `${assertions} app-shared query structural utility assertions passed`,
);
