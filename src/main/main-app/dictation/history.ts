// @ts-nocheck

import { createHash, randomUUID } from "node:crypto";
import {
  chmodSync,
  existsSync,
  mkdirSync,
  readFileSync,
  renameSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import {
  chmod,
  link,
  mkdir,
  open,
  readFile,
  readdir,
  rename,
  rm,
  stat,
} from "node:fs/promises";
import { dirname, join } from "node:path";

export const DICTATION_HISTORY_LIMIT = 20;
export const TRANSCRIPTION_HISTORY_FILENAME = "transcription-history.jsonl";
export const METADATA_FILENAME = "metadata.json";
export const CHUNK_FILENAME_PATTERN = /^(\d{10})\.chunk$/;

type DictationStatus = "recording" | "completed" | "cancelled" | "interrupted";
type DictationSurface = "composer" | "global";
interface DictationMetadata {
  createdAtMs: number;
  durationMs?: number;
  id: string;
  mimeType: string;
  sizeBytes: number;
  status: DictationStatus;
  surface: DictationSurface;
  text: string;
}
interface GlobalHistoryEntry {
  id: string;
  createdAtMs: number;
  text: string;
}

/** Creates the file-backed dictation owner and its legacy global-history bridge. */
export function createDictationHistoryRuntime(dependencies: any) {
  const {
    schema,
    RpcHandlerBase,
    codexHome,
    getDefaultDownloadsDirectory,
    getLogger,
    createLogger,
  } = dependencies;
  const globalEntrySchema = schema.wf({
    id: schema.Of(),
    createdAtMs: schema.Cf(),
    text: schema.Of(),
  });
  const metadataSchema = schema.wf({
    createdAtMs: schema.Cf(),
    durationMs: schema.Cf().nonnegative().optional(),
    id: schema.Of().min(1),
    mimeType: schema.Of().min(1),
    sizeBytes: schema.Cf().int().nonnegative(),
    status: schema.df(["recording", "completed", "cancelled", "interrupted"]),
    surface: schema.df(["composer", "global"]),
    text: schema.Of(),
  });
  const appendChunkSchema = schema.wf({
    chunk: schema.ff(Uint8Array),
    createdAtMs: schema.Cf(),
    id: schema.Of().min(1),
    mimeType: schema.Of().min(1),
    sequence: schema.Cf().int().min(0).max(9_999_999_999),
    surface: schema.df(["composer", "global"]),
  });
  const finalizeSchema = schema.wf({
    cancelled: schema.gf(),
    durationMs: schema.Cf().nonnegative().optional(),
    id: schema.Of().min(1),
  });
  const transcriptSchema = schema.wf({
    id: schema.Of().min(1),
    text: schema.Of(),
  });
  const idSchema = schema.wf({ id: schema.Of().min(1) });
  const globalHistoryPath = join(codexHome, TRANSCRIPTION_HISTORY_FILENAME);

  function readGlobalHistory(): GlobalHistoryEntry[] {
    if (!existsSync(globalHistoryPath)) return [];
    try {
      const entries: GlobalHistoryEntry[] = [];
      for (const line of readFileSync(globalHistoryPath, "utf8").split(
        /\r?\n/,
      )) {
        const value = line.trim();
        if (!value) continue;
        try {
          const parsed = globalEntrySchema.safeParse(JSON.parse(value));
          if (parsed.success) entries.push(parsed.data);
        } catch {}
      }
      return entries.slice(-DICTATION_HISTORY_LIMIT).reverse();
    } catch (error) {
      getLogger().warning("Failed to read global dictation history", {
        safe: {},
        sensitive: { error },
      });
      return [];
    }
  }

  function writeGlobalHistory(entries: GlobalHistoryEntry[]) {
    try {
      const temporaryPath = `${globalHistoryPath}.${randomUUID()}.tmp`;
      mkdirSync(dirname(globalHistoryPath), { mode: 0o700, recursive: true });
      try {
        const contents =
          [...entries]
            .reverse()
            .map((entry) => JSON.stringify(entry))
            .join("\n") + (entries.length ? "\n" : "");
        writeFileSync(temporaryPath, contents, {
          encoding: "utf8",
          flag: "wx",
          mode: 0o600,
        });
        renameSync(temporaryPath, globalHistoryPath);
        chmodSync(globalHistoryPath, 0o600);
      } catch (error) {
        rmSync(temporaryPath, { force: true });
        throw error;
      }
    } catch (error) {
      getLogger().warning("Failed to write global dictation history", {
        safe: {},
        sensitive: { error },
      });
    }
  }

  function appendGlobalDictationHistory(entry: GlobalHistoryEntry) {
    writeGlobalHistory(
      [
        entry,
        ...readGlobalHistory().filter((candidate) => candidate.id !== entry.id),
      ].slice(0, DICTATION_HISTORY_LIMIT),
    );
  }
  function removeGlobalHistoryEntries(ids: string[]) {
    if (!ids.length) return;
    const removed = new Set(ids);
    writeGlobalHistory(
      readGlobalHistory().filter((entry) => !removed.has(entry.id)),
    );
  }

  class DictationHistoryService extends RpcHandlerBase {
    private readonly entriesById = new Map<string, DictationMetadata>();
    private readonly logger = createLogger("dictation-history");
    private readonly options: any;
    private initialized = false;
    private queue: Promise<unknown> = Promise.resolve();
    constructor(options: any) {
      super();
      this.options = options;
    }

    appendChunk(request: unknown) {
      const { chunk, createdAtMs, id, mimeType, sequence, surface } =
        appendChunkSchema.parse(request);
      if (chunk.byteLength === 0) return Promise.resolve();
      return this.enqueue(async () => {
        await this.ensureDirectory(this.options.directory);
        const entryDirectory = this.entryDirectory(id);
        await this.ensureDirectory(entryDirectory);
        let entry = this.entriesById.get(id);
        if (entry == null) {
          entry = {
            createdAtMs,
            id,
            mimeType,
            sizeBytes: 0,
            status: "recording",
            surface,
            text: "",
          };
          this.entriesById.set(id, entry);
          await this.writeMetadata(entry);
        }
        const path = join(
          entryDirectory,
          `${String(sequence).padStart(10, "0")}.chunk`,
        );
        if (await this.writeChunkOnce(path, chunk))
          entry.sizeBytes += chunk.byteLength;
        await this.writeMetadata(entry);
        await this.prune();
        this.options.onChanged();
      });
    }

    finalize(request: unknown) {
      const { cancelled, durationMs, id } = finalizeSchema.parse(request);
      return this.enqueue(async () => {
        const entry = this.entriesById.get(id);
        if (entry == null) return;
        entry.status = cancelled ? "cancelled" : "completed";
        entry.durationMs = durationMs;
        await this.writeMetadata(entry);
        await this.prune();
        this.options.onChanged();
      });
    }

    setTranscript(request: unknown) {
      const { id, text } = transcriptSchema.parse(request);
      return this.enqueue(async () => {
        const entry = this.entriesById.get(id);
        if (entry == null) return;
        entry.text = text.trim();
        await this.writeMetadata(entry);
        this.options.onChanged();
      });
    }

    list() {
      return this.enqueue(async () => ({
        items: this.sortedEntries().map((entry) => ({ ...entry })),
      }));
    }

    readAudio(request: unknown) {
      const { id } = idSchema.parse(request);
      return this.enqueue(async () => {
        const entry = this.entriesById.get(id);
        if (entry == null) throw Error("Dictation recording was not found");
        const chunks = await this.readChunks(this.entryDirectory(id));
        if (!chunks.length) throw Error("Dictation recording has no audio");
        return {
          audio: new Uint8Array(
            Buffer.concat(
              await Promise.all(chunks.map((chunk) => readFile(chunk.path))),
            ),
          ),
          mimeType: entry.mimeType,
        };
      });
    }

    download(request: unknown) {
      const { id } = idSchema.parse(request);
      return this.enqueue(async () => {
        const entry = this.entriesById.get(id);
        if (entry == null) throw Error("Dictation recording was not found");
        const chunks = await this.readChunks(this.entryDirectory(id));
        if (!chunks.length) throw Error("Dictation recording has no audio");
        const directory =
          this.options.getDownloadsDirectory?.() ??
          getDefaultDownloadsDirectory();
        const basename = `Codex dictation ${new Date(entry.createdAtMs).toISOString().replaceAll(":", "-")}`;
        const extension = audioExtension(entry.mimeType);
        for (let suffix = 0; ; suffix += 1) {
          const filename = suffix
            ? `${basename} (${suffix}).${extension}`
            : `${basename}.${extension}`;
          try {
            await this.writeDownload(join(directory, filename), chunks);
            return;
          } catch (error) {
            if (!hasErrorCode(error, "EEXIST")) throw error;
          }
        }
      });
    }

    delete(request: unknown) {
      const { id } = idSchema.parse(request);
      return this.enqueue(async () => {
        const entry = this.entriesById.get(id);
        if (entry == null) return;
        if (entry.status === "recording")
          throw Error("Cannot delete an active dictation recording");
        this.entriesById.delete(id);
        await rm(this.entryDirectory(id), { force: true, recursive: true });
        await this.syncDirectory(this.options.directory);
        removeGlobalHistoryEntries([id]);
        this.options.onChanged();
      });
    }

    private enqueue<T>(operation: () => Promise<T>): Promise<T> {
      const run = async () => {
        if (!this.initialized) {
          await this.initialize();
          this.initialized = true;
        }
        return operation();
      };
      const next = this.queue.then(run, run);
      this.queue = next.then(
        () => undefined,
        () => undefined,
      );
      return next;
    }

    private async initialize() {
      try {
        await this.ensureDirectory(this.options.directory);
        const directoryEntries = await readdir(this.options.directory, {
          withFileTypes: true,
        });
        const recovered = await Promise.all(
          directoryEntries
            .filter((entry) => entry.isDirectory())
            .map(async (directoryEntry) => {
              const directory = join(
                this.options.directory,
                directoryEntry.name,
              );
              try {
                await chmod(directory, 0o700);
                const entry: DictationMetadata = metadataSchema.parse(
                  JSON.parse(
                    await readFile(join(directory, METADATA_FILENAME), "utf8"),
                  ),
                );
                entry.sizeBytes = (await this.readChunks(directory)).reduce(
                  (total, chunk) => total + chunk.sizeBytes,
                  0,
                );
                if (entry.status === "recording") entry.status = "interrupted";
                await this.writeMetadata(entry);
                return entry;
              } catch (error) {
                this.logger.warning("Failed to recover dictation recording", {
                  safe: {},
                  sensitive: { error },
                });
                return null;
              }
            }),
        );
        for (const entry of recovered)
          if (entry != null) this.entriesById.set(entry.id, entry);
        for (const legacyEntry of readGlobalHistory()) {
          const existing = this.entriesById.get(legacyEntry.id);
          if (existing != null) {
            if (!existing.text && legacyEntry.text) {
              existing.text = legacyEntry.text;
              await this.writeMetadata(existing);
            }
            continue;
          }
          const imported: DictationMetadata = {
            createdAtMs: legacyEntry.createdAtMs,
            id: legacyEntry.id,
            mimeType: "audio/webm",
            sizeBytes: 0,
            status: "completed",
            surface: "global",
            text: legacyEntry.text,
          };
          await this.ensureDirectory(this.entryDirectory(imported.id));
          await this.writeMetadata(imported);
          this.entriesById.set(imported.id, imported);
        }
        writeGlobalHistory(readGlobalHistory());
        await this.prune();
      } catch (error) {
        this.logger.warning("Failed to initialize dictation history", {
          safe: {},
          sensitive: { error },
        });
        throw error;
      }
    }

    private sortedEntries() {
      return [...this.entriesById.values()].sort(
        (left, right) => right.createdAtMs - left.createdAtMs,
      );
    }

    private async prune() {
      const entries = this.sortedEntries();
      const recordingCount = entries.filter(
        (entry) => entry.status === "recording",
      ).length;
      const removed = entries
        .filter((entry) => entry.status !== "recording")
        .slice(Math.max(0, DICTATION_HISTORY_LIMIT - recordingCount));
      await Promise.all(
        removed.map(async (entry) => {
          await rm(this.entryDirectory(entry.id), {
            force: true,
            recursive: true,
          });
          this.entriesById.delete(entry.id);
        }),
      );
      if (removed.length) await this.syncDirectory(this.options.directory);
      removeGlobalHistoryEntries(removed.map((entry) => entry.id));
    }

    private entryDirectory(id: string) {
      return join(
        this.options.directory,
        createHash("sha256").update(id).digest("hex"),
      );
    }

    private async ensureDirectory(path: string) {
      await mkdir(path, { mode: 0o700, recursive: true });
      await chmod(path, 0o700);
    }

    private async readChunks(directory: string) {
      const chunks = await Promise.all(
        (await readdir(directory)).flatMap((filename) => {
          const match = CHUNK_FILENAME_PATTERN.exec(filename);
          if (match == null) return [];
          const path = join(directory, filename);
          return [
            stat(path).then((fileStat) => ({
              path,
              sequence: Number(match[1]),
              sizeBytes: fileStat.size,
            })),
          ];
        }),
      );
      return chunks.sort((left, right) => left.sequence - right.sequence);
    }

    private async writeChunkOnce(path: string, chunk: Uint8Array) {
      const temporaryPath = `${path}.${randomUUID()}.tmp`;
      try {
        const file = await open(temporaryPath, "wx", 0o600);
        try {
          await file.writeFile(chunk);
          await file.sync();
        } finally {
          await file.close();
        }
        try {
          await link(temporaryPath, path);
          return true;
        } catch (error) {
          if (!hasErrorCode(error, "EEXIST")) throw error;
          return false;
        }
      } finally {
        await rm(temporaryPath, { force: true });
      }
    }

    private async writeMetadata(entry: DictationMetadata) {
      const directory = this.entryDirectory(entry.id);
      const metadataPath = join(directory, METADATA_FILENAME);
      const temporaryPath = `${metadataPath}.${randomUUID()}.tmp`;
      try {
        const file = await open(temporaryPath, "wx", 0o600);
        try {
          await file.writeFile(JSON.stringify(entry), "utf8");
          await file.sync();
        } finally {
          await file.close();
        }
        await rename(temporaryPath, metadataPath);
        await this.syncDirectory(directory);
      } catch (error) {
        await rm(temporaryPath, { force: true });
        throw error;
      }
    }

    private async writeDownload(path: string, chunks: Array<{ path: string }>) {
      const file = await open(path, "wx", 0o600);
      try {
        for (const chunk of chunks)
          await file.writeFile(await readFile(chunk.path));
        await file.sync();
      } catch (error) {
        await file.close();
        await rm(path, { force: true });
        throw error;
      }
      await file.close();
    }

    private async syncDirectory(path: string) {
      if (process.platform === "win32") return;
      const directory = await open(path, "r");
      try {
        await directory.sync();
      } finally {
        await directory.close();
      }
    }
  }

  return { DictationHistoryService, appendGlobalDictationHistory };
}

function audioExtension(mimeType: string) {
  switch (mimeType.split(";", 1)[0]?.trim().toLowerCase()) {
    case "audio/mp4":
      return "m4a";
    case "audio/ogg":
      return "ogg";
    case "audio/mpeg":
      return "mp3";
    case "audio/aac":
      return "aac";
    case "audio/wav":
    case "audio/wave":
    case "audio/x-wav":
      return "wav";
    default:
      return "webm";
  }
}

function hasErrorCode(error: unknown, code: string) {
  return error instanceof Error && "code" in error && error.code === code;
}

if (typeof module !== "undefined")
  module.exports = { createDictationHistoryRuntime };
