// source-file-delete-dialog —— 共享 ChatGPT 项目来源文件的删除确认弹窗。
// 原版：app/webview/assets/source-file-delete-dialog-69fc11482a0a.js。

import * as runtimeChunk from "@rchunk/rolldown-runtime";
import * as appSharedChunk from "@rchunk/app-shared";
import * as appInitialChunk from "@rchunk/app-initial";

void runtimeChunk;
const appShared = appSharedChunk as Record<string, any>;
const appInitial = appInitialChunk as Record<string, any>;
const jsx = appShared.I3();

function Bold(children: any) {
  return jsx.jsx("strong", { children });
}

function ChatGptProjectFileDeleteDialog({
  fileId,
  onClose,
  onDelete,
  projectId,
  title,
}: {
  fileId: string;
  onClose: () => void;
  onDelete: () => void;
  projectId: string;
  title: string;
}) {
  const { data: project } = appShared.BX(appInitial.cjt, projectId);
  const deletionContext = appInitial.ux();
  const canDelete =
    appInitial.eUt(
      project?.gizmo.current_user_permission?.can_write,
      deletionContext,
    ) &&
    project?.files.some(
      (file: any) =>
        (file.file_id || file.id) === fileId && appInitial.dp(file) == null,
    ) === true;

  const handleOpenChange = (open: boolean) => {
    if (!open) onClose();
  };
  const handleSubmit = (event: { preventDefault: () => void }) => {
    event.preventDefault();
    if (canDelete) {
      onClose();
      onDelete();
    }
  };
  const dialogTitle = jsx.jsx(appShared.Rh, {
    children: jsx.jsx(appShared.Y2, {
      id: "chatgptProjectHome.sources.deleteFile.title",
      defaultMessage: 'Delete "{title}" from project?',
      description:
        "Confirmation title before deleting an uploaded file from a shared ChatGPT project's sources; title is the file name",
      values: { title },
    }),
  });
  const description = jsx.jsx(appShared.Lh, {
    children: jsx.jsx(appShared.Y2, {
      id: "chatgptProjectHome.sources.deleteFile.description",
      defaultMessage:
        "<bold>This removes this file from the project for everyone.</bold> It can be added again later.",
      description:
        "Warning before deleting an uploaded file from a shared ChatGPT project's sources. The bold tag emphasizes that every collaborator loses access to this project source, but the file can be added again later.",
      values: { bold: Bold },
    }),
  });
  const heading = jsx.jsx(appShared.jh, {
    children: jsx.jsx(appShared.Ah, {
      title: dialogTitle,
      subtitle: description,
    }),
  });
  const cancelButton = jsx.jsx(appShared.Yh, {
    color: "outline",
    type: "button",
    onClick: onClose,
    children: jsx.jsx(appShared.Y2, {
      id: "chatgptProjectHome.sources.deleteFile.cancel",
      defaultMessage: "Cancel",
      description:
        "Cancel button in the confirmation for deleting an uploaded file from a shared ChatGPT project",
    }),
  });
  const deleteButton = jsx.jsx(appShared.Yh, {
    color: "danger",
    disabled: !canDelete,
    type: "submit",
    children: jsx.jsx(appShared.Y2, {
      id: "chatgptProjectHome.sources.deleteFile.confirm",
      defaultMessage: "Delete",
      description:
        "Button confirming deletion of an uploaded file from a shared ChatGPT project's sources",
    }),
  });
  const footer = jsx.jsx(appShared.jh, {
    children: jsx.jsxs(appShared.kh, {
      children: [cancelButton, deleteButton],
    }),
  });
  const form = jsx.jsxs(appShared.Oh, {
    className: "select-none",
    as: "form",
    onSubmit: handleSubmit,
    children: [heading, footer],
  });

  return jsx.jsx(appShared.Ih, {
    open: true,
    onOpenChange: handleOpenChange,
    size: "compact",
    children: form,
  });
}

function initializeChatGptProjectFileDeleteDialog(): void {
  appShared.$3?.();
  appShared.FX?.();
  appShared.K2?.();
  appShared.Zh?.();
  appShared.zh?.();
  appShared.Ph?.();
  appInitial.ujt?.();
  appInitial.pp?.();
  appInitial.lx?.();
}

initializeChatGptProjectFileDeleteDialog();

export { ChatGptProjectFileDeleteDialog };
