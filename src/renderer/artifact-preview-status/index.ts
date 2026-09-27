import "@rchunk/rolldown-runtime";
import { I3 as getJsxRuntime, type JsxRuntime } from "@rchunk/app-shared";
import "@rchunk/app-initial";
let runtime: JsxRuntime | undefined; function jsx(): JsxRuntime { runtime ??= getJsxRuntime(); return runtime; }
function n(status: string): unknown { return status === "error" ? jsx().jsx("div", { role: "alert", children: "Couldn’t load this preview" }) : null; }
function t(): void {}
export { n, t };
