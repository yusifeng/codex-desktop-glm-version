// delete-archived-chats-dialog —— 删除单个、项目内或全部归档本地聊天的确认弹窗。
// 原版：app/webview/assets/delete-archived-chats-dialog-c9e21f2b6f91.js。

import * as runtimeChunk from "@rchunk/rolldown-runtime";
import * as appSharedChunk from "@rchunk/app-shared";
import * as appInitialChunk from "@rchunk/app-initial";

void runtimeChunk;
const appShared = appSharedChunk as Record<string, any>;
const appInitial = appInitialChunk as Record<string, any>;
let jsx: any;
let initialized = false;

function initializeDeleteArchivedChatsDialog(): void {
  if (initialized) return;
  appShared.$3?.();
  appShared.K2?.();
  appShared.Zh?.();
  appShared.zh?.();
  appShared.Ph?.();
  appInitial.Rb?.();
  jsx = appShared.I3?.();
  initialized = true;
}

type DeleteState =
  | { kind: "all"; threads: unknown[] }
  | { kind: "project"; threads: unknown[] }
  | { kind: "single"; threads: unknown[] };

function DeleteArchivedChatsDialog({
  state,
  onConfirm,
  onOpenChange,
  isDeleting = false,
}: {
  state: DeleteState | null;
  onConfirm: () => void;
  onOpenChange: (open: boolean) => void;
  isDeleting?: boolean;
}): unknown {
  initializeDeleteArchivedChatsDialog();
  if (state == null) return null;
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
  const header = jsx.jsx(appShared.jh, {
    children: jsx.jsx(appShared.Ah, {
      title: jsx.jsx(appShared.Rh, {
        children: jsx.jsx(appShared.Y2, titleCopy),
      }),
    }),
  });
  const body = jsx.jsx(appShared.jh, {
    className: "text-codex-description",
    children: jsx.jsx("p", {
      children: jsx.jsx(appShared.Y2, bodyCopy),
    }),
  });
  const cancel = jsx.jsx(appShared.Yh, {
    color: "ghost",
    disabled: isDeleting,
    onClick: () => onOpenChange(false),
    children: jsx.jsx(appShared.Y2, {
      id: "settings.dataControls.archivedChats.deleteConfirm.cancel",
      defaultMessage: "Cancel",
      description: "Cancel button label for deleting archived chats",
    }),
  });
  const confirm = jsx.jsx(appShared.Yh, {
    color: "danger",
    loading: isDeleting,
    type: "submit",
    children: jsx.jsx(appShared.Y2, { ...appInitial.Lb.delete }),
  });
  const footer = jsx.jsx(appShared.jh, {
    children: jsx.jsxs(appShared.kh, { children: [cancel, confirm] }),
  });
  const form = jsx.jsxs(appShared.Oh, {
    as: "form",
    onSubmit: (event: any) => {
      event.preventDefault();
      if (!isDeleting) onConfirm();
    },
    children: [header, body, footer],
  });
  return jsx.jsx(appShared.Ih, {
    open: true,
    showDialogClose: false,
    onOpenChange: (open: boolean) => {
      if (!isDeleting) onOpenChange(open);
    },
    children: form,
  });
}

initializeDeleteArchivedChatsDialog();
export {
  initializeDeleteArchivedChatsDialog as n,
  DeleteArchivedChatsDialog as t,
};
