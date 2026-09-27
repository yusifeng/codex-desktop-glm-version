import "@rchunk/rolldown-runtime";
import { I3 as getJsxRuntime, type JsxRuntime } from "@rchunk/app-shared";
import "@rchunk/app-initial";
export interface GeneratedImageFavoriteTarget { isPreview?: boolean; src?: string | null; status: string }
export interface GeneratedImageFavoriteProps { conversationId: string; directoryId?: string | null; image: GeneratedImageFavoriteTarget; isSaved?: boolean; libraryFileId?: string | null; onSelectFolder?(folderId: string | null): void; onToggleFavorite?(saved: boolean, folderId?: string | null): Promise<void> | void; visible?: boolean }
let runtime: JsxRuntime | undefined; function jsx(): JsxRuntime { runtime ??= getJsxRuntime(); return runtime; }
const generatedImageInfoQuery = { getKey(fileId: string, conversationId: string, accountId?: string, userId?: string): readonly unknown[] { return ["library-api", accountId, userId, "generated-image-info", fileId, conversationId]; }, staleTime: 30_000 } as const;
function GeneratedImageFavoriteButton(props: GeneratedImageFavoriteProps): unknown { const available = props.image.status === "completed" && !props.image.isPreview && props.image.src != null && props.libraryFileId != null; if (!available) return null; let saved = props.isSaved ?? false; const toggle = async (): Promise<void> => { saved = !saved; await props.onToggleFavorite?.(saved, props.directoryId); }; return jsx().jsxs("div", { className: "size-9", "data-generated-image-favorite": true, children: [jsx().jsx("button", { "aria-label": saved ? "Remove from library" : "Save to library", onClick: toggle, type: "button", children: saved ? "Saved" : "Save" }), props.onSelectFolder ? jsx().jsx("button", { onClick: () => props.onSelectFolder?.(props.directoryId ?? null), type: "button", children: "Choose folder" }) : null] }); }
function GeneratedImageFavorite(props: GeneratedImageFavoriteProps): unknown { if (props.visible === false || props.image.status !== "completed" || props.image.isPreview || props.image.src == null) return null; return jsx().jsx(GeneratedImageFavoriteButton, props); }
function initializeGeneratedImageInfoQuery(): void {}
function initializeGeneratedImageFavorite(): void { void jsx(); }
export { initializeGeneratedImageInfoQuery as a, generatedImageInfoQuery as i, GeneratedImageFavoriteButton as n, initializeGeneratedImageFavorite as r, GeneratedImageFavorite as t };
