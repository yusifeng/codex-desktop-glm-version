import "@rchunk/rolldown-runtime";
import {
  $3 as initializeCompilerRuntime,
  I3 as getJsxRuntime,
  h4 as initializeClassNames,
  m4 as classNames,
} from "@rchunk/app-shared";

interface AnsiBlockProps { children?: string | null; className?: string; }
interface AnsiSegment { background?: string; content: string; decorations: string[]; foreground?: string; }

const jsx = getJsxRuntime();
const basicColors = ["black", "red", "green", "yellow", "blue", "magenta", "cyan", "white"];

function stripAnsi(value: string): string {
  let previous: string;
  let current = value;
  do {
    previous = current;
    current = current.replace(/\x1b\[[0-?]*[ -\/]*[@-~]/g, "").replace(/[^\n]\x08/g, "");
  } while (current.length < previous.length);
  return current;
}

function eraseCarriageReturnUpdates(value: string): string {
  let output = value.replace(/\r+\n/g, "\n");
  while (/\r./.test(output)) {
    output = output.replace(/^([^\r\n]*)\r+([^\r\n]+)/gm, (_match, previous: string, replacement: string) => {
      let visibleLength = stripAnsi(replacement).length;
      const leadingStyles = previous.match(/\x1b\[[\d;]*m/g)?.join("") ?? "";
      const suffix = previous.replace(/\x1b\[[\d;]*[A-Za-z]|./g, (character) =>
        character.startsWith("\x1b") || visibleLength-- <= 0 ? character : "");
      return leadingStyles + replacement + (suffix && /\x1b\[[\d;]*m/.test(replacement) ? "\x1b[0m" : "") + suffix;
    });
  }
  return output;
}

function parseAnsi(value: string): AnsiSegment[] {
  const segments: AnsiSegment[] = [];
  const state: Omit<AnsiSegment, "content"> = { decorations: [] };
  let cursor = 0;
  const expression = /\x1b\[([\d;]*)m/g;
  for (const match of value.matchAll(expression)) {
    if (match.index > cursor) segments.push({ ...state, decorations: [...state.decorations], content: value.slice(cursor, match.index) });
    applySgr(state, match[1]?.split(";").filter(Boolean).map(Number) ?? [0]);
    cursor = match.index + match[0].length;
  }
  if (cursor < value.length || segments.length === 0) segments.push({ ...state, decorations: [...state.decorations], content: value.slice(cursor) });
  return segments.filter(({ content }) => content.length > 0);
}

function applySgr(state: Omit<AnsiSegment, "content">, codes: number[]): void {
  if (codes.length === 0) codes = [0];
  for (let index = 0; index < codes.length; index++) {
    const code = codes[index] ?? 0;
    if (code === 0) {
      state.foreground = undefined; state.background = undefined; state.decorations = [];
    } else if (code >= 30 && code <= 37) state.foreground = `ansi-${basicColors[code - 30]}`;
    else if (code >= 90 && code <= 97) state.foreground = `ansi-bright-${basicColors[code - 90]}`;
    else if (code >= 40 && code <= 47) state.background = `ansi-${basicColors[code - 40]}`;
    else if (code >= 100 && code <= 107) state.background = `ansi-bright-${basicColors[code - 100]}`;
    else if (code === 39) state.foreground = undefined;
    else if (code === 49) state.background = undefined;
    else if ([1, 2, 3, 4, 8, 9].includes(code)) {
      const decoration = ({ 1: "bold", 2: "dim", 3: "italic", 4: "underline", 8: "hidden", 9: "strikethrough" } as Record<number, string>)[code];
      if (decoration != null && !state.decorations.includes(decoration)) state.decorations.push(decoration);
    } else if (code === 22) state.decorations = state.decorations.filter((item) => item !== "bold" && item !== "dim");
    else if (code >= 23 && code <= 29) {
      const decoration = ({ 23: "italic", 24: "underline", 28: "hidden", 29: "strikethrough" } as Record<number, string>)[code];
      if (decoration != null) state.decorations = state.decorations.filter((item) => item !== decoration);
    } else if ((code === 38 || code === 48) && codes[index + 1] === 5) {
      const paletteIndex = codes[index + 2];
      if (paletteIndex != null) {
        const color = paletteIndex < 8 ? `ansi-${basicColors[paletteIndex]}`
          : paletteIndex < 16 ? `ansi-bright-${basicColors[paletteIndex - 8]}` : `ansi-palette-${paletteIndex}`;
        if (code === 38) state.foreground = color; else state.background = color;
      }
      index += 2;
    }
  }
}

function segmentStyle(segment: AnsiSegment): Record<string, string> | undefined {
  const style: Record<string, string> = {};
  if (segment.decorations.includes("bold")) style.fontWeight = "bold";
  if (segment.decorations.includes("dim")) style.opacity = "0.5";
  if (segment.decorations.includes("italic")) style.fontStyle = "italic";
  if (segment.decorations.includes("hidden")) style.visibility = "hidden";
  const lines = [
    segment.decorations.includes("underline") ? "underline" : null,
    segment.decorations.includes("strikethrough") ? "line-through" : null,
  ].filter((item): item is string => item != null);
  if (lines.length > 0) style.textDecorationLine = lines.join(" ");
  return Object.keys(style).length === 0 ? undefined : style;
}

function AnsiBlock({ children, className }: AnsiBlockProps): unknown {
  const normalized = eraseCarriageReturnUpdates(children ?? "");
  const segments = parseAnsi(normalized);
  return jsx.jsx("code", {
    className,
    children: segments.map((segment, index) => jsx.jsx("span", {
      className: classNames(
        segment.foreground != null && `${segment.foreground}-fg`,
        segment.background != null && `${segment.background}-bg`,
      ),
      style: segmentStyle(segment),
      children: stripAnsi(segment.content),
    }, index)),
  });
}

function initializeAnsiBlock(): void {
  initializeCompilerRuntime();
  initializeClassNames();
}

export { initializeAnsiBlock as n, AnsiBlock as t };
