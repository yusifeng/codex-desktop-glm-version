import "@rchunk/rolldown-runtime";
import { I3 as getJsxRuntime, type JsxRuntime } from "@rchunk/app-shared";
let runtime: JsxRuntime | undefined;
function jsx(): JsxRuntime { runtime ??= getJsxRuntime(); return runtime; }
function GoogleLogo(props: Record<string, unknown> = {}): unknown { return jsx().jsxs("svg", { width: 24, height: 24, viewBox: "0 0 24 24", role: "img", "aria-label": "Google", ...props, children: [jsx().jsx("path", { fill: "#4285F4", d: "M21.35 12.23c0-.71-.06-1.23-.2-1.77H12v3.31h5.37a4.6 4.6 0 0 1-1.99 3.02l2.8 2.17c1.64-1.51 3.17-3.74 3.17-6.73Z" }), jsx().jsx("path", { fill: "#34A853", d: "M12 21.72c2.63 0 4.84-.87 6.45-2.36l-2.8-2.17c-.78.52-1.78.88-3.65.88-2.53 0-4.68-1.71-5.45-4.01l-2.89 2.23A9.73 9.73 0 0 0 12 21.72Z" }), jsx().jsx("path", { fill: "#FBBC05", d: "M6.55 14.06A5.85 5.85 0 0 1 6.24 12c0-.72.12-1.41.31-2.06L3.66 7.71A9.72 9.72 0 0 0 2.62 12c0 1.56.37 3.04 1.04 4.29l2.89-2.23Z" }), jsx().jsx("path", { fill: "#EA4335", d: "M12 5.93c1.43 0 2.72.49 3.73 1.46l2.78-2.72A9.35 9.35 0 0 0 12 2.28a9.73 9.73 0 0 0-8.34 5.43l2.89 2.23C7.32 7.64 9.47 5.93 12 5.93Z" })] }); }
function initializeGoogleLogo(): void { void jsx(); }
export { initializeGoogleLogo as n, GoogleLogo as t };
