import "@rchunk/rolldown-runtime";
export interface TextLayoutOptions { tabSize?: number; whiteSpace?: "normal" | "pre" | "pre-wrap" }
export interface TextLayout { font: string; options: TextLayoutOptions; text: string }
function visualLineCount(layout: TextLayout, columns: number): number { const width = Math.max(1, Math.floor(columns)); const tabSize = layout.options.tabSize ?? 4; return layout.text.split("\n").reduce((total, line) => { const expanded = line.replace(/\t/g, " ".repeat(tabSize)); if (layout.options.whiteSpace === "pre") return total + 1; return total + Math.max(1, Math.ceil(expanded.length / width)); }, 0); }
function createTextLayout(text: string, font: string, options: TextLayoutOptions = {}): TextLayout { return { font, options, text }; }
function measureTextHeight(layout: TextLayout, maxWidth: number, lineHeight: number): { height: number; lineCount: number } { const lineCount = visualLineCount(layout, maxWidth); return { lineCount, height: lineCount * lineHeight }; }
function initializeTextLayout(): void {}
export { measureTextHeight as n, createTextLayout as r, initializeTextLayout as t };
