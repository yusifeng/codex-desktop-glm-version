import "@rchunk/rolldown-runtime";
import { I3 as getJsxRuntime, type JsxRuntime } from "@rchunk/app-shared";
import "@rchunk/app-initial";
interface ImageItem { alt?: string; sourceLabel?: string; sourceUrl?: string; src: string }
interface ImageLightboxProps { currentIndex?: number; images: ImageItem[]; onClose(): void; onNavigate?(index: number): void; onRetry?(): void }
let runtime: JsxRuntime | undefined;
function jsx(): JsxRuntime { runtime ??= getJsxRuntime(); return runtime; }
function t({ currentIndex = 0, images, onClose, onNavigate, onRetry }: ImageLightboxProps): unknown { const index = Math.max(0, Math.min(currentIndex, Math.max(0, images.length - 1))); const image = images[index]; if (image == null) return jsx().jsxs("dialog", { open: true, children: [jsx().jsx("p", { role: "alert", children: "Couldn't load this image" }), jsx().jsx("button", { onClick: onRetry, type: "button", children: "Try again" }), jsx().jsx("button", { onClick: onClose, type: "button", children: "Close" })] }); return jsx().jsxs("dialog", { open: true, "aria-label": `Image ${index + 1}`, children: [jsx().jsx("button", { onClick: onClose, type: "button", children: "Close" }), jsx().jsx("img", { alt: image.alt ?? `Image ${index + 1}`, src: image.src }), jsx().jsx("span", { children: `${index + 1} of ${images.length}` }), jsx().jsx("button", { disabled: index === 0, onClick: () => onNavigate?.(index - 1), type: "button", children: "Previous" }), jsx().jsx("button", { disabled: index >= images.length - 1, onClick: () => onNavigate?.(index + 1), type: "button", children: "Next" }), image.sourceUrl == null ? null : jsx().jsx("a", { href: image.sourceUrl, children: image.sourceLabel == null ? "Open image source" : `View on ${image.sourceLabel}` })] }); }
function n(): void {}
export { n, t };
