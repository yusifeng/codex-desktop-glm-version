import assert from "node:assert/strict";
import fs from "node:fs";
import { build } from "esbuild";

const storePath = new URL(
  "../src/main/main-app/thread-catalog/store.ts",
  import.meta.url,
).pathname;
const bundle = await build({
  entryPoints: [storePath],
  bundle: true,
  format: "esm",
  platform: "node",
  write: false,
  plugins: [
    {
      name: "thread-catalog-schema-double",
      setup(build) {
        build.onResolve({ filter: /^\.\/schema$/ }, () => ({
          path: "thread-catalog-schema-double",
          namespace: "test-double",
        }));
        build.onLoad({ filter: /.*/, namespace: "test-double" }, () => ({
          loader: "js",
          contents: `
              const schema = { safeParse: (value) => ({ success: true, data: value }) };
              export const CATALOG_UPSERT_SQL = "TEST UPSERT";
              export const catalogRowSchema = schema;
              export const DEFAULT_SYNC_PROGRESS = {
                sourceUpdatedAtWatermark: null,
                lastFullReconciliationAt: null,
                isComplete: false,
                catalogRevision: 0,
              };
              export const displayTitleForThread = (entry) => entry.displayTitle;
              export const LOCAL_HOST_ID = "local";
              export const scanCheckpointSchema = schema;
              export const syncStateRowSchema = schema;
            `,
        }));
      },
    },
  ],
});
const bundledSource = bundle.outputFiles[0].text;
const { LocalThreadCatalogStore, rowToCatalogEntry } = await import(
  `data:text/javascript;base64,${Buffer.from(bundledSource).toString("base64")}`
);

let assertions = 0;
const equal = (actual, expected) => {
  assert.deepEqual(actual, expected);
  assertions += 1;
};
const throws = (callback, pattern) => {
  assert.throws(callback, pattern);
  assertions += 1;
};

const calls = [];
const db = {
  prepare(sql) {
    const normalized = sql.replace(/\s+/g, " ").trim();
    return {
      run(...params) {
        calls.push(["run", normalized, params]);
        return { changes: 1 };
      },
      all(...params) {
        calls.push(["all", normalized, params]);
        if (normalized.includes("FROM local_thread_catalog_hosts")) {
          return [{ host_id: "host-a" }, { host_id: "host-b" }];
        }
        if (
          normalized.includes("source_recency_at") &&
          normalized.includes("LIMIT 100")
        ) {
          return [
            { host_id: "host-b", source_recency_at: 4, source_created_at: 3 },
            { host_id: "host-a", source_recency_at: 4, source_created_at: 3 },
          ];
        }
        return [];
      },
      get(...params) {
        calls.push(["get", normalized, params]);
        if (normalized.includes("watermark_updated_at")) {
          return {
            watermark_updated_at: 7,
            last_full_reconciled_at: 8,
            initial_build_complete: 1,
          };
        }
        if (normalized.includes("SELECT catalog_revision"))
          return { catalog_revision: 11 };
        if (normalized.includes("AS count")) return { count: 5 };
        if (normalized.includes("RETURNING observation_sequence")) {
          return { observation_sequence: 12 };
        }
        return undefined;
      },
    };
  },
};

const store = new LocalThreadCatalogStore(db, "host-a", "ssh");
equal(
  calls
    .slice(0, 2)
    .map(([kind, sql, params]) => [kind, sql.includes("INSERT"), params]),
  [
    ["run", true, ["host-a"]],
    ["run", true, ["host-a", "ssh"]],
  ],
);
equal(store.listHostIds("ssh"), ["host-a", "host-b"]);
equal(store.readThreadHostId("thread-1"), "host-a");
equal(store.readSyncState(), {
  sourceUpdatedAtWatermark: 7,
  lastFullReconciliationAt: 8,
  isComplete: true,
  catalogRevision: 11,
});
equal(store.readThreadCount("host-a"), 5);
equal(store.nextObservationSequence(), 12);
equal(
  store.runInTransaction(() => "committed"),
  "committed",
);
equal(calls.at(-1)[1], "COMMIT");
throws(
  () =>
    store.runInTransaction(() => {
      throw new Error("rollback me");
    }),
  /rollback me/,
);
equal(calls.at(-1)[1], "ROLLBACK");
throws(
  () => new LocalThreadCatalogStore(db, "", "local"),
  /host ID must not be empty/,
);

equal(
  rowToCatalogEntry({
    host_id: "host-a",
    thread_id: "thread-1",
    display_title: "  Title  ",
    source_created_at: 1,
    source_updated_at: 2,
    source_recency_at: 3,
    cwd: "/repo",
    source_kind: "cli",
    source_detail: null,
    thread_source: null,
    model_provider: null,
    git_branch: null,
    project_id: null,
    conversation_origin: null,
  }),
  {
    hostId: "host-a",
    threadId: "thread-1",
    displayTitle: "Title",
    sourceCreatedAt: 1,
    sourceUpdatedAt: 2,
    sourceRecencyAt: 3,
    cwd: "/repo",
    sourceKind: "cli",
    sourceDetail: null,
    threadSource: null,
    modelProvider: "",
    gitBranch: null,
  },
);

const main = fs.readFileSync(
  new URL("../.reference/originals/main/main-C-Mhak1n.ts", import.meta.url),
  "utf8",
);
equal(main.includes("hhe = LocalThreadCatalogStore"), true);
equal(main.includes("hhe = class"), false);
equal(main.includes("new hhe(oe, e, t)"), true);
equal(main.includes("function fm("), false);
equal(main.includes("function mm("), false);

console.log(`${assertions} main thread catalog store assertions passed`);
