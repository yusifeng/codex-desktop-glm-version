import "@rchunk/rolldown-runtime";
import { I3 as getJsxRuntime, m4 as joinClasses, type JsxRuntime } from "@rchunk/app-shared";

interface SegmentOption { ariaLabel?: string; id: string; label: unknown }
interface AnimatedSegmentedToggleProps {
  animateSelection?: boolean;
  ariaLabel: string;
  className?: string;
  onSelect(id: string): void;
  options: SegmentOption[];
  selectedId: string;
  size?: "compact" | "default";
}
let runtime: JsxRuntime | undefined;
function jsx(): JsxRuntime { runtime ??= getJsxRuntime(); return runtime; }

function t({ animateSelection = true, ariaLabel, className, onSelect, options, selectedId, size = "default" }: AnimatedSegmentedToggleProps): unknown {
  const compact = size === "compact";
  return jsx().jsx("div", {
    "aria-label": ariaLabel,
    className: joinClasses(compact ? "inline-grid gap-0.5 rounded-[10px] bg-surface-secondary/92 p-0.5" : "bg-text/10 inline-grid gap-1 rounded-2xl p-1", className),
    role: "group",
    style: { gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` },
    children: options.map((option) => {
      const selected = option.id === selectedId;
      return jsx().jsxs("button", {
        "aria-label": option.ariaLabel,
        "aria-pressed": selected,
        className: joinClasses("relative isolate min-w-0", compact ? "h-6 rounded-lg px-2 text-xs" : "rounded-xl px-3 py-1.5 text-sm", selected ? "text-default" : "text-secondary"),
        onClick: () => onSelect(option.id),
        type: "button",
        children: [selected ? jsx().jsx("span", { "data-animate-selection": animateSelection ? "" : undefined, className: "absolute inset-0 -z-10 rounded-lg bg-surface shadow-sm" }) : null, option.label],
      }, option.id);
    }),
  });
}

function n(): void {}
export { n, t };
