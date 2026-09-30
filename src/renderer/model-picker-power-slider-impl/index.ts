// Model-picker power slider implementation. Release chunk: impl-70e51521c772.js.
import "@rchunk/rolldown-runtime";
import * as appSharedChunk from "@rchunk/app-shared";

interface SliderOption {
  id: string;
  label: string;
  icon?: unknown;
  isLocked?: boolean;
  isMax?: boolean;
  requiresExplicitSelection?: boolean;
}
interface Props {
  active: boolean;
  disabled?: boolean;
  fastModeEnabled: boolean;
  keyboardControlFocused?: boolean;
  onCommitOption?: (option: SliderOption, previous: SliderOption) => void;
  onCancelOption?: () => void;
  onDragToMax: () => void;
  onPreviewOption?: (option: SliderOption | null) => void;
  onSelectOption: (option: SliderOption) => void;
  options: SliderOption[];
  selectedOptionId: string;
  shouldReduceMotion?: boolean;
  transitionsReady?: boolean;
}
interface PointerEventLike {
  clientX: number;
  currentTarget: {
    getBoundingClientRect(): { left: number; width: number };
    setPointerCapture?(pointerId: number): void;
  };
  pointerId: number;
  preventDefault(): void;
  stopPropagation(): void;
}
interface KeyboardEventLike {
  key: string;
  preventDefault(): void;
  stopPropagation(): void;
}
interface JsxRuntime {
  jsx(type: unknown, props: Record<string, unknown>, key?: unknown): unknown;
  jsxs(type: unknown, props: Record<string, unknown>, key?: unknown): unknown;
}
interface ReactRuntime {
  useRef<T>(initial: T): { current: T };
  useState<T>(initial: T): [T, (value: T | ((previous: T) => T)) => void];
}
interface SharedRuntime {
  I3(): JsxRuntime;
  e6(): ReactRuntime;
  m4(...values: Array<string | false | null | undefined>): string;
  [key: string]: unknown;
}

const shared = appSharedChunk as unknown as SharedRuntime;
const React = shared.e6();
const jsxRuntime = shared.I3();

function firstExplicitIndex(options: SliderOption[]): number {
  const index = options.findIndex(
    (option) => option.requiresExplicitSelection === true,
  );
  return index === -1 ? options.length : index;
}

function validateOptionOrder(options: SliderOption[]): void {
  const boundary = firstExplicitIndex(options);
  if (
    boundary === 0 ||
    options.slice(boundary).some((option) => !option.requiresExplicitSelection)
  ) {
    throw new Error(
      "Explicit-selection options must follow all ordinary slider options.",
    );
  }
}

function percentage(index: number, maximumIndex: number): number {
  return maximumIndex <= 0
    ? 0
    : (Math.max(0, Math.min(index, maximumIndex)) / maximumIndex) * 100;
}

function indexFromPointer(
  event: PointerEventLike,
  maximumIndex: number,
  ordinaryOptionCount: number,
): number {
  if (maximumIndex <= 0) return 0;
  const bounds = event.currentTarget.getBoundingClientRect();
  const ratio =
    bounds.width <= 0 ? 0 : (event.clientX - bounds.left) / bounds.width;
  return Math.max(
    0,
    Math.min(ordinaryOptionCount - 1, Math.round(ratio * maximumIndex)),
  );
}

function nextUnlockedIndex(
  options: SliderOption[],
  start: number,
  direction: -1 | 1,
  ordinaryOptionCount: number,
): number {
  let index = start + direction;
  while (index >= 0 && index < ordinaryOptionCount) {
    if (!options[index]?.isLocked) return index;
    index += direction;
  }
  return start;
}

function ModelPickerPowerSliderImpl({
  active,
  disabled = false,
  fastModeEnabled,
  keyboardControlFocused,
  onCommitOption,
  onCancelOption,
  onDragToMax,
  onPreviewOption,
  onSelectOption,
  options,
  selectedOptionId,
  shouldReduceMotion,
  transitionsReady = true,
}: Props): unknown {
  validateOptionOrder(options);
  const explicitIndex = firstExplicitIndex(options);
  const ordinaryOptionCount = explicitIndex;
  const maximumIndex = options.length - 1;
  const selectedIndex = Math.max(
    0,
    options.findIndex((option) => option.id === selectedOptionId),
  );
  const [previewIndex, setPreviewIndex] = React.useState<number | null>(null);
  const [pointerDown, setPointerDown] = React.useState(false);
  const [dragging, setDragging] = React.useState(false);
  const previewBase = React.useRef<SliderOption | null>(null);
  const dragReachedMax = React.useRef(false);
  const displayIndex = previewIndex ?? selectedIndex;
  const displayedOption = options[displayIndex] ?? options[0];
  const unavailable = disabled || options.length <= 1;

  const preview = (index: number): SliderOption | undefined => {
    if (unavailable || index === displayIndex) return;
    const option = options[index];
    if (!option || option.isLocked) return;
    if (!previewBase.current)
      previewBase.current = options[selectedIndex] ?? null;
    setPreviewIndex(index);
    onPreviewOption?.(option);
    onSelectOption(option);
    if (option.isMax && !dragReachedMax.current) {
      dragReachedMax.current = true;
      onDragToMax();
    } else if (!option.isMax) dragReachedMax.current = false;
    return option;
  };

  const cancelPreview = () => {
    setPointerDown(false);
    setDragging(false);
    setPreviewIndex(null);
    previewBase.current = null;
    dragReachedMax.current = false;
    onPreviewOption?.(null);
    onCancelOption?.();
  };

  const commitPreview = () => {
    const option = previewIndex == null ? undefined : options[previewIndex];
    const base = previewBase.current;
    setPointerDown(false);
    setDragging(false);
    setPreviewIndex(null);
    previewBase.current = null;
    onPreviewOption?.(null);
    if (option && base) onCommitOption?.(option, base);
  };

  const onPointerDown = (event: PointerEventLike) => {
    if (unavailable) return;
    event.preventDefault();
    event.stopPropagation();
    event.currentTarget.setPointerCapture?.(event.pointerId);
    setPointerDown(true);
    const index = indexFromPointer(event, maximumIndex, ordinaryOptionCount);
    preview(index);
  };
  const onPointerMove = (event: PointerEventLike) => {
    if (!pointerDown || unavailable) return;
    setDragging(true);
    preview(indexFromPointer(event, maximumIndex, ordinaryOptionCount));
  };
  const onKeyDown = (event: KeyboardEventLike) => {
    if (unavailable) return;
    let next = displayIndex;
    if (event.key === "ArrowLeft" || event.key === "ArrowDown") {
      next = nextUnlockedIndex(options, displayIndex, -1, ordinaryOptionCount);
    } else if (event.key === "ArrowRight" || event.key === "ArrowUp") {
      next = nextUnlockedIndex(options, displayIndex, 1, ordinaryOptionCount);
    } else if (event.key === "Home") next = 0;
    else if (event.key === "End") next = Math.max(0, ordinaryOptionCount - 1);
    else if (event.key === "Escape") {
      event.preventDefault();
      cancelPreview();
      return;
    } else if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      commitPreview();
      return;
    } else return;
    event.preventDefault();
    event.stopPropagation();
    const option = preview(next);
    if (option) {
      const base = options[selectedIndex];
      if (base) onCommitOption?.(option, base);
      setPreviewIndex(null);
      previewBase.current = null;
      onPreviewOption?.(null);
    }
  };

  const trackPercent = percentage(displayIndex, maximumIndex);
  const ordinaryOptions = options.slice(0, ordinaryOptionCount);
  const explicitOptions = options.slice(ordinaryOptionCount);
  return jsxRuntime.jsxs("div", {
    className: "model-picker-power-slider",
    "data-keyboard-focused": keyboardControlFocused,
    "data-model-picker-power-slider": "",
    children: [
      jsxRuntime.jsxs("div", {
        role: "slider",
        tabIndex: unavailable ? -1 : 0,
        "aria-disabled": unavailable,
        "aria-label": displayedOption?.label,
        "aria-valuemin": 0,
        "aria-valuemax": Math.max(ordinaryOptionCount - 1, 0),
        "aria-valuenow": Math.min(
          displayIndex,
          Math.max(ordinaryOptionCount - 1, 0),
        ),
        className: shared.m4(
          "relative h-7 w-full select-none",
          active && "is-active",
          dragging && "is-dragging",
        ),
        "data-fast-mode": fastModeEnabled,
        "data-pointer-down": pointerDown,
        "data-reduced-motion": shouldReduceMotion ?? false,
        "data-transitions-ready": transitionsReady,
        onKeyDown,
        onLostPointerCapture: cancelPreview,
        onPointerCancel: cancelPreview,
        onPointerDown,
        onPointerMove,
        onPointerUp: commitPreview,
        children: [
          jsxRuntime.jsx("span", {
            className: "absolute inset-y-0 left-0 rounded-full",
            style: { width: trackPercent + "%" },
          }),
          ordinaryOptions.map((option, index) =>
            jsxRuntime.jsx(
              "span",
              {
                className: "absolute top-1/2 -translate-y-1/2",
                "data-locked": option.isLocked,
                "data-selected": index <= displayIndex,
                style: { left: percentage(index, maximumIndex) + "%" },
                children: option.isLocked ? "locked" : null,
              },
              option.id,
            ),
          ),
          jsxRuntime.jsx("span", {
            className: "absolute top-1/2 -translate-x-1/2 -translate-y-1/2",
            style: { left: trackPercent + "%" },
            children: displayedOption?.icon ?? null,
          }),
        ],
      }),
      ...explicitOptions.map((option, index) =>
        jsxRuntime.jsx(
          "button",
          {
            type: "button",
            tabIndex: -1,
            disabled: !active || unavailable || option.isLocked,
            "aria-label": option.label,
            "aria-pressed": displayedOption?.id === option.id,
            onPointerDown: (event: {
              preventDefault(): void;
              stopPropagation(): void;
            }) => {
              event.preventDefault();
              event.stopPropagation();
            },
            onClick: (event: { stopPropagation(): void }) => {
              event.stopPropagation();
              const chosen = preview(ordinaryOptionCount + index);
              if (chosen && displayedOption)
                onCommitOption?.(chosen, displayedOption);
            },
            children: option.icon ?? option.label,
          },
          option.id,
        ),
      ),
    ],
  });
}

for (const name of [
  "$3",
  "N2",
  "h4",
  "f$",
  "JQ",
  "a$",
  "t$",
  "YQ",
  "$Q",
  "lw",
] as const) {
  const initializer = shared[name];
  if (typeof initializer === "function") (initializer as () => void)();
}

export { ModelPickerPowerSliderImpl };
