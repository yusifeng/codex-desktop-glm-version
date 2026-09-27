import "@rchunk/rolldown-runtime";
import { I3 as getJsxRuntime, e6 as getReactRuntime } from "@rchunk/app-shared";
import "@rchunk/app-initial";

interface ToolActivityDisclosureProps { children?: unknown; defaultExpanded?: boolean; icon?: unknown; indentContent?: boolean; onExpand?(): void; status?: "complete" | "error" | "running"; summary: unknown }
const jsx = getJsxRuntime();
const React = getReactRuntime();

function useMeasuredElement(): { elementHeightPx: number; elementRef(element: { scrollHeight?: number } | null): void } {
  const [height, setHeight] = React.useState(0);
  return { elementHeightPx: height, elementRef: element => setHeight(element?.scrollHeight ?? 0) };
}
function initializeMeasurement(): void {}
function ToolActivityDisclosure({ children, defaultExpanded = false, icon, indentContent = true, onExpand, status, summary }: ToolActivityDisclosureProps): unknown {
  const [expanded, setExpanded] = React.useState(defaultExpanded);
  const active = status === "running";
  const open = children != null && (active || expanded);
  return jsx.jsxs("section", { "data-status": status, children: [jsx.jsx("button", { type: "button", disabled: children == null, "aria-expanded": open, onClick: () => { if (!open) onExpand?.(); setExpanded(!expanded); }, children: jsx.jsxs("span", { children: [icon, summary] }) }), children == null ? null : jsx.jsx("div", { hidden: !open, "data-indent": indentContent, children })] });
}
function initializeToolActivityDisclosure(): void {}
export { useMeasuredElement as i, initializeToolActivityDisclosure as n, initializeMeasurement as r, ToolActivityDisclosure as t };
