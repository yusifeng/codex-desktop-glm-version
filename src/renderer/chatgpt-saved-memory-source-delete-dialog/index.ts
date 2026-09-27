// chatgpt-saved-memory-source-delete-dialog —— 来源面板内账户记忆的删除确认弹窗。
// 原版：app/webview/assets/chatgpt-saved-memory-source-delete-dialog-d168320d4ec2.js。

import * as runtimeChunk from "@rchunk/rolldown-runtime";
import * as appSharedChunk from "@rchunk/app-shared";
import type { JsxRuntime } from "@rchunk/app-shared";

void runtimeChunk;
const {
  $3: initializeJsxRuntime,
  Ah: DialogHeader,
  I3: getJsxRuntime,
  Ih: Dialog,
  K2: initializeIntlRuntime,
  Lh: DialogDescription,
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

let jsxRuntime: JsxRuntime | null = null;

interface ChatGptSavedMemorySourceDeleteDialogProps {
  title: string;
  onClose(): void;
  onConfirm(): void;
}

interface FormSubmitEvent {
  preventDefault(): void;
}

function ChatGptSavedMemorySourceDeleteDialog({
  title,
  onClose,
  onConfirm,
}: ChatGptSavedMemorySourceDeleteDialogProps): unknown {
  const jsx = getInitializedJsxRuntime();
  const handleOpenChange = (open: boolean) => {
    if (!open) onClose();
  };
  const handleSubmit = (event: FormSubmitEvent) => {
    event.preventDefault();
    onConfirm();
  };
  const heading = jsx.jsx(DialogSection, {
    children: jsx.jsx(DialogHeader, {
      title: jsx.jsx(DialogTitle, {
        children: jsx.jsx(FormattedMessage, {
          id: "chatgptConversations.summaryPanel.sources.memory.delete.title",
          defaultMessage: "Delete this memory?",
          description:
            "Title of the confirmation dialog opened from a saved-memory citation in the ChatGPT Sources side panel before permanently deleting that account memory.",
        }),
      }),
    }),
  });
  const description = jsx.jsx(DialogSection, {
    children: jsx.jsx(DialogDescription, {
      children: jsx.jsx(FormattedMessage, {
        id: "chatgptConversations.summaryPanel.sources.memory.delete.descriptionWithTitle",
        defaultMessage:
          '"{title}" will be deleted. ChatGPT may not remember this information going forward.',
        description:
          "Warning in the confirmation dialog opened from a saved-memory citation in the ChatGPT Sources side panel. Explains that one account memory, not conversation history, will be deleted.",
        values: { title },
      }),
    }),
  });
  const cancelButton = jsx.jsx(Button, {
    color: "secondary",
    type: "button",
    onClick: onClose,
    children: jsx.jsx(FormattedMessage, {
      id: "chatgptConversations.summaryPanel.sources.memory.delete.cancel",
      defaultMessage: "Cancel",
      description:
        "Secondary button that closes saved-memory deletion confirmation from the ChatGPT Sources side panel without changing account memory.",
    }),
  });
  const deleteButton = jsx.jsx(Button, {
    color: "danger",
    type: "submit",
    children: jsx.jsx(FormattedMessage, {
      id: "chatgptConversations.summaryPanel.sources.memory.delete.confirm",
      defaultMessage: "Delete",
      description:
        "Destructive confirmation button that permanently deletes the cited saved account memory from the ChatGPT Sources side panel.",
    }),
  });
  const form = jsx.jsxs(DialogBody, {
    as: "form",
    onSubmit: handleSubmit,
    children: [
      heading,
      description,
      jsx.jsxs(DialogFooter, { children: [cancelButton, deleteButton] }),
    ],
  });

  return jsx.jsx(Dialog, {
    open: true,
    onOpenChange: handleOpenChange,
    children: form,
  });
}

function initializeChatGptSavedMemorySourceDeleteDialog(): void {
  if (jsxRuntime != null) return;
  initializeJsxRuntime();
  initializeIntlRuntime();
  initializeButton();
  initializeDialog();
  initializeDialogLayout();
  jsxRuntime = getJsxRuntime();
}

function getInitializedJsxRuntime(): JsxRuntime {
  initializeChatGptSavedMemorySourceDeleteDialog();
  if (jsxRuntime == null) {
    throw new Error("Saved memory delete dialog JSX runtime failed to initialize");
  }
  return jsxRuntime;
}

initializeChatGptSavedMemorySourceDeleteDialog();

export { ChatGptSavedMemorySourceDeleteDialog };
