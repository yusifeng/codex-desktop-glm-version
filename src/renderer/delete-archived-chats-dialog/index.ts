// delete-archived-chats-dialog —— 删除单个、项目内或全部归档本地聊天的确认弹窗。
// 原版：app/webview/assets/delete-archived-chats-dialog-c9e21f2b6f91.js。

import * as runtimeChunk from "@rchunk/rolldown-runtime";
import * as appSharedChunk from "@rchunk/app-shared";
import * as appInitialChunk from "@rchunk/app-initial";
import type { JsxRuntime } from "@rchunk/app-shared";

void runtimeChunk;
const {
  $3: initializeJsxRuntime,
  Ah: DialogHeader,
  I3: getJsxRuntime,
  Ih: Dialog,
  K2: initializeIntlRuntime,
  Oh: DialogBody,
  Ph: initializeDialogLayout,
  Rh: DialogTitle,
  Y2: FormattedMessage,
  Yh: Button,
  Zh: initializeButton,
  jh: DialogSection,
  kh: DialogFooter,
  zh: initializeDialog,
} = appSharedChunk;
const { Lb: commonMessages, Rb: initializeCommonMessages } = appInitialChunk;
let jsxRuntime: JsxRuntime | null = null;
let initialized = false;

function initializeDeleteArchivedChatsDialog(): void {
  if (initialized) return;
  initializeJsxRuntime();
  initializeIntlRuntime();
  initializeButton();
  initializeDialog();
  initializeDialogLayout();
  initializeCommonMessages();
  jsxRuntime = getJsxRuntime();
  initialized = true;
}

type DeleteState =
  | { kind: "all"; threads: readonly unknown[] }
  | { kind: "project"; threads: readonly unknown[] }
  | { kind: "single"; threads: readonly unknown[] };

interface DeleteArchivedChatsDialogProps {
  state: DeleteState | null;
  onConfirm(): void;
  onOpenChange(open: boolean): void;
  isDeleting?: boolean;
}

interface FormSubmitEvent {
  preventDefault(): void;
}

function DeleteArchivedChatsDialog({
  state,
  onConfirm,
  onOpenChange,
  isDeleting = false,
}: DeleteArchivedChatsDialogProps): unknown {
  initializeDeleteArchivedChatsDialog();
  if (state == null) return null;
  const jsx = getInitializedJsxRuntime();
  const titleCopy =
    state.kind === "all"
      ? {
          id: "settings.dataControls.archivedChats.deleteAllConfirm.title",
          defaultMessage: "Delete all archived local chats?",
          description:
            "Title for confirming deletion of all archived local chats",
        }
      : state.kind === "project"
        ? {
            id: "settings.dataControls.archivedChats.deleteProjectConfirm.title",
            defaultMessage: "Delete all in project?",
            description:
              "Title for confirming deletion of archived local chats in one project",
          }
        : {
            id: "settings.dataControls.archivedChats.deleteConfirm.title",
            defaultMessage: "Delete archived chat?",
            description: "Title for confirming deletion of an archived chat",
          };
  const bodyCopy =
    state.kind === "all"
      ? {
          id: "settings.dataControls.archivedChats.deleteAllConfirm.body",
          defaultMessage: "This permanently deletes all local archived chats",
          description:
            "Body copy in the delete all archived local chats confirmation dialog",
        }
      : state.kind === "project"
        ? {
            id: "settings.dataControls.archivedChats.deleteProjectConfirm.body",
            defaultMessage:
              "This permanently deletes {count, plural, one {# local archived chat} other {# local archived chats}} in this project",
            description:
              "Body copy in the delete archived local chats in project confirmation dialog",
            values: { count: state.threads.length },
          }
        : {
            id: "settings.dataControls.archivedChats.deleteConfirm.body",
            defaultMessage: "This permanently deletes the archived chat",
            description:
              "Body copy in the delete archived chat confirmation dialog",
          };
  const header = jsx.jsx(DialogSection, {
    children: jsx.jsx(DialogHeader, {
      title: jsx.jsx(DialogTitle, {
        children: jsx.jsx(FormattedMessage, titleCopy),
      }),
    }),
  });
  const body = jsx.jsx(DialogSection, {
    className: "text-codex-description",
    children: jsx.jsx("p", {
      children: jsx.jsx(FormattedMessage, bodyCopy),
    }),
  });
  const cancel = jsx.jsx(Button, {
    color: "ghost",
    disabled: isDeleting,
    onClick: () => onOpenChange(false),
    children: jsx.jsx(FormattedMessage, {
      id: "settings.dataControls.archivedChats.deleteConfirm.cancel",
      defaultMessage: "Cancel",
      description: "Cancel button label for deleting archived chats",
    }),
  });
  const confirm = jsx.jsx(Button, {
    color: "danger",
    loading: isDeleting,
    type: "submit",
    children: jsx.jsx(FormattedMessage, { ...commonMessages.delete }),
  });
  const footer = jsx.jsx(DialogSection, {
    children: jsx.jsxs(DialogFooter, { children: [cancel, confirm] }),
  });
  const form = jsx.jsxs(DialogBody, {
    as: "form",
    onSubmit: (event: FormSubmitEvent) => {
      event.preventDefault();
      if (!isDeleting) onConfirm();
    },
    children: [header, body, footer],
  });
  return jsx.jsx(Dialog, {
    open: true,
    showDialogClose: false,
    onOpenChange: (open: boolean) => {
      if (!isDeleting) onOpenChange(open);
    },
    children: form,
  });
}

function getInitializedJsxRuntime(): JsxRuntime {
  initializeDeleteArchivedChatsDialog();
  if (jsxRuntime == null) {
    throw new Error("Delete archived chats JSX runtime failed to initialize");
  }
  return jsxRuntime;
}

initializeDeleteArchivedChatsDialog();
export {
  initializeDeleteArchivedChatsDialog as n,
  DeleteArchivedChatsDialog as t,
};
