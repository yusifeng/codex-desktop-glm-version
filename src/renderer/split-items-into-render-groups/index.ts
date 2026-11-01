// split-items-into-render-groups —— turn 条目 → 19 类渲染分组。
//
// 原版：app/webview/assets/split-items-into-render-groups-19560a11b33a.js
//（8.9KB / 207 行；conversation-markdown 与 local-conversation-turn 共同依赖）。
//
// 两个导出（压缩名 → 语义）：
//   - n（u）：splitItemsIntoRenderGroups —— 条目单遍分拣到 19 个桶
//     （userItems/agentItems/toolGroupStartItems/upNextStatusItem/
//     automationUpdateItems/assistantItem/currentCommentaryItem/toolOutputItems/
//     postAssistantItems/systemEventItem/unifiedDiffItem/remoteTaskCreated/
//     personalityChanged/forkedFromConversation/modelChanged/modelRerouted/
//     subagentActivityItemGroups/todoListItem/proposedPlanItem/
//     planImplementationItem/mcpServerElicitationItems/permissionRequestItems/
//     approvalItem/userInputItem）+ latest 模式下的末尾 assistant 剥离与
//     搜索项合并 + system-error 收尾判定 + automation 引用回填
//   - t（w）：初始化器（12 个闭包判定器装配）
//
// 闭包判定器（w 内装配，语义经原文核实）：
//   - h：patch 待审批（approvalRequestId + 未成功）
//   - g：exec 待审批（approvalRequestId + 无退出码）
//   - _：assistant-message 判定
//   - v：generated-image 用量超限（failure.usageLimitExceeded + image_gen）
//   - y：末尾 automatic-approval-review 剥离（倒序弹出）
//   - b：审批审阅内联到目标条目（exec/patch/mcp 的 callId/
//     commandExecutionItemId 关联；denied 的 mcp 目标不内联）
//   - x：目标条目键（exec → commandExecutionItemId ?? callId；其余 callId）
//   - S：elicitation 的服务器键（userVerification/browserAuth/form… →
//     serverName；mcpToolCall → approval.connector_id；connectorAuth →
//     connector.connector_id；toolSuggestion/unsupportedOpenAIForm → null）
//   - C：system-error 判定
//   - d：可显示 assistant（非 async + 无 requestUserInputAsync + 排除器不命中）

import { n as onceExport } from "@rchunk/rolldown-runtime";
import { l3 as lodashInterop } from "@rchunk/app-shared";
import {
  P0t as uniqBy,
  fhn as connectorEquals,
  gmn as groupBy,
  wfn as otherInit,
} from "@rchunk/app-initial";
import {
  n as agentActivityItemInit,
  r as isGroupableContinuation,
  t as groupingOf,
} from "@rchunk/agent-activity-item";

void lodashInterop;
void uniqBy;
void connectorEquals;
void groupBy;
void otherInit;
void agentActivityItemInit;
void isGroupableContinuation;
void groupingOf;

const once = onceExport as (initializer: () => void) => () => void;

// ---------------------------------------------------------------------------
// 类型
// ---------------------------------------------------------------------------

/** turn 条目（判别联合的结构化子集）。 */
export interface RenderGroupItem {
  type: string;
  completed?: boolean;
  phase?: string | null;
  delivery?: string | null;
  deliveryStatus?: string | null;
  requestUserInputAsync?: unknown;
  heartbeatTrigger?: unknown;
  hookFeedback?: boolean;
  codexDelegation?: unknown;
  searchItemId?: unknown;
  approvalRequestId?: unknown;
  success?: boolean | null;
  callId?: string | null;
  commandExecutionItemId?: string | null;
  targetItemId?: string | null;
  id?: string | null;
  isMessage?: boolean;
  [key: string]: unknown;
}

/** 分组结果（19 桶）。 */
export interface RenderGroups {
  agentItems: RenderGroupItem[];
  approvalItem: RenderGroupItem | null;
  assistantItem:
    (RenderGroupItem & { automationCitations?: RenderGroupItem[] }) | null;
  automationUpdateItems: RenderGroupItem[];
  currentCommentaryItem: RenderGroupItem | null;
  forkedFromConversationItems: RenderGroupItem[];
  mcpServerElicitationItems: RenderGroupItem[];
  modelChangedItems: RenderGroupItem[];
  modelReroutedItems: RenderGroupItem[];
  permissionRequestItems: RenderGroupItem[];
  personalityChangedItems: RenderGroupItem[];
  planImplementationItem: RenderGroupItem | null;
  postAssistantItems: RenderGroupItem[];
  proposedPlanItem: RenderGroupItem | null;
  remoteTaskCreatedItems: RenderGroupItem[];
  subagentActivityItemGroups: RenderGroupItem[][];
  systemEventItem: RenderGroupItem | null;
  todoListItem: RenderGroupItem | null;
  toolGroupStartItems: Set<unknown>;
  toolOutputItems: RenderGroupItem[];
  unifiedDiffItem: RenderGroupItem | null;
  upNextStatusItem: RenderGroupItem | null;
  userInputItem: RenderGroupItem | null;
  userItems: RenderGroupItem[];
}

// ---------------------------------------------------------------------------
// 闭包判定器（原 `w` 内装配）
// ---------------------------------------------------------------------------

/** patch 待审批（原 `h`）。 */
function isPendingPatchApproval(item: RenderGroupItem): boolean {
  return (
    item.type === "patch" &&
    item.approvalRequestId != null &&
    item.success == null
  );
}

/** exec 待审批（原 `g`）。 */
function isPendingExecApproval(item: RenderGroupItem): boolean {
  return (
    item.type === "exec" &&
    item.approvalRequestId != null &&
    (item as { output?: { exitCode?: number } }).output?.exitCode === undefined
  );
}

/** assistant-message 判定（原 `_`）。 */
function isAssistantMessage(item: RenderGroupItem | null | undefined): boolean {
  return item?.type === "assistant-message";
}

/** 可显示 assistant（原 `d`）。 */
function isDisplayableAssistant(
  item: RenderGroupItem | null | undefined,
  exclude?: (item: RenderGroupItem) => boolean,
): boolean {
  return (
    isAssistantMessage(item) &&
    (item as { delivery?: string }).delivery !== "async" &&
    (item as { requestUserInputAsync?: unknown }).requestUserInputAsync ==
      null &&
    exclude?.(item as RenderGroupItem) !== true
  );
}

/** generated-image 用量超限（原 `v`）。 */
function isUsageLimitedImage(
  item: RenderGroupItem | null | undefined,
): boolean {
  const failure = (
    item as { failure?: { type?: string; limitId?: string } } | null | undefined
  )?.failure;
  return (
    item?.type === "generated-image" &&
    failure?.type === "usageLimitExceeded" &&
    failure.limitId === "image_gen"
  );
}

/** 末尾审批审阅剥离（原 `y`）。 */
function popTrailingApprovalReviews(
  items: RenderGroupItem[],
): RenderGroupItem[] {
  const popped: RenderGroupItem[] = [];
  for (;;) {
    const last = items[items.length - 1];
    if (last?.type !== "automatic-approval-review") break;
    items.pop();
    popped.push(last);
  }
  return popped.reverse();
}

/** 目标条目键（原 `x`）。 */
function approvalTargetKey(item: RenderGroupItem): string | null {
  if (
    item.type !== "exec" &&
    item.type !== "patch" &&
    item.type !== "mcp-tool-call"
  )
    return null;
  return item.type === "exec"
    ? (item.commandExecutionItemId ?? item.callId ?? null)
    : (item.callId ?? null);
}

/** 审批复用（原 `b`）：exec 用 commandExecutionItemId；denied 的 mcp 目标不内联。 */
function inlineApprovalReviews(items: RenderGroupItem[]): RenderGroupItem[] {
  const reviewsByTarget = new Map<string, RenderGroupItem[]>();
  const targetTypes = new Map<string, string>();
  const inlinedIds = new Set<unknown>();
  for (const item of items) {
    if (
      item.type !== "exec" &&
      item.type !== "patch" &&
      item.type !== "mcp-tool-call"
    )
      continue;
    const key = approvalTargetKey(item);
    if (key != null) targetTypes.set(key, item.type);
  }
  for (const item of items) {
    const targetType =
      item.type === "automatic-approval-review" && item.targetItemId != null
        ? targetTypes.get(item.targetItemId)
        : undefined;
    if (
      item.type === "automatic-approval-review" &&
      item.targetItemId != null &&
      targetType != null &&
      ((item as { status?: string }).status !== "denied" ||
        targetType !== "mcp-tool-call")
    ) {
      inlinedIds.add(item.id);
      const existing = reviewsByTarget.get(item.targetItemId);
      if (existing == null) reviewsByTarget.set(item.targetItemId, [item]);
      else existing.push(item);
    }
  }
  return items.flatMap((item) => {
    if (item.type === "automatic-approval-review" && inlinedIds.has(item.id))
      return [];
    const key = approvalTargetKey(item);
    const reviews = key == null ? null : (reviewsByTarget.get(key) ?? null);
    return reviews == null
      ? [item]
      : [{ ...item, automaticApprovalReviews: reviews }];
  });
}

/** elicitation 服务器键（原 `S`）。 */
function elicitationServerKey(item: RenderGroupItem): string | null {
  const elicitation = (
    item as {
      elicitation?: {
        kind?: string;
        serverName?: string;
        approval?: { connector_id?: string };
        connector?: { connector_id?: string };
      };
    }
  ).elicitation;
  switch (elicitation?.kind) {
    case "userVerification":
    case "browserAuth":
    case "formElicitation":
    case "openaiForm":
    case "legacyOpenAIForm":
    case "generic":
    case "urlAction":
      return elicitation.serverName?.trim() || null;
    case "mcpToolCall":
      return elicitation.approval?.connector_id ?? null;
    case "connectorAuth":
      return elicitation.connector?.connector_id ?? null;
    case "toolSuggestion":
    case "unsupportedOpenAIForm":
      return null;
  }
  return null;
}

/** system-error 判定（原 `C`）。 */
function isSystemError(item: RenderGroupItem | null | undefined): boolean {
  return item?.type === "system-error";
}

// ---------------------------------------------------------------------------
// 分组主体（原 `u`，导出 n）
// ---------------------------------------------------------------------------

/**
 * 条目 → 19 类渲染分组（原 `u`，导出 n）：
 * 单遍分拣；latest 模式（会话进行中的最新 turn）额外做：
 * ① 末尾 assistant 剥离（含搜索项合并：相邻同 searchItemId 的
 *    final_answer 合并）；
 * ② upNext 状态（用户已发送/实时转写后清除）；
 * ③ commentary 跟踪（final_answer/async 出现前最后一条）；
 * ④ elicitation 服务器键去重（同服务器挂起时进行中的 mcp 调用隐藏）；
 * ⑤ system-error 收尾（非进行中 + 无 assistant 内容时）；
 * ⑥ automation 引用回填到完成的 assistant。
 */
function splitItemsIntoRenderGroups(
  items: RenderGroupItem[],
  turnStatus: "in_progress" | "complete" | string,
  mode: "latest" | "all",
  excludeAssistant?: (item: RenderGroupItem) => boolean,
): RenderGroups {
  const userItems: RenderGroupItem[] = [];
  const agentItems: RenderGroupItem[] = [];
  const toolGroupStartItems = new Set<unknown>();
  let upNextStatusItem: RenderGroupItem | null = null;
  let assistantItem: RenderGroupItem | null = null;
  let currentCommentaryItem: RenderGroupItem | null = null;
  const toolOutputItems: RenderGroupItem[] = [];
  const postAssistantItems: RenderGroupItem[] = [];
  let systemEventItem: RenderGroupItem | null = null;
  let unifiedDiffItem: RenderGroupItem | null = null;
  const remoteTaskCreatedItems: RenderGroupItem[] = [];
  const personalityChangedItems: RenderGroupItem[] = [];
  const forkedFromConversationItems: RenderGroupItem[] = [];
  const modelChangedItems: RenderGroupItem[] = [];
  const modelReroutedItems: RenderGroupItem[] = [];
  const subagentActivityItemGroups: RenderGroupItem[][] = [];
  let todoListItem: RenderGroupItem | null = null;
  let proposedPlanItem: RenderGroupItem | null = null;
  let planImplementationItem: RenderGroupItem | null = null;
  const mcpServerElicitationItems: RenderGroupItem[] = [];
  const permissionRequestItems: RenderGroupItem[] = [];
  let approvalItem: RenderGroupItem | null = null;
  let userInputItem: RenderGroupItem | null = null;
  const pendingElicitationServers = new Set<string>();
  const commentaryItems: RenderGroupItem[] = [];
  const automationUpdateBuffer: RenderGroupItem[] = [];
  const commentarySet = new Set<RenderGroupItem>();
  let sawNonWorktreeInit = false;
  let sawNonMessageSubagent = false;

  for (const item of items) {
    const isNonMessageSubagent =
      item.type === "subagent-activity" && !item.isMessage;
    const startsSubagentGroup = isNonMessageSubagent && !sawNonMessageSubagent;
    sawNonMessageSubagent = isNonMessageSubagent;
    // heartbeat 触发的用户消息与首个 worktree-init 前的用户消息
    if (item.type === "user-message" && item.heartbeatTrigger != null) {
      userItems.push(item);
      continue;
    }
    if (!sawNonWorktreeInit && item.type === "user-message") {
      userItems.push(item);
      continue;
    }
    if (item.type !== "worktree-init") sawNonWorktreeInit = true;
    // latest 模式：commentary 跟踪与 upNext 清除
    if (mode === "latest") {
      if (item.type === "assistant-message") {
        const hasContent =
          String(item.content ?? "").trim().length > 0 ||
          item.structuredOutput != null;
        if (
          item.phase === "commentary" &&
          item.delivery !== "async" &&
          item.requestUserInputAsync == null
        ) {
          commentaryItems.push(item);
          commentarySet.add(item);
          if (item.completed !== true || hasContent)
            currentCommentaryItem = item;
          continue;
        }
        if (
          item.delivery === "async" ||
          item.requestUserInputAsync != null ||
          (item.phase === "final_answer" && hasContent)
        ) {
          currentCommentaryItem = null;
        }
      } else if (
        (item.type === "user-message" &&
          item.deliveryStatus !== "not-sent" &&
          item.hookFeedback !== true &&
          item.heartbeatTrigger == null &&
          item.codexDelegation == null) ||
        (item.type === "realtime-transcript" &&
          ((item as { entries?: Array<{ role?: string }> }).entries ?? []).some(
            ({ role }) => role === "user",
          ))
      ) {
        upNextStatusItem = null;
        currentCommentaryItem = null;
      }
    }
    if (item.type === "turn-diff") unifiedDiffItem = item;
    if (item.type === "todo-list") todoListItem = item;
    if (item.type === "proposed-plan") {
      proposedPlanItem = item;
      continue;
    }
    if (item.type === "remote-task-created") remoteTaskCreatedItems.push(item);
    if (item.type === "personality-changed") personalityChangedItems.push(item);
    if (item.type === "forked-from-conversation")
      forkedFromConversationItems.push(item);
    if (item.type === "model-changed") {
      modelChangedItems.push(item);
      continue;
    }
    if (item.type === "model-rerouted") {
      modelReroutedItems.push(item);
      continue;
    }
    if (item.type === "plan-implementation") {
      planImplementationItem = item;
      continue;
    }
    if (item.type === "mcp-server-elicitation") {
      if (item.completed === true) {
        if (
          (item as { elicitation?: { kind?: string } }).elicitation?.kind !==
          "unsupportedOpenAIForm"
        )
          commentaryItems.push(item);
        continue;
      }
      const serverKey = elicitationServerKey(item);
      if (serverKey != null) pendingElicitationServers.add(serverKey);
      mcpServerElicitationItems.push(item);
      continue;
    }
    if (item.type === "permission-request") {
      permissionRequestItems.push(item);
      continue;
    }
    // 待审批 patch/exec（取最后一个）
    const isPatchApproval = isPendingPatchApproval(item);
    const isExecApproval = !isPatchApproval && isPendingExecApproval(item);
    if (isPatchApproval || isExecApproval) {
      approvalItem = item;
      continue;
    }
    if (item.type === "userInput" && item.completed !== true) {
      userInputItem = item;
      continue;
    }
    if (item.type === "user-message") {
      commentaryItems.push(item);
      continue;
    }
    if (item.type === "generated-image") {
      const usageLimited = isUsageLimitedImage(item);
      if (!usageLimited) toolOutputItems.push(item);
      if (turnStatus === "in_progress" || usageLimited)
        commentaryItems.push(item);
      continue;
    }
    if (item.type === "automation-update") {
      automationUpdateBuffer.push(item);
      continue;
    }
    if (item.type === "auto-review-interruption-warning") {
      postAssistantItems.push(item);
      continue;
    }
    if (item.type === "subagent-activity") {
      if (item.isMessage) commentaryItems.push(item);
      else if (startsSubagentGroup) {
        commentaryItems.push(item);
        subagentActivityItemGroups.push([item]);
      } else subagentActivityItemGroups.at(-1)?.push(item);
      continue;
    }
    if (
      item.type === "reasoning" ||
      item.type === "automatic-approval-review" ||
      groupingOf(item) != null
    )
      commentaryItems.push(item);
  }

  const automationUpdateItems = automationUpdateBuffer;

  // 审批复用
  const inlined = inlineApprovalReviews(commentaryItems);
  // 末尾审批审阅剥离（非 latest 模式移到 postAssistant）
  const trailingReviews =
    mode === "latest" ? [] : popTrailingApprovalReviews([...inlined]);
  // latest 模式的可见性过滤
  let hadCommentary = false;
  let visible =
    mode === "latest" || pendingElicitationServers.size > 0
      ? inlined.filter((item, index) => {
          if (commentarySet.has(item)) {
            hadCommentary = true;
            return item === currentCommentaryItem;
          }
          if (
            item.type === "mcp-tool-call" &&
            item.completed !== true &&
            pendingElicitationServers.has(
              String(
                (item as { invocation?: { server?: string } }).invocation
                  ?.server ?? "",
              ),
            )
          )
            return false;
          if (
            hadCommentary &&
            groupingOf(item)?.grouping === "groupable" &&
            !isGroupableContinuation(item, inlined[index + 1])
          ) {
            toolGroupStartItems.add(item);
            hadCommentary = false;
          }
          return true;
        })
      : inlined;
  if (mode === "latest") visible = [...visible, ...trailingReviews];

  // 末尾 assistant 剥离（跳过 elicitation 尾巴）
  let lastIndex = visible.length - 1;
  while (visible[lastIndex]?.type === "mcp-server-elicitation") --lastIndex;
  if (!isDisplayableAssistant(visible[lastIndex], excludeAssistant)) {
    let probe = lastIndex;
    for (;;) {
      const item = visible[probe];
      if (
        item?.type !== "mcp-server-elicitation" &&
        item?.type !== "subagent-activity" &&
        !isUsageLimitedImage(item) &&
        (item?.type !== "reasoning" || item.completed !== false) &&
        (item?.type !== "exec" ||
          turnStatus !== "complete" ||
          (item as { parsedCmd?: { isFinished?: boolean } }).parsedCmd
            ?.isFinished !== true) &&
        (item?.type !== "dynamic-tool-call" ||
          turnStatus !== "complete" ||
          item.completed !== true)
      )
        break;
      --probe;
    }
    const candidate = visible[probe];
    if (
      isDisplayableAssistant(candidate, excludeAssistant) &&
      candidate.phase === "final_answer"
    )
      lastIndex = probe;
  }
  const lastItem = visible[lastIndex];
  const extracted = isDisplayableAssistant(lastItem, excludeAssistant)
    ? lastItem
    : null;
  const hasAssistantContent =
    String(extracted?.content ?? "").trim().length > 0 ||
    extracted?.structuredOutput != null;
  if (extracted) {
    visible.splice(lastIndex, 1);
    // 搜索项合并：相邻同 searchItemId 的 final_answer
    const previous = visible[lastIndex - 1];
    if (
      extracted.phase === "final_answer" &&
      previous?.type === "assistant-message" &&
      previous.phase === "final_answer" &&
      previous.searchItemId != null &&
      previous.searchItemId === extracted.searchItemId
    ) {
      visible.splice(lastIndex - 1, 1);
    }
    postAssistantItems.push(...trailingReviews);
  } else visible.push(...trailingReviews);

  // system-error 收尾
  const finalItem = visible[visible.length - 1];
  const trailingSystemError =
    turnStatus !== "in_progress" &&
    !hasAssistantContent &&
    isSystemError(finalItem)
      ? finalItem
      : null;
  if (trailingSystemError) visible.pop();

  // automation 引用（uniqBy 语义：automationId ?? arguments.id ?? callId）
  const automationCitations = dedupeBy(
    [...automationUpdateItems].reverse(),
    (item) =>
      (item as { result?: { automationId?: string } }).result?.automationId ??
      (item as { arguments?: { id?: string } }).arguments?.id ??
      item.callId,
  ).reverse();
  const assistantWithCitations =
    extracted != null &&
    extracted.completed === true &&
    automationCitations.length > 0
      ? { ...extracted, automationCitations }
      : extracted;

  // connectorAuth 去重
  const dedupedElicitations = dedupeAdjacent(
    mcpServerElicitationItems,
    (a, b) =>
      (a as { elicitation?: { kind?: string; connector?: unknown } })
        .elicitation?.kind === "connectorAuth" &&
      (b as { elicitation?: { kind?: string; connector?: unknown } })
        .elicitation?.kind === "connectorAuth" &&
      (a as { elicitation?: { connector?: unknown } }).elicitation
        ?.connector ===
        (b as { elicitation?: { connector?: unknown } }).elicitation?.connector,
  );

  return {
    userItems,
    agentItems: visible,
    toolGroupStartItems,
    upNextStatusItem:
      mode === "latest" && turnStatus === "in_progress"
        ? upNextStatusItem
        : null,
    automationUpdateItems: extracted == null ? automationCitations : [],
    assistantItem: assistantWithCitations,
    currentCommentaryItem:
      currentCommentaryItem === extracted
        ? assistantWithCitations
        : currentCommentaryItem,
    toolOutputItems,
    postAssistantItems,
    systemEventItem: trailingSystemError,
    unifiedDiffItem,
    remoteTaskCreatedItems,
    personalityChangedItems,
    forkedFromConversationItems,
    modelChangedItems,
    modelReroutedItems,
    subagentActivityItemGroups,
    todoListItem,
    proposedPlanItem,
    planImplementationItem,
    mcpServerElicitationItems: dedupedElicitations,
    permissionRequestItems,
    approvalItem,
    userInputItem,
  };
}

// ---------------------------------------------------------------------------
// 小工具（lodash 语义内联）
// ---------------------------------------------------------------------------

/** uniqBy（倒序后应用再正序回来——与原版一致）。 */
function dedupeBy<T>(items: T[], keyOf: (item: T) => unknown): T[] {
  const seen = new Set<unknown>();
  const out: T[] = [];
  for (const item of items) {
    const key = keyOf(item);
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(item);
  }
  return out;
}

/** 相邻去重（原 `m.default` 的 pairwise 语义）。 */
function dedupeAdjacent<T>(items: T[], equals: (a: T, b: T) => boolean): T[] {
  const out: T[] = [];
  for (const item of items) {
    if (out.length > 0 && equals(out[out.length - 1], item)) continue;
    out.push(item);
  }
  return out;
}

// ---------------------------------------------------------------------------
// 初始化器（原 `w`，导出 t）与兼容导出
// ---------------------------------------------------------------------------

/** 初始化器（原 `w`，导出 t）：判定器为模块级函数，保持幂等契约。 */
const initializeSplitItemsIntoRenderGroups = once((): void => {});

export {
  splitItemsIntoRenderGroups as n,
  initializeSplitItemsIntoRenderGroups as t,
};
