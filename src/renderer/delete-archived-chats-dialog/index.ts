// delete-archived-chats-dialog —— 删除单个、项目内或全部归档本地聊天的确认弹窗。
// 原版：app/webview/assets/delete-archived-chats-dialog-c9e21f2b6f91.js。

import * as runtimeChunk from "@rchunk/rolldown-runtime";
import * as appSharedChunk from "@rchunk/app-shared";
import * as appInitialChunk from "@rchunk/app-initial";
import type { JsxRuntime } from "@rchunk/app-shared";

void runtimeChunk;
const {
  $3: getCompilerRuntime,
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
interface CompilerRuntime { c(size: number): unknown[] }
let compilerRuntime: CompilerRuntime;
let initialized = false;

function initializeDeleteArchivedChatsDialog(): void {
  if (initialized) return;
  compilerRuntime = getCompilerRuntime() as unknown as CompilerRuntime;
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
  const cache = compilerRuntime.c(31);
  if (state == null) return null;
  const jsx = getInitializedJsxRuntime();
  let handleOpenChange: (open: boolean) => void;
  if (cache[0] === isDeleting && cache[1] === onOpenChange) handleOpenChange = cache[2] as typeof handleOpenChange;
  else {
    handleOpenChange = (open) => { if (!isDeleting) onOpenChange(open); };
    cache[0] = isDeleting; cache[1] = onOpenChange; cache[2] = handleOpenChange;
  }
  let handleSubmit: (event: FormSubmitEvent) => void;
  if (cache[3] === isDeleting && cache[4] === onConfirm) handleSubmit = cache[5] as typeof handleSubmit;
  else {
    handleSubmit = (event) => { event.preventDefault(); if (!isDeleting) onConfirm(); };
    cache[3] = isDeleting; cache[4] = onConfirm; cache[5] = handleSubmit;
  }
  let header: unknown;
  if (cache[6] === state.kind) header = cache[7];
  else {
    const title = state.kind === "all"
      ? jsx.jsx(FormattedMessage, { id: "settings.dataControls.archivedChats.deleteAllConfirm.title", defaultMessage: "Delete all archived local chats?", description: "Title for confirming deletion of all archived local chats" })
      : state.kind === "project"
        ? jsx.jsx(FormattedMessage, { id: "settings.dataControls.archivedChats.deleteProjectConfirm.title", defaultMessage: "Delete all in project?", description: "Title for confirming deletion of archived local chats in one project" })
        : jsx.jsx(FormattedMessage, { id: "settings.dataControls.archivedChats.deleteConfirm.title", defaultMessage: "Delete archived chat?", description: "Title for confirming deletion of an archived chat" });
    header = jsx.jsx(DialogSection, { children: jsx.jsx(DialogHeader, { title: jsx.jsx(DialogTitle, { children: title }) }) });
    cache[6] = state.kind; cache[7] = header;
  }
  let body: unknown;
  if (cache[8] === state.kind && cache[9] === state.threads) body = cache[10];
  else {
    const message = state.kind === "all"
      ? jsx.jsx(FormattedMessage, { id: "settings.dataControls.archivedChats.deleteAllConfirm.body", defaultMessage: "This permanently deletes all local archived chats", description: "Body copy in the delete all archived local chats confirmation dialog" })
      : state.kind === "project"
        ? jsx.jsx(FormattedMessage, { id: "settings.dataControls.archivedChats.deleteProjectConfirm.body", defaultMessage: "This permanently deletes {count, plural, one {# local archived chat} other {# local archived chats}} in this project", description: "Body copy in the delete archived local chats in project confirmation dialog", values: { count: state.threads.length } })
        : jsx.jsx(FormattedMessage, { id: "settings.dataControls.archivedChats.deleteConfirm.body", defaultMessage: "This permanently deletes the archived chat", description: "Body copy in the delete archived chat confirmation dialog" });
    body = jsx.jsx(DialogSection, { className: "text-codex-description", children: jsx.jsx("p", { children: message }) });
    cache[8] = state.kind; cache[9] = state.threads; cache[10] = body;
  }
  let close: () => void;
  if (cache[11] === onOpenChange) close = cache[12] as typeof close;
  else { close = () => onOpenChange(false); cache[11] = onOpenChange; cache[12] = close; }
  let cancelLabel: unknown;
  if (cache[13] === Symbol.for("react.memo_cache_sentinel")) {
    cancelLabel = jsx.jsx(FormattedMessage, {
      id: "settings.dataControls.archivedChats.deleteConfirm.cancel",
      defaultMessage: "Cancel",
      description: "Cancel button label for deleting archived chats",
    }); cache[13] = cancelLabel;
  } else cancelLabel = cache[13];
  let cancel: unknown;
  if (cache[14] === isDeleting && cache[15] === close) cancel = cache[16];
  else { cancel = jsx.jsx(Button, { color: "ghost", disabled: isDeleting, onClick: close, children: cancelLabel }); cache[14] = isDeleting; cache[15] = close; cache[16] = cancel; }
  let deleteLabel: unknown;
  if (cache[17] === Symbol.for("react.memo_cache_sentinel")) { deleteLabel = jsx.jsx(FormattedMessage, { ...commonMessages.delete }); cache[17] = deleteLabel; }
  else deleteLabel = cache[17];
  let confirm: unknown;
  if (cache[18] === isDeleting) confirm = cache[19];
  else { confirm = jsx.jsx(Button, { color: "danger", loading: isDeleting, type: "submit", children: deleteLabel }); cache[18] = isDeleting; cache[19] = confirm; }
  let footer: unknown;
  if (cache[20] === confirm && cache[21] === cancel) footer = cache[22];
  else { footer = jsx.jsx(DialogSection, { children: jsx.jsxs(DialogFooter, { children: [cancel, confirm] }) }); cache[20] = confirm; cache[21] = cancel; cache[22] = footer; }
  let form: unknown;
  if (cache[23] === footer && cache[24] === handleSubmit && cache[25] === header && cache[26] === body) form = cache[27];
  else { form = jsx.jsxs(DialogBody, { as: "form", onSubmit: handleSubmit, children: [header, body, footer] }); cache[23] = footer; cache[24] = handleSubmit; cache[25] = header; cache[26] = body; cache[27] = form; }
  if (cache[28] !== form || cache[29] !== handleOpenChange) { cache[28] = form; cache[29] = handleOpenChange; cache[30] = jsx.jsx(Dialog, { open: true, showDialogClose: false, onOpenChange: handleOpenChange, children: form }); }
  return cache[30];
}

function getInitializedJsxRuntime(): JsxRuntime {
  initializeDeleteArchivedChatsDialog();
  if (jsxRuntime == null) {
    throw new Error("Delete archived chats JSX runtime failed to initialize");
  }
  return jsxRuntime;
}

export {
  initializeDeleteArchivedChatsDialog as n,
  DeleteArchivedChatsDialog as t,
};
