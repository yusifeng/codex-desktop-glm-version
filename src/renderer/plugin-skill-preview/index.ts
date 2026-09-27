import * as appSharedChunk from "@rchunk/app-shared";
import "@rchunk/rolldown-runtime";
import "@rchunk/app-initial";
import "@rchunk/plugin-skill-queries";
import type { JsxRuntime } from "@rchunk/app-shared";
const { I3: jsxExport } = appSharedChunk as unknown as { I3: JsxRuntime | (() => JsxRuntime) };
let jsx: JsxRuntime;
interface Props { description?: string; footer?: unknown; headerActions?: unknown; icon?: unknown; onClose?(): void; pluginId: string; skillName: string; title?: string; }
function PluginSkillPreview(props: Props): unknown { initializePluginSkillPreview(); return jsx.jsxs("article", { "data-plugin-id": props.pluginId, "data-skill-name": props.skillName, children: [jsx.jsxs("header", { children: [props.icon, jsx.jsx("h2", { children: props.title ?? props.skillName }), props.headerActions] }), jsx.jsx("p", { children: props.description }), props.footer] }); }
function renderSkillMarkdown(contents: string | null | undefined): unknown { initializePluginSkillPreview(); return contents == null ? null : jsx.jsx("pre", { children: contents }); }
function initializePluginSkillPreview(): void { if (jsx == null) jsx = typeof jsxExport === "function" ? jsxExport() : jsxExport; }
initializePluginSkillPreview();
export { initializePluginSkillPreview as n, renderSkillMarkdown as r, PluginSkillPreview as t };
