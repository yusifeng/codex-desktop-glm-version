import "@rchunk/rolldown-runtime";
import { I3 as getJsxRuntime, e6 as getReactRuntime } from "@rchunk/app-shared";
import "@rchunk/diff-preview-content";

interface DiffPreviewTooltipProps { children?: unknown; diff: { metadata?: unknown }; disabled?: boolean; displayPath?: string; linesAdded?: number; linesRemoved?: number; onOpen?(): void }
const jsx = getJsxRuntime();
const React = getReactRuntime();
function DiffPreviewTooltip({ children, diff, disabled = false, displayPath, linesAdded = 0, linesRemoved = 0, onOpen }: DiffPreviewTooltipProps): unknown {
  const [visible, setVisible] = React.useState(false);
  return jsx.jsxs("span", { className: "group/diff-preview", onPointerEnter: () => setVisible(true), children: [jsx.jsx("span", { "aria-disabled": disabled, children }), visible && !disabled ? jsx.jsxs("aside", { role: "tooltip", children: [jsx.jsx("strong", { children: displayPath ?? "Diff preview" }), jsx.jsx("span", { children: `+${linesAdded} −${linesRemoved}` }), jsx.jsx("button", { type: "button", onClick: onOpen, children: "Open diff" }), jsx.jsx("pre", { children: JSON.stringify(diff.metadata ?? {}) })] }) : null] });
}
function initializeDiffPreviewTooltip(): void {}
export { initializeDiffPreviewTooltip as n, DiffPreviewTooltip as t };
