import { I3 as getJsxRuntime, e6 as getReactRuntime, type JsxRuntime } from "@rchunk/app-shared";
import "@rchunk/app-initial";
import "@rchunk/remote-connection-editor-dialog";
import "@rchunk/remote-connection-editor-draft";
import "@rchunk/rolldown-runtime";

export interface RemoteConnectionDraft {
  color?: string | null;
  displayName: string;
  host?: string;
  hostId: string;
  identity?: string | null;
  kind?: "remote-control" | "ssh" | "wsl";
  port?: number | null;
  user?: string;
}

export interface RemoteConnectionEditorModalProps {
  connection?: RemoteConnectionDraft | null;
  connections?: readonly RemoteConnectionDraft[] | null;
  error?: string | null;
  hostId: string;
  isLoading?: boolean;
  isSaving?: boolean;
  onClose(): void;
  onSave?(connection: RemoteConnectionDraft): Promise<void> | void;
}

let jsx: JsxRuntime;
let React: ReturnType<typeof getReactRuntime>;

function connectionHost(connection: RemoteConnectionDraft): string {
  return connection.host ?? "";
}

function RemoteConnectionEditorModal(props: RemoteConnectionEditorModalProps): unknown {
  const connection = props.connection ?? props.connections?.find((candidate) => candidate.hostId === props.hostId) ?? null;
  const loading = props.isLoading === true || (props.connection === undefined && props.connections == null && props.error == null);
  if (connection == null) {
    return jsx.jsxs("dialog", {
      open: true,
      children: [
        jsx.jsx("h2", { children: loading ? "Loading connection" : "Connection unavailable" }),
        props.error == null ? null : jsx.jsx("p", { role: "alert", children: props.error }),
        jsx.jsx("button", { type: "button", onClick: props.onClose, children: "Close" }),
      ],
    });
  }

  const [draft, setDraft] = React.useState<RemoteConnectionDraft>(() => ({ ...connection }));
  const draftRef = React.useRef(draft);
  const [saveError, setSaveError] = React.useState<string | null>(null);
  const [saving, setSaving] = React.useState(false);
  const pending = props.isSaving === true || saving;
  const update = (key: keyof RemoteConnectionDraft, value: string | number | null) => {
    const next = { ...draftRef.current, [key]: value };
    draftRef.current = next;
    setDraft(next);
    setSaveError(null);
  };
  const submit = async (event?: { preventDefault(): void }) => {
    event?.preventDefault();
    if (pending || props.onSave == null) return;
    if (draftRef.current.displayName.trim().length === 0) {
      setSaveError("Display name is required.");
      return;
    }
    setSaving(true);
    setSaveError(null);
    try {
      await props.onSave({
        ...draftRef.current,
        displayName: draftRef.current.displayName.trim(),
        host: draftRef.current.host?.trim(),
        identity: draftRef.current.identity?.trim() || null,
        user: draftRef.current.user?.trim(),
      });
      props.onClose();
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : "Failed to save remote connection.");
    } finally {
      setSaving(false);
    }
  };

  const sshLike = connection.kind == null || connection.kind === "ssh";
  return jsx.jsxs("dialog", {
    open: true,
    "data-host-id": props.hostId,
    "data-connection-kind": connection.kind ?? "ssh",
    children: [
      jsx.jsx("h2", { children: "Edit connection" }),
      jsx.jsxs("form", {
        onSubmit: submit,
        children: [
          jsx.jsxs("label", {
            children: ["Display name", jsx.jsx("input", {
              "aria-label": "Display name",
              disabled: pending,
              value: draft.displayName,
              onChange: (event: { currentTarget: { value: string } }) => update("displayName", event.currentTarget.value),
            })],
          }),
          sshLike ? jsx.jsxs("label", {
            children: ["Host", jsx.jsx("input", {
              "aria-label": "Host",
              disabled: pending,
              value: connectionHost(draft),
              onChange: (event: { currentTarget: { value: string } }) => update("host", event.currentTarget.value),
            })],
          }) : null,
          sshLike ? jsx.jsxs("label", {
            children: ["User", jsx.jsx("input", {
              "aria-label": "User",
              disabled: pending,
              value: draft.user ?? "",
              onChange: (event: { currentTarget: { value: string } }) => update("user", event.currentTarget.value),
            })],
          }) : null,
          sshLike ? jsx.jsxs("label", {
            children: ["Port", jsx.jsx("input", {
              "aria-label": "Port",
              disabled: pending,
              inputMode: "numeric",
              value: draft.port == null ? "" : String(draft.port),
              onChange: (event: { currentTarget: { value: string } }) => update("port", event.currentTarget.value.length === 0 ? null : Number(event.currentTarget.value)),
            })],
          }) : null,
          jsx.jsxs("label", {
            children: ["Color", jsx.jsx("input", {
              "aria-label": "Connection color",
              disabled: pending,
              type: "color",
              value: draft.color ?? "#6b7280",
              onChange: (event: { currentTarget: { value: string } }) => update("color", event.currentTarget.value),
            })],
          }),
          saveError == null ? null : jsx.jsx("p", { role: "alert", children: saveError }),
          jsx.jsxs("footer", {
            children: [
              jsx.jsx("button", { type: "button", disabled: pending, onClick: props.onClose, children: "Cancel" }),
              jsx.jsx("button", { type: "submit", disabled: pending || props.onSave == null, children: pending ? "Saving…" : "Save" }),
            ],
          }),
        ],
      }),
    ],
  });
}

function initializeRemoteConnectionEditorModal(): void {
  jsx = getJsxRuntime();
  React = getReactRuntime();
}

initializeRemoteConnectionEditorModal();
export { RemoteConnectionEditorModal };
