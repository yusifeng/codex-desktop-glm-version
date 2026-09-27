import "@rchunk/rolldown-runtime";
import {
  $3 as initializeCompilerRuntime,
  Ah as DialogHeader,
  G2 as defineMessages,
  I3 as initializeJsxRuntime,
  Ih as DialogRoot,
  K2 as initializeIntlRuntime,
  Lh as Text,
  Oh as DialogContent,
  Ph as initializeDialogContent,
  Rh as DialogTitle,
  Y2 as FormattedMessage,
  Yh as Button,
  Zh as initializeDialogPanel,
  e6 as ReactRuntime,
  iL as useMutation,
  jh as DialogSection,
  kh as DialogActions,
  rL as initializeUseMutation,
  zh as initializeDialogRuntime,
} from "@rchunk/app-shared";
import {
  pdn as initializeApiHeaders,
  udn as apiClient,
} from "@rchunk/app-initial";
import {
  n as useDropzone,
  t as initializeDropzone,
} from "@rchunk/mcp-oauth-runtime";
import {
  a as getPluginArchiveError,
  o as initializePluginUploadApi,
  s as uploadPluginArchive,
} from "@rchunk/api";

interface HostedPlugin extends Record<string, unknown> {
  id: string;
  release: { display_name: string };
  scope: "USER" | string;
}

interface PluginUploadDialogProps extends Record<string, unknown> {
  accountId: string;
  onClose(): void;
  onUpdated?(): void;
  pluginId: string;
}

interface PluginDeleteDialogProps extends Record<string, unknown> {
  accountId: string;
  onClose(): void;
  onDeleted(): Promise<void> | void;
  plugin: HostedPlugin;
}

const messages = defineMessages({
  upload: {
    id: "plugins.management.upload",
    defaultMessage: "Upload new version",
    description: "Upload a new archive to an existing plugin",
  },
  delete: {
    id: "plugins.management.delete",
    defaultMessage: "Delete plugin",
    description: "Permanently delete a hosted plugin",
  },
  cancel: {
    id: "plugins.management.cancel",
    defaultMessage: "Cancel",
    description: "Cancel a plugin management dialog",
  },
});

function PluginUploadDialog(props: PluginUploadDialogProps): unknown {
  const { pluginId, accountId, onClose, onUpdated } = props;
  const [invalidArchive, setInvalidArchive] = ReactRuntime.useState(false);
  const mutation = useMutation<unknown, Error, File>({
    mutationFn: (file) => uploadPluginArchive(pluginId, accountId, file),
    onSuccess: onUpdated,
  });
  const accept = {
    "application/zip": [".zip"],
    "application/gzip": [".tar.gz", ".tgz"],
  };
  const markInvalid = (): void => setInvalidArchive(true);
  const dropzone = useDropzone({
    multiple: false,
    noClick: true,
    noKeyboard: true,
    disabled: mutation.isPending || mutation.isSuccess,
    accept,
    onDrop: (acceptedFiles: File[], rejectedFiles: unknown[]) => {
      if (!dropzone.inputRef.current?.isConnected || dropzone.inputRef.current.disabled) return;
      const file = acceptedFiles[0];
      if (rejectedFiles.length > 0 || file == null || getPluginArchiveError(file) != null) {
        markInvalid();
        return;
      }
      setInvalidArchive(false);
      mutation.mutate(file);
    },
    onError: markInvalid,
  });
  const handleOpenChange = (open: boolean): void => {
    if (!open && !mutation.isPending) onClose();
  };
  const body = mutation.isSuccess
    ? initializeJsxRuntime().jsx(Text, {
        role: "status",
        className: "text-sm text-secondary",
        children: initializeJsxRuntime().jsx(FormattedMessage, {
          id: "plugins.management.uploadSuccess",
          defaultMessage: "New version uploaded",
          description: "Confirmation that a new plugin version has been saved",
        }),
      })
    : initializeJsxRuntime().jsxs("div", {
        ...dropzone.getRootProps({
          className: "flex min-h-32 flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-primary-outline p-4 text-center",
        }),
        children: [
          initializeJsxRuntime().jsx(Text, {
            className: "text-sm text-secondary",
            children: initializeJsxRuntime().jsx(FormattedMessage, {
              id: "plugins.management.uploadHelp",
              defaultMessage: "Drop a .zip, .tar.gz, or .tgz file here, or choose a file. Maximum size: 100 MB",
              description: "Instructions for uploading an archive as a new plugin version",
            }),
          }),
          initializeJsxRuntime().jsx("input", {
            ...dropzone.getInputProps({ hidden: true, name: "plugin-archive" }),
          }),
          mutation.isPending
            ? initializeJsxRuntime().jsx("span", {
                role: "status",
                className: "max-w-full text-sm break-words",
                children: `Uploading ${mutation.variables?.name ?? ""}…`,
              })
            : null,
          invalidArchive
            ? initializeJsxRuntime().jsx("span", {
                role: "alert",
                className: "text-sm text-danger",
                children: "Choose one .zip, .tar.gz, or .tgz file no larger than 100 MB",
              })
            : null,
          mutation.error == null
            ? null
            : initializeJsxRuntime().jsx("span", {
                role: "alert",
                className: "text-sm text-danger",
                children: `Couldn't upload the new version. ${mutation.error.message}`,
              }),
          initializeJsxRuntime().jsx(Button, {
            color: "secondary",
            size: "medium",
            disabled: mutation.isPending,
            loading: mutation.isPending,
            onClick: dropzone.open,
            children: "Choose file",
          }),
        ],
      });
  return initializeJsxRuntime().jsx(DialogRoot, {
    open: true,
    onOpenChange: handleOpenChange,
    showDialogClose: !mutation.isPending,
    shouldIgnoreClickOutside: mutation.isPending,
    children: initializeJsxRuntime().jsxs(DialogContent, {
      children: [
        initializeJsxRuntime().jsx(DialogSection, {
          children: initializeJsxRuntime().jsx(DialogHeader, {
            title: initializeJsxRuntime().jsx(DialogTitle, {
              children: initializeJsxRuntime().jsx(FormattedMessage, messages.upload),
            }),
          }),
        }),
        initializeJsxRuntime().jsx(DialogSection, { spacing: "large", children: body }),
        initializeJsxRuntime().jsx(DialogSection, {
          spacing: "large",
          children: initializeJsxRuntime().jsx(DialogActions, {
            expandSingleButton: false,
            children: initializeJsxRuntime().jsx(Button, {
              color: mutation.isSuccess ? "primary" : "secondary",
              disabled: mutation.isPending,
              onClick: onClose,
              children: mutation.isSuccess ? "View plugin" : "Cancel",
            }),
          }),
        }),
      ],
    }),
  });
}

function PluginDeleteDialog(props: PluginDeleteDialogProps): unknown {
  const { plugin, accountId, onClose, onDeleted } = props;
  const mutation = useMutation({
    mutationFn: () => apiClient.safeDelete(
      plugin.scope === "USER"
        ? "/ps/plugins/{plugin_id}"
        : "/public/plugins/workspace/{plugin_id}",
      {
        additionalHeaders: { "ChatGPT-Account-Id": accountId },
        parameters: { path: { plugin_id: plugin.id } },
        expectedErrorStatuses: [400, 403, 404, 409],
      },
    ),
    onSuccess: async () => {
      onClose();
      await onDeleted();
    },
  });
  const handleOpenChange = (open: boolean): void => {
    if (!open && !mutation.isPending) onClose();
  };
  const handleSubmit = (event: { preventDefault(): void }): void => {
    event.preventDefault();
    if (!mutation.isPending) mutation.mutate();
  };
  return initializeJsxRuntime().jsx(DialogRoot, {
    open: true,
    size: "compact",
    onOpenChange: handleOpenChange,
    showDialogClose: !mutation.isPending,
    shouldIgnoreClickOutside: mutation.isPending,
    children: initializeJsxRuntime().jsxs(DialogContent, {
      as: "form",
      onSubmit: handleSubmit,
      children: [
        initializeJsxRuntime().jsx(DialogSection, {
          children: initializeJsxRuntime().jsxs(DialogSection, {
            children: [
              initializeJsxRuntime().jsx(DialogHeader, {
                title: initializeJsxRuntime().jsx(DialogTitle, {
                  children: initializeJsxRuntime().jsx(FormattedMessage, messages.delete),
                }),
                subtitle: `Permanently delete ${plugin.release.display_name}? People who use this plugin will lose access. This can't be undone`,
                subtitleSize: "sm",
                subtitleTone: "secondary",
              }),
              mutation.isError
                ? initializeJsxRuntime().jsx("span", {
                    role: "alert",
                    className: "text-sm text-danger",
                    children: "Couldn't delete plugin. Try again",
                  })
                : null,
            ],
          }),
        }),
        initializeJsxRuntime().jsx(DialogSection, {
          spacing: "large",
          children: initializeJsxRuntime().jsxs(DialogActions, {
            children: [
              initializeJsxRuntime().jsx(Button, {
                color: "secondary",
                disabled: mutation.isPending,
                onClick: onClose,
                children: initializeJsxRuntime().jsx(FormattedMessage, messages.cancel),
              }),
              initializeJsxRuntime().jsx(Button, {
                color: "dangerSolid",
                type: "submit",
                disabled: mutation.isPending,
                loading: mutation.isPending,
                children: initializeJsxRuntime().jsx(FormattedMessage, messages.delete),
              }),
            ],
          }),
        }),
      ],
    }),
  });
}

let initialized = false;
function initializePluginShareDialogs(): void {
  if (initialized) return;
  initialized = true;
  initializeCompilerRuntime();
  initializeUseMutation();
  ReactRuntime();
  initializeDropzone();
  initializeIntlRuntime();
  initializeApiHeaders();
  initializeDialogRuntime();
  initializeDialogPanel();
  initializeDialogContent();
  initializePluginUploadApi();
  initializeJsxRuntime();
}

initializePluginShareDialogs();

export { PluginDeleteDialog, PluginUploadDialog };
