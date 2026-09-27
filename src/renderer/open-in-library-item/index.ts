import "@rchunk/rolldown-runtime";
import { I3 as getJsxRuntime, type JsxRuntime } from "@rchunk/app-shared";
import "@rchunk/app-initial";
interface OpenInLibraryItemProps { disabled?: boolean; libraryFileId: string; onOpen?(path: string): void }
let runtime: JsxRuntime | undefined;
function jsx(): JsxRuntime { runtime ??= getJsxRuntime(); return runtime; }
function OpenInLibraryItem({ disabled = false, libraryFileId, onOpen }: OpenInLibraryItemProps): unknown { const path = `/library/file/${encodeURIComponent(libraryFileId)}`; return jsx().jsx("button", { type: "button", disabled, onClick: () => { if (!disabled) onOpen?.(path); }, children: "Open in Library" }); }
function initialize(): void {}
export { initialize as n, OpenInLibraryItem as t };
