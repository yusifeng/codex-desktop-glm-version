import "@rchunk/rolldown-runtime";
import { I3 as getJsxRuntime, type JsxRuntime } from "@rchunk/app-shared";
import "@rchunk/app-initial";
import "@rchunk/app-primary";
import "@rchunk/use-app-connect-flow";
import "@rchunk/open-in-google-drive-menu-item";
import "@rchunk/use-target-apps";
import "@rchunk/artifact-originating-turn";
interface ArtifactPreviewHeaderProps { canDownload?: boolean; downloading?: boolean; openTargets?: Array<{ id: string; label: string }>; title?: string; onDownload?(): Promise<void> | void; onOpen?(targetId: string): void; onReveal?(): void }
let runtime: JsxRuntime | undefined;
function jsx(): JsxRuntime { runtime ??= getJsxRuntime(); return runtime; }
async function r(action: (() => Promise<void> | void) | undefined): Promise<{ ok: boolean; error?: string }> { try { await action?.(); return { ok: true }; } catch { return { ok: false, error: "Could not download artifact" }; } }
function t({ canDownload = true, downloading = false, openTargets = [], title = "Artifact", onDownload, onOpen, onReveal }: ArtifactPreviewHeaderProps): unknown { return jsx().jsxs("header", { children: [jsx().jsx("h2", { children: title }), onReveal == null ? null : jsx().jsx("button", { onClick: onReveal, type: "button", children: "Open in folder" }), openTargets.map(target => jsx().jsx("button", { onClick: () => onOpen?.(target.id), type: "button", children: `Open in ${target.label}` }, target.id)), jsx().jsx("button", { disabled: !canDownload || downloading, onClick: () => r(onDownload), type: "button", children: downloading ? "Downloading…" : "Download" })] }); }
function n(): void {}
export { n, r, t };
