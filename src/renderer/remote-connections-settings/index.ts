import "@rchunk/rolldown-runtime";
import * as appSharedChunk from "@rchunk/app-shared";
import "@rchunk/app-initial";
import "@rchunk/chatgpt-desktop-auth-url";
import "@rchunk/codex-mobile-setup-dialog";
import "@rchunk/codex-mobile-setup-flow";
import "@rchunk/onboarding-login-content";
import "@rchunk/remote-connection-editor-dialog";
import "@rchunk/remote-connection-editor-draft";
interface Connection {
  autoConnect?: boolean;
  codexInstalled?: boolean;
  displayName?: string;
  envId?: string;
  error?: string | null;
  hostId: string;
  hostname?: string;
  kind?: "remote-control" | "ssh" | "wsl";
  lastSeenAt?: string | number | null;
  status?: string;
  username?: string;
}
interface RemoteDraft {
  authMode?: "identity" | "none";
  displayName?: string;
  identity?: string;
  sshHost?: string;
  sshPort?: string;
}
interface RemoteProps {
  authRequired?: boolean;
  clientAuthorized?: boolean;
  error?: string | null;
  isAuthorizing?: boolean;
  isLoading?: boolean;
  isRefreshing?: boolean;
  onAdd?(): void;
  onAuthorize?(): void;
  onDelete?(connection: Connection): void;
  onDeleteRemoteControl?(connection: Connection): void;
  onEdit?(connection: Connection): void;
  onInstallCodex?(connection: Connection): void;
  onLogout?(connection: Connection): void;
  onPairMobile?(): void;
  onRefresh?(): void;
  onRenameRemoteControl?(connection: Connection, name: string): void;
  onSaveDraft?(draft: RemoteDraft, hostId?: string | null): void;
  onTabChange?(tab: string): void;
  onToggleAutoConnect?(connection: Connection, enabled: boolean): void;
  remoteControlConnections?: readonly Connection[];
  routeDraft?: { draft?: RemoteDraft; hostId?: string | null } | null;
  selectedTab?: "remote-control" | "ssh" | "wsl";
  sshConnections?: readonly Connection[];
  supportsRemoteControl?: boolean;
  supportsWsl?: boolean;
  wslConnections?: readonly Connection[];
}
const shared = appSharedChunk as unknown as { I3(): import("@rchunk/app-shared").JsxRuntime };
let jsx: import("@rchunk/app-shared").JsxRuntime | undefined;
function connectionLabel(connection: Connection): string {
  return connection.displayName ?? connection.hostname ?? connection.hostId;
}

function statusTone(status: string | undefined): "danger" | "neutral" | "success" | "warning" {
  if (status === "connected" || status === "authorized") return "success";
  if (status === "connecting" || status === "installing") return "warning";
  if (status === "error" || status === "login-required") return "danger";
  return "neutral";
}

function Row({ connection, kind, props }: { connection: Connection; kind: Connection["kind"]; props: RemoteProps }): unknown {
  const status = connection.status ?? "disconnected";
  const isRemoteControl = kind === "remote-control";
  return jsx!.jsxs("li", {
    className: "flex items-center justify-between gap-3 px-4 py-3",
    "data-connection-kind": kind,
    "data-host-id": connection.hostId,
    children: [
      jsx!.jsxs("div", {
        className: "min-w-0 flex-1",
        children: [
          jsx!.jsx("div", { className: "truncate font-medium", children: connectionLabel(connection) }),
          jsx!.jsx("div", { className: "text-sm text-secondary", children: [connection.username, connection.hostname, status].filter(Boolean).join(" · ") }),
          connection.error == null ? null : jsx!.jsx("p", { role: "alert", children: connection.error }),
        ],
      }),
      jsx!.jsx("span", { "data-status-tone": statusTone(status), children: status }),
      isRemoteControl ? null : jsx!.jsxs("label", {
        children: [
          "Connect automatically",
          jsx!.jsx("input", {
            checked: connection.autoConnect === true,
            onChange: (event: { currentTarget: { checked: boolean } }) => props.onToggleAutoConnect?.(connection, event.currentTarget.checked),
            type: "checkbox",
          }),
        ],
      }),
      !isRemoteControl && connection.codexInstalled === false
        ? jsx!.jsx("button", { onClick: () => props.onInstallCodex?.(connection), type: "button", children: "Install Codex CLI" })
        : null,
      jsx!.jsx("button", { type: "button", onClick: () => props.onEdit?.(connection), children: "Edit" }),
      status === "login-required" ? jsx!.jsx("button", { onClick: () => props.onLogout?.(connection), type: "button", children: "Log out" }) : null,
      jsx!.jsx("button", {
        type: "button",
        onClick: () => isRemoteControl ? props.onDeleteRemoteControl?.(connection) : props.onDelete?.(connection),
        children: "Delete",
      }),
    ],
  });
}

function List({ connections, kind, label, props }: { connections: readonly Connection[]; kind: Connection["kind"]; label: string; props: RemoteProps }): unknown {
  const ordered = [...connections].sort((left, right) => connectionLabel(left).localeCompare(connectionLabel(right)));
  return jsx!.jsxs("section", {
    "aria-label": label,
    className: "rounded-xl border",
    children: [
      jsx!.jsx("h2", { className: "border-b px-4 py-3 font-semibold", children: label }),
      ordered.length === 0
        ? jsx!.jsx("p", { className: "px-4 py-3 text-secondary", children: "No connections" })
        : jsx!.jsx("ul", { children: ordered.map((connection) => jsx!.jsx(Row, { connection, kind, props }, connection.hostId)) }),
    ],
  });
}

function ConnectionEditor({ routeDraft, onSave }: { routeDraft: NonNullable<RemoteProps["routeDraft"]>; onSave?: RemoteProps["onSaveDraft"] }): unknown {
  const draft: RemoteDraft = { authMode: "none", displayName: "", sshHost: "", sshPort: "", ...(routeDraft.draft ?? {}) };
  const update = (key: keyof RemoteDraft, value: string) => { draft[key] = value as never; };
  return jsx!.jsxs("dialog", {
    open: true,
    children: [
      jsx!.jsx("h2", { children: routeDraft.hostId == null ? "Add SSH connection" : "Edit SSH connection" }),
      jsx!.jsxs("form", {
        onSubmit: (event: { preventDefault(): void }) => { event.preventDefault(); onSave?.(draft, routeDraft.hostId); },
        children: [
          jsx!.jsxs("label", { children: ["Display name", jsx!.jsx("input", { defaultValue: draft.displayName, onChange: (event: { currentTarget: { value: string } }) => update("displayName", event.currentTarget.value) })] }),
          jsx!.jsxs("label", { children: ["Hostname or alias", jsx!.jsx("input", { defaultValue: draft.sshHost, onChange: (event: { currentTarget: { value: string } }) => update("sshHost", event.currentTarget.value) })] }),
          jsx!.jsxs("label", { children: ["SSH port", jsx!.jsx("input", { defaultValue: draft.sshPort, inputMode: "numeric", onChange: (event: { currentTarget: { value: string } }) => update("sshPort", event.currentTarget.value) })] }),
          jsx!.jsx("button", { type: "submit", children: "Save connection" }),
        ],
      }),
    ],
  });
}

export function RemoteConnectionsSettings(props: RemoteProps = {}): unknown {
  jsx ??= shared.I3();
  if (props.isLoading) return jsx.jsx("div", { role: "status", children: "Loading remote connections…" });
  if (props.error != null) return jsx.jsxs("div", { role: "alert", children: [props.error, jsx.jsx("button", { type: "button", onClick: props.onRefresh, children: "Retry" })] });
  const editorMode = props.routeDraft == null ? null : props.routeDraft.hostId == null ? "add" : "edit";
  const supportsWsl = props.supportsWsl ?? true;
  const supportsRemoteControl = props.supportsRemoteControl ?? true;
  return jsx.jsxs("main", {
    "data-settings-page": "remote-connections",
    "data-editor-mode": editorMode,
    children: [
      jsx.jsxs("header", {
        children: [
          jsx.jsx("h1", { children: "Remote connections" }),
          jsx.jsx("button", { disabled: props.isRefreshing, type: "button", onClick: props.onRefresh, children: props.isRefreshing ? "Refreshing…" : "Refresh" }),
          jsx.jsx("button", { type: "button", onClick: props.onAdd, children: "Add connection" }),
        ],
      }),
      jsx.jsx("nav", {
        "aria-label": "Connection types",
        children: (["ssh", ...(supportsWsl ? ["wsl"] : []), ...(supportsRemoteControl ? ["remote-control"] : [])] as const).map((tab) => jsx.jsx("button", {
          "aria-current": props.selectedTab === tab ? "page" : undefined,
          onClick: () => props.onTabChange?.(tab),
          type: "button",
          children: tab === "ssh" ? "SSH" : tab === "wsl" ? "WSL" : "Remote control",
        }, tab)),
      }),
      jsx.jsx(List, { label: "SSH connections", kind: "ssh", connections: props.sshConnections ?? [], props }),
      supportsWsl ? jsx.jsx(List, { label: "WSL connections", kind: "wsl", connections: props.wslConnections ?? [], props }) : null,
      supportsRemoteControl ? jsx.jsxs("section", {
        children: [
          props.authRequired ? jsx.jsxs("div", { role: "status", children: ["Authorization required", jsx.jsx("button", { disabled: props.isAuthorizing, onClick: props.onAuthorize, type: "button", children: "Authorize" })] }) : null,
          jsx.jsx(List, { label: "Remote control connections", kind: "remote-control", connections: props.remoteControlConnections ?? [], props }),
          jsx.jsx("button", { disabled: !props.clientAuthorized && props.authRequired, type: "button", onClick: props.onPairMobile, children: "Pair mobile device" }),
        ],
      }) : null,
      props.routeDraft == null ? null : jsx.jsx(ConnectionEditor, { routeDraft: props.routeDraft, onSave: props.onSaveDraft }),
    ],
  });
}
