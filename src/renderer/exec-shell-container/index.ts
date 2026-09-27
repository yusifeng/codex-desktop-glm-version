import "@rchunk/rolldown-runtime";
import { I3 as getJsxRuntime, e6 as getReactRuntime } from "@rchunk/app-shared";
import "@rchunk/app-initial";
import "@rchunk/ansi-block";
import "@rchunk/shell-label";

interface ShellContainerProps { command: string; cwd?: string; footer?: unknown; isInProgress?: boolean; output: string; surface?: "default" | "plain" }
interface ShellFooterProps { exitCode?: number; isInProgress?: boolean; isSuccess?: boolean; wasInterrupted?: boolean }
const jsx = getJsxRuntime();
function ExpandIcon(props: Record<string, unknown> = {}): unknown { return jsx.jsx("svg", { width: 20, height: 20, ...props, children: jsx.jsx("path", { d: "M12 3v5h5M8 17v-5H3", stroke: "currentColor" }) }); }
function ShellFooter({ exitCode, isInProgress = false, isSuccess = false, wasInterrupted = false }: ShellFooterProps): unknown { if (isInProgress) return jsx.jsx("div", { "aria-label": "Command running" }); return jsx.jsx("div", { children: wasInterrupted ? "Stopped" : isSuccess ? "Success" : `Exit code ${exitCode ?? "unknown"}` }); }
function ShellContainer({ command, cwd, footer, isInProgress = false, output, surface = "default" }: ShellContainerProps): unknown { return jsx.jsxs("section", { "data-surface": surface, children: [jsx.jsxs("header", { children: [jsx.jsx("code", { children: command }), cwd ? jsx.jsx("span", { children: cwd }) : null] }), jsx.jsx("pre", { "aria-busy": isInProgress, children: output.trim() === "" && !isInProgress ? "No output" : output }), footer] }); }
const ExecShellContainer = Object.assign(ShellContainer, { Footer: ShellFooter });
function initializeExecShellContainer(): void { getReactRuntime(); }
export { initializeExecShellContainer as n, ExpandIcon as r, ExecShellContainer as t };
