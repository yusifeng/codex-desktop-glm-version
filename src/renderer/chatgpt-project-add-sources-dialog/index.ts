import "@rchunk/rolldown-runtime";
import "@rchunk/app-initial";
import "@rchunk/app-primary";
import "@rchunk/mcp-oauth-runtime";
import "@rchunk/source-dashed-border";
import { I3 as getJsxRuntime, e6 as ReactRuntime, type JsxRuntime } from "@rchunk/app-shared";

type SourceMode = "library" | "text" | "website";
interface ChatGptProjectAddSourcesDialogProps { disabled?: boolean; fileLimitBanner?: unknown; isFileLimitReached?: boolean; onAddLibrary?(): void; onAddText?(text: string): Promise<void> | void; onAddWebsite?(url: string): Promise<void> | void; onClose(): void; onCloseAutoFocus?(event: unknown): void; onFilesSelected(files: File[]): void; projectId: string }
let runtime: JsxRuntime | undefined;
function jsx(): JsxRuntime { runtime ??= getJsxRuntime(); return runtime; }
function ChatGptProjectAddSourcesDialog({ disabled = false, fileLimitBanner, isFileLimitReached = false, onAddLibrary, onAddText, onAddWebsite, onClose, onFilesSelected, projectId }: ChatGptProjectAddSourcesDialogProps): unknown {
  const [mode, setMode] = ReactRuntime.useState<SourceMode | null>(null);
  const [value, setValue] = ReactRuntime.useState("");
  const [saving, setSaving] = ReactRuntime.useState(false);
  const [error, setError] = ReactRuntime.useState(false);
  const blocked = disabled || isFileLimitReached;
  const submit = async (kind: "text" | "website") => { const next = value.trim(); if (blocked || saving || next.length === 0) return; setSaving(true); setError(false); try { await (kind === "text" ? onAddText?.(next) : onAddWebsite?.(next)); onClose(); } catch { setError(true); } finally { setSaving(false); } };
  const chooseMode = (next: SourceMode | null) => { setMode(next); setValue(""); setError(false); };
  const modePanel = (kind: "text" | "website", title: string, label: string) => jsx().jsxs("section", { "data-project-id": projectId, children: [jsx().jsx("button", { type: "button", disabled: saving, onClick: () => chooseMode(null), children: "Back" }), jsx().jsx("h2", { children: title }), jsx().jsx(kind === "text" ? "textarea" : "input", { "aria-label": label, value, disabled: blocked || saving, onChange: (event: { currentTarget: { value: string } }) => setValue(event.currentTarget.value) }), error ? jsx().jsx("p", { role: "alert", children: "Couldn’t add this source. Try again." }) : null, jsx().jsx("button", { type: "button", disabled: blocked || saving || value.trim().length === 0, onClick: () => void submit(kind), children: saving ? "Adding…" : "Add" })] });
  return jsx().jsxs("dialog", { open: true, "aria-busy": saving, children: [mode === "text" ? modePanel("text", "Paste text", "Source text") : mode === "website" ? modePanel("website", "Add website", "Website URL") : mode === "library" ? jsx().jsxs("section", { children: [jsx().jsx("button", { type: "button", onClick: () => chooseMode(null), children: "Back" }), jsx().jsx("h2", { children: "Add from library" }), jsx().jsx("button", { type: "button", disabled, onClick: onAddLibrary, children: "Open Library" })] }) : jsx().jsxs("section", { children: [jsx().jsxs("header", { children: [jsx().jsx("h2", { children: "Add sources" }), jsx().jsx("button", { type: "button", "aria-label": "Close", onClick: onClose, children: "Close" })] }), fileLimitBanner, jsx().jsxs("label", { role: "button", "aria-disabled": blocked, children: ["Drag sources here", jsx().jsx("input", { type: "file", multiple: true, hidden: true, disabled: blocked, name: "project-source-files", onChange: (event: { currentTarget: { files: FileList | null } }) => { if (event.currentTarget.files != null) onFilesSelected(Array.from(event.currentTarget.files)); } })] }), jsx().jsxs("div", { children: [jsx().jsx("button", { type: "button", disabled: blocked, onClick: () => findFileInput(), children: "Upload" }), jsx().jsx("button", { type: "button", disabled, onClick: () => chooseMode("library"), children: "Library" }), jsx().jsx("button", { type: "button", disabled: blocked, onClick: () => chooseMode("text"), children: "Paste text" }), jsx().jsx("button", { type: "button", disabled, onClick: () => chooseMode("website"), children: "Website" })] })] })] });
}
function findFileInput(): void { if (typeof document !== "undefined") document.querySelector<HTMLInputElement>('input[name="project-source-files"]')?.click(); }
export { ChatGptProjectAddSourcesDialog, type ChatGptProjectAddSourcesDialogProps };
