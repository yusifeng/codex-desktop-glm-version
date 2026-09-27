import "@rchunk/rolldown-runtime";
import { I3 as getJsxRuntime, e6 as getReactRuntime } from "@rchunk/app-shared";
const jsx = getJsxRuntime();
function ArtifactFilePreviewIcon({ getImagePreviewSrc, iconClassName, imageClassName, path }: { getImagePreviewSrc?(path: string): string | null | undefined; iconClassName?: string; imageClassName?: string; path: string }): unknown { const src = getImagePreviewSrc?.(path); if (src) return jsx.jsx("img", { alt: "", className: imageClassName, src }); const extension = path.split(".").pop()?.toUpperCase() ?? "FILE"; return jsx.jsx("span", { className: iconClassName, "aria-label": `${extension} file`, children: extension.slice(0, 4) }); }
function initializeArtifactFilePreviewIcon(): void { getReactRuntime(); }
export { initializeArtifactFilePreviewIcon as n, ArtifactFilePreviewIcon as t };
