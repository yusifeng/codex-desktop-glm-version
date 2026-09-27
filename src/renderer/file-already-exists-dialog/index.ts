// file-already-exists-dialog —— 项目文件重名上传确认弹窗。
// 原版：app/webview/assets/file-already-exists-dialog-8a907b310635.js。

import * as runtimeChunk from "@rchunk/rolldown-runtime";
import * as appSharedChunk from "@rchunk/app-shared";
import * as appInitialChunk from "@rchunk/app-initial";
import type { JsxRuntime } from "@rchunk/app-shared";

void runtimeChunk;
const {
  $3: initializeJsxRuntime,
  I3: getJsxRuntime,
  K2: initializeIntlRuntime,
  Y2: FormattedMessage,
  Yh: Button,
  Zh: initializeButton,
} = appSharedChunk;
const {
  Kat: CompactFormDialog,
  qat: initializeCompactFormDialog,
} = appInitialChunk;

let jsxRuntime: JsxRuntime | null = null;

interface ProjectFileAlreadyExistsDialogProps {
  fileName: string;
  onClose(): void;
  onConfirm(): void;
}

function ProjectFileAlreadyExistsDialog({
  fileName,
  onClose,
  onConfirm,
}: ProjectFileAlreadyExistsDialogProps): unknown {
  const jsx = getInitializedJsxRuntime();
  const title = jsx.jsx(FormattedMessage, {
    id: "chatgptProjectUpload.duplicate.title",
    defaultMessage: "File already exists",
    description:
      "Title of the confirmation shown to project editors before uploading a file with the same name as an existing project source",
  });
  const subtitle = jsx.jsx("span", {
    className: "wrap-anywhere",
    children: jsx.jsx(FormattedMessage, {
      id: "chatgptProjectUpload.duplicate.description",
      defaultMessage: "A file with the name {fileName} already exists",
      description:
        "Explains a project source upload name conflict; fileName is the exact selected filename, including its extension. The editor can add another file or skip it.",
      values: { fileName },
    }),
  });
  const submit = () => {
    onConfirm();
    onClose();
  };
  const skipButton = jsx.jsx(Button, {
    color: "secondary",
    size: "dialogAction",
    type: "button",
    onClick: onClose,
    children: jsx.jsx(FormattedMessage, {
      id: "chatgptProjectUpload.duplicate.skip",
      defaultMessage: "Skip",
      description:
        "Skips only the current conflicting file in a project upload batch and continues with the other selected files",
    }),
  });
  const uploadButton = jsx.jsx(Button, {
    color: "primary",
    size: "dialogAction",
    type: "submit",
    children: jsx.jsx(FormattedMessage, {
      id: "chatgptProjectUpload.duplicate.upload",
      defaultMessage: "Upload anyway",
      description:
        "Confirms uploading another project source with the same filename; this does not replace the existing file",
    }),
  });

  return jsx.jsx(CompactFormDialog, {
    size: "compact",
    title,
    subtitle,
    onClose,
    onSubmit: submit,
    footer: jsx.jsxs(jsx.Fragment, { children: [skipButton, uploadButton] }),
    children: null,
  });
}

function initializeProjectFileAlreadyExistsDialog(): void {
  if (jsxRuntime != null) return;
  initializeJsxRuntime();
  initializeIntlRuntime();
  initializeButton();
  initializeCompactFormDialog();
  jsxRuntime = getJsxRuntime();
}

function getInitializedJsxRuntime(): JsxRuntime {
  initializeProjectFileAlreadyExistsDialog();
  if (jsxRuntime == null) {
    throw new Error("Duplicate file dialog JSX runtime failed to initialize");
  }
  return jsxRuntime;
}

initializeProjectFileAlreadyExistsDialog();

export { ProjectFileAlreadyExistsDialog };
