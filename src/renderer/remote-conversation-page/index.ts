import "@rchunk/rolldown-runtime";
import * as appSharedChunk from "@rchunk/app-shared";
import * as appInitialChunk from "@rchunk/app-initial";
import * as appPrimaryChunk from "@rchunk/app-primary";
import "@rchunk/ansi-block";
import "@rchunk/bookmarked-thread-user-message-navigation";
import "@rchunk/chat-tab-metadata-bridge";
import "@rchunk/conversation-blocks";
import "@rchunk/conversation-source";
import * as documentTitleChunk from "@rchunk/document-title";
import "@rchunk/local-conversation-turn";
import "@rchunk/preview-footer";
import * as rightPanelComposerChunk from "@rchunk/right-panel-composer-overlay";
import "@rchunk/scroll-to-match";
import * as threadAppShellChunk from "@rchunk/thread-app-shell-chrome";
import "@rchunk/thread-bridge";
import * as threadEmojiChunk from "@rchunk/thread-emoji";
import * as threadScrollLayoutChunk from "@rchunk/thread-scroll-layout";
import * as hotkeyLayoutChunk from "@rchunk/use-hotkey-window-detail-layout";
import "@rchunk/user-message";

type StateUpdater<Value> = Value | ((previous: Value) => Value);
type Variant = "hotkey" | "main";
interface ReactRuntime {
  useState<Value>(
    initialValue: Value | (() => Value),
  ): [Value, (next: StateUpdater<Value>) => void];
}
interface JsxRuntime {
  Fragment: unknown;
  jsx(type: unknown, props: Record<string, unknown>, key?: string): unknown;
  jsxs(type: unknown, props: Record<string, unknown>, key?: string): unknown;
}
interface RemoteContentPart {
  content_type?: string;
  text?: string;
}
interface RemoteInputItem {
  asset_pointer?: string;
  content?: RemoteContentPart[];
  type?: string;
  [key: string]: unknown;
}
interface RemoteOutputItem {
  content?: RemoteContentPart[];
  pr_title?: string;
  title?: string;
  type?: string;
  [key: string]: unknown;
}
interface RemoteUserTurn {
  created_at?: number;
  id: string;
  input_items?: RemoteInputItem[];
}
interface RemoteAssistantTurn {
  created_at?: number;
  id: string;
  output_items?: RemoteOutputItem[];
  turn_status?: string;
}
interface RemoteTurnGroup {
  assistantTurns?: RemoteAssistantTurn[];
  activeId?: string | null;
  userTurn: RemoteUserTurn;
}
interface RemoteTask {
  id?: string;
  task_status_display?: { environment_label?: string | null };
  title?: string | null;
}
interface RemoteTaskState {
  data?: {
    current_assistant_turn?: RemoteAssistantTurn | null;
    hasPatch?: boolean;
    task: RemoteTask;
    transcript?: unknown[];
    turns?: RemoteTurnGroup[];
  } | null;
  error?: unknown;
  isError?: boolean;
  isLoading?: boolean;
  onExitArchivedPreview?(): void;
  onSend?(message: string): Promise<void> | void;
  refetch?(): Promise<unknown> | unknown;
}
interface RemoteTurnState {
  turn_status?: "completed" | "failed" | "in_progress" | "pending" | string;
}
interface LocationState {
  state?: { archivedConversationPreview?: boolean } | null;
}
interface Props {
  variant?: Variant;
}
interface ShellProps {
  showReviewTab?: boolean;
  threadType: "remote";
}
interface ScrollProps {
  children?: unknown;
  footer?: unknown;
  threadEndContent?: unknown;
}
interface OverlayProps {
  children: unknown;
  forceExpanded?: boolean;
}

const sharedRuntime = appSharedChunk as unknown as {
  $3?(): void;
  FX?(): void;
  HX?<Value>(signal: unknown): Value;
  I3(): JsxRuntime;
  K2?(): void;
  e6(): ReactRuntime;
};
const initialRuntime = appInitialChunk as unknown as {
  Bmt?: unknown;
  PZt?: unknown;
  Vmt?: unknown;
  e8t?(): (
    destination: string | number,
    options?: Record<string, unknown>,
  ) => void;
  i_n?(): LocationState;
  l_n?(): { taskId?: string | null };
};
const primaryRuntime = appPrimaryChunk as unknown as {
  d?(): void;
  Oo?: unknown;
  ut?: unknown;
};
const titleRuntime = documentTitleChunk as unknown as {
  r?(): void;
  t?: (props: { title?: string | null }) => unknown;
};
const shellRuntime = threadAppShellChunk as unknown as {
  n?(): void;
  t?: (props: ShellProps) => unknown;
};
const emojiRuntime = threadEmojiChunk as unknown as {
  n?(): void;
  t?: (props: { threadId: string }) => unknown;
};
const scrollRuntime = threadScrollLayoutChunk as unknown as {
  n?(): void;
  t?: (props: ScrollProps) => unknown;
};
const overlayRuntime = rightPanelComposerChunk as unknown as {
  n?(): void;
  t?: (props: OverlayProps) => unknown;
};
const hotkeyRuntime = hotkeyLayoutChunk as unknown as {
  n?(): void;
  r?(layout: unknown): void;
};
const {
  $3: initializeSharedRuntime,
  FX: initializeSharedState,
  HX: useSignalValue,
  I3: getJsxRuntime,
  K2: initializeSharedUi,
  e6: getReactRuntime,
} = sharedRuntime;
const {
  Bmt: remoteTurnStateSignal,
  PZt: remoteHostIdSignal,
  Vmt: remoteTaskStateSignal,
  e8t: useNavigate,
  i_n: useLocation,
  l_n: useRouteParams,
} = initialRuntime;
const { d: initializePrimaryRuntime } = primaryRuntime;
const { r: initializeDocumentTitle, t: DocumentTitle } = titleRuntime;
const { n: initializeThreadAppShell, t: ThreadAppShellChrome } = shellRuntime;
const { n: initializeThreadEmoji, t: ThreadEmoji } = emojiRuntime;
const { n: initializeThreadScrollLayout, t: ThreadScrollLayout } =
  scrollRuntime;
const { n: initializeRightPanelComposer, t: RightPanelComposerOverlay } =
  overlayRuntime;
const { n: initializeHotkeyLayout, r: useHotkeyWindowDetailLayout } =
  hotkeyRuntime;

initializeSharedRuntime?.();
initializeSharedState?.();
initializeSharedUi?.();
initializePrimaryRuntime?.();
initializeDocumentTitle?.();
initializeThreadAppShell?.();
initializeThreadEmoji?.();
initializeThreadScrollLayout?.();
initializeRightPanelComposer?.();
initializeHotkeyLayout?.();

const React = getReactRuntime();
const jsx = getJsxRuntime();
const defaultTaskState: RemoteTaskState = { isLoading: true };

function itemText(
  items: Array<{ content?: RemoteContentPart[] }> | undefined,
): string {
  return (items ?? [])
    .flatMap((item) => item.content ?? [])
    .filter((part) => part.content_type === "text")
    .map((part) => part.text ?? "")
    .join("");
}
function assistantOutput(item: RemoteOutputItem, key: string): unknown {
  const text = itemText([item]).trim();
  switch (item.type) {
    case "message":
      return text.length === 0 ? null : jsx.jsx("p", { children: text }, key);
    case "output_diff":
    case "follow_up_diff":
      return jsx.jsx(
        "pre",
        { "data-remote-output": "diff", children: String(item.diff ?? text) },
        key,
      );
    case "pr":
      return jsx.jsxs(
        "aside",
        {
          "data-remote-output": "pull-request",
          children: [
            jsx.jsx("strong", {
              children: item.pr_title?.trim() || "Pull request",
            }),
            item.url == null
              ? null
              : jsx.jsx("a", {
                  href: String(item.url),
                  children: "Open pull request",
                }),
          ],
        },
        key,
      );
    case "comment":
    case "cr":
    case "review":
    case "sr":
    case "suggested_task":
      return jsx.jsxs(
        "aside",
        {
          "data-remote-output": "review",
          children: [
            item.title == null
              ? null
              : jsx.jsx("strong", { children: item.title }),
            text.length === 0 ? null : jsx.jsx("p", { children: text }),
          ],
        },
        key,
      );
    case "output_image_asset_pointer":
      return jsx.jsx(
        "figure",
        {
          "data-asset-pointer": item.asset_pointer,
          children:
            item.url == null
              ? "Generated image"
              : jsx.jsx("img", {
                  alt: "Generated image",
                  src: String(item.url),
                  referrerPolicy: "no-referrer",
                }),
        },
        key,
      );
    case "output_preview":
    case "output_deployment_info":
      return jsx.jsx(
        "aside",
        {
          "data-remote-output": "website",
          children: item.title ?? (text || "Website preview"),
        },
        key,
      );
    default:
      return text.length === 0 ? null : jsx.jsx("p", { children: text }, key);
  }
}
function structuredTranscript(groups: RemoteTurnGroup[]): unknown[] {
  return groups
    .flatMap((group) => {
      const userText = itemText(group.userTurn.input_items).trim();
      const attachments = (group.userTurn.input_items ?? []).filter(
        (item) => item.type !== "message",
      );
      const assistant =
        group.assistantTurns?.find((turn) => turn.id === group.activeId) ??
        group.assistantTurns?.[0] ??
        null;
      return [
        jsx.jsxs(
          "article",
          {
            "data-role": "user",
            "data-turn-id": group.userTurn.id,
            children: [
              userText.length === 0
                ? null
                : jsx.jsx("p", { children: userText }),
              attachments.length === 0
                ? null
                : jsx.jsx("div", {
                    className: "flex flex-wrap gap-2 self-end",
                    children: attachments.map((item, index) =>
                      jsx.jsx(
                        "span",
                        {
                          "data-asset-pointer": item.asset_pointer,
                          children:
                            item.type === "image"
                              ? "Image attachment"
                              : "Attachment",
                        },
                        `${item.asset_pointer ?? "attachment"}-${index}`,
                      ),
                    ),
                  }),
            ],
          },
          `user:${group.userTurn.id}`,
        ),
        assistant == null
          ? null
          : jsx.jsx(
              "article",
              {
                "data-role": "assistant",
                "data-turn-id": assistant.id,
                children: (assistant.output_items ?? []).map((item, index) =>
                  assistantOutput(item, `${assistant.id}:${index}`),
                ),
              },
              `assistant:${assistant.id}`,
            ),
      ];
    })
    .filter((entry) => entry != null);
}

function ThreadBody({
  archived,
  hostId,
  taskId,
  taskState,
  turnState,
}: {
  archived: boolean;
  hostId: string;
  taskId: string;
  taskState: RemoteTaskState;
  turnState: RemoteTurnState | null;
}): unknown {
  const [message, setMessage] = React.useState("");
  const [sending, setSending] = React.useState(false);
  const responseInProgress =
    turnState?.turn_status === "pending" ||
    turnState?.turn_status === "in_progress";
  const send = async (): Promise<void> => {
    const trimmed = message.trim();
    if (trimmed.length === 0 || sending || archived) return;
    setSending(true);
    try {
      await taskState.onSend?.(trimmed);
      setMessage("");
    } finally {
      setSending(false);
    }
  };
  const transcript =
    taskState.data?.turns == null
      ? (taskState.data?.transcript ?? [])
      : structuredTranscript(taskState.data.turns);
  const content = jsx.jsxs("div", {
    className: "remote-conversation-thread",
    "data-host-id": hostId,
    children: [
      transcript.length === 0
        ? jsx.jsx("p", { children: "No messages yet" })
        : transcript.map((entry, index) =>
            typeof entry === "object" && entry != null && "type" in entry
              ? entry
              : jsx.jsx("article", { children: String(entry) }, String(index)),
          ),
      responseInProgress
        ? jsx.jsx("p", { role: "status", children: "Response in progress…" })
        : null,
    ],
  });
  const ProductionComposer = primaryRuntime.ut;
  const ComposerProvider = primaryRuntime.Oo;
  const fallbackComposer = jsx.jsxs("form", {
    onSubmit: (event: { preventDefault(): void }) => {
      event.preventDefault();
      void send();
    },
    children: [
      jsx.jsx("textarea", {
        "aria-label": "Message",
        disabled: sending,
        value: message,
        onChange: (event: { currentTarget: { value: string } }) =>
          setMessage(event.currentTarget.value),
      }),
      jsx.jsx("button", {
        type: "submit",
        disabled: sending || message.trim().length === 0,
        children: sending ? "Sending…" : "Send",
      }),
    ],
  });
  const composer = archived
    ? null
    : typeof ProductionComposer === "function"
      ? jsx.jsx(
          typeof ComposerProvider === "function"
            ? ComposerProvider
            : jsx.Fragment,
          {
            children: jsx.jsx(ProductionComposer, {
              selectedProject: null,
              composerLayoutMode: "auto-single-line",
              isResponseInProgress: responseInProgress,
              showUtilityBarBranchWhen: "always",
            }),
          },
        )
      : fallbackComposer;
  const thread =
    ThreadScrollLayout == null
      ? content
      : jsx.jsx(ThreadScrollLayout, {
          children: content,
          footer: archived
            ? jsx.jsx("p", { children: "Archived conversations are read-only" })
            : null,
        });
  return RightPanelComposerOverlay == null || composer == null
    ? jsx.jsxs("div", { children: [thread, composer] })
    : jsx.jsxs("div", {
        children: [
          thread,
          jsx.jsx(RightPanelComposerOverlay, {
            children: composer,
            forceExpanded: true,
          }),
        ],
      });
}
function MainRemoteConversation({
  archived,
  hostId,
  taskId,
  taskState,
  turnState,
}: {
  archived: boolean;
  hostId: string;
  taskId: string;
  taskState: RemoteTaskState;
  turnState: RemoteTurnState | null;
}): unknown {
  const [reviewOpen, setReviewOpen] = React.useState(false);
  const navigate = useNavigate?.() ?? (() => undefined);
  const title = taskState.data?.task.title ?? "Codex";
  const environment =
    taskState.data?.task.task_status_display?.environment_label ?? null;
  const hasPatch = taskState.data?.hasPatch === true;
  const leading =
    ThreadEmoji == null ? null : jsx.jsx(ThreadEmoji, { threadId: taskId });
  const header = jsx.jsxs("header", {
    className: "flex min-w-0 items-center justify-between gap-2",
    children: [
      jsx.jsxs("span", {
        className: "flex min-w-0 items-center gap-1",
        children: [
          leading,
          jsx.jsx("span", { className: "truncate", children: title }),
          environment == null
            ? null
            : jsx.jsx("span", {
                className: "shrink-0 text-codex-description",
                children: environment,
              }),
        ],
      }),
      !archived && hasPatch
        ? jsx.jsx("button", {
            type: "button",
            onClick: () => setReviewOpen(true),
            children: "Open review",
          })
        : null,
    ],
  });
  const body = jsx.jsxs("div", {
    className: "relative h-full min-h-0",
    children: [
      header,
      archived
        ? jsx.jsxs("section", {
            role: "status",
            children: [
              jsx.jsx("strong", { children: "Archived conversation preview" }),
              jsx.jsx("button", {
                type: "button",
                onClick: () => {
                  taskState.onExitArchivedPreview?.();
                  navigate("/");
                },
                children: "Exit preview",
              }),
            ],
          })
        : null,
      jsx.jsx(ThreadBody, { archived, hostId, taskId, taskState, turnState }),
      reviewOpen
        ? jsx.jsxs("aside", {
            "aria-label": "Review changes",
            children: [
              jsx.jsx("h2", { children: "Review changes" }),
              jsx.jsx("button", {
                type: "button",
                onClick: () => setReviewOpen(false),
                children: "Close review",
              }),
            ],
          })
        : null,
    ],
  });
  return jsx.jsxs(jsx.Fragment, {
    children: [
      body,
      archived || ThreadAppShellChrome == null
        ? null
        : jsx.jsx(ThreadAppShellChrome, {
            threadType: "remote",
            showReviewTab: hasPatch,
          }),
    ],
  });
}
function RemoteConversationPage({ variant = "main" }: Props): unknown {
  const { taskId } = useRouteParams?.() ?? {};
  const location = useLocation?.() ?? {};
  const hostId = useSignalValue?.<string>(remoteHostIdSignal) ?? "cloud";
  const taskState =
    useSignalValue?.<RemoteTaskState>(remoteTaskStateSignal) ??
    defaultTaskState;
  const turnState =
    useSignalValue?.<RemoteTurnState | null>(remoteTurnStateSignal) ?? null;
  const archived = location.state?.archivedConversationPreview === true;
  const title = taskState.data?.task.title ?? "Codex";
  const environment =
    taskState.data?.task.task_status_display?.environment_label ?? null;
  useHotkeyWindowDetailLayout?.(
    variant === "hotkey" && taskId != null
      ? {
          mainWindowPath: `/remote/${taskId}`,
          title: environment == null ? title : `${title} · ${environment}`,
        }
      : null,
  );
  if (taskId == null)
    return jsx.jsxs("main", {
      role: "alert",
      children: [
        jsx.jsx("p", { children: "Conversation not found" }),
        jsx.jsx("a", { href: "/", children: "Back home" }),
      ],
    });
  if (taskState.isLoading)
    return jsx.jsx("main", {
      role: "status",
      children: "Loading conversation…",
    });
  if (taskState.isError || taskState.error != null)
    return jsx.jsxs("main", {
      role: "alert",
      children: [
        jsx.jsx("p", { children: "Conversation couldn't be loaded" }),
        jsx.jsx("button", {
          type: "button",
          onClick: () => taskState.refetch?.(),
          children: "Retry",
        }),
      ],
    });
  const content =
    variant === "hotkey"
      ? jsx.jsx(ThreadBody, { archived, hostId, taskId, taskState, turnState })
      : jsx.jsx(MainRemoteConversation, {
          archived,
          hostId,
          taskId,
          taskState,
          turnState,
        });
  return jsx.jsxs(jsx.Fragment, {
    children: [
      DocumentTitle == null
        ? null
        : jsx.jsx(DocumentTitle, { title: taskState.data?.task.title }),
      variant === "hotkey"
        ? jsx.jsx("div", {
            className: "remote-conversation-hotkey",
            children: content,
          })
        : content,
    ],
  });
}

export { RemoteConversationPage };
