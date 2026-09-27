import "@rchunk/rolldown-runtime";
import { I3 as getJsxRuntime, type JsxRuntime } from "@rchunk/app-shared";
import "@rchunk/app-initial";
import "@rchunk/code-diff";
import "@rchunk/diff-summary";
import "@rchunk/conversation-diff-comments";

interface EditorDiffPageProps { conversationId?: string | null; diffContent?: string | null; error?: string | null; initialViewType?: "split" | "unified"; richPreviewEnabled?: boolean }
let runtime: JsxRuntime | undefined;
function jsx(): JsxRuntime { runtime ??= getJsxRuntime(); return runtime; }
function decodeDiff(value: string): string { if (!value.startsWith("base64,")) return value; const bytes = Uint8Array.from(atob(value.slice(7)), character => character.charCodeAt(0)); return new TextDecoder().decode(bytes); }
function EditorDiffPage({ conversationId = null, diffContent = null, error = null, initialViewType = "unified", richPreviewEnabled = false }: EditorDiffPageProps = {}): unknown { let decoded: string | null = null; let decodeError = error; if (decodeError == null && diffContent != null) try { decoded = decodeDiff(diffContent); } catch { decodeError = "Couldn’t load this diff"; } if (decodeError != null) return jsx().jsx("div", { role: "alert", children: decodeError }); if (decoded == null || decoded.trim() === "") return jsx().jsx("div", { role: "status", children: "No diff available" }); return jsx().jsxs("main", { "data-conversation-id": conversationId ?? undefined, "data-view-type": initialViewType, children: [jsx().jsx("header", { children: richPreviewEnabled ? "Changes · Rich preview" : "Changes" }), jsx().jsx("pre", { children: decoded })] }); }
export { EditorDiffPage };
