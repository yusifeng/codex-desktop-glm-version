import assert from "node:assert/strict";
import { pathToFileURL } from "node:url";
import fs from "node:fs";
import path from "node:path";
import * as esbuild from "esbuild";
const root = path.resolve(
  path.dirname(new URL(import.meta.url).pathname),
  "..",
);
const files = [
  "threads/history-policy",
  "threads/operations",
  "threads/start-config",
  "threads/patch-classification",
  "threads/context-compaction",
  "threads/fork-rollback",
  "threads/inactive-unsubscriber",
  "workspace/config",
];
let assertions = 0;
for (const file of files) {
  const source = fs.readFileSync(
    path.join(root, "src/main/main-app", file + ".ts"),
    "utf8",
  );
  assert.equal(
    /:\s*any\b|\bas any\b|@ts-expect-error|@ts-nocheck/u.test(source),
    false,
    file + " has no type escape",
  );
  assert.ok(source.includes("export"), file + " exports API");
  assertions += 2;
}
const entry = path.join(root, "scripts/.tmp-thread-gap-entry.ts");
const runtimeFiles = files.slice(1, 7);
const imports = runtimeFiles
  .map(
    (file, index) =>
      `export * as m${index} from "../src/main/main-app/${file}";`,
  )
  .join("\n");
fs.writeFileSync(entry, imports);
const result = await esbuild.build({
  entryPoints: [entry],
  bundle: true,
  format: "esm",
  platform: "node",
  packages: "external",
  plugins: [
    {
      name: "chunk-mocks",
      setup(build) {
        build.onResolve({ filter: /^@chunk\// }, (args) => ({
          path: args.path,
          namespace: "mock",
        }));
        build.onLoad({ filter: /.*/, namespace: "mock" }, () => ({
          contents:
            "export const $u=value=>value; export const Od=()=>({sandboxPolicy:{type:'workspaceWrite',writableRoots:[]}}); export const kd=()=>({}); export const _s='durable'; export const Cs=value=>value==='durable'; export const Zo=String; export const _l=value=>String(value).replaceAll('\\\\','/');",
          loader: "js",
        }));
      },
    },
  ],
  write: false,
  logLevel: "silent",
});
fs.unlinkSync(entry);
const target = path.join(
  "/tmp",
  "thread-workspace-gaps-" + Date.now() + ".mjs",
);
fs.writeFileSync(target, result.outputFiles[0].text);
const loaded = await import(pathToFileURL(target));
fs.unlinkSync(target);
const [operations, start, patch, compaction, rollback, inactive] =
  runtimeFiles.map((_file, index) => loaded[`m${index}`]);
assert.equal(start.TURN_START_TIMEOUT_MS, 30000);
assert.equal(
  start.resolveThreadCwdFromResponse({
    requestedCwd: "/work/sub",
    responseCwd: "/work",
  }),
  "/work/sub",
);
assert.equal(
  await start.resolveServiceTier("fast", { warning() {} }, async () => ({
    featureRequirements: { fast_mode: false },
  })),
  null,
);
assert.deepEqual(operations.mergeUnique(["a", "b"], ["b", "c"]), [
  "a",
  "b",
  "c",
]);
assert.equal(
  operations.sandboxMissingRoots(
    { type: "workspaceWrite", writableRoots: ["/a"] },
    ["/a", "/b"],
  ),
  true,
);
assert.equal(
  operations.isWriterConflictError(
    new Error("thread already has an active writer"),
  ),
  true,
);
const settings = { latestModel: "a" };
patch.applyThreadSettingsUpdate(settings, { model: "b", cwd: "/x" });
assert.equal(settings.previousTurnModel, "a");
assert.equal(settings.latestModel, "b");
const updates = [];
const tracker = new compaction.ManualContextCompactionTracker(
  {
    updateConversationState(_id, update) {
      const value = {
        turns: [
          {
            status: "inProgress",
            items: [{ id: "pending-manual-context-compaction" }],
          },
        ],
      };
      update(value);
      updates.push(value);
    },
  },
  () => {},
);
tracker.register("t");
assert.equal(tracker.consumeSource("t"), "manual");
tracker.remove("t");
assert.equal(typeof rollback.applyRollbackResponse, "function");
assert.equal(typeof inactive.InactiveThreadUnsubscriber, "function");
assertions += 12;
console.log(`main thread/workspace gaps: ${assertions} assertions passed`);
