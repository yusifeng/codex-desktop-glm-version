import * as appSharedChunk from "@rchunk/app-shared";
import * as appInitialChunk from "@rchunk/app-initial";
import type { JsxRuntime, ReactRuntime } from "@rchunk/app-shared";

export interface DeleteThreadDialogProps {
  conversationId: string;
  hostId?: string;
  returnFocusTo?: HTMLElement | null;
  onClose(): void;
  onDelete?(input: { threadId: string; hostId?: string }): Promise<void> | void;
  onError?(error: unknown): void;
}

interface Scope {
  get(token: unknown): unknown;
}
interface ToastApi {
  danger(message: unknown, options?: Record<string, unknown>): void;
  info(message: unknown, options?: Record<string, unknown>): void;
}

const shared = appSharedChunk as unknown as Record<string, unknown>;
const initial = appInitialChunk as unknown as Record<string, unknown>;
let jsx: JsxRuntime;
let React: Pick<ReactRuntime, "useRef" | "useState">;
let initialized = false;

function initializeDeleteThreadDialog(): void {
  if (initialized) return;
  initialized = true;
  for (const value of [
    shared.$3,
    shared.FX,
    shared.K2,
    shared.Ph,
    shared.QI,
    shared.Zh,
    shared.zh,
    initial.Evt,
    initial.Wgn,
  ]) {
    if (typeof value === "function") (value as () => void)();
  }
  jsx = (shared.I3 as () => JsxRuntime)();
  React =
    typeof shared.e6 === "function"
      ? (shared.e6 as () => ReactRuntime)()
      : ({
          useRef: <Value>(current: Value) => ({ current }),
          useState: <Value>(value: Value | (() => Value)) => [
            typeof value === "function" ? (value as () => Value)() : value,
            () => undefined,
          ],
        } as Pick<ReactRuntime, "useRef" | "useState">);
}

function translated(
  id: string,
  defaultMessage: string,
  description: string,
): unknown {
  const Message = shared.Y2;
  return typeof Message === "function"
    ? jsx.jsx(Message, { id, defaultMessage, description })
    : defaultMessage;
}

function element(
  production: unknown,
  fallback: unknown,
  props: Record<string, unknown>,
): unknown {
  return jsx.jsx(
    typeof production === "function" ? production : fallback,
    props,
  );
}

function DeleteThreadDialog(props: DeleteThreadDialogProps): unknown {
  initializeDeleteThreadDialog();
  const scope =
    typeof shared.LX === "function"
      ? (shared.LX as (token: unknown) => Scope)(shared.ZI)
      : null;
  const intl =
    typeof shared.n4 === "function"
      ? (
          shared.n4 as () => {
            formatMessage(descriptor: Record<string, unknown>): string;
          }
        )()
      : null;
  const [deleting, setDeleting] = React.useState(false);
  const deletionStarted = React.useRef(false);
  const focus = React.useRef({
    target: props.returnFocusTo,
    list: props.returnFocusTo?.closest?.('[role="list"]') ?? null,
    sidebar: props.returnFocusTo?.closest?.("nav") ?? null,
  });

  const notify = (kind: "danger" | "info", message: unknown): void => {
    const api = scope?.get(shared.pk) as ToastApi | undefined;
    api?.[kind]?.(
      message,
      kind === "danger"
        ? {
            errorAnalytics: {
              toastId: "sidebarElectron.deleteThreadDialog.error",
            },
          }
        : {
            leading:
              typeof shared.YC === "function" ? jsx.jsx(shared.YC, {}) : null,
          },
    );
  };
  const submit = async (event?: { preventDefault?(): void }): Promise<void> => {
    event?.preventDefault?.();
    if (deletionStarted.current) return;
    deletionStarted.current = true;
    setDeleting(true);
    try {
      if (props.onDelete != null) {
        await props.onDelete({
          threadId: props.conversationId,
          hostId: props.hostId,
        });
      } else {
        const client =
          typeof initial.Ugn === "function"
            ? (
                initial.Ugn as (
                  scope: Scope | null,
                  hostId?: string,
                ) => {
                  sendRequest(method: string, input: unknown): Promise<unknown>;
                }
              )(scope, props.hostId)
            : null;
        if (client == null)
          throw new Error("Thread deletion client is unavailable");
        await client.sendRequest("thread/delete", {
          threadId: props.conversationId,
        });
      }
    } catch (error) {
      deletionStarted.current = false;
      setDeleting(false);
      notify(
        "danger",
        intl?.formatMessage({
          id: "sidebarElectron.deleteThreadDialog.error",
          defaultMessage: "Couldn't delete the task. Try again.",
          description:
            "Error toast when deleting a Codex task fails; the confirmation stays open so the user can retry or cancel",
        }) ?? "Couldn't delete the task. Try again.",
      );
      props.onError?.(error);
      return;
    }
    props.onClose();
    notify(
      "info",
      translated(
        "sidebarElectron.deleteThreadDialog.success",
        "Task deleted",
        "Toast shown after permanently deleting a Codex task. There is no undo action.",
      ),
    );
  };

  const cancel = (): void => {
    if (!deletionStarted.current) props.onClose();
  };
  const contentProps = {
    onCloseAutoFocus(event: { preventDefault(): void }): void {
      event.preventDefault();
      if (deletionStarted.current || typeof document === "undefined") return;
      const target = focus.current.target;
      if (
        typeof HTMLElement !== "undefined" &&
        target instanceof HTMLElement &&
        target !== document.body &&
        target.isConnected
      ) {
        target.focus();
        if (document.activeElement === target) return;
      }
      const appFocused =
        typeof initial.Cvt === "function" && (initial.Cvt as () => boolean)();
      if (appFocused) return;
      const fallback = focus.current.list?.isConnected
        ? focus.current.list
        : focus.current.sidebar?.querySelector?.("button");
      (fallback as HTMLElement | null)?.focus?.();
    },
  };

  const title = translated(
    "sidebarElectron.deleteThreadDialog.title",
    "Delete task?",
    "Title of the irreversible Codex task deletion confirmation dialog",
  );
  const description = translated(
    "sidebarElectron.deleteThreadDialog.description",
    "This permanently deletes the task and its subagent tasks. This cannot be undone.",
    "Warning that deleting a Codex task also deletes its subagent tasks and cannot be undone",
  );
  const cancelButton = element(shared.Yh, "button", {
    autoFocus: true,
    color: "outline",
    disabled: deleting,
    type: "button",
    onClick: cancel,
    children: translated(
      "sidebarElectron.deleteThreadDialog.cancel",
      "Cancel",
      "Safe default button that closes Codex task deletion confirmation without deleting the task",
    ),
  });
  const deleteButton = element(shared.Yh, "button", {
    color: "danger",
    loading: deleting,
    type: "submit",
    children: translated(
      "sidebarElectron.deleteThreadDialog.confirm",
      "Delete",
      "Destructive button that confirms irreversible deletion of the Codex task",
    ),
  });
  const form = jsx.jsxs("form", {
    className: "select-none",
    onSubmit: submit,
    children: [
      jsx.jsx("h1", { children: title }),
      jsx.jsx("p", { children: description }),
      jsx.jsx("footer", { children: [cancelButton, deleteButton] }),
    ],
  });
  const Dialog = shared.Ih;
  return typeof Dialog === "function"
    ? jsx.jsx(Dialog, {
        open: true,
        onOpenChange: (open: boolean) => {
          if (!open) cancel();
        },
        contentProps,
        size: "compact",
        children: form,
      })
    : jsx.jsx("dialog", { open: true, contentProps, children: form });
}

initializeDeleteThreadDialog();
export { DeleteThreadDialog };
