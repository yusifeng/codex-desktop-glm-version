// my-gpt-delete-dialog —— 用户自建 GPT 的永久删除确认弹窗。
// 原版：app/webview/assets/my-gpt-delete-dialog-20af490a3eee.js。

import * as runtimeChunk from "@rchunk/rolldown-runtime";
import * as appSharedChunk from "@rchunk/app-shared";
import * as appInitialChunk from "@rchunk/app-initial";

void runtimeChunk;

interface JsxRuntime {
  jsx(component: unknown, props: Record<string, unknown>): unknown;
  jsxs(component: unknown, props: Record<string, unknown>): unknown;
}

interface MyGptResource extends Record<string, unknown> {
  gizmo: {
    current_user_permission?: { can_delete?: boolean } | null;
    id: string;
    migrated_plugin_id?: string | null;
  };
}

interface QueryClientInvalidator {
  invalidateQueries(options: { queryKey: readonly unknown[] }): unknown;
}

const {
  $3: initializeRuntimeLazy,
  I3: jsxRuntimeFactory,
} = appSharedChunk as unknown as {
  $3?: () => void;
  I3(): JsxRuntime;
};
const {
  Ah: DialogHeader,
  FX: initializeMaitaiRuntime,
  Ih: Dialog,
  K2: initializeIntl,
  Lh: DialogDescription,
  LX: useScope,
  Oh: DialogBody,
  Ph: initializeDialogLayout,
  QI: initializeAppScope,
  Rh: DialogTitle,
  Y2: FormattedMessage,
  Yh: Button,
  ZI: appScopeRoot,
  Zh: initializeButton,
  iL: useMutation,
  jh: DialogSection,
  kh: DialogFooter,
  rL: initializeUseMutation,
  zh: initializeDialog,
} = appSharedChunk;
const {
  rJt: apiClient,
  cJt: initializeApiClient,
} = appInitialChunk as unknown as {
  rJt: {
    safeDelete(
      path: string,
      options: { parameters: { path: { gizmo_id: string } } },
    ): Promise<unknown> | unknown;
  };
  cJt?: () => void;
};
const jsx = jsxRuntimeFactory();

function MyGptDeleteDialog({
  resource,
  onClose,
}: {
  resource: MyGptResource;
  onClose: () => void;
}): unknown {
  const scope = useScope(appScopeRoot);
  const queryClient = scope.queryClient as QueryClientInvalidator;
  const mutation = useMutation<unknown, Error, void>({
    mutationFn: () =>
      apiClient.safeDelete("/gizmos/{gizmo_id}", {
        parameters: { path: { gizmo_id: resource.gizmo.id } },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["chatgpt-gizmos"] });
      onClose();
    },
  });
  const { mutate, isPending, isError } = mutation;
  const handleOpenChange = (open: boolean) => {
    if (!open && !isPending) onClose();
  };
  const handleSubmit = (event: { preventDefault: () => void }) => {
    event.preventDefault();
    if (
      !isPending &&
      resource.gizmo.current_user_permission?.can_delete &&
      !resource.gizmo.migrated_plugin_id
    ) {
      mutate();
    }
  };

  const heading = jsx.jsx(DialogSection, {
    children: jsx.jsx(DialogHeader, {
      title: jsx.jsx(DialogTitle, {
        children: jsx.jsx(FormattedMessage, {
          id: "chatgptConversations.gpts.mine.deleteTitle",
          defaultMessage: "Delete GPT",
          description:
            "Title of the permanent GPT deletion confirmation dialog",
        }),
      }),
    }),
  });
  const description = jsx.jsx(DialogDescription, {
    children: jsx.jsx(FormattedMessage, {
      id: "chatgptConversations.gpts.mine.deleteDescription",
      defaultMessage:
        "Are you sure you want to delete this GPT? This cannot be undone.",
      description:
        "Warning in the confirmation dialog before permanently deleting a GPT",
    }),
  });
  const error = isError
    ? jsx.jsx("p", {
        role: "alert",
        className: "text-sm text-danger",
        children: jsx.jsx(FormattedMessage, {
          id: "chatgptConversations.gpts.mine.deleteError",
          defaultMessage: "Couldn't delete the GPT. Try again.",
          description:
            "GPT deletion failed; the confirmation stays open so the user can retry",
        }),
      })
    : null;
  const body = jsx.jsxs(DialogSection, { children: [description, error] });
  const cancelButton = jsx.jsx(Button, {
    color: "outline",
    size: "dialog",
    type: "button",
    disabled: isPending,
    onClick: onClose,
    children: jsx.jsx(FormattedMessage, {
      id: "chatgptConversations.gpts.mine.deleteCancel",
      defaultMessage: "Cancel",
      description: "Dismiss the GPT deletion confirmation without deleting",
    }),
  });
  const deleteButton = jsx.jsx(Button, {
    color: "danger",
    size: "dialog",
    type: "submit",
    loading: isPending,
    children: jsx.jsx(FormattedMessage, {
      id: "chatgptConversations.gpts.mine.deleteConfirm",
      defaultMessage: "Delete GPT",
      description: "Confirm permanent deletion of this GPT",
    }),
  });
  const footer = jsx.jsx(DialogSection, {
    children: jsx.jsxs(DialogFooter, {
      children: [cancelButton, deleteButton],
    }),
  });
  const form = jsx.jsxs(DialogBody, {
    as: "form",
    size: "viewport",
    onSubmit: handleSubmit,
    children: [heading, body, footer],
  });

  return jsx.jsx(Dialog, {
    open: true,
    onOpenChange: handleOpenChange,
    size: "compact",
    showDialogClose: false,
    children: form,
  });
}

function initializeMyGptDeleteDialog(): void {
  initializeRuntimeLazy?.();
  initializeUseMutation?.();
  initializeMaitaiRuntime?.();
  initializeIntl?.();
  initializeApiClient?.();
  initializeButton?.();
  initializeDialog?.();
  initializeDialogLayout?.();
  initializeAppScope?.();
}

initializeMyGptDeleteDialog();

export { MyGptDeleteDialog };
