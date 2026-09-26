// source-file-delete-dialog —— 共享 ChatGPT 项目来源文件的删除确认弹窗。
// 原版：app/webview/assets/source-file-delete-dialog-69fc11482a0a.js。

import * as runtimeChunk from "@rchunk/rolldown-runtime";
import * as appSharedChunk from "@rchunk/app-shared";
import * as appInitialChunk from "@rchunk/app-initial";
import type { JsxRuntime } from "@rchunk/app-shared";

void runtimeChunk;

export interface ChatGptProjectFileDeleteDialogProps {
  fileId: string;
  onClose(): void;
  onDelete(): void;
  projectId: string;
  title: string;
}

const {
  $3: initializeRuntimeLazy,
  Ah: DialogHeader,
  BX: useSignalFamilyValue,
  FX: initializeSignalRuntime,
  I3: getJsxRuntime,
  Ih: Dialog,
  K2: initializeReactRuntime,
  Lh: DialogDescription,
  Oh: DialogContent,
  Ph: initializeDialogLayout,
  Rh: DialogTitle,
  Y2: FormattedMessage,
  Yh: Button,
  Zh: initializeButton,
  jh: DialogSection,
  kh: DialogActions,
  zh: initializeDialog,
} = appSharedChunk;
const {
  cjt: projectByIdQuery,
  dp: getProjectFileProcessingState,
  eUt: canDeleteProjectFile,
  lx: initializeProjectFileState,
  pp: initializeProjectPermissions,
  ujt: initializeProjectQuery,
  ux: getProjectFileDeletionContext,
} = appInitialChunk;

const jsx: JsxRuntime = getJsxRuntime();

function Bold(children: unknown): unknown {
  return jsx.jsx("strong", { children });
}

function ChatGptProjectFileDeleteDialog({
  fileId,
  onClose,
  onDelete,
  projectId,
  title,
}: ChatGptProjectFileDeleteDialogProps): unknown {
  const { data: project } = useSignalFamilyValue(projectByIdQuery, projectId);
  const deletionContext = getProjectFileDeletionContext();
  const canDelete =
    canDeleteProjectFile(
      project?.gizmo.current_user_permission?.can_write,
      deletionContext,
    ) &&
    project?.files.some(
      (file) =>
        (file.file_id || file.id) === fileId &&
        getProjectFileProcessingState(file) == null,
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
  const dialogTitle = jsx.jsx(DialogTitle, {
    children: jsx.jsx(FormattedMessage, {
      id: "chatgptProjectHome.sources.deleteFile.title",
      defaultMessage: 'Delete "{title}" from project?',
      description:
        "Confirmation title before deleting an uploaded file from a shared ChatGPT project's sources; title is the file name",
      values: { title },
    }),
  });
  const description = jsx.jsx(DialogDescription, {
    children: jsx.jsx(FormattedMessage, {
      id: "chatgptProjectHome.sources.deleteFile.description",
      defaultMessage:
        "<bold>This removes this file from the project for everyone.</bold> It can be added again later.",
      description:
        "Warning before deleting an uploaded file from a shared ChatGPT project's sources. The bold tag emphasizes that every collaborator loses access to this project source, but the file can be added again later.",
      values: { bold: Bold },
    }),
  });
  const heading = jsx.jsx(DialogSection, {
    children: jsx.jsx(DialogHeader, {
      title: dialogTitle,
      subtitle: description,
    }),
  });
  const cancelButton = jsx.jsx(Button, {
    color: "outline",
    type: "button",
    onClick: onClose,
    children: jsx.jsx(FormattedMessage, {
      id: "chatgptProjectHome.sources.deleteFile.cancel",
      defaultMessage: "Cancel",
      description:
        "Cancel button in the confirmation for deleting an uploaded file from a shared ChatGPT project",
    }),
  });
  const deleteButton = jsx.jsx(Button, {
    color: "danger",
    disabled: !canDelete,
    type: "submit",
    children: jsx.jsx(FormattedMessage, {
      id: "chatgptProjectHome.sources.deleteFile.confirm",
      defaultMessage: "Delete",
      description:
        "Button confirming deletion of an uploaded file from a shared ChatGPT project's sources",
    }),
  });
  const footer = jsx.jsx(DialogSection, {
    children: jsx.jsxs(DialogActions, {
      children: [cancelButton, deleteButton],
    }),
  });
  const form = jsx.jsxs(DialogContent, {
    className: "select-none",
    as: "form",
    onSubmit: handleSubmit,
    children: [heading, footer],
  });

  return jsx.jsx(Dialog, {
    open: true,
    onOpenChange: handleOpenChange,
    size: "compact",
    children: form,
  });
}

function initializeChatGptProjectFileDeleteDialog(): void {
  initializeRuntimeLazy();
  initializeSignalRuntime();
  initializeReactRuntime();
  initializeButton();
  initializeDialog();
  initializeDialogLayout();
  initializeProjectQuery();
  initializeProjectPermissions();
  initializeProjectFileState();
}

initializeChatGptProjectFileDeleteDialog();

export { ChatGptProjectFileDeleteDialog };
