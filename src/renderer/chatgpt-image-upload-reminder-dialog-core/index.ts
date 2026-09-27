// chatgpt-image-upload-reminder-dialog-core —— 青少年图片上传隐私提醒弹窗。
// 原版：app/webview/assets/chatgpt-image-upload-reminder-dialog-6d64e2b29a8f.js。

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

interface ChatGptImageUploadReminderDialogProps {
  onAcknowledge(): void;
  overlayClassName?: string;
}

interface ReminderSubmitEvent {
  preventDefault(): void;
  stopPropagation(): void;
}

function ignoreOpenChange(): void {}

function ChatGptImageUploadReminderDialog({
  onAcknowledge,
  overlayClassName,
}: ChatGptImageUploadReminderDialogProps): unknown {
  const jsx = getInitializedJsxRuntime();
  const handleSubmit = (event: ReminderSubmitEvent) => {
    event.preventDefault();
    event.stopPropagation();
    onAcknowledge();
  };
  const title = jsx.jsx(DialogTitle, {
    children: jsx.jsx(FormattedMessage, {
      id: "chatgptConversations.imageUploadReminder.title",
      defaultMessage: "Check before sharing",
      description:
        "Title of a privacy reminder asking teens to check photos for sensitive information when attaching them to ChatGPT",
    }),
  });
  const heading = jsx.jsx(DialogSection, {
    children: jsx.jsx(DialogHeader, {
      className: "select-none",
      title,
      subtitle: jsx.jsx(DialogDescription, {
        children: jsx.jsx(FormattedMessage, {
          id: "chatgptConversations.imageUploadReminder.description",
          defaultMessage:
            "Before you upload, take a quick look to make sure you haven’t included anything sensitive",
          description:
            "Privacy reminder asking teens to check photos for sensitive information when attaching them to ChatGPT; shown before selection or after a sensitive-image preview",
        }),
      }),
    }),
  });
  const footer = jsx.jsx(DialogSection, {
    children: jsx.jsx(DialogFooter, {
      children: jsx.jsx(Button, {
        type: "submit",
        children: jsx.jsx(FormattedMessage, {
          id: "chatgptConversations.imageUploadReminder.acknowledge",
          defaultMessage: "Got it",
          description:
            "Only button in the teen photo privacy reminder; acknowledges it and either opens the picker before selection or closes the reminder after an upload",
        }),
      }),
    }),
  });
  const form = jsx.jsxs(DialogBody, {
    as: "form",
    onSubmit: handleSubmit,
    children: [heading, footer],
  });

  return jsx.jsx(Dialog, {
    open: true,
    shouldIgnoreClickOutside: true,
    showDialogClose: false,
    size: "compact",
    overlayClassName,
    onOpenChange: ignoreOpenChange,
    children: form,
  });
}

function initializeChatGptImageUploadReminderDialog(): void {
  if (jsxRuntime != null) return;
  initializeJsxRuntime();
  initializeIntlRuntime();
  initializeButton();
  initializeDialog();
  initializeDialogLayout();
  jsxRuntime = getJsxRuntime();
}

function getInitializedJsxRuntime(): JsxRuntime {
  initializeChatGptImageUploadReminderDialog();
  if (jsxRuntime == null) {
    throw new Error("Image upload reminder JSX runtime failed to initialize");
  }
  return jsxRuntime;
}

export {
  initializeChatGptImageUploadReminderDialog as n,
  ChatGptImageUploadReminderDialog as t,
};
