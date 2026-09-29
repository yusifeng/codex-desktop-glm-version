// queued-message-list —— queued follow-up previews, actions, pause state, and reordering.

import * as appInitialChunk from "@rchunk/app-initial";
import * as appPrimaryChunk from "@rchunk/app-primary";
import * as appSharedChunk from "@rchunk/app-shared";
import * as modifiersChunk from "@rchunk/modifiers.esm";
import * as runtimeChunk from "@rchunk/rolldown-runtime";

type IntlShape = import("@rchunk/app-shared").IntlShape;
type JsxRuntime = import("@rchunk/app-shared").JsxRuntime;
type ReactRuntime = import("@rchunk/app-shared").ReactRuntime;

interface PullRequestActionSource {
  hostId: string;
  kind: "pull-request-action";
  pullRequest: {
    hostname: string;
    number: number;
    owner: string;
    repository: string;
  };
  title?: string | null;
}

interface SelectedTextAttachment {
  source?: PullRequestActionSource | { kind: string } | null;
}

interface CommentAttachment {
  comments?: readonly unknown[];
  kind?: "annotation" | "design-tweak" | "diff" | string;
}

interface ImageAttachment {
  previewSrc?: string | null;
  src: string;
}

interface QueuedMessageContext {
  appshotContexts?: Array<{
    imageDataUrl?: string | null;
    imagePath?: string | null;
  }>;
  commentAttachments?: CommentAttachment[];
  fileAttachments?: unknown[];
  generatedPastedTextAttachmentPaths?: string[];
  imageAttachments: ImageAttachment[];
  imageCommentDraft?: { comments: readonly unknown[] } | null;
  imageCommentDrafts?: Array<{ comments: readonly unknown[] }>;
  mcpAppModelContextAttachments?: Array<{
    imageAttachments: ImageAttachment[];
  }>;
  pastedTextAttachments?: Array<{ preview?: string | null }>;
  responseTextAnnotations?: readonly unknown[];
  selectedTextAttachments?: SelectedTextAttachment[];
}

interface QueuedMessage {
  context: QueuedMessageContext;
  id: string;
  pausedReason?: unknown;
  text: string;
}

interface QueuedMessageListProps {
  editingMessageId?: string | null;
  hostId?: string | null;
  isInterrupted: boolean;
  isMessagePaused(reason: unknown): boolean;
  isQueueingEnabled: boolean;
  isSendNowDisabled: boolean;
  messages: QueuedMessage[];
  onDeleteMessage(messageId: string): void;
  onEditMessage(messageId: string): void;
  onOpenInSideChatMessage?: ((messageId: string) => void) | null;
  onQueueingChange(enabled: boolean): void;
  onReorderMessages(messageIds: string[]): void;
  onResumeInterruptedQueue(): void;
  onSendNowMessage(messageId: string): void;
}

interface DragEndEvent {
  active: { id: string | number };
  over?: { id: string | number } | null;
}

interface SortableState {
  attributes: Record<string, unknown>;
  isDragging: boolean;
  listeners: Record<string, unknown>;
  setActivatorNodeRef(value: unknown): void;
  setNodeRef(value: unknown): void;
  transform?: unknown;
  transition?: string;
}

interface SharedRuntime {
  $3(): void;
  I3(): JsxRuntime;
  e6: (() => ReactRuntime) & ReactRuntime;
  n4(): IntlShape;
}

interface InitialRuntime {
  $Sn(): void;
  $Z: unknown;
  Set: unknown;
  XSn: unknown;
  ZSn: unknown;
  _et(props: Record<string, unknown>): unknown;
  aCn(...sensors: unknown[]): unknown;
  bet(): void;
  cCn(sensor: unknown, options: Record<string, unknown>): unknown;
  iCn: unknown;
  oCn: { Translate: { toString(value: unknown): string | undefined } };
  qSn(props: Record<string, unknown>): unknown;
  vet<T>(items: readonly T[], from: number, to: number): T[];
  xet(options: { disabled: boolean; id: string }): SortableState;
}

interface PrimaryRuntime {
  Lo(): void;
  Yp(): void;
}

interface ModifiersRuntime {
  i: unknown;
  n: unknown;
  t<T>(items: readonly T[], from: number, to: number): T[];
}

const {
  $3: initializeRuntimeLazy,
  I3: getJsxRuntime,
  e6: getReactRuntime,
  n4: useIntl,
} = appSharedChunk as unknown as SharedRuntime;
const {
  $Sn: initializeDragAndDrop,
  $Z: quickChatSurfaceContext,
  Set: verticalListSortingStrategy,
  XSn: KeyboardSensor,
  ZSn: closestCenter,
  _et: SortableContext,
  aCn: useSensors,
  bet: initializeQueuedMessageModel,
  cCn: useSensor,
  iCn: PointerSensor,
  oCn: CSS,
  qSn: DndContext,
  vet: runtimeArrayMove,
  xet: useSortable,
} = appInitialChunk as unknown as InitialRuntime;
const { Lo: initializeComposerQueueSurface, Yp: initializeWarningIcon } =
  appPrimaryChunk as unknown as PrimaryRuntime;
const {
  i: restrictToParentElement,
  n: restrictToVerticalAxis,
  t: modifierArrayMove,
} = modifiersChunk as unknown as ModifiersRuntime;

void runtimeChunk;
void runtimeArrayMove;

let React: ReactRuntime;
let jsx: JsxRuntime;

function stop(event: { stopPropagation(): void }, callback: () => void): void {
  event.stopPropagation();
  callback();
}

function stripCodeFence(text: string): string {
  const trimmed = text.trim();
  if (!/^(?:`{3,}|~{3,})/.test(trimmed)) return text;
  return trimmed
    .replace(/^(?:`{3,}|~{3,})[^\n]*\n?/, "")
    .replace(/\n?(?:`{3,}|~{3,})\s*$/, "");
}

function countImageComments(context: QueuedMessageContext): number {
  if (context.imageCommentDrafts != null) {
    return context.imageCommentDrafts.reduce(
      (total, draft) => total + draft.comments.length,
      0,
    );
  }
  return context.imageCommentDraft?.comments.length ?? 0;
}

function formatCount(
  intl: IntlShape,
  count: number,
  one: string,
  other: string,
): string {
  return String(
    intl.formatMessage(
      { id: one, defaultMessage: count === 1 ? one : other },
      { count },
    ),
  )
    .replace("{count}", String(count))
    .replace("#", String(count));
}

function isPullRequestActionSource(
  source: SelectedTextAttachment["source"],
): source is PullRequestActionSource {
  return source?.kind === "pull-request-action" && "pullRequest" in source;
}

function pullRequestTargets(
  attachments: SelectedTextAttachment[] | undefined,
): string[] {
  return (attachments ?? []).flatMap(({ source }) => {
    if (!isPullRequestActionSource(source)) return [];
    const title = source.title?.trim() || `#${source.pullRequest.number}`;
    const host =
      source.pullRequest.hostname === "github.com"
        ? ""
        : `${source.pullRequest.hostname}/`;
    return [
      `${title} · ${host}${source.pullRequest.owner}/${source.pullRequest.repository} (${source.hostId})`,
    ];
  });
}

function queuedMessageText(intl: IntlShape, message: QueuedMessage): string {
  const { context, text } = message;
  const targets = pullRequestTargets(context.selectedTextAttachments);
  if (targets.length > 0) {
    const prefix =
      targets.length === 1
        ? "Pull latest"
        : `${targets.length} Pull latest actions`;
    return `${prefix} · ${targets.join(", ")}${text.trim().length > 0 ? ` — ${text}` : ""}`;
  }
  if (text.trim().length > 0) return stripCodeFence(text);

  const pasted = context.pastedTextAttachments ?? [];
  const generatedPasteCount =
    context.generatedPastedTextAttachmentPaths?.length ?? 0;
  const pastedCount = pasted.length > 0 ? pasted.length : generatedPasteCount;
  const pastedPreview = pasted[0]?.preview;
  if (pastedCount > 0) {
    const preview = pastedPreview || "Pasted text";
    return pastedCount === 1
      ? preview
      : `${preview} (+${pastedCount - 1} more pasted text attachments)`;
  }

  const commentAttachments = context.commentAttachments ?? [];
  const comments =
    commentAttachments.reduce(
      (total, attachment) => total + (attachment.comments?.length ?? 0),
      0,
    ) +
    countImageComments(context) +
    (context.responseTextAnnotations?.length ?? 0);
  if (comments > 0)
    return formatCount(intl, comments, "{count} comment", "{count} comments");

  const selectionCount = context.selectedTextAttachments?.length ?? 0;
  if (selectionCount > 0) {
    return formatCount(
      intl,
      selectionCount,
      "{count} selection",
      "{count} selections",
    );
  }
  if (context.imageAttachments.length > 0) {
    return formatCount(
      intl,
      context.imageAttachments.length,
      "{count} image",
      "{count} images",
    );
  }
  return "";
}

function imagePreview(context: QueuedMessageContext): string | null {
  const image = context.imageAttachments[0];
  if (image != null) return image.previewSrc ?? image.src;
  for (const appshot of context.appshotContexts ?? []) {
    const source = appshot.imageDataUrl ?? appshot.imagePath;
    if (source != null) return source;
  }
  return (
    context.mcpAppModelContextAttachments
      ?.flatMap((attachment) => attachment.imageAttachments)
      .at(0)?.src ?? null
  );
}

function QueuedMessageRow({
  editing,
  hostId,
  message,
  paused,
  queueingEnabled,
  reorderable,
  sendNowDisabled,
  onDelete,
  onEdit,
  onOpenInSideChat,
  onQueueingChange,
  onSendNow,
}: {
  editing: boolean;
  hostId?: string | null;
  message: QueuedMessage;
  paused: boolean;
  queueingEnabled: boolean;
  reorderable: boolean;
  sendNowDisabled: boolean;
  onDelete(messageId: string): void;
  onEdit(messageId: string): void;
  onOpenInSideChat?: ((messageId: string) => void) | null;
  onQueueingChange(enabled: boolean): void;
  onSendNow(messageId: string): void;
}): unknown {
  const intl = useIntl();
  const sortable = useSortable({ id: message.id, disabled: !reorderable });
  const preview = queuedMessageText(intl, message);
  const previewImage = imagePreview(message.context);
  const primaryLabel = paused ? "Retry" : "Steer";
  const opacity = editing || sortable.isDragging ? "opacity-60" : undefined;
  const style = {
    transform: CSS.Translate.toString(sortable.transform),
    transition: sortable.transition,
  };

  return jsx.jsx("div", {
    ref: sortable.setNodeRef,
    style,
    className: opacity,
    "data-message-id": message.id,
    "data-host-id": hostId ?? undefined,
    children: jsx.jsxs("article", {
      className: "queued-message-row",
      children: [
        reorderable
          ? jsx.jsx("button", {
              type: "button",
              ref: sortable.setActivatorNodeRef,
              "aria-label": "Reorder queued message",
              ...sortable.attributes,
              ...sortable.listeners,
              children: "Drag",
            })
          : jsx.jsx("span", { "aria-hidden": true, children: "Queued" }),
        paused
          ? jsx.jsx("span", {
              role: "status",
              title: "Retry, edit, or delete it to continue the queue",
              children: "This queued message could not be sent",
            })
          : null,
        previewImage == null
          ? null
          : jsx.jsx("img", {
              src: previewImage,
              alt: "Image attachment",
              draggable: false,
            }),
        preview.length === 0 && previewImage != null
          ? null
          : jsx.jsx("div", {
              className: "queued-message-preview",
              children: preview,
            }),
        jsx.jsx("button", {
          type: "button",
          "aria-label": primaryLabel,
          disabled: sendNowDisabled,
          title: paused
            ? "Try sending this queued message again"
            : "Submit without interrupting the model",
          onClick: (event: { stopPropagation(): void }) =>
            stop(event, () => onSendNow(message.id)),
          children: primaryLabel,
        }),
        jsx.jsx("button", {
          type: "button",
          "aria-label": "Delete queued message",
          onClick: (event: { stopPropagation(): void }) =>
            stop(event, () => onDelete(message.id)),
          children: "Delete",
        }),
        jsx.jsxs("details", {
          children: [
            jsx.jsx("summary", {
              "aria-label": "Queued message actions",
              children: "More",
            }),
            jsx.jsx("button", {
              type: "button",
              onClick: (event: { stopPropagation(): void }) =>
                stop(event, () => onEdit(message.id)),
              children: "Edit message",
            }),
            onOpenInSideChat == null
              ? null
              : jsx.jsx("button", {
                  type: "button",
                  onClick: (event: { stopPropagation(): void }) =>
                    stop(event, () => onOpenInSideChat(message.id)),
                  children: "Open in side chat",
                }),
            jsx.jsx("button", {
              type: "button",
              onClick: (event: { stopPropagation(): void }) =>
                stop(event, () => onQueueingChange(!queueingEnabled)),
              children: queueingEnabled
                ? "Turn off queueing"
                : "Turn on queueing",
            }),
          ],
        }),
      ],
    }),
  });
}

function QueuedMessageList(props: QueuedMessageListProps): unknown {
  const { isQuickChatFloatingSurface } = React.useContext(
    quickChatSurfaceContext,
  ) as {
    isQuickChatFloatingSurface?: boolean;
  };
  const ids = props.messages.map((message) => message.id);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, {}),
  );
  if (props.messages.length === 0) return null;

  const onDragEnd = ({ active, over }: DragEndEvent): void => {
    if (over == null) return;
    const activeId = String(active.id);
    const overId = String(over.id);
    if (activeId === overId) return;
    const from = ids.indexOf(activeId);
    const to = ids.indexOf(overId);
    if (from !== -1 && to !== -1) {
      props.onReorderMessages(modifierArrayMove(ids, from, to));
    }
  };

  const rows = props.messages.map((message) =>
    jsx.jsx(
      QueuedMessageRow,
      {
        editing: message.id === props.editingMessageId,
        hostId: props.hostId,
        message,
        paused: props.isMessagePaused(message.pausedReason),
        queueingEnabled: props.isQueueingEnabled,
        reorderable: props.messages.length > 1,
        sendNowDisabled: props.isSendNowDisabled,
        onDelete: props.onDeleteMessage,
        onEdit: props.onEditMessage,
        onOpenInSideChat: props.onOpenInSideChatMessage,
        onQueueingChange: props.onQueueingChange,
        onSendNow: props.onSendNowMessage,
      },
      message.id,
    ),
  );

  return jsx.jsx("section", {
    className: "queued-message-list",
    "data-variant": isQuickChatFloatingSurface ? "inline" : "default",
    children: jsx.jsxs("div", {
      className: "queued-message-scroll",
      children: [
        props.isInterrupted
          ? jsx.jsxs("header", {
              children: [
                jsx.jsx("span", {
                  children: "Queue paused because you interrupted",
                }),
                jsx.jsx("button", {
                  type: "button",
                  onClick: props.onResumeInterruptedQueue,
                  children: "Resume",
                }),
              ],
            })
          : null,
        jsx.jsx(DndContext, {
          sensors,
          collisionDetection: closestCenter,
          modifiers: [restrictToVerticalAxis, restrictToParentElement],
          onDragEnd,
          children: jsx.jsx(SortableContext, {
            items: ids,
            strategy: verticalListSortingStrategy,
            children: rows,
          }),
        }),
      ],
    }),
  });
}

let initialized = false;
function initializeQueuedMessageList(): void {
  if (initialized) return;
  initializeRuntimeLazy();
  initializeDragAndDrop();
  initializeQueuedMessageModel();
  initializeComposerQueueSurface();
  initializeWarningIcon();
  React = getReactRuntime();
  jsx = getJsxRuntime();
  initialized = true;
}

initializeQueuedMessageList();
export { QueuedMessageList };
