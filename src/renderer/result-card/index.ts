import "@rchunk/rolldown-runtime";
import { I3 as getJsxRuntime } from "@rchunk/app-shared";
import "@rchunk/app-initial";
import "@rchunk/result-values";

interface ResultDetails { branch?: string; networkDomains?: string[]; networkEnabled?: boolean; repository?: string; setupScript?: string; startSkill?: string; worktree?: string; [key: string]: unknown }
interface ResultCardProps { details: ResultDetails; notice?: unknown; onOpenRepository?(): void; title?: string }
const jsx = getJsxRuntime();
function Detail({ label, value, onOpen }: { label: string; value: unknown; onOpen?(): void }): unknown { return value == null ? null : jsx.jsxs("div", { children: [jsx.jsx("dt", { children: label }), jsx.jsxs("dd", { children: [String(value), onOpen ? jsx.jsx("button", { type: "button", onClick: onOpen, children: "Open" }) : null] })] }); }
function ResultCard({ details, notice, onOpenRepository, title = "Environment setup" }: ResultCardProps): unknown {
  return jsx.jsxs("article", { children: [jsx.jsx("h3", { children: title }), jsx.jsxs("dl", { children: [jsx.jsx(Detail, { label: "Repository", value: details.repository, onOpen: onOpenRepository }), jsx.jsx(Detail, { label: "Branch", value: details.branch }), jsx.jsx(Detail, { label: "Worktree", value: details.worktree }), jsx.jsx(Detail, { label: "Network", value: details.networkDomains?.join(", ") ?? (details.networkEnabled ? "Enabled" : "Disabled") })] }), jsx.jsx("footer", { children: notice ?? "Prototype draft — execution and validation are not connected yet" })] });
}
function ResultCardForCurrentThread(props: ResultCardProps): unknown { return jsx.jsx(ResultCard, props); }
function initializeResultCard(): void {}
export { ResultCard as n, initializeResultCard as r, ResultCardForCurrentThread as t };
