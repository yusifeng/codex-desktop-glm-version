// chatgpt-image-upload-reminder-dialog-core —— 青少年图片上传隐私提醒弹窗。
// 原版：app/webview/assets/chatgpt-image-upload-reminder-dialog-6d64e2b29a8f.js。

import * as runtimeChunk from "@rchunk/rolldown-runtime";
import * as appSharedChunk from "@rchunk/app-shared";

void runtimeChunk;
const appShared = appSharedChunk as Record<string, any>;
const jsx = appShared.I3();

function ignoreOpenChange(): void {}

function ChatGptImageUploadReminderDialog({
  onAcknowledge,
  overlayClassName,
}: {
  onAcknowledge: () => void;
  overlayClassName?: string;
}) {
  const handleSubmit = (event: {
    preventDefault: () => void;
    stopPropagation: () => void;
  }) => {
    event.preventDefault();
    event.stopPropagation();
    onAcknowledge();
  };
  const title = jsx.jsx(appShared.Rh, {
    children: jsx.jsx(appShared.Y2, {
      id: "chatgptConversations.imageUploadReminder.title",
      defaultMessage: "Check before sharing",
      description:
        "Title of a privacy reminder asking teens to check photos for sensitive information when attaching them to ChatGPT",
    }),
  });
  const heading = jsx.jsx(appShared.jh, {
    children: jsx.jsx(appShared.Ah, {
      className: "select-none",
      title,
      subtitle: jsx.jsx(appShared.Lh, {
        children: jsx.jsx(appShared.Y2, {
          id: "chatgptConversations.imageUploadReminder.description",
          defaultMessage:
            "Before you upload, take a quick look to make sure you haven’t included anything sensitive",
          description:
            "Privacy reminder asking teens to check photos for sensitive information when attaching them to ChatGPT; shown before selection or after a sensitive-image preview",
        }),
      }),
    }),
  });
  const footer = jsx.jsx(appShared.jh, {
    children: jsx.jsx(appShared.kh, {
      children: jsx.jsx(appShared.Yh, {
        type: "submit",
        children: jsx.jsx(appShared.Y2, {
          id: "chatgptConversations.imageUploadReminder.acknowledge",
          defaultMessage: "Got it",
          description:
            "Only button in the teen photo privacy reminder; acknowledges it and either opens the picker before selection or closes the reminder after an upload",
        }),
      }),
    }),
  });
  const form = jsx.jsxs(appShared.Oh, {
    as: "form",
    onSubmit: handleSubmit,
    children: [heading, footer],
  });

  return jsx.jsx(appShared.Ih, {
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
  appShared.$3?.();
  appShared.K2?.();
  appShared.Zh?.();
  appShared.zh?.();
  appShared.Ph?.();
}

export {
  initializeChatGptImageUploadReminderDialog as n,
  ChatGptImageUploadReminderDialog as t,
};
