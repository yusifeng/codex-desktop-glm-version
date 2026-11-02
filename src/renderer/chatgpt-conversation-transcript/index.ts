import "@rchunk/rolldown-runtime";
import * as appSharedChunk from "@rchunk/app-shared";
import * as appInitialChunk from "@rchunk/app-initial";
import * as appPrimaryChunk from "@rchunk/app-primary";
import * as timestampChunk from "@rchunk/timestamp-separator";
import * as viewerChunk from "@rchunk/artifact-viewer";
import type { JsxRuntime, ReactRuntime } from "@rchunk/app-shared";

export interface TranscriptTurn {
  browserConversationId?: string | null;
  conversationId?: string;
  errorMessage?: unknown;
  id: string;
  isMostRecentTurn?: boolean;
  isTemporaryChat?: boolean;
  isWorkConversation?: boolean;
  paragen?: Record<string, unknown> | null;
  readAloudEnabled?: boolean;
  role?: "assistant" | "system" | "user";
  text?: string;
  timestamp?: string | number;
  timestampSeparatorAtMs?: number | null;
  turn?: unknown;
  turnKey?: string;
  [key: string]: unknown;
}
export interface ChatgptConversationTranscriptProps {
  browserConversationId?: string;
  conversationId: string;
  emptyState?: unknown;
  flushTop?: boolean;
  imageEngagementContext?: unknown;
  onHandoffSuccess?: unknown;
  paragenEnabled?: boolean;
  paragenPortalContainer?: Element | null;
  pendingSubmission?: {
    attachments?: unknown;
    renderMarkdown?: boolean;
    text?: string;
  } | null;
  renderInitialContentAsComplete?: boolean;
  renderMode?: "conversation" | "sidebar";
  showRequestUserInputStatus?: boolean;
  trackShownImpressions?: boolean;
  turnActions?: unknown;
  turns?: TranscriptTurn[];
}
interface QueryResult<Value> {
  data?: Value;
  error?: unknown;
  isError?: boolean;
  isLoading?: boolean;
}
interface SharedRuntime {
  BX?<Value>(family: unknown, parameter: unknown): Value;
  HX?<Value>(signal: unknown): Value;
  I3(): JsxRuntime;
  LX?(scope: unknown): { get(signal: unknown, parameter?: unknown): unknown };
  Y2?: unknown;
  ZI?: unknown;
  e6(): ReactRuntime;
  n4?(): { formatMessage(descriptor: Record<string, unknown>): string };
  zX?(family: unknown, parameter: unknown): unknown;
  [key: string]: unknown;
}
interface InitialRuntime {
  [key: string]: unknown;
}
interface PrimaryRuntime {
  [key: string]: unknown;
}
interface ViewerRuntime {
  [key: string]: unknown;
}

const shared = appSharedChunk as unknown as SharedRuntime;
const initial = appInitialChunk as unknown as InitialRuntime;
const primary = appPrimaryChunk as unknown as PrimaryRuntime;
const viewer = viewerChunk as unknown as ViewerRuntime;
const timestamp = timestampChunk as unknown as { n?: () => void; t?: unknown };
let React: ReactRuntime;
let jsx: JsxRuntime;
let initialized = false;
const loggedErrors = new WeakSet<object>();

function callInitializer(value: unknown): void {
  if (typeof value === "function") (value as () => void)();
}
function initializeTranscript(): void {
  if (initialized) return;
  for (const value of [
    shared.$3,
    shared.FX,
    shared.K2,
    shared.QI,
    initial.Let,
    initial.Ret,
    initial.hL,
    initial.pL,
    initial.qL,
    initial.uHt,
    initial.zVt,
    primary.Ds,
    primary.Os,
    viewer._,
    viewer.m,
    viewer.n,
    viewer.r,
    timestamp.n,
  ])
    callInitializer(value);
  React = shared.e6();
  jsx = shared.I3();
  initialized = true;
}

function family<Value>(
  signal: unknown,
  parameter: unknown,
  fallback: Value,
): Value {
  return typeof shared.BX === "function" && signal != null
    ? shared.BX<Value>(signal, parameter)
    : fallback;
}
function value<Value>(signal: unknown, fallback: Value): Value {
  return typeof shared.HX === "function" && signal != null
    ? shared.HX<Value>(signal)
    : fallback;
}
function callable<Result>(
  target: unknown,
  ...args: unknown[]
): Result | undefined {
  return typeof target === "function"
    ? (target as (...values: unknown[]) => Result)(...args)
    : undefined;
}

function syntheticTurns(
  props: ChatgptConversationTranscriptProps,
): TranscriptTurn[] {
  return props.turns ?? [];
}

function projectLiveTurns(props: ChatgptConversationTranscriptProps): {
  conversationQuery: QueryResult<Record<string, unknown>>;
  isStreaming: boolean;
  serverConversationId: string | null;
  turns: TranscriptTurn[];
  showPendingLoadingMessage: boolean;
} {
  const serverConversationId = family<string | null>(
    initial.wVt,
    props.conversationId,
    null,
  );
  const querySignal = callable<unknown>(
    shared.zX,
    initial.BBt,
    serverConversationId,
  );
  const conversationQuery = value<QueryResult<Record<string, unknown>>>(
    querySignal,
    {},
  );
  const currentMessage = family<unknown>(
    initial.jVt,
    props.conversationId,
    null,
  );
  const threadMapping = family<unknown>(
    initial.RVt,
    props.conversationId,
    null,
  );
  const workContext = family<unknown>(initial.YVt, props.conversationId, null);
  const isStreaming = callable<boolean>(initial.dHt, workContext) ?? false;
  const origin =
    conversationQuery.data?.conversation_origin ??
    family<unknown>(initial.AVt, props.conversationId, null);
  const isWorkConversation = origin === "tpp" || origin === "flora";
  const renderConversation = callable<{
    renderedConversation?: unknown;
    renderedTurns?: unknown[];
    showPendingLoadingMessage?: boolean;
  }>(viewer.h, {
    conversation: conversationQuery.data,
    clinicalSearchEnabled: value(initial.hkt, false),
    clinicalCitationsEnabled: value(initial.mkt, false),
    conversationOrigin: origin,
    getRenderTelemetry: () => undefined,
    isStreaming,
    isWorkConversation,
    mode: isWorkConversation ? "conversation" : (props.renderMode ?? "sidebar"),
    moderationDisclaimersByMessageId: family(
      initial.zVt,
      props.conversationId,
      null,
    ),
    pendingSubmission:
      props.pendingSubmission == null
        ? null
        : {
            ...props.pendingSubmission,
            renderMarkdown: family(initial.CIt, props.conversationId, true),
          },
    threadCurrentNode: currentMessage,
    threadMapping,
  });
  const projected = callable<TranscriptTurn[]>(viewer.g, {
    paragen:
      props.paragenEnabled === false || props.renderMode !== "conversation"
        ? null
        : family(initial.Cpn, props.conversationId, null),
    browserConversationId: props.browserConversationId,
    conversationId: props.conversationId,
    errorMessage: family(initial.MVt, props.conversationId, null),
    isWorkConversation,
    onEditUserMessage: undefined,
    onFork: undefined,
    renderedTurns: renderConversation?.renderedTurns ?? [],
    safetyReview: family(initial.GVt, props.conversationId, null),
    showPendingLoadingMessage:
      renderConversation?.showPendingLoadingMessage === true,
    showRequestUserInputStatus: props.showRequestUserInputStatus === true,
  });
  return {
    conversationQuery,
    isStreaming,
    serverConversationId,
    turns: props.turns ?? projected ?? [],
    showPendingLoadingMessage:
      renderConversation?.showPendingLoadingMessage === true,
  };
}

function PlainTurn({ turn }: { turn: TranscriptTurn }): unknown {
  return jsx.jsxs("article", {
    "data-role": turn.role,
    "data-turn-id": turn.id,
    children: [
      turn.timestamp == null
        ? null
        : jsx.jsx("time", { children: String(turn.timestamp) }),
      jsx.jsx("p", { children: turn.text }),
    ],
  });
}

function renderTurn(
  props: ChatgptConversationTranscriptProps,
  turn: TranscriptTurn,
  index: number,
  total: number,
): unknown {
  const Turn = viewer.r;
  const TimestampSeparator = timestamp.t;
  const content =
    typeof Turn === "function"
      ? jsx.jsx(Turn, {
          browserConversationId:
            turn.browserConversationId ?? props.browserConversationId,
          conversationId: turn.conversationId ?? props.conversationId,
          conversationType:
            props.renderMode === "conversation" ? "primary" : "sidebar",
          flushTop: props.flushTop === true && index === 0,
          hostId: initial.ugn,
          imageEngagementContext: props.imageEngagementContext,
          isMostRecentTurn: turn.isMostRecentTurn ?? index === total - 1,
          isTemporaryChat: turn.isTemporaryChat,
          isParagen: turn.paragen != null,
          isWorkConversation: turn.isWorkConversation,
          readAloudEnabled: turn.readAloudEnabled,
          onHandoffSuccess: props.onHandoffSuccess,
          pendingSubmissionAttachments:
            index === total - 1
              ? props.pendingSubmission?.attachments
              : undefined,
          trackShownImpressions: props.trackShownImpressions !== false,
          turnActions: index === total - 1 ? props.turnActions : null,
          turn: turn.turn ?? turn,
          turnId: turn.id,
        })
      : jsx.jsx(PlainTurn, { turn });
  return jsx.jsxs(
    "div",
    {
      className: "flex flex-col gap-1.5",
      "data-chatgpt-conversation-turn": "true",
      "data-chatgpt-conversation-turn-id": turn.id,
      children: [
        turn.timestampSeparatorAtMs == null ||
        typeof TimestampSeparator !== "function"
          ? null
          : jsx.jsx(TimestampSeparator, {
              sentAtMs: turn.timestampSeparatorAtMs,
            }),
        content,
      ],
    },
    turn.turnKey ?? turn.id,
  );
}

function ChatgptConversationTranscript(
  props: ChatgptConversationTranscriptProps,
): unknown {
  initializeTranscript();
  const live = projectLiveTurns(props);
  const [initialContentIncomplete] = React.useState(
    () =>
      props.renderInitialContentAsComplete !== true && live.turns.length > 0,
  );
  React.useEffect(() => {
    const error = live.conversationQuery.error;
    if (
      !live.conversationQuery.isError ||
      props.trackShownImpressions === false ||
      typeof error !== "object" ||
      error == null ||
      loggedErrors.has(error)
    )
      return;
    loggedErrors.add(error);
    const scope = shared.LX?.(shared.ZI);
    const analytics = scope?.get(initial.Cpn) as
      { logProductEvent?(event: Record<string, unknown>): void } | undefined;
    analytics?.logProductEvent?.({
      conversationId: live.serverConversationId,
      error,
      source: "chatgpt-conversation-transcript-load",
    });
  }, [
    live.conversationQuery.error,
    live.conversationQuery.isError,
    live.serverConversationId,
    props.trackShownImpressions,
  ]);

  const turns = props.turns == null ? live.turns : syntheticTurns(props);
  const loading =
    live.serverConversationId != null &&
    live.conversationQuery.isLoading === true;
  const error = live.conversationQuery.isError === true;
  let body: unknown;
  if (error) {
    body = jsx.jsx("div", {
      className:
        "rounded-xl border border-default bg-surface-secondary/92 p-4 text-sm text-default",
      role: "alert",
      children: "Could not load this ChatGPT conversation",
    });
  } else if (loading) {
    body = jsx.jsx("div", {
      "aria-busy": true,
      "aria-label":
        shared
          .n4?.()
          .formatMessage({
            id: "chatgptConversations.loadingConversation",
            defaultMessage: "Loading ChatGPT conversation",
          }) ?? "Loading ChatGPT conversation",
      className: "relative min-h-0 flex-1",
      role: "status",
    });
  } else if (
    turns.length === 0 &&
    props.pendingSubmission == null &&
    !live.showPendingLoadingMessage
  ) {
    body =
      props.emptyState ??
      jsx.jsx("div", {
        className:
          "rounded-xl border border-default bg-surface-secondary/92 p-4 text-sm text-codex-description",
        children:
          "No renderable ChatGPT messages were found in this conversation",
      });
  } else {
    const PendingStatus = primary.xa;
    body = jsx.jsxs(jsx.Fragment, {
      children: [
        turns.map((turn, index) =>
          renderTurn(props, turn, index, turns.length),
        ),
        typeof PendingStatus !== "function" ||
        (!live.showPendingLoadingMessage && props.pendingSubmission == null)
          ? null
          : jsx.jsx(PendingStatus, {
              conversationId: props.conversationId,
              showPendingLoadingMessage: live.showPendingLoadingMessage,
              showRequestUserInputStatus:
                props.showRequestUserInputStatus === true,
              trackShownImpressions: props.trackShownImpressions !== false,
            }),
      ],
    });
  }
  return jsx.jsxs("div", {
    className: "flex min-h-full flex-1 flex-col gap-1.5",
    "data-conversation-id": props.conversationId,
    "data-initial-content-incomplete": initialContentIncomplete,
    "data-render-mode": props.renderMode ?? "sidebar",
    children: [
      typeof initial.pL === "function"
        ? jsx.jsx(initial.pL, { conversationId: props.conversationId })
        : null,
      body,
    ],
  });
}

initializeTranscript();
export { initializeTranscript as n, ChatgptConversationTranscript as t };
