import { Nh } from "./untrusted-input";

interface InputItem { type?: unknown; text?: unknown; imageUrl?: unknown; path?: unknown }
interface NormalizeOptions { input: unknown; commentAttachments?: unknown; shouldStripAdjacentImageDisplayPlaceholders?: boolean; shouldStripImageDisplayPlaceholderLines?: boolean }
export interface NormalizedUserInput { rawText: string; displayRawText: string; imageCount: number; appInput: unknown; appInputPlaceholder: string | null }

function items(input: unknown): InputItem[] {
  if (Array.isArray(input)) return input.filter((item): item is InputItem => typeof item === `object` && item !== null);
  if (typeof input === `object` && input !== null && `items` in input && Array.isArray(input.items)) return input.items as InputItem[];
  return typeof input === `string` ? [{ type: `text`, text: input }] : [];
}
export function ug(options: NormalizeOptions): NormalizedUserInput {
  const source = items(options.input);
  const imageCount = source.filter((item) => item.type === `image` || item.type === `localImage` || item.imageUrl != null).length;
  let rawText = source.filter((item) => item.type === `text` || item.type === `inputText` || typeof item.text === `string`)
    .map((item) => typeof item.text === `string` ? item.text : ``).join(`\n`);
  let appInput: unknown = null; let appInputPlaceholder: string | null = null;
  const appLine = rawText.split(/\r?\n/).find((line) => line.startsWith(Nh));
  if (appLine != null) {
    appInputPlaceholder = appLine;
    try { const parsed = JSON.parse(appLine.slice(Nh.length)) as { input?: unknown }; appInput = parsed.input ?? parsed; } catch { appInput = null; }
    rawText = rawText.split(/\r?\n/).filter((line) => line !== appLine).join(`\n`);
  }
  if (options.shouldStripImageDisplayPlaceholderLines) rawText = rawText.split(/\r?\n/).filter((line) => line.trim() !== `<<ImageDisplayed>>`).join(`\n`);
  if (options.shouldStripAdjacentImageDisplayPlaceholders) rawText = rawText.replace(/(?:^|\n)<<ImageDisplayed>>(?:\n<<ImageDisplayed>>)+/g, `\n<<ImageDisplayed>>`).replace(/^\n/, ``);
  return { rawText, displayRawText: rawText, imageCount, appInput, appInputPlaceholder };
}
export const normalizeUserInput = ug;
