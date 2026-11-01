// automation-delete-confirmation-dialog —— 永久删除计划任务的确认对话框。
// 原版：app/webview/assets/automation-delete-confirmation-dialog-65dd08412175.js。

import * as runtimeChunk from "@rchunk/rolldown-runtime";
import * as appSharedChunk from "@rchunk/app-shared";
import type { JsxRuntime } from "@rchunk/app-shared";

void runtimeChunk;
const {
  $3: getCompilerRuntime,
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
interface CompilerRuntime { c(size: number): unknown[] }
let compilerRuntime: CompilerRuntime;
let initialized = false;

function initializeAutomationDeleteConfirmationDialog(): void {
  if (initialized) return;
  compilerRuntime = getCompilerRuntime() as unknown as CompilerRuntime;
  initializeIntlRuntime();
  initializeButton();
  initializeDialog();
  initializeDialogLayout();
  jsxRuntime = getJsxRuntime();
  initialized = true;
}

interface AutomationDeleteConfirmationDialogProps {
  isPending: boolean;
  name: string;
  onCancel(): void;
  onConfirm(): void;
  open: boolean;
}

interface FormSubmitEvent {
  preventDefault(): void;
}

function AutomationDeleteConfirmationDialog({
  isPending,
  name,
  onCancel,
  onConfirm,
  open,
}: AutomationDeleteConfirmationDialogProps): unknown {
  initializeAutomationDeleteConfirmationDialog();
  const cache = compilerRuntime.c(26);
  const jsx = getInitializedJsxRuntime();
  let handleOpenChange: (nextOpen: boolean) => void;
  if (cache[0] === onCancel) handleOpenChange = cache[1] as typeof handleOpenChange;
  else {
    handleOpenChange = (nextOpen) => { if (!nextOpen) onCancel(); };
    cache[0] = onCancel; cache[1] = handleOpenChange;
  }
  let handleSubmit: (event: FormSubmitEvent) => void;
  if (cache[2] === onConfirm) handleSubmit = cache[3] as typeof handleSubmit;
  else {
    handleSubmit = (event) => { event.preventDefault(); onConfirm(); };
    cache[2] = onConfirm; cache[3] = handleSubmit;
  }
  let title: unknown;
  if (cache[4] === name) title = cache[5];
  else {
    title = jsx.jsx(DialogTitle, { children: jsx.jsx(FormattedMessage, {
      id: "inbox.automations.deleteConfirm.title",
      defaultMessage: "Delete {name}?",
      description: "Title for the delete automation confirmation dialog",
      values: {
        name: jsx.jsx("strong", {
          className: "font-semibold text-default",
          children: name,
        }),
      },
    }) });
    cache[4] = name; cache[5] = title;
  }
  let subtitle: unknown;
  if (cache[6] === Symbol.for("react.memo_cache_sentinel")) {
    subtitle = jsx.jsx(DialogDescription, { children: jsx.jsx(FormattedMessage, {
      id: "inbox.automations.deleteConfirm.descriptionNoPeriod",
      defaultMessage:
        "This will permanently delete the scheduled task and stop future runs",
      description:
        "Description for the delete scheduled task confirmation dialog",
    }) });
    cache[6] = subtitle;
  } else subtitle = cache[6];
  let header: unknown;
  if (cache[7] === title) header = cache[8];
  else {
    header = jsx.jsx(DialogSection, { children: jsx.jsx(DialogHeader, { title, subtitle }) });
    cache[7] = title; cache[8] = header;
  }
  let cancelLabel: unknown;
  if (cache[9] === Symbol.for("react.memo_cache_sentinel")) {
    cancelLabel = jsx.jsx(FormattedMessage, {
      id: "inbox.automations.deleteConfirm.cancel",
      defaultMessage: "Cancel",
      description:
        "Cancel button label for delete automation confirmation dialog",
    });
    cache[9] = cancelLabel;
  } else cancelLabel = cache[9];
  let cancel: unknown;
  if (cache[10] === onCancel) cancel = cache[11];
  else {
    cancel = jsx.jsx(Button, { color: "outline", onClick: onCancel, children: cancelLabel });
    cache[10] = onCancel; cache[11] = cancel;
  }
  let confirmLabel: unknown;
  if (cache[12] === Symbol.for("react.memo_cache_sentinel")) {
    confirmLabel = jsx.jsx(FormattedMessage, {
      id: "inbox.automations.deleteConfirm.confirm",
      defaultMessage: "Delete scheduled task",
      description:
        "Confirm button label for delete scheduled task confirmation dialog",
    });
    cache[12] = confirmLabel;
  } else confirmLabel = cache[12];
  let confirm: unknown;
  if (cache[13] === isPending) confirm = cache[14];
  else {
    confirm = jsx.jsx(Button, { color: "danger", loading: isPending, type: "submit", children: confirmLabel });
    cache[13] = isPending; cache[14] = confirm;
  }
  let footer: unknown;
  if (cache[15] === cancel && cache[16] === confirm) footer = cache[17];
  else {
    footer = jsx.jsx(DialogSection, { children: jsx.jsxs(DialogFooter, { children: [cancel, confirm] }) });
    cache[15] = cancel; cache[16] = confirm; cache[17] = footer;
  }
  let content: unknown;
  if (cache[18] === footer && cache[19] === handleSubmit && cache[20] === header) content = cache[21];
  else {
    content = jsx.jsxs(DialogBody, { as: "form", onSubmit: handleSubmit, children: [header, footer] });
    cache[18] = footer; cache[19] = handleSubmit; cache[20] = header; cache[21] = content;
  }
  if (cache[22] !== open || cache[23] !== handleOpenChange || cache[24] !== content) {
    cache[22] = open; cache[23] = handleOpenChange; cache[24] = content;
    cache[25] = jsx.jsx(Dialog, { open, onOpenChange: handleOpenChange, children: content });
  }
  return cache[25];
}

function getInitializedJsxRuntime(): JsxRuntime {
  initializeAutomationDeleteConfirmationDialog();
  if (jsxRuntime == null) {
    throw new Error("Automation delete dialog JSX runtime failed to initialize");
  }
  return jsxRuntime;
}

export {
  initializeAutomationDeleteConfirmationDialog as n,
  AutomationDeleteConfirmationDialog as t,
};
