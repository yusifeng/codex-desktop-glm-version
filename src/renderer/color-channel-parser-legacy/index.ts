// Lazy legacy color-channel parser bridge. Release chunk: channel-b05b0fc90e5c.js.
import "@rchunk/rolldown-runtime";
import * as colorRuntimeChunk from "@rchunk/color-channel-runtime-legacy";

interface ParsedColor { [channel: string]: number | undefined }
interface ColorRuntime { ft: { parse(value: string): ParsedColor }; ht(): void; mt: { lang: { round(value: number | undefined): number } }; pt(): void }
const colorRuntime = colorRuntimeChunk as unknown as ColorRuntime;
let initialized = false;
let parseRoundedColorChannel: (value: string, channel: string) => number;
function initialize(): void {
  if (initialized) return;
  initialized = true;
  colorRuntime.ht();
  colorRuntime.pt();
  parseRoundedColorChannel = (value, channel) => colorRuntime.mt.lang.round(colorRuntime.ft.parse(value)[channel]);
}
export { initialize as n, parseRoundedColorChannel as t };
