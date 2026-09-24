// writing blocks（`:::writing` 指令块）上下文提取与合并（原版 47,662-47,815 区段）。
//
// 职责：从会话历史 turn 的 agent 消息文本中提取 `:::writing` directive 块
// （标题/正文/收件人/主题/元数据等），结合用户在 thread settings 里的手动
// 编辑快照（`codex-writing-block-*-v1:<key>` 键），生成注入 additionalContext
// 的「当前版本」快照文本；超过 800 字节的部分按 chunk 拆分为
// `codex_apps_writing_block_edits_part_N_of_M` 多键。
//
// 消费方：conversation/turn-dispatch（qxe 权限准备）、conversation/
// turn-context（queued message prepare）——经 extractWritingBlockContext /
// mergeWritingBlockContext 两个入口。

import {
  Ef as zRecord,
  Of as zString,
  Mf as zUnknown,
  jf as zUnion,
  bf as zLiteral,
} from "@chunk/shared";
import { AS as Marked, NS as walkTokens } from "../vendor/marked";
import {
  codexDirectiveExtension,
  preprocessDirectiveSource,
  applyDirectiveTokenPostProcessing,
} from "./codex-directives";

/** additionalContext 中 writing block 快照的键名（单 chunk 形态）。 */
const WRITING_BLOCK_EDITS_CONTEXT_KEY = `codex_apps_writing_block_edits`;
/** 单个 writing block 快照 chunk 的字节上限。 */
const WRITING_BLOCK_CHUNK_BYTE_LIMIT = 800;

/** writing-blocks 专用 Marked 实例（directive 扩展 + breaks + gfm）。 */
const writingBlocksMarked = new Marked({ ...codexDirectiveExtension, breaks: true, gfm: true });

/** 单字段（bcc/cc/content/recipient/subject/active-tone-section）的存储 schema。 */
const writingBlockFieldSchema = zString().optional().catch(undefined);

/** metadata 字段的存储 schema（任意 JSON 对象）。 */
const writingBlockMetadataSchema = zRecord(zString(), zUnknown()).optional().catch(undefined);

/** writing block 的稳定标识键：`<threadId>\n<JSON [turnId, blockId]>`。 */
function writingBlockContextKey(threadId: string, turnId: string | undefined, blockId: unknown) {
  return `${threadId}\n${JSON.stringify([turnId ?? ``, blockId])}`;
}

/** 取 writing block 的稳定 id：无显式 id 时按内容字段哈希生成 `codex-generated-<base36>`。 */
function resolveWritingBlockId(block: {
  id?: unknown;
  bodyContent: string;
  emailMetadata: { bcc?: unknown; cc?: unknown; recipient?: unknown; subject?: unknown };
  metadata: unknown;
  title?: unknown;
  variant?: unknown;
}) {
  if (block.id != null) return block.id;
  let serialized = JSON.stringify({
    bodyContent: block.bodyContent,
    emailMetadata: block.emailMetadata,
    metadata: block.metadata,
    title: block.title,
    variant: block.variant,
  });
  let hash = 0;
  for (let index = 0; index < serialized.length; index += 1) hash = (hash * 31 + serialized.charCodeAt(index)) % 2147483647;
  return `codex-generated-${hash.toString(36)}`;
}

/** 解析 metadata JSON（先尝试 decodeURIComponent 后的文本，再尝试原文）。 */
function parseMetadataJson(raw: string | undefined) {
  if (raw == null) return;
  let decoded = raw;
  try {
    decoded = decodeURIComponent(raw);
  } catch {}
  for (let candidate of decoded === raw ? [raw] : [decoded, raw]) {
    try {
      let parsed = writingBlockMetadataSchema.parse(JSON.parse(candidate));
      if (parsed != null) return parsed;
    } catch {}
  }
}

/**
 * 从历史 turn 提取 `:::writing` 块并注入用户手动编辑快照。
 *
 * @param threadId          会话 id
 * @param turns             倒序遍历的历史 turn（{turnId, messages}）
 * @param readThreadSetting thread settings 读取函数（`codex-writing-block-*-v1:` 键）
 * @param existingContext   现有 additionalContext（无变更时原样返回）
 * @param forceIncludeDeleted 已删除线程也强制包含（prewarm 路径）
 */
export function extractWritingBlockContext(
  threadId: string,
  turns: { turnId: string | null; messages: string[] }[],
  readThreadSetting: (key: string) => unknown,
  existingContext: Record<string, unknown> | undefined,
  forceIncludeDeleted = false,
) {
  if (Object.keys(existingContext ?? {}).some(isWritingBlockContextKey)) return existingContext;
  let threadDeleted = readThreadSetting(`codex-writing-block-deleted-thread-v1:${threadId}`) === true;
  if (threadDeleted && !forceIncludeDeleted) return existingContext;
  let seenBlockIds = new Set();
  let editedBlocks: {
    bcc: unknown;
    cc: unknown;
    content: unknown;
    recipient: unknown;
    subject: unknown;
    activeToneSectionId: unknown;
    id: unknown;
    metadata: unknown;
    turnId: string | null;
  }[] = [];
  for (let turnIndex = threadDeleted ? -1 : turns.length - 1; turnIndex >= 0; --turnIndex) {
    let turn = turns[turnIndex];
    for (let messageIndex = turn.messages.length - 1; messageIndex >= 0; --messageIndex) {
      let message = turn.messages[messageIndex];
      if (!message.includes(`:::writing`)) continue;
      // lexer 的第二参（options）省缺时走实例 defaults，显式传 undefined 保持等价。
      let tokens = writingBlocksMarked.lexer(preprocessDirectiveSource(message), undefined);
      applyDirectiveTokenPostProcessing(tokens);
      let extracted: unknown[] = [];
      // 逐 token 找 writing directive；attributes schema 为 record(string, string|true)。
      // 与原版一致：回调无返回值（walkTokens 的聚合结果被丢弃，仅取副作用）。
      walkTokens(tokens, (token: any) => {
        if (token.type !== `codexDirective` || !(`name` in token) || token.name !== `writing` || !(`attributes` in token))
          return;
        let attributes = zRecord(zString(), zUnion([zString(), zLiteral(true)])).parse(token.attributes);
        let readAttribute = (key: string) => readStringAttribute(attributes, key);
        extracted.push(
          resolveWritingBlockId({
            id: readAttribute(`id`),
            bodyContent: (`text` in token && typeof token.text == `string` ? token.text : ``)
              .replace(/^\r?\n/, ``)
              .replace(/\r?\n$/, ``),
            emailMetadata: {
              bcc: readAttribute(`bcc`),
              cc: readAttribute(`cc`),
              recipient: readAttribute(`recipient`),
              subject: readAttribute(`subject`),
            },
            metadata: parseMetadataJson(readAttribute(`metadata`)),
            title: readAttribute(`title`),
            variant: readAttribute(`variant`),
          }),
        );
      });
      // 倒序收集（新块优先），同 id 去重。
      for (let blockId of extracted.reverse()) {
        if (seenBlockIds.has(blockId)) continue;
        seenBlockIds.add(blockId);
        let contextKey = writingBlockContextKey(threadId, turn.turnId ?? undefined, blockId);
        let readField = (suffix: string) =>
          writingBlockFieldSchema.parse(readThreadSetting(`codex-writing-block-${suffix}-v1:${contextKey}`));
        let bcc = readField(`bcc`);
        let cc = readField(`cc`);
        let content = readField(`content`);
        let recipient = readField(`recipient`);
        let subject = readField(`subject`);
        let activeToneSectionId = readField(`active-tone-section`);
        let metadata = writingBlockMetadataSchema.parse(
          readThreadSetting(`codex-writing-block-metadata-v1:${contextKey}`),
        );
        if (
          bcc != null ||
          cc != null ||
          content != null ||
          recipient != null ||
          subject != null ||
          activeToneSectionId != null ||
          metadata != null
        ) {
          editedBlocks.push({
            bcc,
            cc,
            content,
            recipient,
            subject,
            activeToneSectionId,
            id: blockId,
            metadata,
            turnId: turn.turnId,
          });
        }
      }
    }
  }
  if (editedBlocks.length === 0 && (!forceIncludeDeleted || (!threadDeleted && seenBlockIds.size === 0)))
    return existingContext;
  let chunks = chunkByBytes(
    `The user manually edited these writing blocks. Treat the following snapshots as the current versions of those blocks, superseding the earlier assistant output.\n${JSON.stringify(
      editedBlocks.reverse(),
    )}`,
  );
  return {
    ...Object.fromEntries(
      chunks.map((chunk, index) => [
        chunks.length === 1 ? WRITING_BLOCK_EDITS_CONTEXT_KEY : `${WRITING_BLOCK_EDITS_CONTEXT_KEY}_part_${index + 1}_of_${chunks.length}`,
        {
          kind: `untrusted`,
          value:
            chunks.length === 1
              ? chunk
              : `User-edited writing block snapshots [${WRITING_BLOCK_EDITS_CONTEXT_KEY}] part ${index + 1} of ${chunks.length}:\n${chunk}`,
        },
      ]),
    ),
    ...existingContext,
  };
}

/**
 * 合并 writing block 上下文：override 中的 writing-block 键覆盖 base 同名键；
 * override 无 writing-block 键时保留 base 的全部键。
 */
export function mergeWritingBlockContext(
  base: Record<string, unknown> | undefined,
  override: Record<string, unknown> | undefined,
) {
  if (override == null) return base;
  let overrideHasWritingBlocks = Object.keys(override).some(isWritingBlockContextKey);
  return {
    ...Object.fromEntries(Object.entries(base ?? {}).filter(([key]) => !overrideHasWritingBlocks || !isWritingBlockContextKey(key))),
    ...override,
  };
}

/** additionalContext 键是否为 writing block 快照键（含多 chunk 形态）。 */
export function isWritingBlockContextKey(key: string) {
  return key === WRITING_BLOCK_EDITS_CONTEXT_KEY || key.startsWith(`${WRITING_BLOCK_EDITS_CONTEXT_KEY}_part_`);
}

/** 从 attributes 里读字符串值（非字符串一律 undefined）。 */
function readStringAttribute(attributes: Record<string, unknown>, key: string) {
  let value = attributes[key];
  return typeof value == `string` ? value : undefined;
}

/** 按字节（UTF-8 code unit 估算：codePoint 长度）把文本切成 ≤800 字节的 chunk。 */
function chunkByBytes(text: string) {
  let chunks: string[] = [];
  let current = ``;
  let currentBytes = 0;
  for (let char of text) {
    let codePoint = char.codePointAt(0) ?? 0;
    let byteLength = 4;
    if (codePoint < 128) byteLength = 1;
    else if (codePoint < 2048) byteLength = 2;
    else if (codePoint < 65536) byteLength = 3;
    if (currentBytes + byteLength > WRITING_BLOCK_CHUNK_BYTE_LIMIT) {
      chunks.push(current);
      current = ``;
      currentBytes = 0;
    }
    current += char;
    currentBytes += byteLength;
  }
  if (current.length > 0) chunks.push(current);
  return chunks;
}
