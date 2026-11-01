import {
  $3 as getCompilerRuntime,
  I3 as getJsxRuntime,
  K2 as initializeInternationalization,
  Y2 as FormattedMessage,
  e6 as getReactRuntime,
  h4 as initializeClassNames,
  m4 as classNames,
  type JsxRuntime,
} from "@rchunk/app-shared";
import {
  LY as initializeMarkdown,
  OLt as ChevronDownIcon,
  RY as Markdown,
  ion as parseMarkdownMetadata,
  kLt as initializeMetadataParser,
} from "@rchunk/app-initial";
import "@rchunk/rolldown-runtime";

interface SurfaceProps { background?: "normal" | "subtle"; children?: unknown; className?: string; overflow?: "auto" | "clip" }
interface MetadataEntry { key: string; value: string | string[] }
interface MarkdownSurfaceProps { conversationId?: string | null; cwd?: string | null; enableMetadataPreview?: boolean; hideCodeBlocks?: boolean; hostId?: string; isStreaming?: boolean; markdown: string }
interface CompilerRuntime { c(size: number): unknown[] }
interface ReactRuntime { useState<T>(value: T): [T, (next: T | ((current: T) => T)) => void] }

let compiler: CompilerRuntime;
let React: ReactRuntime;
let jsx: JsxRuntime;
let emptyValue: string;
let collapsedEntryCount: number;

function Surface({ background = "subtle", className, children, overflow = "clip" }: SurfaceProps): unknown {
  const cache = compiler.c(7);
  const backgroundClass = background === "normal" ? "bg-surface" : "bg-text/5";
  const overflowClass = overflow === "auto" ? "overflow-auto" : "overflow-clip";
  let resolvedClassName: string;
  if (cache[0] !== className || cache[1] !== backgroundClass || cache[2] !== overflowClass) {
    resolvedClassName = classNames("relative rounded-lg", backgroundClass, overflowClass, className);
    cache[0] = className; cache[1] = backgroundClass; cache[2] = overflowClass; cache[3] = resolvedClassName;
  } else resolvedClassName = cache[3] as string;
  let result: unknown;
  if (cache[4] !== children || cache[5] !== resolvedClassName) {
    result = jsx.jsx("div", { className: resolvedClassName, children });
    cache[4] = children; cache[5] = resolvedClassName; cache[6] = result;
  } else result = cache[6];
  return result;
}

function MarkdownSurface({ enableMetadataPreview = false, markdown, conversationId = null, cwd = null, hideCodeBlocks, hostId, isStreaming = false }: MarkdownSurfaceProps): unknown {
  const cache = compiler.c(15);
  let parsed: { body: string; entries: MetadataEntry[] } | null;
  if (cache[0] !== enableMetadataPreview || cache[1] !== markdown) {
    parsed = enableMetadataPreview ? parseMarkdownMetadata(markdown) : null;
    cache[0] = enableMetadataPreview; cache[1] = markdown; cache[2] = parsed;
  } else parsed = cache[2] as typeof parsed;
  const body = parsed?.body ?? markdown;
  let metadata: unknown;
  if (cache[3] === parsed) metadata = cache[4];
  else {
    metadata = parsed != null && parsed.entries.length > 0 ? jsx.jsx(MetadataPreview, { entries: parsed.entries }) : null;
    cache[3] = parsed; cache[4] = metadata;
  }
  let renderedMarkdown: unknown;
  if (cache[5] !== conversationId || cache[6] !== cwd || cache[7] !== hideCodeBlocks || cache[8] !== hostId || cache[9] !== isStreaming || cache[10] !== body) {
    renderedMarkdown = jsx.jsx(Markdown, { className: "text-size-chat", conversationId, hideCodeBlocks, hostId, isStreaming, cwd, children: body });
    cache[5] = conversationId; cache[6] = cwd; cache[7] = hideCodeBlocks; cache[8] = hostId; cache[9] = isStreaming; cache[10] = body; cache[11] = renderedMarkdown;
  } else renderedMarkdown = cache[11];
  let result: unknown;
  if (cache[12] !== metadata || cache[13] !== renderedMarkdown) {
    result = jsx.jsxs("div", { className: "px-4 py-3", children: [metadata, renderedMarkdown] });
    cache[12] = metadata; cache[13] = renderedMarkdown; cache[14] = result;
  } else result = cache[14];
  return result;
}

function MetadataPreview({ entries }: { entries: MetadataEntry[] }): unknown {
  const cache = compiler.c(13);
  const [expanded, setExpanded] = React.useState(false);
  const collapsible = entries.length > collapsedEntryCount;
  let visibleEntries: MetadataEntry[];
  if (cache[0] !== entries || cache[1] !== expanded || cache[2] !== collapsible) {
    visibleEntries = collapsible && !expanded ? entries.slice(0, collapsedEntryCount) : entries;
    cache[0] = entries; cache[1] = expanded; cache[2] = collapsible; cache[3] = visibleEntries;
  } else visibleEntries = cache[3] as MetadataEntry[];
  let title: unknown;
  if (cache[4] === Symbol.for("react.memo_cache_sentinel")) {
    title = jsx.jsx("div", { className: "mb-2 font-medium text-secondary", children: jsx.jsx(FormattedMessage, { id: "markdown.metadata.title", defaultMessage: "Metadata", description: "Title for rendered Markdown file metadata" }) });
    cache[4] = title;
  } else title = cache[4];
  let list: unknown;
  if (cache[5] === visibleEntries) list = cache[6];
  else { list = jsx.jsx(MetadataList, { entries: visibleEntries }); cache[5] = visibleEntries; cache[6] = list; }
  let disclosure: unknown;
  if (cache[7] !== expanded || cache[8] !== collapsible) {
    disclosure = collapsible ? jsx.jsxs("button", {
      type: "button", "aria-expanded": expanded,
      className: "mt-1.5 inline-flex cursor-interaction items-center gap-1 text-secondary hover:text-default",
      onClick: () => setExpanded(toggleBoolean),
      children: [
        jsx.jsx("span", { children: expanded
          ? jsx.jsx(FormattedMessage, { id: "markdown.metadata.showLess", defaultMessage: "Show less", description: "Disclosure control shown when a Markdown metadata preview can collapse additional fields" })
          : jsx.jsx(FormattedMessage, { id: "markdown.metadata.showMore", defaultMessage: "Show more", description: "Disclosure control shown when a Markdown metadata preview hides additional fields" }) }),
        jsx.jsx(ChevronDownIcon, { className: classNames("icon-2xs transition-transform", expanded ? "rotate-180" : "rotate-0") }),
      ],
    }) : null;
    cache[7] = expanded; cache[8] = collapsible; cache[9] = disclosure;
  } else disclosure = cache[9];
  let result: unknown;
  if (cache[10] !== list || cache[11] !== disclosure) {
    result = jsx.jsxs("div", { className: "mb-3 rounded-md border border-border/60 bg-text/5 px-3 py-2 text-xs", children: [title, list, disclosure] });
    cache[10] = list; cache[11] = disclosure; cache[12] = result;
  } else result = cache[12];
  return result;
}

function toggleBoolean(value: boolean): boolean { return !value; }

function MetadataList({ className, entries }: { className?: string; entries: MetadataEntry[] }): unknown {
  const cache = compiler.c(7);
  let resolvedClassName: string;
  if (cache[0] === className) resolvedClassName = cache[1] as string;
  else { resolvedClassName = classNames("grid grid-cols-[minmax(0,8rem)_minmax(0,1fr)] gap-x-3 gap-y-1.5", className); cache[0] = className; cache[1] = resolvedClassName; }
  let rows: unknown[];
  if (cache[2] === entries) rows = cache[3] as unknown[];
  else { rows = entries.map(renderMetadataRow); cache[2] = entries; cache[3] = rows; }
  let result: unknown;
  if (cache[4] !== resolvedClassName || cache[5] !== rows) { result = jsx.jsx("dl", { className: resolvedClassName, children: rows }); cache[4] = resolvedClassName; cache[5] = rows; cache[6] = result; }
  else result = cache[6];
  return result;
}

function renderMetadataRow(entry: MetadataEntry, index: number): unknown {
  return jsx.jsxs("div", { className: "contents", children: [
    jsx.jsx("dt", { className: "truncate font-mono text-secondary", title: entry.key, children: entry.key }),
    jsx.jsx("dd", { className: "min-w-0 text-default", children: jsx.jsx(MetadataValue, { value: entry.value }) }),
  ] }, `${entry.key}-${index}`);
}

function MetadataValue({ value }: { value: string | string[] }): unknown {
  const cache = compiler.c(6);
  if (Array.isArray(value)) {
    let values: unknown[];
    if (cache[0] === value) values = cache[1] as unknown[];
    else { values = value.map(renderArrayValue); cache[0] = value; cache[1] = values; }
    let result: unknown;
    if (cache[2] === values) result = cache[3];
    else { result = jsx.jsx("span", { className: "flex min-w-0 flex-wrap gap-1", children: values }); cache[2] = values; cache[3] = result; }
    return result;
  }
  const display = value.length === 0 ? emptyValue : value;
  let result: unknown;
  if (cache[4] === display) result = cache[5];
  else { result = jsx.jsx("span", { className: "font-mono break-words", children: display }); cache[4] = display; cache[5] = result; }
  return result;
}

function renderArrayValue(value: string, index: number): unknown {
  return jsx.jsx("span", { className: "max-w-full rounded-sm bg-text/10 px-1.5 py-0.5 font-mono break-words", children: value.length === 0 ? emptyValue : value }, `${value}-${index}`);
}

function initializeSurface(): void {
  compiler = getCompilerRuntime() as CompilerRuntime;
  initializeClassNames(); React = getReactRuntime() as ReactRuntime; initializeInternationalization();
  initializeMetadataParser(); initializeMarkdown(); jsx = getJsxRuntime(); emptyValue = '""'; collapsedEntryCount = 8;
}

export { initializeSurface as i, Surface as n, MarkdownSurface as r, MetadataPreview as t };
