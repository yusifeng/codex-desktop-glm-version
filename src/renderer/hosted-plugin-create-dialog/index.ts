import { I3 as getJsxRuntime, type JsxRuntime } from "@rchunk/app-shared";
import "@rchunk/app-initial";
import "@rchunk/app-connect-modal";
import "@rchunk/use-app-connect-flow";
import "@rchunk/app-info";
import "@rchunk/mcp-oauth-runtime";
import "@rchunk/api";

export interface HostedPluginCreateDialogProps { canCreateMcpApp: boolean; canUploadArchive: boolean; initialMode?: "archive" | "mcp"; isPending?: boolean; onAppCreated?(app: Record<string, unknown>): void; onArchiveCreated?(plugin: Record<string, unknown>): void; onClose(): void }
let jsx: JsxRuntime;
function HostedPluginCreateDialog(props: HostedPluginCreateDialogProps): unknown {
  const runtime = ensureJsx();
  const mode = props.initialMode ?? (props.canUploadArchive ? "archive" : "mcp");
  const canSubmit = mode === "archive" ? props.canUploadArchive : props.canCreateMcpApp;
  const switchMode = mode === "archive" ? "mcp" : "archive";
  const canSwitch = switchMode === "archive" ? props.canUploadArchive : props.canCreateMcpApp;
  return runtime.jsx("dialog", { open: true, children: runtime.jsxs("form", { "data-mode": mode, onSubmit: (event: { preventDefault(): void }) => { event.preventDefault(); if (!canSubmit) return; if (mode === "archive") props.onArchiveCreated?.({ kind: "archive" }); else props.onAppCreated?.({ kind: "mcp" }); }, children: [runtime.jsx("h2", { children: mode === "archive" ? "Upload plugin archive" : "Create MCP App" }), runtime.jsx("div", { children: mode === "archive" ? "Choose a plugin archive to install." : "Connect an MCP server to create an app." }), canSwitch ? runtime.jsx("button", { type: "button", "data-next-mode": switchMode, children: switchMode === "mcp" ? "Create MCP App" : "Upload plugin archive" }) : null, runtime.jsx("button", { type: "button", disabled: props.isPending, onClick: props.onClose, children: "Cancel" }), runtime.jsx("button", { type: "submit", disabled: !canSubmit || props.isPending, children: mode === "archive" ? "Add plugin" : "Create" })] }) });
}
function ensureJsx(): JsxRuntime { if (jsx == null) jsx = getJsxRuntime(); return jsx; }
export { HostedPluginCreateDialog };
