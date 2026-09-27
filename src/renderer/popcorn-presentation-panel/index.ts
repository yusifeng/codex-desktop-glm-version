import "@rchunk/rolldown-runtime";
import { I3 as getJsxRuntime, type JsxRuntime } from "@rchunk/app-shared";
import "@rchunk/artifact-workbook-runtime";
import "@rchunk/app-initial";
import "@rchunk/popcorn-icons";
import "@rchunk/artifact-source-bootstrap";
import "@rchunk/app-primary";
import "@rchunk/popcorn-manual-edit-header-controls";
import "@rchunk/text-underline-icon";
import "@rchunk/portable-thumbnail-font-face-source-runtime";
import "@rchunk/portable-thumbnail-font-runtime";
import "@rchunk/drawing-frame-geometry";
import "@rchunk/floating-ui-modifiers";
import "@rchunk/popcorn-electron-surface-style";
import "@rchunk/popcorn-review-bar-overlay";
import "@rchunk/draw-presence-label";
import "@rchunk/presentation-review-utils";
export interface PresentationSlide { id: string; title?: string; thumbnailUrl?: string }
export interface PopcornPresentationController { getSelectedSlideIndex(): number; selectSlide(index: number): void; setZoom(zoom: number): void }
export interface PopcornElectronPresentationPanelProps { annotationsEnabled?: boolean; className?: string; footerContent?: unknown; headerCenterContent?: unknown; headerRightContent?: unknown; headerTitleContent?: unknown; initialSelectedSlideIdx?: number; initialSourceBytes?: Uint8Array; initialSourceFormat?: string; initialZoom?: number; isEditing?: boolean; onControllerReady?(controller: PopcornPresentationController): void; onImportError?(error: Error): void; onImportReady?(): void; onInteractionAttempt?(): void; onPresentationEdit?(): void; renderHeader?(parts: Record<string, unknown>): unknown; renderLayout?(parts: Record<string, unknown>): unknown; slides?: readonly PresentationSlide[]; theme?: string; title?: string }
let runtime: JsxRuntime | undefined; function jsx(): JsxRuntime { runtime ??= getJsxRuntime(); return runtime; }
function PopcornElectronPresentationPanel(props: PopcornElectronPresentationPanelProps): unknown { let selected = Math.min(Math.max(0, props.initialSelectedSlideIdx ?? 0), Math.max(0, (props.slides?.length ?? 1) - 1)); let zoom = props.initialZoom ?? 1; const controller: PopcornPresentationController = { getSelectedSlideIndex: () => selected, selectSlide(index) { selected = Math.min(Math.max(0, index), Math.max(0, (props.slides?.length ?? 1) - 1)); props.onInteractionAttempt?.(); }, setZoom(value) { zoom = value; props.onInteractionAttempt?.(); } }; props.onControllerReady?.(controller); props.onImportReady?.(); const header = props.renderHeader?.({ title: props.title, zoom }) ?? jsx().jsxs("header", { children: [props.headerTitleContent ?? jsx().jsx("h1", { children: props.title ?? "Presentation" }), props.headerCenterContent, props.headerRightContent] }); const content = jsx().jsxs("div", { "data-selected-slide-index": selected, "data-zoom": zoom, children: [jsx().jsx("aside", { children: (props.slides ?? []).map((slide, index) => jsx().jsx("button", { "aria-pressed": index === selected, onClick: () => controller.selectSlide(index), type: "button", children: slide.title ?? `Slide ${index + 1}` }, slide.id)) }), jsx().jsx("div", { "data-presentation-canvas": true, children: props.slides?.[selected]?.title ?? "Empty presentation" })] }); const panel = jsx().jsxs("section", { className: props.className, "data-codex-popcorn-editor": true, "data-testid": "popcorn-electron-presentation-panel", "data-theme": props.theme ?? "codex", "data-editing": props.isEditing ?? false, children: [header, content, props.footerContent] }); return props.renderLayout?.({ content, header, panel }) ?? panel; }
export { PopcornElectronPresentationPanel };
