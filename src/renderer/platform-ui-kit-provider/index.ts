import "@rchunk/rolldown-runtime";
import "@rchunk/date-picker-runtime";
import { I3 as getJsxRuntime, type JsxRuntime } from "@rchunk/app-shared";
interface Props { children?: unknown; locale?: string; timeZone?: string }
let runtime: JsxRuntime | undefined; function jsx(): JsxRuntime { runtime ??= getJsxRuntime(); return runtime; }
function PlatformUIKitProvider({ children, locale = "en-US", timeZone = "UTC" }: Props): unknown { return jsx().jsx("div", { "data-locale": locale, "data-time-zone": timeZone, children }); }
function initialize(): void {}
export { PlatformUIKitProvider as n, initialize as r, initialize as t };
