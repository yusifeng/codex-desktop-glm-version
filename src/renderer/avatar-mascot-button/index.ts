import "@rchunk/rolldown-runtime";
import { I3 as getJsxRuntime, type JsxRuntime } from "@rchunk/app-shared";
import "@rchunk/app-initial";
import "@rchunk/codex-pet-assets";
interface AvatarMascotButtonProps { ariaLabel?: string; className?: string; lookFrame?: number | null; notificationBadge?: string | number | null; source?: string; state?: "idle" | "jumping" | "running" | "waving"; style?: Record<string, unknown>; transientState?: "idle" | "jumping" | "running" | "waving"; onContextMenu?(event: unknown): void }
let runtime: JsxRuntime | undefined;
function jsx(): JsxRuntime { runtime ??= getJsxRuntime(); return runtime; }
const fadeTransition = { duration: 0.22, ease: [0.4, 0, 0.6, 1] } as const;
const softSpring = { damping: 26.18, mass: 1, stiffness: 685.3890625, type: "spring", velocity: 0 } as const;
const firmSpring = { damping: 32.67256359733385, mass: 1, stiffness: 631.6546817189, type: "spring", velocity: 0 } as const;
const softTransitions = { default: softSpring, filter: { ...softSpring, damping: 52.36 } } as const;
const firmTransitions = { default: firmSpring, filter: { ...firmSpring, damping: 2 * Math.sqrt(firmSpring.stiffness * firmSpring.mass) } } as const;
const mascotStyles = { Material: "_Material_c58wm_2", CompactMaterial: "_CompactMaterial_c58wm_2", ActivityBacking: "_ActivityBacking_c58wm_2", Control: "_Control_c58wm_2" } as const;
const nativeTintStyles = { nativeTint: "_nativeTint_v9pb8_6" } as const;
function blurFilter(pixels: number): string { return `blur(max(0px, ${pixels}px))`; }
function NotificationBadge({ notificationBadge }: { notificationBadge: string | number }): unknown { return jsx().jsx("span", { role: "status", "aria-label": `${notificationBadge} notifications`, children: notificationBadge }); }
function AvatarMascotButton({ ariaLabel, className, notificationBadge, source = "default", state = "idle", style, transientState, onContextMenu }: AvatarMascotButtonProps): unknown { const activeState = transientState ?? state; return jsx().jsxs("div", { className, "data-avatar-mascot": true, "data-source": source, "data-state": activeState, "data-testid": "avatar-mascot-button", "aria-hidden": ariaLabel == null && notificationBadge == null || undefined, "aria-label": ariaLabel, role: notificationBadge != null ? "group" : ariaLabel == null ? undefined : "img", onContextMenu, style, children: [jsx().jsx("span", { "aria-hidden": true, children: activeState === "waving" ? "👋" : "◉" }), notificationBadge == null ? null : jsx().jsx(NotificationBadge, { notificationBadge })] }); }
function initializeMotion(): void {}
function initializeNativeTintStyles(): void {}
function initializeMascotStyles(): void {}
function initializeAvatarMascotButton(): void { initializeMotion(); initializeNativeTintStyles(); initializeMascotStyles(); void jsx(); }
export { initializeMascotStyles as a, firmSpring as c, softTransitions as d, fadeTransition as f, mascotStyles as i, softSpring as l, initializeMotion as m, NotificationBadge as n, nativeTintStyles as o, blurFilter as p, initializeAvatarMascotButton as r, initializeNativeTintStyles as s, AvatarMascotButton as t, firmTransitions as u };
