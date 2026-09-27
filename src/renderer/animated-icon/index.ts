import "@rchunk/rolldown-runtime";
import { I3 as getJsxRuntime, type JsxRuntime } from "@rchunk/app-shared";
import "@rchunk/app-initial";
import "@rchunk/app-primary";
import "@rchunk/animated-icon-svg";
import "@rchunk/hello-icon";
import "@rchunk/loader-icon";
import "@rchunk/memory-footnote-icon";
import "@rchunk/sidebar-finances-icon";
import "@rchunk/sidebar-images-icon";
import "@rchunk/sidebar-library-icon";
import "@rchunk/sidebar-more-icon";
import "@rchunk/sidebar-new-chat-icon";
import "@rchunk/sidebar-plugins-icon";
import "@rchunk/sidebar-projects-icon";
import "@rchunk/sidebar-search-icon";
import "@rchunk/sidebar-tasks-icon";
type AnimationName = "automation" | "hello" | "loader" | "memory" | "sidebar-finances" | "sidebar-images" | "sidebar-library" | "sidebar-more" | "sidebar-new-chat" | "sidebar-plugins" | "sidebar-projects" | "sidebar-search" | "sidebar-tasks";
interface AnimatedIconProps { animation: AnimationName; animated?: boolean; className?: string; color?: string; fallbackIcon?: unknown; loop?: boolean; onComplete?(): void; onReady?(): void }
let runtime: JsxRuntime | undefined;
function jsx(): JsxRuntime { runtime ??= getJsxRuntime(); return runtime; }
function AnimatedIcon({ animation, animated = true, className = "h-full w-full", color = "currentColor", fallbackIcon, loop = false, onComplete, onReady }: AnimatedIconProps): unknown { const content = fallbackIcon ?? jsx().jsx("svg", { viewBox: "0 0 24 24", "aria-hidden": true, children: jsx().jsx("circle", { cx: 12, cy: 12, r: animation === "loader" ? 8 : 7, fill: "none", stroke: color, strokeWidth: 2 }) }); return jsx().jsx("div", { className, "data-animation": animation, "data-animated": animated, "data-loop": loop, onAnimationEnd: () => { onComplete?.(); }, ref: () => onReady?.(), children: content }); }
function initializeAnimatedIcon(): void { void jsx(); }
export { initializeAnimatedIcon as n, AnimatedIcon as t };
