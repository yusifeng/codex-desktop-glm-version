import "@rchunk/rolldown-runtime";
import * as Shared from "@rchunk/app-shared";
import * as Initial from "@rchunk/app-initial";
import { getPathBasename } from "../app-shared/runtime/get-path-basename";

interface JsxRuntime { jsx(type: unknown, props: Record<string, unknown>): unknown; jsxs(type: unknown, props: Record<string, unknown>): unknown }
interface ThumbnailProps { title: string; path?: string | null; isMarkdown?: boolean; icon?: unknown; hideFilePath?: boolean; hasUnsavedChanges?: boolean; content?: string | null }
type IconComponent = (props: Record<string, unknown>) => unknown;
const shared = Shared as unknown as { $3(): { c(n: number): unknown[] }; I3(): JsxRuntime; K2(): void; RI(): void; Y2: unknown; gg(): void; hg(path: string): string; pg: Record<string, IconComponent> };
const initial = Initial as unknown as { J9t(path: string): string | null; Jxn(): void; X9t(path: string): boolean; Xd: unknown; Y9t(): void; Zd(): void; qxn: Array<{ id: string; aliases?: string[]; name: string }> };
let compiler: { c(n: number): unknown[] }, jsx: JsxRuntime;

function markdownOutline(content: string): string | null {
  const headings: string[] = []; let fence: string | null = null;
  for (const line of content.match(/[^\r\n]+/g) ?? []) {
    const fenceMatch = /^ {0,3}(\x60{3,}|~{3,})(.*)$/.exec(line);
    if (fence != null) { if (fenceMatch != null && fenceMatch[1][0] === fence[0] && fenceMatch[1].length >= fence.length && fenceMatch[2].trim() === "") fence = null; continue; }
    if (fenceMatch != null) { fence = fenceMatch[1]; continue; }
    const heading = /^ {0,3}(#{1,6})[\t ]+(.+?)\s*$/.exec(line); if (heading == null) continue;
    const text = heading[2].replace(/[\t ]+#+[\t ]*$/, "").trim(); if (text) headings.push("  ".repeat(heading[1].length - 1) + text.slice(0, 160)); if (headings.length === 8) break;
  }
  return headings.length ? headings.join("\n") : null;
}

function TextFileThumbnail({ title, path, isMarkdown, icon, hideFilePath = false, hasUnsavedChanges, content }: ThumbnailProps): unknown {
  compiler.c(31);
  let languageId: string | null = isMarkdown ? "markdown" : null; if (path != null) languageId = initial.J9t(path) ?? getPathBasename(path).toLowerCase();
  const language = initial.qxn.find(item => item.id === languageId || languageId != null && item.aliases?.includes(languageId))?.name;
  if ((path == null || path === title) && content == null && !hasUnsavedChanges && language == null) return null;
  const lineCount = content != null && content.length <= 65536 ? 1 + (content.match(/\r\n|\r|\n/g)?.length ?? 0) : null;
  const outline = content != null && (isMarkdown ?? (path != null && initial.X9t(path))) ? markdownOutline(content.slice(0, 65536)) : null;
  const Icon = path == null ? null : shared.pg[shared.hg(path)]; const resolvedIcon = icon ?? (Icon ? jsx.jsx(Icon, { className: "icon-sm" }) : null);
  const subtitle = hideFilePath || path === title ? null : path ?? null;
  const titleNode = jsx.jsxs("span", { className: "flex min-w-0 items-start gap-2", children: [jsx.jsx("span", { className: "line-clamp-2 min-w-0", children: title }), hasUnsavedChanges ? jsx.jsxs("span", { className: "flex h-5 shrink-0 items-center text-codex-description", children: [jsx.jsx("span", { "aria-hidden": true, className: "h-1 w-1 rounded-full bg-text-secondary" }), jsx.jsx("span", { className: "sr-only", children: jsx.jsx(shared.Y2, { id: "tabThumbnail.file.unsaved", defaultMessage: "Unsaved changes", description: "Status of a file with an unsaved draft in a tab thumbnail" }) })] }) : null] });
  const metadata = language != null || lineCount != null ? { kind: "text", lines: 1, variant: "caption", content: lineCount == null ? language : jsx.jsx(shared.Y2, { id: "tabThumbnail.file.metadata", defaultMessage: "{hasLanguage, select, true {{language} · } other {}}{lineCount, plural, one {# line} other {# lines}}", description: "File language when known, followed by the number of lines in its full cached text or unsaved draft", values: { hasLanguage: language != null, language, lineCount } }) } : null;
  const preview = content ? { kind: "text", content: outline ?? content.slice(0, 600), lines: 8, variant: outline ? "body" : "code" } : null;
  return jsx.jsx(initial.Xd, { icon: resolvedIcon, subtitle, title: titleNode, sections: [metadata, preview] });
}

function initialize(): void { compiler = shared.$3(); shared.K2(); initial.Jxn(); initial.Zd(); initial.Y9t(); shared.gg(); shared.RI(); jsx = shared.I3(); }
export { initialize as n, TextFileThumbnail as t };
