// steering user message 合并与孤儿回收。
//
// 原版 main-C-Mhak1n.ts 30,037-30,187。用户在 turn 进行中排队/改道的消息
// 先以 `steeringUserMessage` item 挂在 turn 上（带 targetTurnId/
// targetTurnStartedAtMs 与 restoreMessage 上下文）；app-server 实际接收后
// 以普通 userMessage 形态回流，需要：
//   - fg：把回流的 userMessage 与挂起的 steering item 匹配（按 clientId、
//     目标 turn、输入内容容差比较——图片可缺失）；
//   - vg：确认接收——把匹配的 steering item 标记 accepted 并回填
//     serverUserMessageId（不匹配时追加 steered 标记项）；
//   - gg/_g：孤儿回收——turn 被改道后，遗留的未绑定 steering item 迁移到
//     目标 turn 并把源头的占位 userMessage 标记 completed；
//   - yge：opening user message 判定（回流消息是否就是 turn 的首条输入）。

import { ps as filterAddedFiles } from "@chunk/shared";
import { current, freezeIdentity, isDraft, produce } from "../vendor/immer";
import { deepEqual } from "../util/lodash-interop";
import { takeLastRequestSection } from "../prompts/section-markers";
// ug：用户输入归一化（剥 <image> 占位/评论附件展开）——定义于 image
// placeholders 簇（29,752-30,065，尚未重写）。
import { ug as normalizeUserInput } from "../conversations/image-placeholders";

/** turn 或其 item 上的宽松类型（双路径模型：canonical/legacy 共用）。 */
export interface AnyTurn {
  turnId?: string | null;
  turnStartedAtMs?: number | null;
  status?: string;
  items: any[];
  params: any;
  itemsPagination?: any;
  localMetadata?: any;
  [key: string]: unknown;
}

/** steeringUserMessage item（挂起的用户改道消息）。 */
interface SteeringUserMessage {
  type: `steeringUserMessage`;
  id: string;
  targetTurnId?: string | null;
  targetTurnStartedAtMs?: number | null;
  clientUserMessageId?: string | null;
  serverUserMessageId?: string | null;
  restoreMessage: { context: any };
  compareKey: { rawText: string; imageCount: number };
  [key: string]: unknown;
}

/** 构造待发送的 steeringUserMessage（原版 dg）。 */
export function buildSteeringUserMessage(
  id: string,
  input: unknown,
  restoreMessage: { context: { commentAttachments?: unknown; [key: string]: unknown }; [key: string]: unknown },
  {
    attachments = [],
    clientUserMessageId = null,
    shouldStripImageDisplayPlaceholderLines = false,
    targetTurnId = null,
    targetTurnStartedAtMs = null,
  }: {
    attachments?: unknown[];
    clientUserMessageId?: string | null;
    shouldStripImageDisplayPlaceholderLines?: boolean;
    targetTurnId?: string | null;
    targetTurnStartedAtMs?: number | null;
  } = {},
) {
  let normalized = normalizeUserInput({
    input,
    commentAttachments: restoreMessage.context.commentAttachments,
    shouldStripImageDisplayPlaceholderLines,
  });
  return {
    type: 'steeringUserMessage' as const,
    id,
    targetTurnId,
    targetTurnStartedAtMs,
    status: 'pending',
    serverUserMessageId: null,
    clientUserMessageId,
    input,
    attachments,
    restoreMessage,
    compareKey: { rawText: normalized.rawText, imageCount: normalized.imageCount },
  };
}

/** 是否 steeringUserMessage item（原版 yg）。 */
export function isSteeringUserMessage(item: any): item is SteeringUserMessage {
  return item.type === `steeringUserMessage`;
}

/** steering item 的目标是否指向给定 turn（原版 _ge）。 */
function matchesTargetTurn(
  item: SteeringUserMessage,
  turnId: string | null,
  turnStartedAtMs: number | null,
): boolean {
  return item.targetTurnId == null
    ? item.targetTurnStartedAtMs != null && item.targetTurnStartedAtMs === turnStartedAtMs
    : item.targetTurnId === turnId;
}

/**
 * 输入容差比较（原版 vge）：rawText 全等；或（允许缺图时）请求段之后的
 * 文本相等且来源带图、目标无图（图片已在 UI 展示后剥离）。图片数严格
 * 相等（或同样允许缺失）。
 */
function inputsEqualWithImageTolerance(
  expected: { rawText: string; imageCount: number },
  actual: { rawText: string; imageCount: number },
  { acceptMissingImageInputs }: { acceptMissingImageInputs: boolean },
): boolean {
  let textEquals = expected.rawText === actual.rawText;
  let textEqualsIgnoringImages =
    acceptMissingImageInputs &&
    expected.imageCount > 0 &&
    takeLastRequestSection(expected.rawText) === takeLastRequestSection(actual.rawText);
  if (!textEquals && !textEqualsIgnoringImages) return false;
  return (
    expected.imageCount === actual.imageCount ||
    (acceptMissingImageInputs && expected.imageCount > 0 && actual.imageCount === 0)
  );
}

/**
 * steering item 与回流输入是否匹配（原版 gge）：把输入按 item 的评论附件
 * 上下文归一化后做容差比较。
 */
function steeringMessageMatchesInput(
  item: SteeringUserMessage,
  input: any,
  {
    acceptMissingImageInputs = false,
    commentAttachments = item.restoreMessage.context.commentAttachments,
    shouldStripAdjacentImageDisplayPlaceholders = false,
    shouldStripImageDisplayPlaceholderLines = false,
  }: {
    acceptMissingImageInputs?: boolean;
    commentAttachments?: any;
    shouldStripAdjacentImageDisplayPlaceholders?: boolean;
    shouldStripImageDisplayPlaceholderLines?: boolean;
  } = {},
): boolean {
  let normalized = normalizeUserInput({
    input,
    commentAttachments,
    shouldStripAdjacentImageDisplayPlaceholders,
    shouldStripImageDisplayPlaceholderLines,
  });
  return inputsEqualWithImageTolerance(item.compareKey, normalized, { acceptMissingImageInputs });
}

/**
 * 找到与回流消息匹配的挂起 steering item（原版 fg）：候选为 pending/
 * accepted 且未绑定 server id、目标指向给定 turn 的 item；优先 clientId
 * 精确匹配，其次内容匹配（clientId 缺失的候选也可兜底）。
 */
export function findMatchingSteeringMessage(
  items: any[],
  input: any,
  turnId: string | null,
  turnStartedAtMs: number | null,
  acceptMissingImageInputs: boolean,
  clientUserMessageId: string | null = null,
): SteeringUserMessage | null {
  let candidates = items.filter(
    (item): item is SteeringUserMessage =>
      (item.status === `pending` || item.status === `accepted`) &&
      item.serverUserMessageId == null &&
      matchesTargetTurn(item, turnId, turnStartedAtMs),
  );
  if (clientUserMessageId != null) {
    let byClientId = candidates.find(
      (item) => item.clientUserMessageId === clientUserMessageId,
    );
    if (byClientId != null) return byClientId;
  }
  return candidates.find(
    (item) =>
      (clientUserMessageId == null || item.clientUserMessageId == null) &&
      steeringMessageMatchesInput(item, input, {
        acceptMissingImageInputs,
        shouldStripImageDisplayPlaceholderLines: acceptMissingImageInputs,
      }),
  );
}

/** 回流的 userMessage 是否就是 turn 的 opening user message（原版 yge）。 */
export function isOpeningUserMessage(turn: AnyTurn, index: number, message: any): boolean {
  let openingUserMessageId = turn.itemsPagination?.openingUserMessageId;
  if (openingUserMessageId !== void 0) return message.id === openingUserMessageId;
  if (message.clientId != null && turn.params.clientUserMessageId != null)
    return message.clientId === turn.params.clientUserMessageId;
  // 无显式锚点时：items 未加载全或输入内容不同 → 不是 opening；
  // 否则要求 index 之前只有不影响 transcript 的合成项。
  if (turn.itemsPagination?.hasLoadedOldest === false || !deepEqual(message.content, turn.params.input))
    return false;
  let items = isDraft(turn.items) ? current(turn.items) : turn.items;
  for (let i = 0; i < index; i += 1) {
    let item = items[i];
    if (
      item != null &&
      item.type !== `automaticApprovalReview` &&
      item.type !== `contextCompaction` &&
      item.type !== `forkedFromConversation` &&
      item.type !== `modelChanged` &&
      item.type !== `modelRerouted` &&
      item.type !== `personalityChanged` &&
      item.type !== `remoteTaskCreated` &&
      item.type !== `steeringUserMessage` &&
      item.type !== `worktreeInit`
    )
      return false;
  }
  return true;
}

/** item 类型谓词（原版 pg）。 */
function isItemType(item: any, type: string): boolean {
  return item.type === type;
}

/** 按 id upsert item（原版 mg；findIndex 在 current 视图上做，写入落在
 *  draft。Rve 的 fileChange patchUpdated 等消费）。 */
export function upsertItem(turn: AnyTurn, item: any): void {
  let index = (isDraft(turn.items) ? current(turn.items) : turn.items).findIndex(
    (existing: any) => existing.id === item.id,
  );
  if (index >= 0) turn.items[index] = item;
  else turn.items.push(item);
}

/** 未绑定 server id 的 steering item（原版 hg；item-merge 的 Cg 消费）。 */
export function isUnboundSteeringMessage(item: any): item is SteeringUserMessage {
  return isSteeringUserMessage(item) && item.serverUserMessageId == null;
}

/**
 * 跨 turn 回收 steering 孤儿（原版 gg）：目标指向其他 turn 的 steering
 * item 从源 turn 移除并 upsert 进目标 turn（目标 items 先 copy 避免共享
 * 引用），最后对每个目标 turn 做单 turn 孤儿回收。
 */
export function recoverSteeringOrphans(turns: AnyTurn[]): void {
  let turnsByTurnId = new Map(turns.map((turn) => [turn.turnId, turn]));
  let touchedTurns = new Set<AnyTurn>();
  for (let turn of turns) {
    let remaining = turn.items.filter((item) => {
      if (!isSteeringUserMessage(item)) return true;
      let target = item.targetTurnId == null ? null : turnsByTurnId.get(item.targetTurnId);
      if (target == null || target === turn) return true;
      target.items = target.items.slice();
      upsertItem(target, item);
      touchedTurns.add(target);
      return false;
    });
    if (remaining.length !== turn.items.length) turn.items = remaining;
  }
  for (let turn of touchedTurns) recoverTurnSteeringOrphans(turn);
}

/**
 * 单 turn 孤儿回收（原版 _g）：turn 上存在未绑定 server id 的 steering
 * item 时，把与之 clientId 匹配的占位 userMessage 标记为 completed（确认
 * 接收，使其不再显示为待定）。
 */
export function recoverTurnSteeringOrphans(turn: AnyTurn): void {
  let pendingSteering = turn.items.filter(isUnboundSteeringMessage);
  if (pendingSteering.length === 0) return;
  let items = isDraft(turn.items) ? current(turn.items) : turn.items;
  for (let item of items)
    if (
      isItemType(item, `userMessage`) &&
      item.clientId != null &&
      pendingSteering.some((steering) => steering.clientUserMessageId === item.clientId)
    )
      acceptServerUserMessage(turn, item, `completed`, null);
}

/**
 * 确认 app-server 已接收的用户消息（原版 vg）：
 *   - 已有绑定到该 server id 的 steering item → no-op；
 *   - 消息即 opening user message（或目标就是本 turn 且匹配挂起 item）→
 *     把匹配的 steering item 置 accepted + serverUserMessageId（改道场景
 *     追加 steered 标记项、累计附件计数）；
 *   - 否则把 userMessage 原样 upsert 进 turn。
 */
export function acceptServerUserMessage(
  turn: AnyTurn,
  message: any,
  status: string,
  modelProvider: string | null,
  targetTurnId: string | null = turn.turnId,
): void {
  for (let item of turn.items)
    if (isSteeringUserMessage(item) && item.serverUserMessageId === message.id) return;
  let messageIndex = (isDraft(turn.items) ? current(turn.items) : turn.items).findIndex(
    (item: any) => item.id === message.id,
  );
  if (targetTurnId !== turn.turnId || !isOpeningUserMessage(turn, messageIndex < 0 ? turn.items.length : messageIndex, message)) {
    let match = buildSteeredMatch({
      turn,
      targetTurnId,
      input: message.content,
      clientUserMessageId: message.clientId,
      modelProvider,
    });
    if (match != null) {
      if (status === `started`) return;
      if (
        targetTurnId === turn.turnId &&
        match.fileAttachmentCount > 0
      )
        turn.localMetadata = {
          fileAttachmentCount:
            (turn.localMetadata?.fileAttachmentCount ?? 0) + match.fileAttachmentCount,
        };
      let accepted = { ...match.item, status: `accepted`, serverUserMessageId: message.id };
      let matchIndex = turn.items.indexOf(match.item);
      turn.items = turn.items.slice();
      turn.items[matchIndex] = accepted;
      // 保持在占位 userMessage 之后的相对顺序（steering item 从后位移到其前）。
      if (messageIndex >= 0 && matchIndex > messageIndex)
        turn.items.splice(messageIndex, 0, ...turn.items.splice(matchIndex, 1));
      if (targetTurnId === turn.turnId)
        upsertItem(turn, freezeIdentity({ type: `steered`, id: message.id }));
      return;
    }
  }
  if (targetTurnId === turn.turnId) upsertItem(turn, freezeIdentity(message));
}

/**
 * 为回流消息构造 steered 匹配（原版 bge）：找到匹配的挂起 steering item
 * 并统计附件数（文件/粘贴文本/已上传/新增文件）。
 */
function buildSteeredMatch({
  turn,
  targetTurnId,
  input,
  clientUserMessageId,
  modelProvider,
}: {
  turn: AnyTurn;
  targetTurnId: string | null;
  input: any;
  clientUserMessageId: string | null;
  modelProvider: string | null;
}): { item: SteeringUserMessage; fileAttachmentCount: number } | null {
  let match = findMatchingSteeringMessage(
    turn.items.filter(isSteeringUserMessage),
    input,
    targetTurnId,
    turn.turnStartedAtMs,
    false,
    clientUserMessageId,
  );
  if (match == null) return null;
  let { context } = match.restoreMessage;
  return {
    item: match,
    fileAttachmentCount:
      (context.fileAttachments?.length ?? 0) +
      (context.pastedTextAttachments?.length ?? 0) +
      (context.uploadedFileAttachments?.length ?? 0) +
      (context.addedFiles?.filter(filterAddedFiles).length ?? 0),
  };
}

// ---------------------------------------------------------------------------
// 兼容导出（原版压缩名；R4 切换语义名后移除）
// ---------------------------------------------------------------------------

export { buildSteeringUserMessage as dg, findMatchingSteeringMessage as fg };
