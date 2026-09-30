// Parse and round a named color channel. Release chunk: channel-6a55bfb120f8.js.
import * as colorRuntimeChunk from "@rchunk/color-channel-runtime-modern";

interface ParsedColor { [channel: string]: number | undefined }
interface ColorRuntime { at: { parse(value: string): ParsedColor }; ot: { lang: { round(value: number | undefined): number } } }
const colorRuntime = colorRuntimeChunk as unknown as ColorRuntime;
function parseRoundedColorChannel(value: string, channel: string): number {
  return colorRuntime.ot.lang.round(colorRuntime.at.parse(value)[channel]);
}
export { parseRoundedColorChannel as t };
