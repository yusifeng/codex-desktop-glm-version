// chatgpt-saved-memory-source-delete-dialog —— 来源面板内账户记忆的删除确认弹窗。
// 原版：app/webview/assets/chatgpt-saved-memory-source-delete-dialog-d168320d4ec2.js。

import * as runtimeChunk from "@rchunk/rolldown-runtime";
import * as appSharedChunk from "@rchunk/app-shared";

void runtimeChunk;
const appShared = appSharedChunk as Record<string, any>;
const jsx = appShared.I3();

function ChatGptSavedMemorySourceDeleteDialog({
  title,
  onClose,
  onConfirm,
}: {
  title: string;
  onClose: () => void;
  onConfirm: () => void;
}) {
  const handleOpenChange = (open: boolean) => {
    if (!open) onClose();
  };
  const handleSubmit = (event: { preventDefault: () => void }) => {
    event.preventDefault();
    onConfirm();
  };
  const heading = jsx.jsx(appShared.jh, {
    children: jsx.jsx(appShared.Ah, {
      title: jsx.jsx(appShared.Rh, {
        children: jsx.jsx(appShared.Y2, {
          id: "chatgptConversations.summaryPanel.sources.memory.delete.title",
          defaultMessage: "Delete this memory?",
          description:
            "Title of the confirmation dialog opened from a saved-memory citation in the ChatGPT Sources side panel before permanently deleting that account memory.",
        }),
      }),
    }),
  });
  const description = jsx.jsx(appShared.jh, {
    children: jsx.jsx(appShared.Lh, {
      children: jsx.jsx(appShared.Y2, {
        id: "chatgptConversations.summaryPanel.sources.memory.delete.descriptionWithTitle",
        defaultMessage:
          '"{title}" will be deleted. ChatGPT may not remember this information going forward.',
        description:
          "Warning in the confirmation dialog opened from a saved-memory citation in the ChatGPT Sources side panel. Explains that one account memory, not conversation history, will be deleted.",
        values: { title },
      }),
    }),
  });
  const cancelButton = jsx.jsx(appShared.Yh, {
    color: "secondary",
    type: "button",
    onClick: onClose,
    children: jsx.jsx(appShared.Y2, {
      id: "chatgptConversations.summaryPanel.sources.memory.delete.cancel",
      defaultMessage: "Cancel",
      description:
        "Secondary button that closes saved-memory deletion confirmation from the ChatGPT Sources side panel without changing account memory.",
    }),
  });
  const deleteButton = jsx.jsx(appShared.Yh, {
    color: "danger",
    type: "submit",
    children: jsx.jsx(appShared.Y2, {
      id: "chatgptConversations.summaryPanel.sources.memory.delete.confirm",
      defaultMessage: "Delete",
      description:
        "Destructive confirmation button that permanently deletes the cited saved account memory from the ChatGPT Sources side panel.",
    }),
  });
  const form = jsx.jsxs(appShared.Oh, {
    as: "form",
    onSubmit: handleSubmit,
    children: [
      heading,
      description,
      jsx.jsxs(appShared.kh, { children: [cancelButton, deleteButton] }),
    ],
  });

  return jsx.jsx(appShared.Ih, {
    open: true,
    onOpenChange: handleOpenChange,
    children: form,
  });
}

function initializeChatGptSavedMemorySourceDeleteDialog(): void {
  appShared.$3?.();
  appShared.K2?.();
  appShared.Zh?.();
  appShared.zh?.();
  appShared.Ph?.();
}

initializeChatGptSavedMemorySourceDeleteDialog();

export { ChatGptSavedMemorySourceDeleteDialog };
