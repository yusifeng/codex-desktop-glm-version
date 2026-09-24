// realtime 会话录制器 + 语音时间账本（原版 56,480-56,943 区段）。
//
// 职责：
//   - RealtimeSessionRecorder（mw）：realtime 事件（thread/realtime/*）与
//     turn 生命周期（turn/started|completed）按会话录制为 JSONL——
//     `realtime-sessions/<YYYY>/<MM>/<DD>/realtime-<ts>-<thread>-<session>.jsonl`；
//     audio delta 只记长度（base64 字符数/解码字节数）、sdp 全量脱敏；
//     handoff 请求在 turn 完成时把 rollout 段（task_started..task_complete，
//     100ms×2 重试）内嵌进录制文件。写全部串行化（pendingWrite 链）。
//   - RecordingGate（Awe）：录制开关 + 代数（generation）——开关变化换代，
//     旧代录制全部作废。
//   - readRealtimeSessionLogForFeedback（kwe）：feedback 日志归档读取最新
//     会话 JSONL。
//   - VoiceTimelineLedger（Lwe）：SQLite `thread_timeline_ledger` 表的
//     append（BEGIN IMMEDIATE 幂等去重 + sequence 分配）/list/readById。
//     **长程消费者：R10 语音历史（159,400 `new C8e(v, new Lwe(y))`）——
//     构造签名不能变。**
//
// 实例化：R12 启动装配（161,197-161,199）。

import { readdir, readFile, appendFile, mkdir } from "node:fs/promises";
import { setTimeout as delay } from "node:timers/promises";
import { join, dirname, basename } from "node:path";
import {
  wf as zObject,
  Of as zString,
  Cf as zNumber,
  bf as zLiteral,
  df as zEnum,
  vf as zDiscriminatedUnion,
  yf as zAny,
} from "@chunk/shared";
import { memoizedTaggedLogger } from "@chunk/logger";

/** 模块级 logger（原 fw = r.r('RealtimeSessionRecorder')）。 */
const logger = memoizedTaggedLogger(`RealtimeSessionRecorder`);

// ---------------------------------------------------------------------------
// realtime 事件 schema（pw/Twe/Ewe/Dwe/Owe）
// ---------------------------------------------------------------------------

/** threadId 参数基 schema（loose）。 */
const threadIdParamsSchema = zObject({ threadId: zString() }).loose();
/** realtime 会话版本（v1/v2/v3）。 */
const realtimeVersionSchema = zEnum([`v1`, `v2`, `v3`]);

/** thread/realtime/* 通知 schema（按 method 判别，原 Ewe）。 */
const realtimeEventSchema = zDiscriminatedUnion(`method`, [
  zObject({
    method: zLiteral(`thread/realtime/started`),
    params: threadIdParamsSchema.extend({
      sessionId: zString().nullable().optional(),
      realtimeSessionId: zString().nullable().optional(),
      version: realtimeVersionSchema,
    }),
  }),
  zObject({ method: zLiteral(`thread/realtime/itemAdded`), params: threadIdParamsSchema.extend({ item: zAny() }) }),
  zObject({
    method: zLiteral(`thread/realtime/transcript/delta`),
    params: threadIdParamsSchema.extend({ role: zString(), delta: zString() }),
  }),
  zObject({
    method: zLiteral(`thread/realtime/transcript/done`),
    params: threadIdParamsSchema.extend({ role: zString(), text: zString() }),
  }),
  zObject({
    method: zLiteral(`thread/realtime/outputAudio/delta`),
    params: threadIdParamsSchema.extend({
      audio: zObject({
        data: zString(),
        sampleRate: zNumber(),
        numChannels: zNumber(),
        samplesPerChannel: zNumber().nullable(),
        itemId: zString().nullable(),
      }).loose(),
    }),
  }),
  zObject({ method: zLiteral(`thread/realtime/sdp`), params: threadIdParamsSchema.extend({ sdp: zString() }) }),
  zObject({ method: zLiteral(`thread/realtime/error`), params: threadIdParamsSchema.extend({ message: zString() }) }),
  zObject({
    method: zLiteral(`thread/realtime/closed`),
    params: threadIdParamsSchema.extend({ reason: zString().nullable() }),
  }),
]);

/** turn/started|completed 通知 schema（原 Dwe）。 */
const turnNotificationSchema = zDiscriminatedUnion(`method`, [
  zObject({
    method: zLiteral(`turn/started`),
    params: threadIdParamsSchema.extend({ turn: zObject({ id: zString() }).loose() }),
  }),
  zObject({
    method: zLiteral(`turn/completed`),
    params: threadIdParamsSchema.extend({ turn: zObject({ id: zString() }).loose() }),
  }),
]);

/** handoff_request 条目 schema（原 Owe）。 */
const handoffRequestSchema = zObject({ type: zLiteral(`handoff_request`), handoff_id: zString() }).loose();

/**
 * feedback 日志归档的 realtime 会话读取（原 kwe）：读最新会话 JSONL，包装
 * 为 `realtime-sessions/latest.jsonl` 归档条目；失败仅告警返回空。
 */
export async function readRealtimeSessionLogForFeedback(
  readMostRecentSessionLog: () => Promise<Buffer | null>,
): Promise<{ contents: Buffer; name: string }[]> {
  try {
    let contents = await readMostRecentSessionLog();
    return contents == null ? [] : [{ contents, name: `realtime-sessions/latest.jsonl` }];
  } catch (error) {
    logger().warning(`Failed to read realtime session log for feedback.`, {
      safe: {},
      sensitive: { error },
    });
    return [];
  }
}

// ---------------------------------------------------------------------------
// RecordingGate（Awe）
// ---------------------------------------------------------------------------

/** 录制开关代数门（原 Awe）：开关变化使旧代录制作废。 */
export class RecordingGate {
  enabled = false;
  generation = 0;

  setEnabled(enabled: boolean) {
    enabled !== this.enabled && ((this.enabled = enabled), (this.generation += 1));
  }

  getGeneration() {
    return this.generation;
  }

  isEnabled() {
    return this.enabled;
  }
}

// ---------------------------------------------------------------------------
// RealtimeSessionRecorder（mw）
// ---------------------------------------------------------------------------

/** 单会话录制状态。 */
interface SessionRecording {
  filePath: string;
  pendingHandoffIds: string[];
  handoffByTurnId: Map<string, string>;
  embeddedTurnIds: Set<string>;
  isClosed: boolean;
}

/** RealtimeSessionRecorder 依赖注入面。 */
export interface RealtimeSessionRecorderOptions {
  hostId: string;
  rootDirectory: string;
  isRecordingEnabled: () => boolean;
  getRecordingGeneration: () => number;
  getRolloutPath?: (threadId: string) => Promise<string | null> | undefined;
}

/**
 * realtime 会话录制器（原 mw）。record() 按 generation 换代清空旧录制；
 * 非 realtime 事件走 turn 通知路径（handoff → turn 绑定 + rollout 内嵌）。
 */
export class RealtimeSessionRecorder {
  options: RealtimeSessionRecorderOptions;
  recordings = new Map<string, SessionRecording>();
  recordingGeneration: number | null = null;
  pendingWrite: Promise<unknown> = Promise.resolve();

  constructor(options: RealtimeSessionRecorderOptions) {
    this.options = options;
  }

  /** 录制根目录：`<codexHome>/realtime-sessions`。 */
  static getRootDirectory({ codexHome }: { codexHome: string }) {
    return join(codexHome, `realtime-sessions`);
  }

  /** 录制一个通知（realtime 事件或 turn 生命周期）。 */
  record(notification: unknown) {
    let generation = this.options.getRecordingGeneration();
    if (
      (this.recordingGeneration != null && generation !== this.recordingGeneration && this.recordings.clear(),
      (this.recordingGeneration = generation),
      !this.options.isRecordingEnabled())
    )
      return;
    let realtimeEvent = realtimeEventSchema.safeParse(notification);
    if (!realtimeEvent.success) {
      this.recordTurnNotification(notification);
      return;
    }
    let event = realtimeEvent.data;
    let timestamp = new Date().toISOString();
    let { threadId } = event.params;
    let recording = this.recordings.get(threadId);
    if (
      ((event.method === `thread/realtime/started` || recording == null) &&
        ((recording = this.createRecording({
          threadId,
          realtimeSessionId:
            event.method === `thread/realtime/started`
              ? (event.params.sessionId ?? event.params.realtimeSessionId ?? null)
              : null,
          timestamp,
          version: event.method === `thread/realtime/started` ? event.params.version : null,
        })),
        this.recordings.set(threadId, recording)),
      this.append(recording, {
        timestamp,
        type: `realtime_event`,
        payload: { method: event.method, params: redactRealtimePayload(event) },
      }),
      event.method === `thread/realtime/itemAdded`)
    ) {
      let handoff = handoffRequestSchema.safeParse(event.params.item);
      handoff.success && recording.pendingHandoffIds.push(handoff.data.handoff_id);
    }
    if (event.method === `thread/realtime/closed`) {
      recording.isClosed = true;
      this.deleteFinishedRecording(threadId, recording);
    }
  }

  /** 等待全部挂起写完成。 */
  async flush() {
    await this.pendingWrite;
  }

  /** 读当日最新的会话 JSONL（ENOENT 视为空）。 */
  async readMostRecentSessionLog(at: Date = new Date()) {
    if (!this.options.isRecordingEnabled()) return null;
    await this.flush();
    let dayDirectory = this.getDayDirectory(at);
    let entries = await readdir(dayDirectory, { withFileTypes: true }).catch((error: unknown) => {
      if (error instanceof Error && `code` in error && (error as any).code === `ENOENT`) return null;
      throw error;
    });
    if (entries == null) return null;
    let latest = entries
      .filter((entry) => entry.isFile())
      .map((entry) => entry.name)
      .filter((name) => name.startsWith(`realtime-`) && name.endsWith(`.jsonl`))
      .sort()
      .at(-1);
    return latest == null ? null : readFile(join(dayDirectory, latest));
  }

  /** 新建会话录制（写 realtime_session_meta 头）。 */
  private createRecording({
    threadId,
    realtimeSessionId,
    timestamp,
    version,
  }: {
    threadId: string;
    realtimeSessionId: string | null;
    timestamp: string;
    version: string | null;
  }) {
    let date = new Date(timestamp);
    let dayDirectory = this.getDayDirectory(date);
    let recording: SessionRecording = {
      filePath: join(
        dayDirectory,
        [`realtime`, timestamp.replaceAll(`:`, `-`), sanitizeFileToken(threadId), sanitizeFileToken(realtimeSessionId ?? `unknown-session`)].join(`-`) +
          `.jsonl`,
      ),
      pendingHandoffIds: [],
      handoffByTurnId: new Map(),
      embeddedTurnIds: new Set(),
      isClosed: false,
    };
    this.append(recording, {
      timestamp,
      type: `realtime_session_meta`,
      payload: {
        schema_version: 2,
        host_id: this.options.hostId,
        thread_id: threadId,
        realtime_session_id: realtimeSessionId,
        version,
      },
    });
    return recording;
  }

  /** `rootDirectory/YYYY/MM/DD`（UTC）。 */
  private getDayDirectory(date: Date) {
    return join(
      this.options.rootDirectory,
      String(date.getUTCFullYear()),
      String(date.getUTCMonth() + 1).padStart(2, `0`),
      String(date.getUTCDate()).padStart(2, `0`),
    );
  }

  /** turn 生命周期通知：started 绑定 pending handoff；completed 内嵌 rollout。 */
  private recordTurnNotification(notification: unknown) {
    let parsed = turnNotificationSchema.safeParse(notification);
    if (!parsed.success) return;
    let { threadId, turn } = parsed.data.params;
    let recording = this.recordings.get(threadId);
    if (recording == null) return;
    if (parsed.data.method === `turn/started`) {
      let handoffId = recording.pendingHandoffIds.shift();
      if (handoffId == null) return;
      recording.handoffByTurnId.set(turn.id, handoffId);
      this.append(recording, {
        timestamp: new Date().toISOString(),
        type: `handoff_turn`,
        payload: { status: `started`, handoff_id: handoffId, thread_id: threadId, turn_id: turn.id },
      });
      return;
    }
    let handoffId = recording.handoffByTurnId.get(turn.id);
    handoffId == null ||
      recording.embeddedTurnIds.has(turn.id) ||
      (recording.embeddedTurnIds.add(turn.id),
      this.embedRollout({ recording, threadId, turnId: turn.id, handoffId }));
  }

  /** turn 完成时把 rollout 段内嵌进录制文件（原 embedRollout）。 */
  private embedRollout({
    recording,
    threadId,
    turnId,
    handoffId,
  }: {
    recording: SessionRecording;
    threadId: string;
    turnId: string;
    handoffId: string;
  }) {
    this.enqueue(recording, async () => {
      try {
        let rolloutPath = await this.options.getRolloutPath?.(threadId);
        if (rolloutPath == null) return;
        let segment = await readRolloutSegment(rolloutPath, turnId);
        if (segment == null) return;
        let embeddedAt = new Date().toISOString();
        let entries = [
          {
            timestamp: embeddedAt,
            type: `embedded_rollout_meta`,
            payload: {
              handoff_id: handoffId,
              thread_id: threadId,
              turn_id: turnId,
              source_file: basename(rolloutPath),
              record_count: segment.length,
            },
          },
          ...segment.map((record: any) => ({
            timestamp: rolloutTimestamp(record) ?? embeddedAt,
            type: `embedded_rollout_event`,
            payload: { handoff_id: handoffId, thread_id: threadId, turn_id: turnId, source: record },
          })),
          {
            timestamp: new Date().toISOString(),
            type: `handoff_turn`,
            payload: { status: `completed`, handoff_id: handoffId, thread_id: threadId, turn_id: turnId },
          },
        ];
        await appendFile(
          recording.filePath,
          entries.map((entry) => JSON.stringify(entry)).join(`
`) +
            `
`,
          `utf8`,
        );
      } finally {
        recording.handoffByTurnId.delete(turnId);
        this.deleteFinishedRecording(threadId, recording);
      }
    });
  }

  /** 追加一条 JSONL（串行）。 */
  private append(recording: SessionRecording, entry: unknown) {
    this.enqueue(recording, () => appendFile(recording.filePath, `${JSON.stringify(entry)}\n`, `utf8`));
  }

  /** 串行写（先建目录；失败仅告警不断链）。 */
  private enqueue(recording: SessionRecording, write: () => Promise<unknown>) {
    this.pendingWrite = this.pendingWrite
      .then(async () => {
        await mkdir(dirname(recording.filePath), { recursive: true });
        await write();
      })
      .catch((error: unknown) => {
        logger().warning(`realtime_session_recording_failed`, {
          safe: {},
          sensitive: { error, filePath: recording.filePath },
        });
      });
  }

  /** 会话已关闭且无未完成 handoff 时移除录制登记。 */
  private deleteFinishedRecording(threadId: string, recording: SessionRecording) {
    this.recordings.get(threadId) === recording &&
      recording.isClosed &&
      recording.pendingHandoffIds.length === 0 &&
      recording.handoffByTurnId.size === 0 &&
      this.recordings.delete(threadId);
  }
}

// ---------------------------------------------------------------------------
// rollout 段读取（hw/gw/jwe/_w/Mwe/vw）
// ---------------------------------------------------------------------------

/**
 * 读 rollout JSONL 中 turn 的段（session_meta + task_started..task_complete）；
 * 未就绪（写入滞后）按 100ms×2 重试，仍无则 null（原 hw）。
 */
async function readRolloutSegment(rolloutPath: string, turnId: string, attempt = 0): Promise<any[] | null> {
  let records = (await readFile(rolloutPath, `utf8`))
    .split(/\r?\n/)
    .filter((line) => line.trim().length > 0)
    .flatMap((line) => {
      try {
        let record = JSON.parse(line);
        return isPlainObject(record) ? [record] : [];
      } catch {
        return [];
      }
    });
  let sessionMeta = records.find((record) => record.type === `session_meta`);
  let startIndex = records.findIndex((record) => isRolloutTurnEvent(record, `task_started`, turnId));
  let endIndex = records.findIndex((record, index) => index >= startIndex && isRolloutTurnEvent(record, `task_complete`, turnId));
  return startIndex >= 0 && endIndex >= startIndex
    ? [...(sessionMeta == null ? [] : [sessionMeta]), ...records.slice(startIndex, endIndex + 1)]
    : attempt >= 2
      ? null
      : (await delay(100), readRolloutSegment(rolloutPath, turnId, attempt + 1));
}

/** rollout 记录是否为指定 turn 的 event_msg（原 gw）。 */
function isRolloutTurnEvent(record: any, eventType: string, turnId: string) {
  return record.type !== `event_msg` || !isPlainObject(record.payload)
    ? false
    : record.payload.type === eventType && record.payload.turn_id === turnId;
}

/** rollout 记录的 timestamp（非字符串返回 null，原 jwe）。 */
function rolloutTimestamp(record: any) {
  return typeof record.timestamp == `string` ? record.timestamp : null;
}

/** 非数组对象判定（原 _w）。 */
function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value == `object` && !!value && !Array.isArray(value);
}

/** realtime 事件脱敏（原 Mwe）：audio 只记长度、sdp 只记字符数。 */
function redactRealtimePayload(event: any) {
  if (event.method === `thread/realtime/outputAudio/delta`) {
    let { audio } = event.params;
    return {
      ...event.params,
      audio: {
        sampleRate: audio.sampleRate,
        numChannels: audio.numChannels,
        samplesPerChannel: audio.samplesPerChannel,
        itemId: audio.itemId,
        encodedCharacters: audio.data.length,
        decodedBytes: Buffer.byteLength(audio.data, `base64`),
      },
    };
  }
  return event.method === `thread/realtime/sdp`
    ? { ...event.params, sdp: { redacted: true, characters: event.params.sdp.length } }
    : event.params;
}

/** 文件名安全化（非 [a-zA-Z0-9._-] → `_`，截断 120，原 vw）。 */
function sanitizeFileToken(value: string) {
  return value.replaceAll(/[^a-zA-Z0-9._-]/g, `_`).slice(0, 120);
}

// ---------------------------------------------------------------------------
// 语音时间账本（Nwe/Pwe/Fwe/Iwe/yw/Lwe）
// ---------------------------------------------------------------------------

/** presentation 来源条目（原 Nwe）。 */
const presentationSourceSchema = zDiscriminatedUnion(`type`, [
  zObject({
    type: zLiteral(`item`),
    itemId: zString().min(1),
    kind: zEnum([`created-thread`, `image`, `remote-task`, `subagent`]),
  }),
  zObject({
    type: zLiteral(`agent-message`),
    itemId: zString().min(1),
    index: zNumber().int().nonnegative(),
    kind: zEnum([`inline-markdown`, `inline-visualization`]),
  }),
]);

/** 账本公共字段（原 Pwe）。 */
const ledgerCommonSchema = zObject({
  schemaVersion: zLiteral(1),
  recordId: zString().min(1),
  occurredAtMs: zNumber(),
  sequence: zNumber().int().positive(),
});

/** 账本条目（按 type 判别，原 Fwe）。 */
const voiceTimelineEntrySchema = zDiscriminatedUnion(`type`, [
  zObject({ type: zLiteral(`session-started`), sessionId: zString().min(1) }),
  zObject({
    type: zLiteral(`session-ended`),
    sessionId: zString().min(1),
    outcome: zEnum([`ended`, `failed`]),
  }),
  zObject({
    type: zLiteral(`transcript-segment`),
    sessionId: zString().min(1),
    segmentId: zString().min(1),
    role: zEnum([`assistant`, `user`]),
    text: zString(),
  }),
  zObject({
    type: zLiteral(`voice-work-claimed`),
    sessionId: zString().min(1),
    turnId: zString().min(1),
    startedAtMs: zNumber(),
    handoffId: zString().min(1).optional(),
  }),
  zObject({
    type: zLiteral(`voice-work-terminal`),
    sessionId: zString().min(1),
    turnId: zString().min(1),
    status: zEnum([`completed`, `failed`, `interrupted`]).nullable(),
  }),
  zObject({
    type: zLiteral(`bem-user-item-observed`),
    sessionId: zString().min(1),
    turnId: zString().min(1),
    itemId: zString().min(1),
  }),
  zObject({
    type: zLiteral(`presentation-committed`),
    sessionId: zString().min(1),
    turnId: zString().min(1),
    presentationId: zString().min(1),
    source: presentationSourceSchema,
  }),
]);

/** 完整账本记录 schema（公共字段 + 判别条目，原 Iwe）。 */
const voiceTimelineRecordSchema = ledgerCommonSchema.and(voiceTimelineEntrySchema);

/** 宽松解析账本记录（失败返回 null，原 yw）。 */
export function parseVoiceTimelineRecord(value: unknown) {
  let parsed = voiceTimelineRecordSchema.safeParse(value);
  return parsed.success ? parsed.data : null;
}

/**
 * 语音时间账本（原 Lwe）：SQLite `thread_timeline_ledger` 表的幂等 append
 * （BEGIN IMMEDIATE；recordId 已存在直接返回；sequence 按 host+thread 取
 * MAX+1）、按序 list、readById（存储损坏抛错）。
 *
 * db 句柄由装配方注入（R10 159,399 经 n.si() 取 better-sqlite3 句柄）。
 */
export class VoiceTimelineLedger {
  db: any;

  constructor(db: any) {
    this.db = db;
  }

  /** 幂等追加一条记录（事务；无效记录抛 `Voice timeline record is invalid`）。 */
  append(scope: { hostId: string; conversationId: string }, record: any) {
    this.db.prepare(`BEGIN IMMEDIATE`).run();
    try {
      let existing = this.readById(scope, record.recordId);
      if (existing != null) return (this.db.prepare(`COMMIT`).run(), existing);
      let sequence =
        (this.db
          .prepare(
            `SELECT MAX(sequence) AS sequence
             FROM thread_timeline_ledger
             WHERE host_id = ? AND thread_id = ?`,
          )
          .get(scope.hostId, scope.conversationId)?.sequence ?? 0) + 1;
      let validated = parseVoiceTimelineRecord({ ...record, sequence });
      if (validated == null) throw Error(`Voice timeline record is invalid`);
      this.db
        .prepare(
          `INSERT INTO thread_timeline_ledger (
             host_id, thread_id, sequence, record_id, payload_json
           ) VALUES (?, ?, ?, ?, ?)`,
        )
        .run(scope.hostId, scope.conversationId, validated.sequence, validated.recordId, JSON.stringify(validated));
      this.db.prepare(`COMMIT`).run();
      return validated;
    } catch (error) {
      throw (this.db.prepare(`ROLLBACK`).run(), error);
    }
  }

  /** 按 sequence 列出全部记录（无效 payload 跳过）。 */
  list(scope: { hostId: string; conversationId: string }) {
    return this.db
      .prepare(
        `SELECT payload_json
         FROM thread_timeline_ledger
         WHERE host_id = ? AND thread_id = ?
         ORDER BY sequence`,
      )
      .all(scope.hostId, scope.conversationId)
      .flatMap((row: any) => {
        let record = parseVoiceTimelineRecord(JSON.parse(row.payload_json));
        return record == null ? [] : [record];
      });
  }

  /** 按 recordId 读单条（不存在返回 null；损坏抛错）。 */
  readById(scope: { hostId: string; conversationId: string }, recordId: string) {
    let row = this.db
      .prepare(
        `SELECT payload_json
         FROM thread_timeline_ledger
         WHERE host_id = ? AND thread_id = ? AND record_id = ?`,
      )
      .get(scope.hostId, scope.conversationId, recordId);
    if (row == null) return null;
    let record = parseVoiceTimelineRecord(JSON.parse(row.payload_json));
    if (record == null) throw Error(`Stored voice timeline record is invalid`);
    return record;
  }
}
