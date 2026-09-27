import { I3 as getJsxRuntime, type JsxRuntime } from "@rchunk/app-shared";
import "@rchunk/app-initial";
import "@rchunk/remote-connection-editor-dialog";
import "@rchunk/remote-connection-editor-draft";
import "@rchunk/rolldown-runtime";

export interface RemoteConnectionDraft {
  displayName: string;
  host: string;
  hostId: string;
  port?: number;
  user?: string;
}

export interface RemoteConnectionEditorModalProps {
  connection?: RemoteConnectionDraft | null;
  hostId: string;
  isLoading?: boolean;
  isSaving?: boolean;
  onClose(): void;
  onSave?(connection: RemoteConnectionDraft): Promise<void> | void;
}

let jsx: JsxRuntime;

function RemoteConnectionEditorModal(props: RemoteConnectionEditorModalProps): unknown {
  if (props.connection == null) {
    return jsx.jsxs("dialog", {
      open: true,
      children: [
        jsx.jsx("h2", { children: props.isLoading ? "Loading connection" : "Connection unavailable" }),
        jsx.jsx("button", { type: "button", onClick: props.onClose, children: "Close" }),
      ],
    });
  }
  const connection = props.connection;
  return jsx.jsxs("dialog", {
    open: true,
    "data-host-id": props.hostId,
    children: [
      jsx.jsx("h2", { children: "Edit remote connection" }),
      jsx.jsx("label", { children: jsx.jsx("input", { "aria-label": "Display name", defaultValue: connection.displayName }) }),
      jsx.jsx("label", { children: jsx.jsx("input", { "aria-label": "Host", defaultValue: connection.host }) }),
      jsx.jsxs("footer", {
        children: [
          jsx.jsx("button", { type: "button", onClick: props.onClose, children: "Cancel" }),
          jsx.jsx("button", { type: "button", disabled: props.isSaving, onClick: () => props.onSave?.(connection), children: props.isSaving ? "Saving…" : "Save" }),
        ],
      }),
    ],
  });
}

function initializeRemoteConnectionEditorModal(): void { jsx = getJsxRuntime(); }
initializeRemoteConnectionEditorModal();
export { RemoteConnectionEditorModal };
