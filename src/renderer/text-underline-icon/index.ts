// Popcorn editor toolbar primitives and shape/icon catalog.

import "@rchunk/rolldown-runtime";
import "@rchunk/artifact-source-bootstrap";
import "@rchunk/popcorn-icons";
import { I3 as getJsxRuntime } from "@rchunk/app-shared";

interface JsxRuntime {
  Fragment: unknown;
  jsx(type: unknown, props: Record<string, unknown>, key?: string): unknown;
  jsxs(type: unknown, props: Record<string, unknown>, key?: string): unknown;
}
interface Rect {
  height: number;
  width: number;
  x?: number;
  y?: number;
}
interface ToolbarConfig {
  insert: string[];
  header: string[];
  inspector: string[];
  floating: string[];
}
interface ShapePreset {
  category: string;
  geometry: string;
  id: string;
  label: string;
}

const PRESENTATION_TOOLBAR: ToolbarConfig = {
  insert: ["text", "image", "chart", "table", "rect", "slide"],
  header: ["insert", "format", "annotation"],
  inspector: ["text", "appearance"],
  floating: ["bold", "text-color", "text-size", "format"],
};
const DOCUMENT_TOOLBAR: ToolbarConfig = {
  insert: ["text", "image", "chart", "table", "rect"],
  header: ["insert", "format"],
  inspector: ["text", "appearance"],
  floating: [],
};
const SHAPE_PRESETS: ShapePreset[] = [
  { category: "basic", geometry: "rectangle", id: "rect", label: "Rectangle" },
  { category: "basic", geometry: "ellipse", id: "ellipse", label: "Ellipse" },
  {
    category: "basic",
    geometry: "triangle",
    id: "triangle",
    label: "Triangle",
  },
  { category: "basic", geometry: "diamond", id: "diamond", label: "Diamond" },
  {
    category: "arrows",
    geometry: "arrow-right",
    id: "arrow-right",
    label: "Right arrow",
  },
  {
    category: "arrows",
    geometry: "arrow-left",
    id: "arrow-left",
    label: "Left arrow",
  },
  {
    category: "flowchart",
    geometry: "process",
    id: "process",
    label: "Process",
  },
  {
    category: "flowchart",
    geometry: "decision",
    id: "decision",
    label: "Decision",
  },
  {
    category: "callouts",
    geometry: "speech",
    id: "speech",
    label: "Speech bubble",
  },
  { category: "symbols", geometry: "star", id: "star", label: "Star" },
];
const FONT_SIZES = [
  8, 9, 10, 11, 12, 14, 16, 18, 20, 24, 28, 32, 36, 48, 64, 72, 96,
];
const COLORS = [
  "#000000",
  "#ffffff",
  "#ef4444",
  "#f59e0b",
  "#22c55e",
  "#3b82f6",
  "#8b5cf6",
  "#ec4899",
];

let jsx: JsxRuntime;
let initialized = false;
function initializePopcornToolbar(): void {
  if (initialized) return;
  jsx = getJsxRuntime();
  initialized = true;
}

function cx(...values: Array<string | false | null | undefined>): string {
  return values.filter(Boolean).join(" ");
}
function mergeToolbarConfig(
  base: ToolbarConfig,
  override?: Partial<ToolbarConfig>,
): ToolbarConfig {
  return {
    insert: override?.insert ?? base.insert,
    header: override?.header ?? base.header,
    inspector: override?.inspector ?? base.inspector,
    floating: override?.floating ?? base.floating,
  };
}
function clamp(value: number, minimum: number, maximum: number): number {
  return Math.min(maximum, Math.max(minimum, value));
}
function normalizeFontSize(value: number): number {
  return clamp(Math.round(value), 1, 400);
}
function nextFontSize(value: number, direction: -1 | 1): number {
  const sorted = FONT_SIZES;
  return direction > 0
    ? (sorted.find((size) => size > value) ?? normalizeFontSize(value + 1))
    : ([...sorted].reverse().find((size) => size < value) ??
        normalizeFontSize(value - 1));
}
function shapeById(id: string): ShapePreset | null {
  return SHAPE_PRESETS.find((shape) => shape.id === id) ?? null;
}
function shapesByCategory(category: string): ShapePreset[] {
  return SHAPE_PRESETS.filter((shape) => shape.category === category);
}
function toolbarItems(config: ToolbarConfig): string[] {
  return [
    ...new Set([
      ...config.header,
      ...config.insert,
      ...config.inspector,
      ...config.floating,
    ]),
  ];
}
function normalizedColor(value: string | null | undefined): string | null {
  if (value == null || value === "none" || value === "transparent") return null;
  if (/^#[0-9a-f]{3,8}$/i.test(value)) return value.toLowerCase();
  return value;
}
function chartThumbnailData(
  values: number[],
): Array<{ x: number; y: number; height: number }> {
  const maximum = Math.max(1, ...values.map((value) => Math.max(0, value)));
  return values.map((value, index) => ({
    x: 12 + index * 14,
    y: 72 - (Math.max(0, value) / maximum) * 56,
    height: (Math.max(0, value) / maximum) * 56,
  }));
}

function Icon({
  children,
  className,
  label,
  viewBox = "0 0 16 16",
  ...props
}: Record<string, unknown> & {
  children?: unknown;
  className?: string;
  label?: string;
  viewBox?: string;
}): unknown {
  initializePopcornToolbar();
  return jsx.jsx("svg", {
    viewBox,
    fill: "none",
    xmlns: "http://www.w3.org/2000/svg",
    className: cx("size-4", className),
    role: label == null ? undefined : "img",
    "aria-label": label,
    "aria-hidden": label == null ? true : undefined,
    ...props,
    children,
  });
}
function TextUnderlineIcon(props: Record<string, unknown> = {}): unknown {
  return Icon({
    ...props,
    children: [
      jsx.jsx("path", {
        d: "M4.5 2.5v5a3.5 3.5 0 0 0 7 0v-5",
        stroke: "currentColor",
        strokeWidth: 1.3,
        strokeLinecap: "round",
      }),
      jsx.jsx("path", {
        d: "M3 14.5h10",
        stroke: "currentColor",
        strokeWidth: 1.3,
        strokeLinecap: "round",
      }),
    ],
  });
}
function GenericShapeIcon({
  geometry = "rectangle",
  ...props
}: Record<string, unknown> & { geometry?: string }): unknown {
  const element = geometry.includes("ellipse")
    ? jsx.jsx("ellipse", {
        cx: 8,
        cy: 8,
        rx: 5.5,
        ry: 4.5,
        stroke: "currentColor",
      })
    : geometry.includes("triangle")
      ? jsx.jsx("path", {
          d: "M8 2.5 14 13H2Z",
          stroke: "currentColor",
          strokeLinejoin: "round",
        })
      : geometry.includes("diamond")
        ? jsx.jsx("path", {
            d: "m8 2 6 6-6 6-6-6Z",
            stroke: "currentColor",
            strokeLinejoin: "round",
          })
        : geometry.includes("star")
          ? jsx.jsx("path", {
              d: "m8 1.8 1.8 3.7 4.1.6-3 2.9.7 4.1L8 11.2l-3.6 1.9.7-4.1-3-2.9 4.1-.6Z",
              stroke: "currentColor",
              strokeLinejoin: "round",
            })
          : jsx.jsx("rect", {
              x: 2.5,
              y: 3.5,
              width: 11,
              height: 9,
              rx: 1,
              stroke: "currentColor",
            });
  return Icon({ ...props, children: element });
}
function ChartThumbnail({
  values = [4, 7, 3, 9, 6],
  ...props
}: { values?: number[] } & Record<string, unknown>): unknown {
  initializePopcornToolbar();
  const bars = chartThumbnailData(values);
  return jsx.jsxs("svg", {
    viewBox: "0 0 120 80",
    width: 120,
    height: 80,
    ...props,
    children: [
      jsx.jsx("path", { d: "M10 8v64h100", fill: "none", stroke: "#D4D4D4" }),
      ...bars.map((bar, index) =>
        jsx.jsx(
          "rect",
          {
            x: bar.x,
            y: bar.y,
            width: 8,
            height: bar.height,
            rx: 1,
            fill: index % 2 ? "#AEC2A7" : "#7D9BC4",
          },
          index,
        ),
      ),
    ],
  });
}

function PageNumberNavigation({
  currentIndex,
  totalCount,
  itemLabel,
  onChangeIndex,
  disabled = false,
  testId = "popcorn-page-number-navigation",
}: {
  currentIndex: number;
  totalCount: number;
  itemLabel: string;
  onChangeIndex(index: number): void;
  disabled?: boolean;
  testId?: string;
}): unknown {
  initializePopcornToolbar();
  if (totalCount <= 1) return null;
  const previous = !disabled && currentIndex > 0;
  const next = !disabled && currentIndex < totalCount - 1;
  return jsx.jsxs("div", {
    className: "flex items-center gap-0.5 text-base leading-5 tabular-nums",
    "data-testid": testId,
    children: [
      jsx.jsx("button", {
        type: "button",
        "aria-label": `Go to previous ${itemLabel}`,
        "data-testid": `${testId}-previous`,
        disabled: !previous,
        onClick: () => onChangeIndex(currentIndex - 1),
        children: "‹",
      }),
      jsx.jsxs("span", {
        "data-testid": `${testId}-indicator`,
        children: [
          totalCount > 0 ? currentIndex + 1 : 0,
          "/",
          Math.max(0, totalCount),
        ],
      }),
      jsx.jsx("button", {
        type: "button",
        "aria-label": `Go to next ${itemLabel}`,
        "data-testid": `${testId}-next`,
        disabled: !next,
        onClick: () => onChangeIndex(currentIndex + 1),
        children: "›",
      }),
    ],
  });
}
function ToolbarButton({
  children,
  disabled = false,
  label,
  pressed = false,
  onClick,
}: {
  children?: unknown;
  disabled?: boolean;
  label: string;
  pressed?: boolean;
  onClick?(): void;
}): unknown {
  initializePopcornToolbar();
  return jsx.jsx("button", {
    type: "button",
    "aria-label": label,
    "aria-pressed": pressed,
    disabled,
    className: cx(
      "inline-flex size-8 items-center justify-center rounded-md",
      pressed && "bg-primary-ghost-active",
    ),
    onClick,
    children,
  });
}
function ColorPicker({
  color,
  onChange,
  allowNone = false,
  label = "Color",
}: {
  color?: string | null;
  onChange(value: string | null): void;
  allowNone?: boolean;
  label?: string;
}): unknown {
  initializePopcornToolbar();
  const options: Array<string | null> = allowNone ? [null, ...COLORS] : COLORS;
  return jsx.jsx("div", {
    role: "group",
    "aria-label": label,
    className: "grid grid-cols-5 gap-1",
    children: options.map((value) =>
      jsx.jsx(
        "button",
        {
          type: "button",
          "aria-label": value ?? "No color",
          "aria-pressed": normalizedColor(color) === value,
          style: { backgroundColor: value ?? "transparent" },
          onClick: () => onChange(value),
        },
        value ?? "none",
      ),
    ),
  });
}
function FontSizeField({
  fontSize,
  onChange,
}: {
  fontSize: number;
  onChange(value: number): void;
}): unknown {
  initializePopcornToolbar();
  return jsx.jsxs("div", {
    role: "group",
    "aria-label": "Font size",
    children: [
      jsx.jsx("button", {
        type: "button",
        onClick: () => onChange(nextFontSize(fontSize, -1)),
        children: "−",
      }),
      jsx.jsx("input", {
        type: "number",
        min: 1,
        max: 400,
        value: fontSize,
        onChange: (event: { currentTarget: { valueAsNumber: number } }) =>
          onChange(normalizeFontSize(event.currentTarget.valueAsNumber)),
      }),
      jsx.jsx("button", {
        type: "button",
        onClick: () => onChange(nextFontSize(fontSize, 1)),
        children: "+",
      }),
    ],
  });
}
function SegmentedControl({
  value,
  options,
  onChange,
  ariaLabel,
}: {
  value: string;
  options: Array<{ label: string; value: string }>;
  onChange(value: string): void;
  ariaLabel: string;
}): unknown {
  initializePopcornToolbar();
  return jsx.jsx("div", {
    role: "radiogroup",
    "aria-label": ariaLabel,
    children: options.map((option) =>
      jsx.jsx(
        "button",
        {
          type: "button",
          role: "radio",
          "aria-checked": value === option.value,
          onClick: () => onChange(option.value),
          children: option.label,
        },
        option.value,
      ),
    ),
  });
}
function InspectorPanel({
  title,
  subtitle,
  onClose,
  widthPx = 240,
  children,
  className,
  embedded = false,
}: {
  title: string;
  subtitle?: string;
  onClose?(): void;
  widthPx?: number;
  children?: unknown;
  className?: string;
  embedded?: boolean;
}): unknown {
  initializePopcornToolbar();
  return jsx.jsxs("section", {
    "aria-label": title,
    className: cx(
      "flex min-h-0 max-h-full flex-col gap-4 overflow-hidden",
      !embedded && "rounded-xl bg-surface-elevated-secondary shadow-lg",
      className,
    ),
    style: embedded ? undefined : { width: widthPx },
    children: [
      jsx.jsxs("header", {
        children: [
          jsx.jsxs("div", {
            children: [
              jsx.jsx("h2", { children: title }),
              subtitle == null ? null : jsx.jsx("p", { children: subtitle }),
            ],
          }),
          onClose == null
            ? null
            : jsx.jsx("button", {
                type: "button",
                "aria-label": `Close ${title}`,
                onClick: onClose,
                children: "×",
              }),
        ],
      }),
      jsx.jsx("div", {
        className: "min-h-0 overflow-y-auto px-4 pb-4",
        children,
      }),
    ],
  });
}
function Section({
  title,
  children,
  defaultOpen = true,
}: {
  title: string;
  children?: unknown;
  defaultOpen?: boolean;
}): unknown {
  initializePopcornToolbar();
  return jsx.jsxs("details", {
    open: defaultOpen,
    children: [jsx.jsx("summary", { children: title }), children],
  });
}
function LabeledField({
  label,
  children,
}: {
  label: string;
  children?: unknown;
}): unknown {
  initializePopcornToolbar();
  return jsx.jsxs("label", {
    children: [jsx.jsx("span", { children: label }), children],
  });
}
function NumberField({
  label,
  value,
  min,
  max,
  step = 1,
  unit,
  onChange,
}: {
  label: string;
  value: number;
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
  onChange(value: number): void;
}): unknown {
  initializePopcornToolbar();
  return jsx.jsxs("label", {
    children: [
      label,
      jsx.jsx("input", {
        type: "number",
        value,
        min,
        max,
        step,
        onChange: (event: { currentTarget: { valueAsNumber: number } }) =>
          onChange(event.currentTarget.valueAsNumber),
      }),
      unit,
    ],
  });
}
function ShapePicker({
  category,
  onSelect,
}: {
  category: string;
  onSelect(shape: ShapePreset): void;
}): unknown {
  initializePopcornToolbar();
  return jsx.jsx("div", {
    role: "list",
    children: shapesByCategory(category).map((shape) =>
      jsx.jsx(
        "button",
        {
          type: "button",
          onClick: () => onSelect(shape),
          children: jsx.jsxs(jsx.Fragment, {
            children: [
              jsx.jsx(GenericShapeIcon, { geometry: shape.geometry }),
              shape.label,
            ],
          }),
        },
        shape.id,
      ),
    ),
  });
}
function Toolbar({
  items,
  onAction,
}: {
  items: string[];
  onAction(item: string): void;
}): unknown {
  initializePopcornToolbar();
  return jsx.jsx("div", {
    role: "toolbar",
    children: items.map((item) =>
      jsx.jsx(
        ToolbarButton,
        { label: item, onClick: () => onAction(item), children: item },
        item,
      ),
    ),
  });
}

function initializeShapes(): void {
  initializePopcornToolbar();
}
function initializeFields(): void {
  initializePopcornToolbar();
}
function initializeInspector(): void {
  initializePopcornToolbar();
}
function initializeIcons(): void {
  initializePopcornToolbar();
}

export {
  Toolbar as A,
  ColorPicker as C,
  shapeById as D,
  shapesByCategory as E,
  mergeToolbarConfig as F,
  PageNumberNavigation as I,
  initializePopcornToolbar as L,
  DOCUMENT_TOOLBAR as M,
  PRESENTATION_TOOLBAR as N,
  ToolbarButton as O,
  initializeShapes as P,
  ShapePicker as S,
  InspectorPanel as T,
  SHAPE_PRESETS as _,
  SegmentedControl as a,
  normalizedColor as b,
  chartThumbnailData as c,
  GenericShapeIcon as d,
  nextFontSize as f,
  FONT_SIZES as g,
  COLORS as h,
  initializeInspector as i,
  clamp as j,
  normalizeFontSize as k,
  NumberField as l,
  Section as m,
  initializeIcons as n,
  LabeledField as o,
  initializeFields as p,
  InspectorPanel as r,
  Toolbar as s,
  TextUnderlineIcon as t,
  ToolbarButton as u,
  FontSizeField as v,
  ShapePicker as w,
  Toolbar as x,
  ChartThumbnail as y,
};

initializePopcornToolbar();
