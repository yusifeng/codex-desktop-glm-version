import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const result = await esbuild.build({
  entryPoints: [
    path.join(ROOT, "src/renderer/app-shared/runtime/query-options.ts"),
  ],
  bundle: true,
  format: "esm",
  platform: "node",
  target: "node22",
  write: false,
  logLevel: "silent",
});

const helpers = await import(
  `data:text/javascript;base64,${Buffer.from(result.outputFiles[0].text).toString("base64")}`
);

let assertions = 0;
function same(actual, expected, message) {
  assert.equal(actual, expected, message);
  assertions += 1;
}

const query = {
  queryKey: ["profile", 7],
  queryFn: async () => ({ id: 7 }),
  staleTime: 30_000,
};
same(helpers.queryOptions(query), query, "preserves query option identity");

const infiniteQuery = {
  queryKey: ["threads"],
  initialPageParam: null,
  getNextPageParam: () => "next",
};
same(
  helpers.infiniteQueryOptions(infiniteQuery),
  infiniteQuery,
  "preserves infinite-query option identity",
);

const mutation = {
  mutationKey: ["delete-profile"],
  mutationFn: async (id) => id,
};
same(helpers.mutationOptions(mutation), mutation, "preserves mutation option identity");
same(helpers.initializeQueryOptions(), undefined, "initializes query options");
same(
  helpers.initializeInfiniteQueryOptions(),
  undefined,
  "initializes infinite-query options",
);
same(helpers.initializeMutationOptions(), undefined, "initializes mutation options");

console.log(
  `app-shared query option behavior: ${assertions}/${assertions} assertions passed`,
);
