import * as RuntimeChunk from "@rchunk/rolldown-runtime";
import * as SharedChunk from "@rchunk/app-shared";
import * as MermaidSupportChunk from "@rchunk/mermaid-support";
import * as InitialChunk from "@rchunk/app-initial";
import * as ChartColorsChunk from "@rchunk/chart-colors";

interface ThemeInput { chatTheme?: string | null; isDarkMode: boolean }
interface ThemeVariables extends Record<string, string> { background: string; lineColor: string; primaryColor: string; primaryTextColor: string; surfaceColor: string; textColor: string }
interface RenderInput { source: string; themeVariables: ThemeVariables; isDarkMode: boolean; diagramId: string }
interface MermaidApi { initialize(options: Record<string, unknown>): void; render(id: string, source: string, container?: HTMLElement): Promise<{ svg: string }>; registerLayoutLoaders?(loaders: readonly unknown[]): void }
interface JsxRuntime { jsx(type: unknown, props: Record<string, unknown>): unknown }

const jsx = (SharedChunk as unknown as { I3(): JsxRuntime }).I3();
const renderCache = new Map<string, Promise<string | null>>();
let renderQueue: Promise<unknown> = Promise.resolve();
void RuntimeChunk; void MermaidSupportChunk; void InitialChunk; void ChartColorsChunk;

async function loadElkRenderer(): Promise<unknown> { return import("@rchunk/mermaid-elk-renderer"); }
async function loadMermaid(): Promise<MermaidApi> { const loaded = await import("@rchunk/mermaid-core") as unknown as { default?: MermaidApi }; return loaded.default ?? loaded as unknown as MermaidApi; }

function sanitizeSource(source: string): string | null {
  let blocked = false;
  const withoutDirectives = source.replace(/%%\{[\s\S]*?\}%%/g, directive => { if (/securityLevel/i.test(directive)) blocked = true; return ""; });
  if (blocked) return null;
  return withoutDirectives.replace(/^\s*click\s+.*$/gim, "").trim() || null;
}

async function renderMermaid({ source, themeVariables, isDarkMode, diagramId }: RenderInput): Promise<string | null> {
  const sanitized = sanitizeSource(source);
  if (sanitized == null) return null;
  const key = `${diagramId}:${JSON.stringify(themeVariables)}:${isDarkMode}:${sanitized}`;
  const cached = renderCache.get(key);
  if (cached != null) return cached;
  const task = renderQueue.then(async () => {
    const mermaid = await loadMermaid();
    mermaid.initialize({ startOnLoad: false, securityLevel: "strict", suppressErrorRendering: true, theme: "base", themeVariables, darkMode: isDarkMode, htmlLabels: false, flowchart: { useMaxWidth: false } });
    const container = document.createElement("div"); container.inert = true; container.hidden = true; document.body.append(container);
    try { return (await mermaid.render(document.getElementById(diagramId) == null ? diagramId : `${diagramId}-${crypto.randomUUID()}`, sanitized, container)).svg || null; } finally { container.remove(); }
  });
  renderQueue = task.then(() => undefined, () => undefined);
  const safeTask = task.catch(() => null); renderCache.set(key, safeTask);
  if (renderCache.size > 50) renderCache.delete(renderCache.keys().next().value ?? key);
  return safeTask;
}

function createThemeVariables({ chatTheme, isDarkMode }: ThemeInput): ThemeVariables {
  const palette = isDarkMode ? { background: "#181818", surface: "#212121", text: "#f5f5f5", line: "#8b8b8b" } : { background: "#ffffff", surface: "#f4f4f4", text: "#202020", line: "#6b6b6b" };
  const accent = chatTheme === "green" ? (isDarkMode ? "#003716" : "#d9f4e4") : chatTheme === "purple" ? (isDarkMode ? "#2c184a" : "#efe5fe") : (isDarkMode ? "#00284d" : "#e5f3ff");
  return { background: "transparent", surfaceColor: palette.background, primaryColor: accent, primaryTextColor: palette.text, textColor: palette.text, lineColor: palette.line, nodeTextColor: palette.text, edgeLabelBackground: palette.background, secondaryColor: palette.surface };
}

function MermaidImage(props: { source: string; diagramId: string; isDarkMode?: boolean; chatTheme?: string | null; onError?(): void; svgRef?(node: SVGSVGElement | null): void }): unknown {
  const themeVariables = createThemeVariables({ chatTheme: props.chatTheme, isDarkMode: props.isDarkMode ?? false });
  return jsx.jsx("div", { className: "mermaid-image", "data-diagram-id": props.diagramId, render: () => renderMermaid({ source: props.source, diagramId: `chatgpt-mermaid-${props.diagramId.replace(/[^a-zA-Z0-9_-]/g, "")}`, isDarkMode: props.isDarkMode ?? false, themeVariables }).catch(error => { props.onError?.(); throw error; }), ref: props.svgRef });
}

function serializeSvg(svg: SVGSVGElement | null): { src: string; width: number; height: number } | null { if (svg == null) return null; const clone = svg.cloneNode(true); if (!(clone instanceof SVGSVGElement)) return null; const { width, height } = svg.viewBox.baseVal; clone.setAttribute("xmlns", "http://www.w3.org/2000/svg"); clone.setAttribute("width", String(width)); clone.setAttribute("height", String(height)); return { src: `data:image/svg+xml;charset=utf-8,${encodeURIComponent(new XMLSerializer().serializeToString(clone))}`, width, height }; }
async function svgDataUrlToPng(source: string): Promise<string | null> { try { await document.fonts.ready; const image = new Image(); image.src = source; await image.decode(); const canvas = document.createElement("canvas"); canvas.width = Math.max(1, Math.ceil(image.naturalWidth * 2)); canvas.height = Math.max(1, Math.ceil(image.naturalHeight * 2)); const context = canvas.getContext("2d"); if (context == null) return null; context.drawImage(image, 0, 0, canvas.width, canvas.height); return canvas.toDataURL("image/png"); } catch { return null; } }
function initializeMermaidImageRendering(): void { void loadElkRenderer; }
function initializeRenderer(): void { renderCache.clear(); }
function initializeThemeState(): void {}
function initializeThemeAtom(): void {}
function initializeReactRenderer(): void {}
const defaultThemeVariables = createThemeVariables({ isDarkMode: false });

export { initializeMermaidImageRendering as a, createThemeVariables as c, initializeRenderer as d, MermaidImage as i, initializeThemeState as l, serializeSvg as n, initializeThemeAtom as o, initializeReactRenderer as r, defaultThemeVariables as s, svgDataUrlToPng as t, renderMermaid as u };
