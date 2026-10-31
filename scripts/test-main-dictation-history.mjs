import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdtemp, mkdir, readFile, readdir, stat } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import fs from "node:fs";
import { z } from "zod";
import { createDictationHistoryRuntime } from "../src/main/main-app/dictation/history.ts";

const temporaryRoot = await mkdtemp(path.join(os.tmpdir(), "dictation-history-test-"));
const historyDirectory = path.join(temporaryRoot, "history");
const downloadsDirectory = path.join(temporaryRoot, "downloads");
await mkdir(downloadsDirectory);
const warnings = [];
let changes = 0;

const { DictationHistoryService, appendGlobalDictationHistory } = createDictationHistoryRuntime({
  schema: {
    wf: z.object,
    Of: z.string,
    Cf: z.number,
    df: z.enum,
    ff: z.instanceof,
    gf: z.boolean,
  },
  RpcHandlerBase: class {},
  codexHome: temporaryRoot,
  getDefaultDownloadsDirectory: () => downloadsDirectory,
  getLogger: () => ({ warning: (...args) => warnings.push(args) }),
  createLogger: () => ({ warning: (...args) => warnings.push(args) }),
});

appendGlobalDictationHistory({ id: "legacy", createdAtMs: 10, text: "old transcript" });
const service = new DictationHistoryService({
  directory: historyDirectory,
  getDownloadsDirectory: () => downloadsDirectory,
  onChanged: () => changes++,
});

let listed = await service.list();
assert.equal(listed.items.length, 1);
assert.equal(listed.items[0].id, "legacy");
assert.equal(listed.items[0].surface, "global");
assert.equal(listed.items[0].mimeType, "audio/webm");
assert.equal(listed.items[0].text, "old transcript");

await service.appendChunk({
  chunk: new Uint8Array([66]),
  createdAtMs: 20,
  id: "recording",
  mimeType: "audio/ogg; codecs=opus",
  sequence: 1,
  surface: "composer",
});
await service.appendChunk({
  chunk: new Uint8Array([65]),
  createdAtMs: 20,
  id: "recording",
  mimeType: "audio/ogg; codecs=opus",
  sequence: 0,
  surface: "composer",
});
await service.appendChunk({
  chunk: new Uint8Array([88]),
  createdAtMs: 20,
  id: "recording",
  mimeType: "audio/ogg; codecs=opus",
  sequence: 0,
  surface: "composer",
});
await service.appendChunk({
  chunk: new Uint8Array(),
  createdAtMs: 20,
  id: "recording",
  mimeType: "audio/ogg",
  sequence: 2,
  surface: "composer",
});

const audio = await service.readAudio({ id: "recording" });
assert.deepEqual([...audio.audio], [65, 66]);
assert.equal(audio.mimeType, "audio/ogg; codecs=opus");
listed = await service.list();
const recording = listed.items.find((entry) => entry.id === "recording");
assert.equal(recording.status, "recording");
assert.equal(recording.sizeBytes, 2);

await service.setTranscript({ id: "recording", text: "  hello world  " });
await service.finalize({ id: "recording", cancelled: false, durationMs: 1234 });
listed = await service.list();
const completed = listed.items.find((entry) => entry.id === "recording");
assert.equal(completed.status, "completed");
assert.equal(completed.durationMs, 1234);
assert.equal(completed.text, "hello world");

const firstDownload = path.join(
  downloadsDirectory,
  `Codex dictation ${new Date(20).toISOString().replaceAll(":", "-")}.ogg`,
);
await service.download({ id: "recording" });
await service.download({ id: "recording" });
assert.deepEqual([...await readFile(firstDownload)], [65, 66]);
assert.deepEqual([...await readFile(firstDownload.replace(/\.ogg$/, " (1).ogg"))], [65, 66]);

const entryHash = createHash("sha256").update("recording").digest("hex");
const metadataPath = path.join(historyDirectory, entryHash, "metadata.json");
assert.equal((await stat(metadataPath)).mode & 0o777, 0o600);
assert.equal(JSON.parse(await readFile(metadataPath, "utf8")).text, "hello world");

await service.delete({ id: "recording" });
assert.equal((await service.list()).items.some((entry) => entry.id === "recording"), false);
assert.equal(changes, 6);

await service.appendChunk({
  chunk: new Uint8Array([1, 2, 3]),
  createdAtMs: 30,
  id: "interrupted",
  mimeType: "audio/webm",
  sequence: 0,
  surface: "global",
});
const recoveredService = new DictationHistoryService({
  directory: historyDirectory,
  onChanged: () => {},
});
const recovered = (await recoveredService.list()).items.find((entry) => entry.id === "interrupted");
assert.equal(recovered.status, "interrupted");
assert.equal(recovered.sizeBytes, 3);

await assert.rejects(() => recoveredService.readAudio({ id: "missing" }), /was not found/);
assert.throws(
  () => recoveredService.appendChunk({ id: "", chunk: new Uint8Array() }),
  /too small|expected/i,
);
assert.equal(warnings.length, 0);
assert.equal((await readdir(historyDirectory)).length >= 2, true);

const main = fs.readFileSync(
  new URL("../.reference/originals/main/main-C-Mhak1n.ts", import.meta.url),
  "utf8",
);
assert.match(main, /DictationHistoryService: W\$e/);
assert.match(main, /appendGlobalDictationHistory: L\$e/);
assert.doesNotMatch(main, /W\$e = class/);
assert.doesNotMatch(main, /function EQ\(/);
assert.doesNotMatch(main, /function OQ\(/);

console.log("dictation history assertions: 29");
