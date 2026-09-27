import "@rchunk/rolldown-runtime";
import { I3 as getJsxRuntime, type JsxRuntime } from "@rchunk/app-shared";
import "@rchunk/app-initial";
import "@rchunk/view-frame";
interface FileViewerFrameProps { className?: string; filePath: string; fileViewer: { hostId?: string; [key: string]: unknown }; lifetime?: unknown; mcpAppId: string; recipient?: unknown }
let runtime: JsxRuntime | undefined; function jsx(): JsxRuntime { runtime ??= getJsxRuntime(); return runtime; }
function t(props: FileViewerFrameProps): unknown { return jsx().jsx("iframe", { className: props.className, "data-file-path": props.filePath, "data-host-id": props.fileViewer.hostId, "data-lifetime": props.lifetime, "data-mcp-app-id": props.mcpAppId, "data-recipient": props.recipient, src: `codex-resource://${props.mcpAppId}` }); }
function n(): void {}
export { n, t };
