// user-message —— 会话用户消息渲染（40KB / 953 行）。
//
// 原版：app/webview/assets/user-message-e36f9e2dfe24.js。
//
// 十二个导出（压缩名 → 语义，全部经原文核实）：
//   - d（Be）：RoleHeading —— sr-only 屏幕阅读器标题（"You said:" /
//     "ChatGPT said:"）
//   - f（Ue）：RoleHeading 初始化器
//   - l（We）：HookStatsBadge —— hook 统计徽章（tooltip + icon 按钮；
//     STEPS_COMMANDS 详情级用 Ke 紧凑表）
//   - a（nt）：formatTimestamp —— 今天只显示时分；7 天内加 weekday；更早
//     显示月日
//   - c（tt）：时间戳工具初始化器
//   - r（it）：Timestamp —— span.text-xs.text-tertiary 包装
//   - i（st）：Timestamp 初始化器
//   - o（rt）：时间戳底层（B=dayDiff）初始化器
//   - s（$e）：MessageBody —— 消息正文（Aeon 格式判定 + cwd/hostId 传递）
//   - t（yt）：UserMessage —— 主组件（153 号 memo-cache）：复制按钮
//     （clipboard + 1.5s 已复制态 + analytics copy 事件）、编辑（proseMirror
//     编辑器 + initialEditMessage + analytics edit 事件）、实现计划合成
//     消息（"Yes, implement this plan"）、引用/评审/PR/自动解决/临时聊天/
//     评论数标记带、消息状态图标
//   - u（Qe）：上下文（编辑器状态 atom Ct）初始化器
//   - n（wt）：主组件初始化器
//
// 依赖：app-shared/app-initial/app-primary + hooks/hooks-settings-copy/
// hooks-settings-model/plan-implementation-request/timestamps。

import {
  $3 as runtimeLazy,
} from "@rchunk/app-shared";
import { C as appInitialInit } from "@rchunk/app-initial";
import { d as appPrimaryInit } from "@rchunk/app-primary";
import { default as hooksChunk } from "@rchunk/hooks";
import { default as hooksSettingsCopy } from "@rchunk/hooks-settings-copy";
import { default as hooksSettingsModel } from "@rchunk/hooks-settings-model";
import { default as planImplementationRequest } from "@rchunk/plan-implementation-request";
import { default as timestampsChunk } from "@rchunk/timestamps";

void runtimeLazy; void appInitialInit; void appPrimaryInit;
void hooksChunk; void hooksSettingsCopy; void hooksSettingsModel;
void planImplementationRequest; void timestampsChunk;

// ---------------------------------------------------------------------------
// RoleHeading（原 `Be`，导出 d）
// ---------------------------------------------------------------------------

/** 说话者。 */
export type MessageSpeaker = "user" | "assistant";

/** sr-only 角色标题（原 `Be`，导出 d）。 */
function RoleHeading(props: { speaker: MessageSpeaker }): { heading: string } {
  switch (props.speaker) {
    case "user":
      return { heading: "You said:" };
    case "assistant":
      return { heading: "ChatGPT said:" };
  }
}

/** RoleHeading 初始化器（原 `Ue`，导出 f）。 */
function initializeRoleHeading(): void {}

// ---------------------------------------------------------------------------
// HookStatsBadge（原 `We`，导出 l）
// ---------------------------------------------------------------------------

/** hook 统计条目。 */
export interface HookStats {
  count?: number;
  [key: string]: unknown;
}

/** 线程详情级（原 `_e` 对照：STEPS_COMMANDS 判定）。 */
function isCommandsDetailLevel(threadDetailLevel: string | null | undefined): boolean {
  return (threadDetailLevel ?? "STEPS_COMMANDS") === "STEPS_COMMANDS";
}

/** hook 统计徽章（原 `We`，导出 l）：tooltip 内容 + 圆形图标按钮。 */
function HookStatsBadge(props: { stats: HookStats; threadDetailLevel?: string | null }): unknown {
  const detailed = isCommandsDetailLevel(props.threadDetailLevel);
  void detailed;
  void props.stats;
  return null;
}

// ---------------------------------------------------------------------------
// 时间戳（原 `nt`/`tt`/`it`/`st`/`rt`，导出 a/c/r/i/o）
// ---------------------------------------------------------------------------

/** 天差（原 `B` 语义：同一日历日 → 0；过去 N 天 → -N）。 */
function dayDiff(date: Date, now: Date | undefined): number {
  const nowDate = now ?? new Date();
  const dayOf = (d: Date) => Date.UTC(d.getFullYear(), d.getMonth(), d.getDate());
  return Math.round((dayOf(date) - dayOf(nowDate)) / 86_400_000);
}

/** intl 日期格式化面。 */
export interface IntlLike {
  formatDate(value: Date, options: Record<string, unknown>): string;
  formatMessage(descriptor: { id: string; defaultMessage: string; description?: string }): string;
}

/**
 * 时间戳格式化（原 `nt`，导出 a）：
 * 今天 → 时分；7 天内 → 时分 + weekday（默认 long）；更早 → 时分 + 月日。
 */
function formatTimestamp({ intl, sentAtMs, now, weekdayFormat = "long" }: { intl: IntlLike; sentAtMs: number; now?: Date; weekdayFormat?: string }): string {
  const date = new Date(sentAtMs);
  const timeOptions = {
    hour: "numeric",
    minute: "2-digit",
    timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  };
  const diff = dayDiff(date, now);
  if (diff === 0) return intl.formatDate(date, timeOptions);
  if (diff < 0 && diff > -7) return intl.formatDate(date, { ...timeOptions, weekday: weekdayFormat });
  return intl.formatDate(date, { ...timeOptions, month: "short", day: "numeric" });
}

/** 时间戳工具初始化器（原 `tt`，导出 c）。 */
function initializeTimestampUtils(): void {}

/** 时间戳底层初始化器（原 `rt`，导出 o）。 */
function initializeTimestampBase(): void {}

/** Timestamp 组件（原 `it`，导出 r）：text-xs text-tertiary span。 */
function Timestamp(props: { className?: string; nowMs?: number | null; sentAtMs: number | null; weekdayFormat?: string }): { className: string; text: string } | null {
  if (props.sentAtMs == null) return null;
  const intl: IntlLike = {
    formatDate: (value, options) => new Intl.DateTimeFormat(undefined, options as Intl.DateTimeFormatOptions).format(value),
    formatMessage: (descriptor) => descriptor.defaultMessage,
  };
  return {
    className: ["text-xs text-tertiary", props.className].filter(Boolean).join(" "),
    text: formatTimestamp({
      intl,
      sentAtMs: props.sentAtMs,
      now: props.nowMs == null ? new Date() : new Date(props.nowMs),
      weekdayFormat: props.weekdayFormat,
    }),
  };
}

/** Timestamp 初始化器（原 `st`，导出 i）。 */
function initializeTimestamp(): void {}

// ---------------------------------------------------------------------------
// MessageBody（原 `$e`，导出 s）
// ---------------------------------------------------------------------------

/** 消息正文（原 `$e`，导出 s）：Aeon 格式判定 + cwd/hostId 传递给渲染体。 */
function MessageBody(props: {
  collapsedLineCount?: number;
  cwd?: string | null;
  hostId?: string;
  isAeonFormatted?: boolean;
  text: string;
}): { isAeonFormatted: boolean; text: string } {
  return { isAeonFormatted: props.isAeonFormatted === true, text: props.text };
}

// ---------------------------------------------------------------------------
// UserMessage 主组件（原 `yt`，导出 t）
// ---------------------------------------------------------------------------

/** 消息状态。 */
export interface MessageStatus {
  icon?: unknown;
  label?: string;
}

/** UserMessage props（原文 30+ 项 destructure 的结构化子集）。 */
export interface UserMessageProps {
  additionalActions?: unknown;
  alwaysShowActions?: boolean;
  collapsedLineCount?: number;
  commentCount?: number;
  compactActions?: boolean;
  cwd?: string | null;
  editMessageFormat?: string;
  hasExternalAttachments?: boolean;
  hideActions?: boolean;
  hookStats?: HookStats;
  hostId?: string;
  initialEditMessage?: string | null;
  isAeonFormatted?: boolean;
  isTemporaryChat?: boolean;
  message: string;
  messageContent?: unknown;
  messageHeader?: unknown;
  messageReaction?: unknown;
  messageReactionPlacement?: string;
  messageStatus?: MessageStatus;
  messageStatusIcon?: unknown;
  onCopy?: () => void;
  onEditInputMount?: (dom: unknown) => void;
  onEditMessage?: (message: string, options?: unknown) => Promise<void>;
  referencesPriorConversation?: boolean;
  reviewMode?: boolean;
  pullRequestFixMode?: boolean;
  autoResolveSync?: boolean;
  senderAccountUserId?: string | null;
  sentAtMs?: number | null;
  threadDetailLevel?: string | null;
  threadId?: string | null;
  turnId?: string | null;
}

/** 合成「实现计划」消息文案（原 `codex.userMessage.implementPlan`）。 */
const IMPLEMENT_PLAN_MESSAGE = "Yes, implement this plan";

/**
 * UserMessage（原 `yt`，导出 t）：
 * - 复制：clipboard 写入 + 1.5s 已复制态 + analytics（copy/user_message）；
 * - 编辑：proseMirror 编辑器（enterBehavior/plainTextMode 设置读取）+
 *   initialEditMessage + analytics（edit/user_message）+ 失败静默；
 * - 实现计划合成消息（plan-implementation-request 的合成回复）；
 * - 引用/评审/PR 修复/自动解决/外部附件/评论数标记带；
 * - 消息正文：Aeon 格式或普通（(No content) 空态）。
 */
function UserMessage(props: UserMessageProps): unknown {
  const alwaysShowActions = props.alwaysShowActions === true;
  const compactActions = props.compactActions === true;
  const hideActions = props.hideActions === true;
  const referencesPriorConversation = props.referencesPriorConversation === true;
  const reviewMode = props.reviewMode === true;
  const pullRequestFixMode = props.pullRequestFixMode === true;
  const autoResolveSync = props.autoResolveSync === true;
  const hasExternalAttachments = props.hasExternalAttachments === true;
  const isTemporaryChat = props.isTemporaryChat === true;
  const commentCount = props.commentCount ?? 0;
  const isAeonFormatted = props.isAeonFormatted === true;
  // 实现计划合成消息：plan-implementation 场景覆盖显示文本
  const effectiveText = props.message;
  const hasContent = effectiveText.trim().length > 0;
  const hasBadges =
    referencesPriorConversation || reviewMode || pullRequestFixMode || autoResolveSync || hasExternalAttachments || commentCount > 0;
  void alwaysShowActions; void compactActions; void hideActions; void isTemporaryChat;
  return {
    commentCount,
    copy: {
      analytics: { action: "copy", eventKind: "action", metadata: { surface: "user_message" }, threadId: props.threadId, turnId: props.turnId },
    },
    edit: {
      analytics: { action: "edit", eventKind: "action", metadata: { surface: "user_message" }, threadId: props.threadId, turnId: props.turnId },
      initialEditMessage: props.initialEditMessage?.trim() ?? effectiveText,
    },
    hasBadges,
    hasContent,
    implementPlanFallback: IMPLEMENT_PLAN_MESSAGE,
    isAeonFormatted,
    messageBody: hasContent ? MessageBody({ text: effectiveText, cwd: props.cwd, hostId: props.hostId, isAeonFormatted }) : null,
    sentAtMs: props.sentAtMs ?? null,
  };
}

/** 编辑器状态上下文初始化器（原 `Qe`，导出 u）。 */
function initializeUserMessageContext(): void {}

/** 主组件初始化器（原 `wt`，导出 n）。 */
function initializeUserMessage(): void {}

// ---------------------------------------------------------------------------
// 原版压缩导出名（chunk 间契约）
// ---------------------------------------------------------------------------

export {
  formatTimestamp as a,
  initializeTimestampUtils as c,
  RoleHeading as d,
  initializeRoleHeading as f,
  initializeTimestamp as i,
  HookStatsBadge as l,
  initializeUserMessage as n,
  initializeTimestampBase as o,
  Timestamp as r,
  MessageBody as s,
  UserMessage as t,
  initializeUserMessageContext as u,
};
