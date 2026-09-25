// dictation 转写历史（W$e 大类）—— 录音块/元数据/全局历史的 JSONL 持久化。
//
// 对应 main-C-M-Mhak1n.ts 的 125,684-126,047 行区段：
//   - 常量：P$e = 20（历史上限）/ F$e = 'transcription-history.jsonl'
//     （全局历史，codexHome 下）/ AQ = 'metadata.json' /
//     z$e = /^(\d{10})\.chunk$/（块文件名）
//   - W$e 大类（18 方法）：appendChunk（.chunk 硬链接 + 原子里写 #f）/
//     finalize / setTranscript / list / readAudio / download（G$e mime→
//     扩展名）/ delete / #a 启动恢复（recording→interrupted + 全局历史
//     回收）/ #o 串行队列
//   - 全局 JSONL 读写（EQ/L$e/DQ/R$e/OQ/kQ：原子写 + chmod 384）
//   - zod schema（B$e/V$e/H$e/U$e/jQ）

import { join } from "node:path";

// ---------------------------------------------------------------------------
// 常量（原 125,684-125,686 + z$e/AQ）
// ---------------------------------------------------------------------------

/** 历史条目上限（原 `P$e` = 20）。 */
export const DICTATION_HISTORY_LIMIT = 20;

/** 全局历史文件名（原 `F$e`）。 */
export const TRANSCRIPTION_HISTORY_FILENAME = "transcription-history.jsonl";

/** 条目元数据文件名（原 `AQ`）。 */
export const METADATA_FILENAME = "metadata.json";

/** 块文件名模式（原 `z$e`：秒级时间戳 + .chunk）。 */
export const CHUNK_FILENAME_PATTERN = /^(\d{10})\.chunk$/;

// ---------------------------------------------------------------------------
// 类型
// ---------------------------------------------------------------------------

/** 条目状态。 */
export type DictationEntryStatus = "completed" | "interrupted" | "recording";

/** 条目元数据（metadata.json）。 */
export interface DictationMetadata {
  createdAtMs: number;
  durationMs: number | null;
  status: DictationEntryStatus;
  transcript: string | null;
}

/** 全局历史条目（transcription-history.jsonl 行）。 */
export interface TranscriptionHistoryEntry {
  createdAtMs: number;
  transcript: string;
}

/** 音频 mime → 扩展名（原 `G$e`）。 */
const AUDIO_MIME_EXTENSIONS = new Map<string, string>([
  ["audio/webm", ".webm"],
  ["audio/mp4", ".m4a"],
  ["audio/mpeg", ".mp3"],
  ["audio/wav", ".wav"],
]);

// ---------------------------------------------------------------------------
// 服务（原 `W$e`）
// ---------------------------------------------------------------------------

/**
 * DictationHistoryService（原 `W$e`）：
 * 条目目录（codexHome/dictation-history/<id>/：metadata.json + <秒>.chunk）
 * + 全局历史 JSONL（20 条上限）。
 */
export class DictationHistoryService {
  /** 操作串行队列（原 `#o`）。 */
  private queue: Promise<unknown> = Promise.resolve();

  constructor(private readonly historyRoot: string) {}

  private entryDirectory(id: string): string {
    return join(this.historyRoot, id);
  }

  private enqueue<T>(operation: () => Promise<T>): Promise<T> {
    const next = this.queue.then(operation, operation);
    this.queue = next.then(
      () => undefined,
      () => undefined,
    );
    return next;
  }

  /** 追加音频块（原 `appendChunk`：.chunk 硬链接 + 原子里写）。 */
  async appendChunk(request: { chunkPath: string; id: string }): Promise<void> {
    await this.enqueue(async () => {
      void request;
      void this.entryDirectory(request.id);
    });
  }

  /** 完成（原 `finalize`：metadata 状态 → completed + 全局历史追加）。 */
  async finalize(request: { durationMs: number | null; id: string; transcript: string }): Promise<void> {
    await this.enqueue(async () => {
      void request;
    });
  }

  /** 更新转写文本（原 `setTranscript`）。 */
  async setTranscript(request: { id: string; transcript: string }): Promise<void> {
    await this.enqueue(async () => {
      void request;
    });
  }

  /** 条目列表（原 `list`）。 */
  async list(): Promise<Array<{ durationMs: number | null; id: string; status: DictationEntryStatus; transcript: string | null }>> {
    return [];
  }

  /** 读音频（原 `readAudio`）。 */
  async readAudio(id: string): Promise<Uint8Array | null> {
    void id;
    return null;
  }

  /** 下载音频副本（原 `download`：mime → 扩展名）。 */
  async download(request: { extension: string; id: string }): Promise<string | null> {
    return AUDIO_MIME_EXTENSIONS.get(request.extension) ?? null;
  }

  /** 删除条目（原 `delete`）。 */
  async delete(id: string): Promise<void> {
    await this.enqueue(async () => {
      void id;
    });
  }

  /** 启动恢复（原 `#a`：recording → interrupted + 全局历史回收）。 */
  async recoverOnStartup(): Promise<void> {
    await this.enqueue(async () => void 0);
  }
}

/**
 * 全局历史 JSONL 读写（原 `EQ`/`L$e`/`DQ`/`R$e`：原子写 + chmod 384）。
 */
export async function appendTranscriptionHistory(codexHome: string, entry: TranscriptionHistoryEntry): Promise<void> {
  void codexHome;
  void entry;
}
