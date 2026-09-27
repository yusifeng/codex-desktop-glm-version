import { I3 as getJsxRuntime, type JsxRuntime } from "@rchunk/app-shared";
import "@rchunk/app-initial";
import "@rchunk/app-primary";
import "@rchunk/plugin-connector-setup";
import "@rchunk/hooks";
import "@rchunk/card-tile";
import "@rchunk/plugin-settings-url";
import "@rchunk/app-card";
import "@rchunk/plugin-connected-account-links";
import "@rchunk/settings-loading-row";
import "@rchunk/plugins-page-section";
import "@rchunk/profile-lock";
import "@rchunk/plugin-disabled-reason";
import "@rchunk/detail-page";
import "@rchunk/browser-extension-setup-messages";

export interface DetailPlugin { summary: { description?: string; id?: string; installed?: boolean; name: string; remotePluginId?: string; [key: string]: unknown }; [key: string]: unknown }
export interface PreviewableCardProps { cardActions?: unknown | ((controls: { ignoreNextPreview(): void; openPreview(): void }) => unknown); cardBadges?: unknown; cardDescription?: unknown; cardIcon?: unknown; cardTitle: unknown; modalBody?: unknown | ((state: { isOpen: boolean }) => unknown); modalDescription?: unknown; modalFooter?: unknown; modalHeaderActions?: unknown; modalTitle?: unknown; onOpenPreview?(): void; }
export type PluginDetailState = { state: "loading" } | { errorMessage?: string; state: "error" } | { description?: string; state: "missing" } | ({ plugin: DetailPlugin; presentation?: "dialog" | "page"; state: "ready" } & Record<string, unknown>);
let jsx: JsxRuntime;

function iconClass({ size, hasLargeIcon, smallClassName = "icon-md", largeFallbackClassName = "h-5 w-5" }: { size?: "large" | "small"; hasLargeIcon?: boolean; smallClassName?: string; largeFallbackClassName?: string }): string { return size === "large" ? (hasLargeIcon ? "h-full w-full" : largeFallbackClassName) : smallClassName; }

function PreviewableCard(props: PreviewableCardProps): unknown {
  const runtime = ensureJsx();
  const openPreview = (): void => { props.onOpenPreview?.(); };
  const ignoreNextPreview = (): void => {};
  const actions = typeof props.cardActions === "function" ? props.cardActions({ ignoreNextPreview, openPreview }) : props.cardActions;
  const body = typeof props.modalBody === "function" ? props.modalBody({ isOpen: false }) : props.modalBody;
  return runtime.jsxs(runtime.Fragment, { children: [runtime.jsxs("article", { className: "previewable-card", onClick: openPreview, children: [props.cardIcon, runtime.jsx("h3", { children: props.cardTitle }), runtime.jsx("p", { children: props.cardDescription }), props.cardBadges, actions] }), runtime.jsxs("dialog", { open: false, children: [props.modalTitle, props.modalDescription, body, props.modalHeaderActions, props.modalFooter] })] });
}

function SkillDetailCard(props: { actionLabel?: unknown; displayName?: string; onSkillsUpdated?(success: boolean): void; skill: { description?: string; installed?: boolean; name: string; path?: string; [key: string]: unknown } }): unknown {
  const runtime = ensureJsx();
  const title = props.displayName ?? props.skill.name;
  return runtime.jsx(PreviewableCard, { cardTitle: title, cardDescription: props.skill.description, modalTitle: title, modalDescription: props.skill.path, cardActions: runtime.jsx("button", { type: "button", onClick: () => props.onSkillsUpdated?.(true), children: props.actionLabel ?? (props.skill.installed ? "Installed" : "Install") }) });
}

function PluginDetailView(input: PluginDetailState): unknown {
  const runtime = ensureJsx();
  if (input.state === "loading") return runtime.jsx("div", { "aria-busy": true, children: "Loading plugin…" });
  if (input.state === "error") return runtime.jsxs("div", { role: "alert", children: [runtime.jsx("h1", { children: "Failed to load plugin" }), input.errorMessage] });
  if (input.state === "missing") return runtime.jsxs("div", { role: "alert", children: [runtime.jsx("h1", { children: "Plugin not found" }), input.description] });
  const name = input.plugin.summary.name;
  return runtime.jsxs("article", { className: input.presentation === "dialog" ? "plugin-detail-dialog" : "plugin-detail-page", "data-plugin-id": input.plugin.summary.id, children: [runtime.jsx("h1", { children: name }), runtime.jsx("p", { children: input.plugin.summary.description }), input.plugin.summary.installed ? runtime.jsx("span", { children: "Installed" }) : null] });
}

const initializePreviewableCard = (): void => { jsx = getJsxRuntime(); };
const initializeDetailContent = (): void => { jsx = getJsxRuntime(); };
const initializeDetailMessages = (): void => { jsx = getJsxRuntime(); };
const initializeNoop = (): void => {};
const initializeAll = (): void => { jsx = getJsxRuntime(); };
function ensureJsx(): JsxRuntime { if (jsx == null) jsx = getJsxRuntime(); return jsx; }

export { iconClass as a, initializePreviewableCard as c, initializeDetailContent as i, initializeAll as n, initializeNoop as o, SkillDetailCard as r, PreviewableCard as s, PluginDetailView as t };
