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

import { classNames, initializeClassNames as intlContextInit } from "../app-shared/ui/class-names";
import {
  $3 as runtimeLazy,
  I3 as getJsxRuntime,
  K2 as springRuntimeInit,
  Y2 as FormattedMessage,
  Yh as Button,
  e6 as ReactRuntime,
  n4 as useIntl,
  o_ as Tooltip,
} from "@rchunk/app-shared";
import * as sharedChunk from "@rchunk/app-shared";
import {
  C as appInitialInit,
} from "@rchunk/app-initial";
import * as initialChunk from "@rchunk/app-initial";
import {
  d as appPrimaryInit,
} from "@rchunk/app-primary";
import * as primaryChunk from "@rchunk/app-primary";
import { n as initializeHooks, t as HooksIcon } from "@rchunk/hooks";
import { a as initializeHooksSettingsCopy, n as formatHookEventName } from "@rchunk/hooks-settings-copy";
import { f as normalizeHookSource, p as initializeHooksSettingsModel } from "@rchunk/hooks-settings-model";
import { n as initializePlanImplementationRequest, r as isPlanImplementationRequest } from "@rchunk/plan-implementation-request";
import * as timestampsChunk from "@rchunk/timestamps";

void runtimeLazy; void appInitialInit; void appPrimaryInit;
void initializeHooks; void initializeHooksSettingsCopy; void initializeHooksSettingsModel;
void initializePlanImplementationRequest; void timestampsChunk;

let jsxRuntime: ReturnType<typeof getJsxRuntime> | undefined;
function jsx(): ReturnType<typeof getJsxRuntime> { jsxRuntime ??= getJsxRuntime(); return jsxRuntime; }
function callInitializer(value: unknown): void { if (typeof value === "function") value(); }

// ---------------------------------------------------------------------------
// RoleHeading（原 `Be`，导出 d）
// ---------------------------------------------------------------------------

/** 说话者。 */
export type MessageSpeaker = "user" | "assistant";

/** sr-only 角色标题（原 `Be`，导出 d）。 */
function RoleHeading(props: { speaker: MessageSpeaker }): unknown {
  const message = props.speaker === "user"
    ? { id: "codex.conversation.roleHeading.user", defaultMessage: "You said:", description: "Screen-reader-only heading announcing the start of a user message in a conversation" }
    : { id: "codex.conversation.roleHeading.assistant", defaultMessage: "ChatGPT said:", description: "Screen-reader-only heading announcing the start of a ChatGPT assistant message in a conversation" };
  switch (props.speaker) {
    case "user": case "assistant":
      return jsx().jsx("h4", { className: "sr-only m-0 select-none", children: jsx().jsx(FormattedMessage, message) });
  }
}

/** RoleHeading 初始化器（原 `Ue`，导出 f）。 */
let roleHeadingInitialized = false;
function initializeRoleHeading(): void {
  if (roleHeadingInitialized) return;
  roleHeadingInitialized = true;
  callInitializer(runtimeLazy);
  callInitializer(springRuntimeInit);
  jsx();
}

// ---------------------------------------------------------------------------
// HookStatsBadge（原 `We`，导出 l）
// ---------------------------------------------------------------------------

/** hook 统计条目。 */
export interface HookStats {
  count?: number;
  blockedCount?: number;
  errorCount?: number;
  entries?: Array<{ kind: "feedback" | "stop" | "error" | "warning"; text: string }>;
  runs?: Array<{ count: number; entries: Array<{ text: string; tone: "error" | "warning" }>; eventName: string; id: string; source: unknown; statusMessage?: string | null }>;
  [key: string]: unknown;
}

/** 线程详情级（原 `_e` 对照：STEPS_COMMANDS 判定）。 */
function isCommandsDetailLevel(threadDetailLevel: string | null | undefined): boolean {
  return (threadDetailLevel ?? "STEPS_COMMANDS") === "STEPS_COMMANDS";
}

function hookEntryLabel(kind: "feedback" | "stop" | "error" | "warning"): unknown {
  const messages = {
    feedback: ["assistantMessage.hookStats.entry.feedback", "Feedback"],
    stop: ["assistantMessage.hookStats.entry.stop", "Stop"],
    error: ["assistantMessage.hookStats.entry.error", "Error"],
    warning: ["assistantMessage.hookStats.entry.message", "Message"],
  } as const;
  const message = messages[kind];
  return jsx().jsx(FormattedMessage, { id: message[0], defaultMessage: message[1] });
}

/** hook 统计徽章（原 `We`，导出 l）：tooltip 内容 + 圆形图标按钮。 */
function HookStatsBadge(props: { stats: HookStats; threadDetailLevel?: string | null }): unknown {
  const detailed = isCommandsDetailLevel(props.threadDetailLevel);
  const intl = useIntl() as IntlLike;
  const label = intl.formatMessage({ id: "assistantMessage.hookStats.label", defaultMessage: "Hooks", description: "Accessible label for hook statistics" });
  const entries = detailed
    ? (props.stats.runs ?? []).flatMap((run) => [
        jsx().jsx("li", { children: formatHookEventName(run.eventName, intl as any) }, `${run.id}:event`),
        jsx().jsxs("li", { className: "flex min-w-0 flex-col", children: [
          jsx().jsx(FormattedMessage, { id: "assistantMessage.hookStats.source", defaultMessage: "{source}", values: { source: normalizeHookSource([run.source]) ?? "unknown" } }),
          run.count > 1 ? jsx().jsx(FormattedMessage, { id: "assistantMessage.hookStats.repeatCount", defaultMessage: " · {count} runs", values: { count: run.count } }) : null,
          run.statusMessage,
          ...(run.entries ?? []).map((entry, index) => jsx().jsx("span", { className: entry.tone === "error" ? "text-warning" : "opacity-65", children: entry.text }, `${run.id}:${index}`)),
        ] }, run.id),
      ])
    : (props.stats.entries ?? []).map((entry, index) => jsx().jsxs("li", {
        className: "contents",
        children: [
          jsx().jsx("span", { className: "opacity-65", children: hookEntryLabel(entry.kind) }),
          jsx().jsx("span", { className: "min-w-0 break-words whitespace-pre-wrap", children: entry.text }),
        ],
      }, `${entry.kind}:${index}:${entry.text}`));
  const NumberValue = (sharedChunk as any).H2 ?? "span";
  const summary = jsx().jsxs("div", {
    className: "flex min-w-0 flex-col gap-2 text-start",
    children: [
      jsx().jsx("div", { className: "font-medium", children: jsx().jsx(FormattedMessage, { id: detailed ? "assistantMessage.hookStats.codeTitle" : "assistantMessage.hookStats.title", defaultMessage: detailed ? "Hooks" : "Hooks summary" }) }),
      detailed ? null : jsx().jsxs("div", { className: "grid grid-cols-[auto_auto] gap-x-3 gap-y-1", children: [
        jsx().jsx("span", { className: "opacity-65", children: jsx().jsx(FormattedMessage, { id: "assistantMessage.hookStats.ranCount", defaultMessage: "Ran" }) }),
        jsx().jsx(NumberValue, { value: props.stats.count ?? 0 }),
        (props.stats.blockedCount ?? 0) > 0 ? jsx().jsx("span", { className: "opacity-65", children: jsx().jsx(FormattedMessage, { id: "assistantMessage.hookStats.blockedCount", defaultMessage: "Blocked" }) }) : null,
        (props.stats.blockedCount ?? 0) > 0 ? jsx().jsx(NumberValue, { value: props.stats.blockedCount }) : null,
        (props.stats.errorCount ?? 0) > 0 ? jsx().jsx("span", { className: "opacity-65", children: jsx().jsx(FormattedMessage, { id: "assistantMessage.hookStats.errorCount", defaultMessage: "Errors" }) }) : null,
        (props.stats.errorCount ?? 0) > 0 ? jsx().jsx(NumberValue, { value: props.stats.errorCount }) : null,
      ] }),
      entries.length === 0 ? null : jsx().jsx("ul", { className: "grid min-w-0 grid-cols-[auto_minmax(0,1fr)] gap-x-3 gap-y-1", children: entries }),
    ],
  });
  const icon = jsx().jsx(HooksIcon, { className: "icon-xs" });
  const button = jsx().jsx("button", { type: "button", "aria-label": label, className: "electron:[&>svg]:icon-sm flex cursor-default items-center justify-center rounded-full border border-transparent p-0.5 text-tertiary select-none no-drag", children: icon });
  return jsx().jsx(Tooltip, { tooltipContent: summary, tooltipClassName: "px-3 py-2", tooltipMaxWidth: "min(32rem, var(--radix-tooltip-content-available-width), calc(100vw - 16px))", children: button });
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

/** MessageBody 初始化器（原 `tt`，导出 c）。 */
let messageBodyInitialized = false;
function initializeMessageBody(): void {
  if (messageBodyInitialized) return;
  messageBodyInitialized = true;
  for (const candidate of [runtimeLazy, (sharedChunk as any).FX, (initialChunk as any).Zet, (initialChunk as any).itn,
    (initialChunk as any).IY, (initialChunk as any)._at]) callInitializer(candidate);
  jsx();
}

/** 时间戳底层初始化器（原 `rt`，导出 o）。 */
let timestampBaseInitialized = false;
function initializeTimestampBase(): void {
  if (timestampBaseInitialized) return;
  timestampBaseInitialized = true;
  callInitializer((timestampsChunk as any).a);
}

/** Timestamp 组件（原 `it`，导出 r）：text-xs text-tertiary span。 */
function Timestamp(props: { className?: string; nowMs?: number | null; sentAtMs: number | null; weekdayFormat?: string }): unknown {
  if (props.sentAtMs == null) return null;
  const intl = useIntl() as IntlLike;
  const text = formatTimestamp({ intl, sentAtMs: props.sentAtMs, now: props.nowMs == null ? new Date() : new Date(props.nowMs), weekdayFormat: props.weekdayFormat });
  return jsx().jsx("span", { className: classNames("text-xs text-tertiary", props.className), children: text });
}

/** Timestamp 初始化器（原 `st`，导出 i）。 */
let timestampInitialized = false;
function initializeTimestamp(): void {
  if (timestampInitialized) return;
  timestampInitialized = true;
  for (const candidate of [runtimeLazy, intlContextInit, springRuntimeInit]) callInitializer(candidate);
  initializeTimestampBase();
  jsx();
}

// ---------------------------------------------------------------------------
// MessageBody（原 `$e`，导出 s）
// ---------------------------------------------------------------------------

/** 消息正文（原 `$e`，导出 s）：Aeon 格式判定 + cwd/hostId 传递给渲染体。 */
function MessageBody(props: {
  collapsedLineCount?: number;
  cwd?: string | null;
  directives?: unknown;
  hostId?: string;
  isAeonFormatted?: boolean;
  text: string;
}): unknown {
  const scope = (sharedChunk as any).LX((initialChunk as any).$en);
  const capability = (sharedChunk as any).BX((initialChunk as any).Xet, { name: "browser.in-app" });
  const conversationId = capability?.isCapable ? ((initialChunk as any).rtn(scope.value) ?? undefined) : undefined;
  const content = jsx().jsx((initialChunk as any).FY, {
    cwd: props.cwd,
    directives: props.directives,
    externalLinkContextMenuConversationId: conversationId,
    hostId: props.hostId,
    text: props.text,
    variant: "user-message",
  });
  return jsx().jsx((initialChunk as any).gat, {
    collapsedLineCount: props.collapsedLineCount,
    isAeonFormatted: props.isAeonFormatted,
    text: props.text,
    children: content,
  });
}

// ---------------------------------------------------------------------------
// UserMessage 主组件（原 `yt`，导出 t）
// ---------------------------------------------------------------------------

/** 消息状态。 */
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
  messageStatus?: unknown;
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

interface UserMessageEditorProps {
  cwd?: string | null;
  hostId?: string;
  initialMessage: string;
  initialRenderFormat?: string;
  onCancel(): void;
  onDraftChange(value: string): void;
  onEditInputMount?: (dom: unknown) => void;
  onSubmit(value: string, format?: string): Promise<void>;
}

/** 原 `ct`：使用与新消息 composer 相同的 ProseMirror 控制器编辑历史消息。 */
function UserMessageEditor(props: UserMessageEditorProps): unknown {
  const react = (ReactRuntime as unknown as () => any)();
  const intl = useIntl() as IntlLike;
  const enterBehavior = (initialChunk as any).Kcn?.((sharedChunk as any).iz?.composerEnterBehavior);
  const plainTextMode = (initialChunk as any).Kcn?.((sharedChunk as any).iz?.composerPlainTextMode);
  const anchorRef = react.useRef(null);
  const createController = (): any => {
    const hasPathLinks = Boolean((initialChunk as any).m6?.(props.initialMessage));
    const hasMarkdownLinks = Boolean((initialChunk as any).p6?.(props.initialMessage));
    return (initialChunk as any).EZ(props.initialMessage, {
      defaultTextKind: props.initialRenderFormat === "markdown" || hasPathLinks || hasMarkdownLinks ? "prompt" : "plain",
      enterBehavior,
      enableRichText: props.initialRenderFormat === "markdown",
      enableSelectedTextLinks: true,
      enableSlashCommands: false,
      plainTextMode,
      restoreMarkdownLinksAsTextLinks: true,
      restorePathLinksAsFileMentions: hasPathLinks || !hasMarkdownLinks,
    });
  };
  const [controller] = react.useState(createController);
  const [submitting, setSubmitting] = react.useState(false);
  const layoutEffect = react.useLayoutEffect ?? react.useEffect;
  layoutEffect?.(() => props.onEditInputMount?.(controller.view.dom), [controller, props.onEditInputMount]);
  react.useEffect?.(() => {
    controller.setEnterBehavior(enterBehavior);
    controller.setPlainTextMode(plainTextMode);
  }, [controller, enterBehavior, plainTextMode]);
  react.useEffect?.(() => () => {
    if (!controller.view.isDestroyed) controller.destroy();
  }, [controller]);

  const roots = props.cwd == null ? undefined : [props.cwd];
  const mentions = (initialChunk as any).R?.(controller) ?? { ui: {} };
  const filesAndSkills = (initialChunk as any).NX?.(controller) ?? { ui: {} };
  const mentionPlacement = (primaryChunk as any)._l?.({ anchorRef, isActive: mentions.ui?.active ?? false });
  const filePlacement = (primaryChunk as any)._l?.({ anchorRef, isActive: filesAndSkills.ui?.active ?? false });
  const draftListener = react.useEffectEvent?.(() => props.onDraftChange(controller.getPersistedText()))
    ?? (() => props.onDraftChange(controller.getPersistedText()));
  const cancel = react.useEffectEvent?.(props.onCancel) ?? props.onCancel;
  react.useEffect?.(() => (initialChunk as any).i8?.(controller.view, draftListener), [controller]);
  react.useEffect?.(() => (initialChunk as any).kZ?.(controller.view, {
    Escape: (event: { defaultPrevented?: boolean; preventDefault(): void }) => {
      if (event.defaultPrevented) return false;
      event.preventDefault();
      cancel();
      return true;
    },
  }), [controller]);

  const submit = async (): Promise<void> => {
    if (submitting) return;
    setSubmitting(true);
    try {
      const format = controller.hasMarkdownFormatting() ? "markdown" : undefined;
      const value = format == null
        ? ((initialChunk as any).B5t?.(controller.getPlainText()) ?? controller.getPlainText())
        : controller.getText();
      await props.onSubmit(String(value).trim(), format);
    } finally {
      setSubmitting(false);
    }
  };
  const mentionResults = jsx().jsx((primaryChunk as any).vl ?? "div", {
    hostId: props.hostId,
    onAddContext: mentions.addMention,
    onRequestClose: mentions.closeAutocomplete,
    onUpdateSelectedMention: mentions.setSelectedMention,
    query: mentions.ui?.query ?? "",
    fileSearchRootPaths: roots,
    skillRoots: roots,
    source: mentions.ui?.source ?? null,
  });
  const mentionPopover = jsx().jsx((sharedChunk as any).vs ?? jsx().Fragment, {
    anchorRef,
    composerController: controller,
    isActive: mentions.ui?.active ?? false,
    mentionUiState: mentions.ui,
    placement: mentionPlacement,
    children: mentionResults,
  });
  const fileAutocomplete = jsx().jsx((initialChunk as any).IX ?? jsx().Fragment, {
    autocomplete: filesAndSkills,
    cwd: props.cwd ?? undefined,
    roots,
    hostId: props.hostId,
    composerController: controller,
    anchorRef,
    placement: filePlacement,
  });
  const plugins = jsx().jsx((initialChunk as any).a ?? jsx().Fragment, {
    composerController: controller,
    hostId: props.hostId,
    roots,
    shouldLoadPlugins: mentions.ui?.active === true,
  });
  const suggestionHandler = (event: unknown): void => {
    (initialChunk as any).z?.(event, {
      onAtMention: mentions.handleMentionEvent,
      onSkillMention: filesAndSkills.handleMentionEvent,
    });
  };
  const editor = jsx().jsx((initialChunk as any).mZ, {
    ariaLabel: intl.formatMessage({ id: "codex.userMessage.editTextareaAriaLabel", defaultMessage: "Edit message", description: "Aria label for the editor used to edit the previous user message" }),
    className: "font-content text-base",
    composerController: controller,
    placeholder: intl.formatMessage({ id: "codex.userMessage.editPlaceholder", defaultMessage: "Edit message", description: "Placeholder shown in the editor used to edit a previous user message" }),
    onSuggestionHandler: suggestionHandler,
    onSubmit: () => { void submit(); },
  });
  return jsx().jsx("form", {
    className: "relative flex w-full flex-col rounded-3xl bg-text/5",
    onSubmit: (event: { preventDefault(): void }) => { event.preventDefault(); void submit(); },
    children: jsx().jsxs("div", {
      ref: anchorRef,
      className: "relative z-10 flex min-h-0 flex-1 flex-col",
      children: [
        mentionPopover,
        fileAutocomplete,
        plugins,
        jsx().jsx("div", { className: "mb-2 flex-grow overflow-y-auto px-3 pt-3", children: editor }),
        jsx().jsxs("div", { className: "flex justify-end gap-1.5 px-3 pb-3", children: [
          jsx().jsx(Button, { color: "outline", size: "toolbar", disabled: submitting, onClick: props.onCancel, children: jsx().jsx(FormattedMessage, { id: "codex.userMessage.cancelEditMessage", defaultMessage: "Cancel" }) }),
          jsx().jsx(Button, { color: "primary", size: "toolbar", loading: submitting, type: "submit", children: jsx().jsx(FormattedMessage, { id: "codex.userMessage.sendEditedMessage", defaultMessage: "Send" }) }),
        ] }),
      ],
    }),
  });
}

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
  initializeUserMessage();
  const react = (ReactRuntime as unknown as () => any)();
  const intl = useIntl() as IntlLike;
  const scope = (sharedChunk as any).LX((initialChunk as any).$en);
  const analytics = (sharedChunk as any).HX((initialChunk as any).Cpn);
  const threadKey = props.threadId ?? (initialChunk as any).ttn?.(scope.value);
  const inferredAeon = (sharedChunk as any).BX(props.isAeonFormatted == null && (primaryChunk as any).zn, threadKey);
  const syntheticPlan = Boolean(isPlanImplementationRequest?.(props.message));
  const rawText = String((initialChunk as any).Bhn?.(props.message) ?? props.message);
  const text = syntheticPlan ? intl.formatMessage({ id: "codex.userMessage.implementPlan", defaultMessage: IMPLEMENT_PLAN_MESSAGE }) : rawText;
  const trimmed = text.trim();
  const hasContent = trimmed.length > 0;
  const isAeonFormatted = props.isAeonFormatted ?? Boolean(inferredAeon);
  const currentAccount = (sharedChunk as any).HX(null);
  const isOtherUser = currentAccount != null && props.senderAccountUserId !== currentAccount.accountUserId && props.senderAccountUserId !== currentAccount.email;
  const [copied, setCopied] = react.useState(false);
  const copying = react.useRef(false);
  const editDraft = props.turnId == null || editStateFamily == null
    ? null
    : (sharedChunk as any).BX(editStateFamily, props.turnId);
  const setEditDraft = (value: string | null): void => {
    if (props.turnId != null && editStateFamily != null) scope.set(editStateFamily, props.turnId, value);
  };
  const submitAnalytics = (action: "copy" | "edit"): void => {
    if (props.threadId == null || props.turnId == null) return;
    analytics?.submitCodexAnalyticsEvent?.({ action, eventKind: "action", metadata: { surface: "user_message" }, threadId: props.threadId, turnId: props.turnId });
  };
  const copy = (): void => {
    if (copying.current) return;
    copying.current = true;
    props.onCopy?.();
    submitAnalytics("copy");
    Promise.resolve((sharedChunk as any).Ym((initialChunk as any).lrn?.(trimmed) ?? trimmed))
      .then((didCopy: unknown) => { if (didCopy) { setCopied(true); setTimeout(() => setCopied(false), 1500); } })
      .finally(() => { copying.current = false; });
  };
  const startEditing = (): void => {
    submitAnalytics("edit");
    if (editDraft == null) setEditDraft(props.initialEditMessage?.trim() ?? trimmed);
  };
  const submitEdit = async (next: string, options?: unknown): Promise<void> => {
    try { await props.onEditMessage?.(next, options); setEditDraft(null); } catch { /* release silently preserves the draft */ }
  };
  const hasBadges = Boolean(props.referencesPriorConversation || props.reviewMode || props.pullRequestFixMode || props.autoResolveSync || props.hasExternalAttachments || (props.commentCount ?? 0) > 0);
  const shouldRenderBubble = hasContent || !hasBadges;
  const body = hasContent
    ? ((typeof props.messageContent === "function" ? props.messageContent(isAeonFormatted) : props.messageContent) ?? jsx().jsx(MessageBody, {
        text, cwd: props.cwd ?? null, hostId: props.hostId, collapsedLineCount: props.collapsedLineCount, isAeonFormatted,
      }))
    : jsx().jsx("div", { className: "mb-px text-size-chat text-codex-description", children: jsx().jsx(FormattedMessage, { id: "codex.userMessage.noContent", defaultMessage: "(No content)" }) });
  const bubble = editDraft != null && props.onEditMessage != null
    ? jsx().jsx("div", { className: "w-full p-px", children: jsx().jsx(UserMessageEditor, {
        cwd: props.cwd ?? null,
        hostId: props.hostId,
        initialMessage: editDraft.trim(),
        initialRenderFormat: props.editMessageFormat,
        onCancel: () => setEditDraft(null),
        onDraftChange: setEditDraft,
        onEditInputMount: props.onEditInputMount,
        onSubmit: submitEdit,
      }) })
    : shouldRenderBubble ? jsx().jsxs("div", {
        "data-user-message-bubble": true,
        className: classNames(
          "bg-user-message text-user-message relative min-w-0 max-w-(--user-chat-width) overflow-hidden break-words px-(--thread-content-margin) text-start [&_.contain-inline-size]:[contain:initial]",
          "_bubble_149ln_1",
          isAeonFormatted && "_compactMessageBubble_149ln_11",
          isOtherUser && "_otherUserMessage_149ln_35",
          isAeonFormatted ? "py-2" : "py-2.5",
          props.isTemporaryChat ? "_temporaryBubble_149ln_45" : "rounded-2xl",
          !hasContent && "leading-none",
        ),
        children: [
          props.isTemporaryChat ? jsx().jsx("svg", { "aria-hidden": true, className: "_temporaryOutline_149ln_51 pointer-events-none absolute inset-0 h-full w-full", focusable: "false", children: jsx().jsx("rect", { x: "0.5", y: "0.5", width: "calc(100% - 1px)", height: "calc(100% - 1px)", fill: "none", stroke: "currentColor", strokeOpacity: "0.4", strokeWidth: "1", strokeDasharray: "8 8", vectorEffect: "non-scaling-stroke" }) }) : null,
          body,
        ],
      }) : null;
  const copyLabel = copied ? "Copied" : "Copy message";
  const copyButton = jsx().jsx(Tooltip, { tooltipContent: copyLabel, children: jsx().jsx(Button, { color: "ghost", size: "icon", "aria-label": copyLabel, onClick: copied ? undefined : copy, children: jsx().jsx(copied ? (sharedChunk as any).em : (sharedChunk as any).af, { className: "icon-xs" }) }) });
  const canEdit = props.onEditMessage != null && props.turnId != null && !syntheticPlan;
  const actions = (hasContent || canEdit) && editDraft == null && !props.compactActions && !props.hideActions && !isAeonFormatted
    ? jsx().jsxs("div", {
        className: classNames("me-1 ms-1 flex items-center gap-2", !props.alwaysShowActions && "opacity-0 group-focus-within:opacity-100 group-hover:opacity-100"),
        children: [
          props.sentAtMs == null ? null : jsx().jsx(Timestamp, { sentAtMs: props.sentAtMs }),
          props.hookStats == null ? null : jsx().jsx(HookStatsBadge, { stats: props.hookStats, threadDetailLevel: props.threadDetailLevel }),
          hasContent ? copyButton : null,
          props.additionalActions,
          canEdit ? jsx().jsx(Button, { color: "ghost", size: "icon", "aria-label": "Edit message", onClick: startEditing, children: jsx().jsx((sharedChunk as any).Lu, { className: "icon-xs" }) }) : null,
        ],
      })
    : null;
  const badge = (children: unknown, key: string): unknown => children == null || children === false ? null : jsx().jsx("span", { className: "text-codex-description text-xs", children }, key);
  const badges = [
    props.messageStatus == null ? null : jsx().jsxs("span", { className: "ms-1 me-1 flex items-center gap-2", children: [props.messageStatusIcon, jsx().jsx("span", { className: "text-codex-description text-xs", children: props.messageStatus })] }),
    badge(props.referencesPriorConversation ? jsx().jsx(FormattedMessage, { id: "codex.userMessage.priorConversation", defaultMessage: "References prior conversation" }) : null, "prior"),
    badge(props.reviewMode ? jsx().jsx(FormattedMessage, { id: "codex.userMessage.reviewMode", defaultMessage: "Review mode" }) : null, "review"),
    badge(props.pullRequestFixMode ? jsx().jsx(FormattedMessage, { id: "codex.userMessage.pullRequestFixMode", defaultMessage: "PR fix" }) : null, "pr-fix"),
    badge(props.autoResolveSync ? jsx().jsx(FormattedMessage, { id: "codex.userMessage.autoResolveSync", defaultMessage: "Auto resolve conflicts" }) : null, "resolve"),
    badge((props.commentCount ?? 0) > 0 ? jsx().jsx(FormattedMessage, { id: "codex.userMessage.commentCount", defaultMessage: "{count, plural, one {# comment} other {# comments}}", values: { count: props.commentCount } }) : null, "comments"),
  ];
  const reactionPlacement = props.messageReactionPlacement ?? "corner";
  const reaction = editDraft == null && props.messageReaction != null
    ? jsx().jsx("div", { className: reactionPlacement === "below" ? "absolute end-4 -bottom-5 z-1" : "absolute -end-0.5 -bottom-0.5 translate-x-1/4 translate-y-1/4 rtl:-translate-x-1/4", "aria-live": "polite", "aria-atomic": true, children: props.messageReaction })
    : null;
  let renderedBubble: unknown = jsx().jsxs("div", { className: classNames("relative flex w-full justify-end", reactionPlacement === "corner" && reaction != null && "mb-2"), children: [bubble, reaction] });
  if (isAeonFormatted) {
    const compactReaction = reaction == null ? null : jsx().jsx("div", { className: classNames("_compactMessageReaction_149ln_7 relative flex size-7 items-center justify-center rounded-full border-2 border-surface", isOtherUser && "_otherUserMessage_149ln_35"), children: props.messageReaction });
    renderedBubble = jsx().jsxs("div", {
      className: classNames(editDraft != null ? "flex w-full flex-col items-end gap-1" : "grid max-w-full grid-cols-[auto_minmax(0,max-content)] items-center gap-x-2 gap-y-1", props.additionalActions == null && "gap-x-0", reaction != null && props.messageHeader == null && "pt-5"),
      children: [
        props.messageHeader == null ? null : jsx().jsx("div", { className: "_compactMessageContainer_149ln_27 col-start-2 flex min-w-0 justify-end", children: props.messageHeader }),
        editDraft == null && props.additionalActions != null ? jsx().jsx("div", { className: "col-start-1", children: props.additionalActions }) : null,
        jsx().jsxs("div", { className: classNames("relative col-start-2 min-w-0 justify-self-end", editDraft != null ? "w-full" : "_compactMessageContainer_149ln_27", reaction != null && props.messageHeader != null && "mt-5"), children: [
          bubble,
          reaction == null ? null : jsx().jsx("div", { className: "absolute -start-3.5 -top-5 z-10 translate-x-0.5 translate-y-0.5 rtl:-translate-x-0.5", "aria-live": "polite", "aria-atomic": true, children: compactReaction }),
        ] }),
      ],
    });
  }
  if (props.compactActions && !props.hideActions && hasContent && editDraft == null && !isAeonFormatted) {
    renderedBubble = jsx().jsxs("div", { className: "flex w-full items-center justify-end gap-1", children: [jsx().jsx("div", { className: "turn-action-controls opacity-0 group-focus-within:opacity-100 group-hover:opacity-100", children: copyButton }), renderedBubble] });
  }
  return jsx().jsxs("div", {
    className: "group flex w-full flex-col items-end justify-end gap-1",
    children: [
      isAeonFormatted ? null : props.messageHeader,
      renderedBubble,
      jsx().jsxs("div", { className: classNames("flex flex-row-reverse items-center gap-1", reactionPlacement === "below" && reaction != null && "me-12"), children: [...badges, actions] }),
    ],
  });
}

/** 编辑器状态上下文初始化器（原 `Qe`，导出 u）。 */
let editStateFamily: unknown;
let userMessageContextInitialized = false;
function initializeUserMessageContext(): void {
  if (userMessageContextInitialized) return;
  userMessageContextInitialized = true;
  for (const candidate of [runtimeLazy, ReactRuntime, springRuntimeInit, (sharedChunk as any).c_,
    initializeHooks, initializeHooksSettingsCopy, initializeHooksSettingsModel,
    (initialChunk as any).Fcn]) callInitializer(candidate);
  jsx();
}

/** 历史消息富文本编辑器依赖（原 `ut`）。 */
let userMessageEditorInitialized = false;
function initializeUserMessageEditor(): void {
  if (userMessageEditorInitialized) return;
  userMessageEditorInitialized = true;
  for (const candidate of [runtimeLazy, (sharedChunk as any).wL, ReactRuntime, springRuntimeInit,
    (sharedChunk as any).ys, (primaryChunk as any).bl, (initialChunk as any).o,
    (initialChunk as any).OZ, (initialChunk as any).R5t, (initialChunk as any).g6,
    (initialChunk as any).L, (primaryChunk as any).gl, (initialChunk as any).jX,
    (initialChunk as any).Vcn, (sharedChunk as any).Zh]) callInitializer(candidate);
  jsx();
}

/** CSS module 常量初始化（原 `vt`；类名已在构建产物中稳定哈希）。 */
let userMessageStylesInitialized = false;
function initializeUserMessageStyles(): void { userMessageStylesInitialized = true; }

/** 主组件初始化器（原 `wt`，导出 n）。 */
let userMessageInitialized = false;
function initializeUserMessage(): void {
  if (userMessageInitialized) return;
  userMessageInitialized = true;
  for (const candidate of [
    runtimeLazy,
    intlContextInit,
    (sharedChunk as any).FX,
    (initialChunk as any).Vhn,
    ReactRuntime,
    springRuntimeInit,
    initializePlanImplementationRequest,
    (primaryChunk as any).Rn,
    initializeUserMessageContext,
    (initialChunk as any).ypn,
    (initialChunk as any).itn,
    (sharedChunk as any).Xm,
    (initialChunk as any).urn,
    (sharedChunk as any).Zh,
    (sharedChunk as any).c_,
    (sharedChunk as any).tm,
    (sharedChunk as any).of,
    (sharedChunk as any).Ru,
    initializeMessageBody,
    initializeTimestamp,
    initializeUserMessageEditor,
    initializeUserMessageStyles,
  ]) callInitializer(candidate);
  jsx();
  editStateFamily = (sharedChunk as any).oZ((initialChunk as any).$en, () => null);
}

// ---------------------------------------------------------------------------
// 原版压缩导出名（chunk 间契约）
// ---------------------------------------------------------------------------

export {
  formatTimestamp as a,
  initializeMessageBody as c,
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
