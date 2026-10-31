import assert from "node:assert/strict";
import fs from "node:fs";
import fsp from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { createHash, randomUUID } from "node:crypto";
import { z } from "zod";
import { createArtifactDocumentStoreClass } from "../src/main/main-app/artifacts/artifact-document-store.ts";

const runtime = {
  Of: () => z.string(),
  wf: (shape) => z.object(shape),
  hf: (schema) => z.array(schema),
  df: (values) => z.enum(values),
  Cf: () => z.number(),
  bf: (value) => z.literal(value),
};
const ArtifactDocumentStore = createArtifactDocumentStoreClass({
  runtime,
  path,
  fs: fsp,
  createHash,
  randomUUID,
  platform: process.platform,
  validateYjsUpdate: () => {},
  mergeYjsUpdates: (updates) => {
    const size = updates.reduce((total, update) => total + update.byteLength, 0);
    const merged = new Uint8Array(size);
    let offset = 0;
    for (const update of updates) { merged.set(update, offset); offset += update.byteLength; }
    return merged;
  },
});

assert.throws(() => new ArtifactDocumentStore({ directory: "/tmp/x", compactionUpdateCountThreshold: 0 }), /thresholds must be positive/);
const directory = await fsp.mkdtemp(path.join(os.tmpdir(), "codex-artifact-store-"));
try {
  const store = new ArtifactDocumentStore({ directory, compactionUpdateCountThreshold: 2, compactionUpdateBytesThreshold: 1024 });
  const publicFilePath = "/workspace/deck.pptx";
  const publicFileHash = "a".repeat(64);
  const base = { publicFilePath, publicFileHash };

  assert.deepEqual(await store.find(base), { status: "ok", value: null });
  const adopted = await store.adopt({
    ...base,
    checkpoint: new Uint8Array([1, 2]),
    documentId: "document",
    kind: "presentation",
  });
  assert.equal(adopted.status, "ok");
  assert.equal(adopted.value.stateVersion, 0);
  assert.equal(adopted.value.documentId, "document");
  assert.deepEqual([...adopted.value.checkpoint], [1, 2]);
  assert.equal((await store.find(base)).value.publicFilePath, publicFilePath);
  assert.equal((await store.read({ ...base, documentId: "document" })).status, "ok");
  await assert.rejects(() => store.read({ ...base, documentId: "other" }), /ID mismatch/);

  const first = await store.append({
    ...base,
    documentId: "document",
    baseStateVersion: 0,
    bytes: new Uint8Array([3]),
    originId: "origin",
    source: "user",
    updateId: "update-1",
  });
  assert.equal(first.status, "ok");
  assert.equal(first.value.applied, true);
  assert.equal(first.value.stateVersion, 1);
  assert.deepEqual([...first.value.committedUpdate.bytes], [3]);

  const duplicate = await store.append({
    ...base,
    documentId: "document",
    baseStateVersion: 0,
    bytes: new Uint8Array([3]),
    originId: "origin",
    source: "user",
    updateId: "update-1",
  });
  assert.equal(duplicate.value.applied, false);
  assert.equal(duplicate.value.stateVersion, 1);
  await assert.rejects(
    () => store.append({ ...base, documentId: "document", baseStateVersion: 0, bytes: new Uint8Array([4]), originId: "origin", source: "user", updateId: "update-1" }),
    /update ID collision/,
  );

  const second = await store.append({
    ...base,
    documentId: "document",
    baseStateVersion: 1,
    bytes: new Uint8Array([4]),
    originId: "origin",
    source: "model",
    updateId: "update-2",
  });
  assert.equal(second.value.stateVersion, 2);
  const compacted = await store.read({ ...base, documentId: "document" });
  assert.equal(compacted.value.checkpointStateVersion, 2);
  assert.deepEqual(compacted.value.updates, []);

  const dirtyRefresh = await store.refreshCleanSession({
    ...base,
    documentId: "document",
    checkpoint: new Uint8Array([9]),
    expectedPublicFileHash: publicFileHash,
    expectedStateVersion: 2,
    replacementDocumentId: "replacement",
  });
  assert.equal(dirtyRefresh.value.outcome, "dirty");

  const materializedSame = await store.beginMaterialization({
    ...base,
    documentId: "document",
    expectedStateVersion: 2,
    materializationId: "materialization-1",
    intendedPublicFileHash: publicFileHash,
    stagedFileName: `.artifact-document-materialize-${randomUUID()}`,
  });
  assert.equal(materializedSame.value.outcome, "materialized");
  assert.equal(materializedSame.value.applied, true);
  assert.deepEqual(await store.getPendingMaterialization(base), { status: "ok", value: null });

  await store.append({
    ...base,
    documentId: "document",
    baseStateVersion: 2,
    bytes: new Uint8Array([5]),
    originId: "origin",
    source: "user",
    updateId: "update-3",
  });
  const nextHash = "b".repeat(64);
  const prepared = await store.beginMaterialization({
    ...base,
    documentId: "document",
    expectedStateVersion: 3,
    materializationId: "materialization-2",
    intendedPublicFileHash: nextHash,
    stagedFileName: `.artifact-document-materialize-${randomUUID()}`,
  });
  assert.equal(prepared.value.outcome, "prepared");
  assert.equal((await store.getPendingMaterialization(base)).value.stagedFileName.startsWith(".artifact-document-materialize-"), true);
  const finished = await store.finishMaterialization({
    publicFilePath,
    publicFileHash: nextHash,
    documentId: "document",
    materializationId: "materialization-2",
  });
  assert.equal(finished.value.outcome, "materialized");
  assert.equal(finished.value.record.publicFileHash, nextHash);

  const conflict = await store.adopt({
    publicFilePath,
    publicFileHash: "c".repeat(64),
    checkpoint: new Uint8Array([1, 2]),
    documentId: "document",
    kind: "presentation",
  });
  assert.equal(conflict.status, "conflict");
  assert.equal(conflict.expectedPublicFileHash, nextHash);
  assert.equal(conflict.actualPublicFileHash, "c".repeat(64));

  const files = await fsp.readdir(directory);
  assert.equal(files.length, 1);
  const persisted = JSON.parse(await fsp.readFile(path.join(directory, files[0]), "utf8"));
  assert.equal(persisted.schemaVersion, 1);
  assert.equal(persisted.recordHash.length, 64);
  assert.equal(persisted.pendingMaterialization, null);
} finally {
  await fsp.rm(directory, { recursive: true, force: true });
}

const main = fs.readFileSync(new URL("../.reference/originals/main/main-C-Mhak1n.ts", import.meta.url), "utf8");
assert.match(main, /Det = createArtifactDocumentStoreClass\(\{/);
assert.doesNotMatch(main, /Det = class/);
assert.doesNotMatch(main, /function M8\(/);
assert.doesNotMatch(main, /function B8\(/);
assert.match(main, /store: new Det\(\{/);

console.log("artifact document store assertions: 36");
