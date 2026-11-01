// xterm runtime boundary plus the desktop-specific theme, output, and zoom bridge.
// The release chunk embedded xterm.js and two official addons; keeping those as
// pinned packages leaves only the first-party behavior in this semantic owner.

import { Terminal, type IBufferCell, type ITerminalOptions, type ITheme } from "@xterm/xterm";
import { FitAddon } from "@xterm/addon-fit";
import { WebLinksAddon } from "@xterm/addon-web-links";
import "@rchunk/app-shared";
import { Dft as initializeExternalLinks, Oft as openExternalLink } from "@rchunk/app-initial";
import { i as firstFontFamily, o as prependSelectedFont, type ThemeFontFace } from "@rchunk/theme-font-family";

interface ThemeFonts { code: string; codeFace?: ThemeFontFace | null }
interface StyledOutputSegment { text: string; style?: Record<string, string | undefined> }
interface OutputWriter {
  dispose(): void;
  replaceOutput(output: string, done?: () => void, afterReset?: () => void): void;
  write(output: string): void;
}
interface WritableTerminal {
  buffer: Terminal["buffer"];
  options: ITerminalOptions;
  reset(): void;
  write(data: string, callback?: () => void): void;
}

const ANSI_THEME_VARIABLES = [
  ["black", "--color-codex-terminal-ansi-black"], ["red", "--color-codex-terminal-ansi-red"],
  ["green", "--color-codex-terminal-ansi-green"], ["yellow", "--color-codex-terminal-ansi-yellow"],
  ["blue", "--color-codex-terminal-ansi-blue"], ["magenta", "--color-codex-terminal-ansi-magenta"],
  ["cyan", "--color-codex-terminal-ansi-cyan"], ["white", "--color-codex-terminal-ansi-white"],
  ["brightBlack", "--color-codex-terminal-ansi-bright-black"], ["brightRed", "--color-codex-terminal-ansi-bright-red"],
  ["brightGreen", "--color-codex-terminal-ansi-bright-green"], ["brightYellow", "--color-codex-terminal-ansi-bright-yellow"],
  ["brightBlue", "--color-codex-terminal-ansi-bright-blue"], ["brightMagenta", "--color-codex-terminal-ansi-bright-magenta"],
  ["brightCyan", "--color-codex-terminal-ansi-bright-cyan"], ["brightWhite", "--color-codex-terminal-ansi-bright-white"],
] as const;
const CLEAR_LINE = "\r\u001B[2K";
const CLEAR_WRAPPED_LINE = "\u001B[1A\r\u001B[2K";
const INCOMPLETE_CONTROL_SEQUENCE_TIMEOUT_MS = 8;
const MAX_BUFFERED_BYTES = 1_048_576;
const MAX_BUFFERED_CHUNKS = 4_096;
const COMPACT_AFTER_CHUNKS = 128;
const COMPACT_AFTER_BYTES = 65_536;
const WRITE_BARRIER = "\0";

function initializeTerminalModule(): void {}
function getTerminalModule(): { Terminal: typeof Terminal } { return { Terminal }; }
function getFitAddonModule(): { FitAddon: typeof FitAddon } { return { FitAddon }; }
function getWebLinksAddonModule(): { WebLinksAddon: typeof WebLinksAddon } { return { WebLinksAddon }; }

function activateTerminalLink(event: MouseEvent, href: string): void {
  if (href.length === 0) return;
  (openExternalLink as unknown as (input: Record<string, unknown>) => void)({ event, href, initiator: "terminal_link_click" });
}
const terminalLinkHandler = { activate: activateTerminalLink };
function initializeTerminalLinks(): void { initializeExternalLinks(); }

function resolveCssColor(element: HTMLElement, property: string, probe: HTMLDivElement, rootStyle: CSSStyleDeclaration): string | undefined {
  const elementStyle = getComputedStyle(element);
  const value = elementStyle.getPropertyValue(property).trim() || rootStyle.getPropertyValue(property).trim();
  if (value.length === 0) return undefined;
  probe.style.color = value;
  return getComputedStyle(probe).color || value;
}

function terminalTheme(element: HTMLElement): ITheme {
  const style = getComputedStyle(element);
  const rootStyle = getComputedStyle(document.documentElement);
  const probe = document.createElement("div");
  element.append(probe);
  const color = (property: string): string | undefined => resolveCssColor(element, property, probe, rootStyle);
  const theme: ITheme = {
    background: color("--color-codex-terminal-background") ?? style.backgroundColor,
    foreground: color("--color-codex-terminal-foreground") ?? style.color,
    cursor: color("--color-codex-terminal-foreground") ?? style.color,
    selectionBackground: color("--color-codex-terminal-selection"),
    selectionInactiveBackground: color("--color-codex-terminal-selection-inactive"),
  };
  for (const [key, variable] of ANSI_THEME_VARIABLES) theme[key] = color(variable);
  probe.remove();
  return theme;
}

function initializeAnsiTheme(): void {}
function ansiColor(index: number, rgb: boolean, isDefault: boolean): string | undefined {
  if (isDefault) return undefined;
  if (rgb) return `#${index.toString(16).padStart(6, "0")}`;
  if (index < 16) return `var(${ANSI_THEME_VARIABLES[index]?.[1] ?? "--color-codex-terminal-foreground"})`;
  if (index >= 232) { const channel = 8 + (index - 232) * 10; return `rgb(${channel}, ${channel}, ${channel})`; }
  const channels = [0, 95, 135, 175, 215, 255];
  const value = index - 16;
  return `rgb(${channels[Math.floor(value / 36)]}, ${channels[Math.floor(value / 6) % 6]}, ${channels[value % 6]})`;
}

function cellStyle(cell: IBufferCell, options: ITerminalOptions): Record<string, string | undefined> {
  const inverse = cell.isInverse();
  let foreground = inverse ? cell.getBgColor() : cell.getFgColor();
  const foregroundRgb = inverse ? cell.isBgRGB() : cell.isFgRGB();
  const foregroundDefault = inverse ? cell.isBgDefault() : cell.isFgDefault();
  if (options.drawBoldTextInBrightColors && cell.isBold() && !foregroundDefault && !foregroundRgb && foreground < 8) foreground += 8;
  const color = ansiColor(foreground, foregroundRgb, foregroundDefault)
    ?? (inverse ? "var(--color-codex-terminal-background)" : "var(--color-codex-terminal-foreground)");
  const backgroundColor = ansiColor(
    inverse ? cell.getFgColor() : cell.getBgColor(),
    inverse ? cell.isFgRGB() : cell.isBgRGB(),
    inverse ? cell.isFgDefault() : cell.isBgDefault(),
  ) ?? (inverse ? "var(--color-codex-terminal-foreground)" : undefined);
  const decorations = [cell.isUnderline() ? "underline" : null, cell.isStrikethrough() ? "line-through" : null, cell.isOverline() ? "overline" : null].filter((value): value is string => value != null).join(" ");
  return {
    color: cell.isDim() ? `color-mix(in srgb, ${color} 50%, transparent)` : color,
    backgroundColor,
    fontWeight: cell.isBold() ? "bold" : undefined,
    fontStyle: cell.isItalic() ? "italic" : undefined,
    textDecorationLine: decorations || undefined,
  };
}

function equalStyle(left?: Record<string, string | undefined>, right?: Record<string, string | undefined>): boolean {
  const keys = new Set([...Object.keys(left ?? {}), ...Object.keys(right ?? {})]);
  for (const key of keys) if (left?.[key] !== right?.[key]) return false;
  return true;
}

function readTerminalOutput(terminal: Terminal): StyledOutputSegment[] {
  const buffer = terminal.buffer.active;
  const cursorLine = buffer.baseY + buffer.cursorY;
  const reusableCell = buffer.getNullCell();
  const output: StyledOutputSegment[] = [];
  let budget = 600;
  for (let lineIndex = cursorLine; lineIndex >= Math.max(buffer.baseY, cursorLine - 7) && budget > 0; lineIndex -= 1) {
    const line = buffer.getLine(lineIndex);
    if (line == null) continue;
    if (output.length > 0) { output.push({ text: "\n" }); budget -= 1; }
    let trimEnd = true;
    for (let column = Math.min(terminal.cols, line.length, 120) - 1; column >= 0 && budget > 0; column -= 1) {
      const cell = line.getCell(column, reusableCell);
      if (cell == null || cell.getWidth() === 0) continue;
      let text = cell.isInvisible() ? " ".repeat(cell.getWidth()) : cell.getChars() || " ";
      const style = cellStyle(cell, terminal.options);
      if (trimEnd && style.backgroundColor == null && style.textDecorationLine == null) text = text.trimEnd();
      if (text.length === 0) continue;
      trimEnd = false;
      text = text.slice(-budget);
      budget -= text.length;
      const adjacent = output.at(-1);
      if (adjacent != null && equalStyle(adjacent.style, style)) adjacent.text = text + adjacent.text;
      else output.push({ text, style });
    }
  }
  return output.reverse();
}

function hasMonospaceFallback(value: string): boolean {
  let start = 0; let quote: string | null = null; let escaped = false;
  for (let index = 0; index < value.length; index += 1) {
    const character = value[index];
    if (escaped) { escaped = false; continue; }
    if (character === "\\") { escaped = true; continue; }
    if (quote != null) { if (character === quote) quote = null; continue; }
    if (character === '"' || character === "'") { quote = character; continue; }
    if (character === ",") { if (value.slice(start, index).trim().toLowerCase() === "monospace") return true; start = index + 1; }
  }
  return value.slice(start).trim().toLowerCase() === "monospace";
}
function withMonospaceFallback(value: string): string { const trimmed = value.trim(); return trimmed.length === 0 ? "monospace" : hasMonospaceFallback(trimmed) ? trimmed : `${trimmed}, monospace`; }
function codeFontFamily(fonts: ThemeFonts): string { return withMonospaceFallback(prependSelectedFont(fonts.code, fonts.codeFace)?.trim() ?? ""); }
function normalizeTerminalOutput(output: string): string { return output.replace(/\r?\n/gu, "\r\n"); }
function isScrolledToBottom(terminal: Terminal): boolean { return terminal.buffer.active.viewportY >= terminal.buffer.active.baseY; }
async function prepareTerminalFont(fontFamily: string, size: number): Promise<void> {
  const family = firstFontFamily(fontFamily);
  if (family.length > 0 && "fonts" in document) {
    try { if (!document.fonts.check(`${size}px ${family}`)) await document.fonts.load(`${size}px ${family}`); } catch {}
  }
}

function adjustWrappedClear(terminal: WritableTerminal, output: string): string {
  if (!output.startsWith(CLEAR_LINE)) return output;
  const buffer = terminal.buffer.active;
  if (buffer.type !== "normal") return output;
  let line = buffer.baseY + buffer.cursorY; let wrapped = 0;
  while (buffer.getLine(line)?.isWrapped) { wrapped += 1; line -= 1; }
  return wrapped === 0 ? output : CLEAR_LINE + CLEAR_WRAPPED_LINE.repeat(wrapped) + output.slice(CLEAR_LINE.length);
}

function createOutputWriter(terminal: WritableTerminal): OutputWriter {
  let chunks: string[] = []; let index = 0; let bufferedBytes = 0; let consumedBytes = 0;
  let tail = ""; let timeout: ReturnType<typeof setTimeout> | null = null; let queued = false; let writing = false;
  let generation = 0; let replacementGeneration = 0; let completion: (() => void) | undefined;
  const clearTimeoutIfNeeded = (): void => { if (timeout != null) clearTimeout(timeout); timeout = null; };
  const resetQueue = (): void => { chunks = []; index = 0; bufferedBytes = 0; consumedBytes = 0; };
  const compact = (): void => { if (index > COMPACT_AFTER_CHUNKS || consumedBytes > COMPACT_AFTER_BYTES) { chunks.splice(0, index); index = 0; consumedBytes = 0; } };
  const drain = (): void => {
    compact(); const chunk = chunks[index];
    if (chunk == null) { writing = false; if (tail.length > 0) return; queued = false; resetQueue(); const done = completion; completion = undefined; done?.(); return; }
    index += 1; bufferedBytes -= chunk.length; consumedBytes += chunk.length; writing = true; const expected = generation;
    terminal.write(adjustWrappedClear(terminal, chunk), () => { if (expected === generation) drain(); });
  };
  const forceWrite = (suffix: string, reset: boolean, afterReset?: () => void): void => {
    const combined = chunks.slice(index).join("") + suffix + tail; const done = completion; const expectedReplacement = replacementGeneration;
    generation += 1; clearTimeoutIfNeeded(); resetQueue(); tail = ""; queued = false; writing = false; completion = undefined;
    const write = (): void => { if (expectedReplacement !== replacementGeneration) return; if (reset) { terminal.reset(); afterReset?.(); } terminal.write(combined, () => { if (expectedReplacement === replacementGeneration) done?.(); }); };
    if (reset) terminal.write(WRITE_BARRIER, write); else write();
  };
  const queue = (value: string, reset = false, afterReset?: () => void): boolean => {
    if (bufferedBytes + value.length + tail.length > MAX_BUFFERED_BYTES) { forceWrite(value, reset, afterReset); return false; }
    let count = chunks.length - index + 1; let marker = value.indexOf(CLEAR_LINE);
    while (marker !== -1) { count += 1; if (count > MAX_BUFFERED_CHUNKS) { forceWrite(value, reset, afterReset); return false; } marker = value.indexOf(CLEAR_LINE, marker + CLEAR_LINE.length); }
    const parts = value.split(CLEAR_LINE); if (parts[0].length > 0) chunks.push(parts[0]);
    for (let partIndex = 1; partIndex < parts.length; partIndex += 1) chunks.push(CLEAR_LINE + parts[partIndex]);
    bufferedBytes += value.length; return true;
  };
  const keepIncompletePrefix = (value: string): string => {
    const combined = tail + value; let length = Math.min(CLEAR_LINE.length - 1, combined.length);
    while (length > 0 && !CLEAR_LINE.startsWith(combined.slice(-length))) length -= 1;
    tail = combined.slice(combined.length - length); return combined.slice(0, combined.length - length);
  };
  const scheduleTail = (): void => {
    if (tail.length === 0 || timeout != null) return;
    timeout = setTimeout(() => { timeout = null; const value = tail; tail = ""; if (!queued) terminal.write(value); else if (queue(value) && !writing) drain(); }, INCOMPLETE_CONTROL_SEQUENCE_TIMEOUT_MS);
  };
  const beginDrain = (reset: boolean, afterReset?: () => void): void => {
    queued = true; writing = true; const expected = generation;
    terminal.write(WRITE_BARRIER, () => { if (expected !== generation) return; if (reset) { terminal.reset(); afterReset?.(); } drain(); });
  };
  return {
    write(value) { clearTimeoutIfNeeded(); const complete = keepIncompletePrefix(value); if (queued) { if (queue(complete) && !writing) drain(); scheduleTail(); return; } if (!complete.includes(CLEAR_LINE)) { terminal.write(complete); scheduleTail(); return; } if (queue(complete)) { beginDrain(false); scheduleTail(); } },
    replaceOutput(value, done, afterReset) { generation += 1; replacementGeneration += 1; clearTimeoutIfNeeded(); resetQueue(); tail = ""; completion = done; const complete = keepIncompletePrefix(value); if (queue(complete, true, afterReset)) { beginDrain(true, afterReset); scheduleTail(); } },
    dispose() { generation += 1; replacementGeneration += 1; clearTimeoutIfNeeded(); resetQueue(); tail = ""; queued = false; writing = false; completion = undefined; },
  };
}

interface PrivateTerminalServices {
  _coreBrowserService?: { _screenDprMonitor?: { register(value: unknown): void } };
  _mouseService?: { getCoords: (...arguments_: unknown[]) => unknown; getMouseReportCoords: (...arguments_: unknown[]) => unknown };
  _selectionService?: { _getMouseEventScrollAmount?: (...arguments_: unknown[]) => unknown; _screenElement?: HTMLElement };
}
function scaleMouseEvent(event: MouseEvent, bounds: DOMRect, scale: number): MouseEvent | { clientX: number; clientY: number } { return scale === 1 ? event : { clientX: bounds.left + (event.clientX - bounds.left) / scale, clientY: bounds.top + (event.clientY - bounds.top) / scale }; }
function attachModifierState(terminal: Terminal, getScale: () => unknown): () => void {
  const core = (terminal as unknown as { _core?: PrivateTerminalServices })._core;
  core?._coreBrowserService?._screenDprMonitor?.register(core._coreBrowserService._screenDprMonitor);
  const mouse = core?._mouseService; if (mouse == null) return () => undefined;
  const originalCoords = mouse.getCoords; const originalReportCoords = mouse.getMouseReportCoords;
  const scale = (event: MouseEvent, element: HTMLElement): MouseEvent | { clientX: number; clientY: number } => { const value = getScale(); return scaleMouseEvent(event, element.getBoundingClientRect(), typeof value === "number" && value > 0 ? value : 1); };
  mouse.getCoords = (event, element, ...rest) => originalCoords.call(mouse, scale(event as MouseEvent, element as HTMLElement), element, ...rest);
  mouse.getMouseReportCoords = (event, element) => originalReportCoords.call(mouse, scale(event as MouseEvent, element as HTMLElement), element);
  const selection = core?._selectionService; const originalScroll = selection?._getMouseEventScrollAmount; const screen = selection?._screenElement;
  if (selection != null && originalScroll != null && screen != null) selection._getMouseEventScrollAmount = (event) => originalScroll.call(selection, scale(event as MouseEvent, screen));
  return () => { mouse.getCoords = originalCoords; mouse.getMouseReportCoords = originalReportCoords; if (selection != null && originalScroll != null) selection._getMouseEventScrollAmount = originalScroll; };
}

function initializeXtermRuntime(): void { initializeTerminalModule(); initializeAnsiTheme(); initializeTerminalLinks(); }

export {
  getTerminalModule as _, codeFontFamily as a, isScrolledToBottom as c, terminalTheme as d,
  initializeAnsiTheme as f, initializeTerminalModule as g, terminalLinkHandler as h,
  prepareTerminalFont as i, readTerminalOutput as l, activateTerminalLink as m,
  attachModifierState as n, normalizeTerminalOutput as o, initializeTerminalLinks as p,
  createOutputWriter as r, initializeXtermRuntime as s, initializeTerminalModule as t,
  initializeXtermRuntime as u, getWebLinksAddonModule as v, getFitAddonModule as y,
};
