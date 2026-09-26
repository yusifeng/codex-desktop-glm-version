// my-gpt-delete-dialog —— 用户自建 GPT 的永久删除确认弹窗。
// 原版：app/webview/assets/my-gpt-delete-dialog-20af490a3eee.js。

import * as runtimeChunk from "@rchunk/rolldown-runtime";
import * as appSharedChunk from "@rchunk/app-shared";
import * as appInitialChunk from "@rchunk/app-initial";

void runtimeChunk;
const appShared = appSharedChunk as Record<string, any>;
const appInitial = appInitialChunk as Record<string, any>;
const jsx = appShared.I3();

function MyGptDeleteDialog({
  resource,
  onClose,
}: {
  resource: any;
  onClose: () => void;
}) {
  const scope = appShared.LX(appShared.ZI);
  const mutation = appShared.iL({
    mutationFn: () =>
      appInitial.rJt.safeDelete("/gizmos/{gizmo_id}", {
        parameters: { path: { gizmo_id: resource.gizmo.id } },
      }),
    onSuccess: () => {
      scope.queryClient.invalidateQueries({ queryKey: ["chatgpt-gizmos"] });
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

  const heading = jsx.jsx(appShared.jh, {
    children: jsx.jsx(appShared.Ah, {
      title: jsx.jsx(appShared.Rh, {
        children: jsx.jsx(appShared.Y2, {
          id: "chatgptConversations.gpts.mine.deleteTitle",
          defaultMessage: "Delete GPT",
          description:
            "Title of the permanent GPT deletion confirmation dialog",
        }),
      }),
    }),
  });
  const description = jsx.jsx(appShared.Lh, {
    children: jsx.jsx(appShared.Y2, {
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
        children: jsx.jsx(appShared.Y2, {
          id: "chatgptConversations.gpts.mine.deleteError",
          defaultMessage: "Couldn't delete the GPT. Try again.",
          description:
            "GPT deletion failed; the confirmation stays open so the user can retry",
        }),
      })
    : null;
  const body = jsx.jsxs(appShared.jh, { children: [description, error] });
  const cancelButton = jsx.jsx(appShared.Yh, {
    color: "outline",
    size: "dialog",
    type: "button",
    disabled: isPending,
    onClick: onClose,
    children: jsx.jsx(appShared.Y2, {
      id: "chatgptConversations.gpts.mine.deleteCancel",
      defaultMessage: "Cancel",
      description: "Dismiss the GPT deletion confirmation without deleting",
    }),
  });
  const deleteButton = jsx.jsx(appShared.Yh, {
    color: "danger",
    size: "dialog",
    type: "submit",
    loading: isPending,
    children: jsx.jsx(appShared.Y2, {
      id: "chatgptConversations.gpts.mine.deleteConfirm",
      defaultMessage: "Delete GPT",
      description: "Confirm permanent deletion of this GPT",
    }),
  });
  const footer = jsx.jsx(appShared.jh, {
    children: jsx.jsxs(appShared.kh, {
      children: [cancelButton, deleteButton],
    }),
  });
  const form = jsx.jsxs(appShared.Oh, {
    as: "form",
    size: "viewport",
    onSubmit: handleSubmit,
    children: [heading, body, footer],
  });

  return jsx.jsx(appShared.Ih, {
    open: true,
    onOpenChange: handleOpenChange,
    size: "compact",
    showDialogClose: false,
    children: form,
  });
}

function initializeMyGptDeleteDialog(): void {
  appShared.$3?.();
  appShared.rL?.();
  appShared.FX?.();
  appShared.K2?.();
  appInitial.cJt?.();
  appShared.Zh?.();
  appShared.zh?.();
  appShared.Ph?.();
  appShared.QI?.();
}

initializeMyGptDeleteDialog();

export { MyGptDeleteDialog };
