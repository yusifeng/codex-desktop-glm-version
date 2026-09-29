import "@rchunk/rolldown-runtime";
import { e6 as getReactRuntime, I3 as getJsxRuntime, n4 as useIntl } from "@rchunk/app-shared";
import "@rchunk/app-initial";
import "@rchunk/app-primary";
import {
  type AnnotationControl,
  type AnnotationControlValue,
  type DesignEditorState,
  c as initializeDesignEditorLayout,
  i as initializeDesignEditorControls,
  n as updateAnnotationControl,
  r as DesignEditorControls,
  t as initializeDesignEditorState,
} from "@rchunk/design-editor-state";
import {
  a as subscribeObstacleStore,
  f as initializeQuickChatPlacement,
  n as getObstacleSnapshot,
  o as ResizeHandles,
  r as initializeQuickChatObstacles,
  t as getObstacleRects,
} from "@rchunk/quick-chat-obstacles";

const React = getReactRuntime();
const jsxRuntime = getJsxRuntime();
const PANEL_MARGIN = 8;
const DEFAULT_SIZE = { height: 480, width: 368 } as const;
const MINIMUM_SIZE = { height: 240, width: 288 } as const;

initializeDesignEditorLayout();
initializeDesignEditorControls();
initializeDesignEditorState();
initializeQuickChatPlacement();
initializeQuickChatObstacles();

interface VisualizationEditorState extends DesignEditorState {
  id: string;
  targetLabel: string;
}

interface VisualizationAnnotationEditorProps {
  body: string;
  hasChanges: boolean;
  isOpen: boolean;
  onBodyChange(value: string): void;
  onChange(id: string, state: DesignEditorState): void;
  onClose(): void;
  onOpen(): void;
  onReset(): void;
  onSelect(id: string): void;
  onSubmit(): void;
  selectedId: string | null;
  states: VisualizationEditorState[];
  submitting?: boolean;
}

interface PanelPosition {
  bottom: number;
  left: number;
}

interface PanelSize {
  height: number;
  width: number;
}

interface DragState {
  pointerId: number;
  rect: DOMRect;
  startX: number;
  startY: number;
}

interface PointerEventLike {
  button: number;
  clientX: number;
  clientY: number;
  currentTarget: {
    hasPointerCapture(pointerId: number): boolean;
    releasePointerCapture(pointerId: number): void;
    setPointerCapture(pointerId: number): void;
  };
  isPrimary: boolean;
  pointerId: number;
  preventDefault(): void;
  target: unknown;
}

interface ChangeEventLike {
  currentTarget: { value: string };
}

interface KeyboardEventLike {
  currentTarget: { form?: { requestSubmit(): void } | null };
  key: string;
  nativeEvent: { isComposing?: boolean };
  preventDefault(): void;
}

interface SubmitEventLike {
  preventDefault(): void;
}

function getViewportSnapshot(): string {
  return typeof window === "undefined" ? "1024:768" : `${window.innerWidth}:${window.innerHeight}`;
}

function subscribeViewport(listener: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  window.addEventListener("resize", listener);
  return () => window.removeEventListener("resize", listener);
}

function parseViewport(snapshot: string): { height: number; width: number } {
  const [width = 1024, height = 768] = snapshot.split(":").map(Number);
  return { height, width };
}

function defaultControlValue(control: AnnotationControl): AnnotationControlValue {
  if (control.defaultValue != null) return control.defaultValue;
  if (control.currentValue != null) return control.currentValue;
  if (control.type === "toggle") return false;
  if (control.type === "color") return "#ffffff";
  if (control.type === "select") return control.options[0]?.value ?? "";
  return control.min;
}

function hasControlChanges(state: VisualizationEditorState): boolean {
  return state.annotationControls.controls.some((control) => {
    const change = state.annotationControlChanges?.find((item) => item.callback === control.callback);
    return change != null && change.value !== (change.previousValue ?? defaultControlValue(control));
  });
}

function rectanglesOverlap(first: DOMRect, second: DOMRect): boolean {
  return first.left < second.right
    && first.right > second.left
    && first.top < second.bottom
    && first.bottom > second.top;
}

function clampPosition(
  position: PanelPosition,
  size: PanelSize,
  viewport: { height: number; width: number },
): PanelPosition {
  return {
    left: Math.max(PANEL_MARGIN, Math.min(position.left, viewport.width - size.width - PANEL_MARGIN)),
    bottom: Math.max(size.height + PANEL_MARGIN, Math.min(position.bottom, viewport.height - PANEL_MARGIN)),
  };
}

function positionRect(position: PanelPosition, size: PanelSize): DOMRect {
  return new DOMRect(position.left, position.bottom - size.height, size.width, size.height);
}

function chooseInitialPosition(
  size: PanelSize,
  viewport: { height: number; width: number },
  obstacles: DOMRect[],
): PanelPosition {
  const candidates: PanelPosition[] = [
    { left: viewport.width - size.width - PANEL_MARGIN, bottom: viewport.height - PANEL_MARGIN },
    { left: viewport.width - size.width - PANEL_MARGIN, bottom: size.height + PANEL_MARGIN },
    { left: PANEL_MARGIN, bottom: size.height + PANEL_MARGIN },
    { left: (viewport.width - size.width) / 2, bottom: size.height + PANEL_MARGIN },
    { left: PANEL_MARGIN, bottom: viewport.height - PANEL_MARGIN },
    { left: (viewport.width - size.width) / 2, bottom: viewport.height - PANEL_MARGIN },
  ];
  return candidates
    .map((candidate) => clampPosition(candidate, size, viewport))
    .find((candidate) => obstacles.every((obstacle) => !rectanglesOverlap(positionRect(candidate, size), obstacle)))
    ?? clampPosition(candidates[0], size, viewport);
}

function isButtonTarget(target: unknown): boolean {
  return typeof Element !== "undefined" && target instanceof Element && target.closest("button") != null;
}

function VisualizationControlSection({
  disabled,
  onChange,
  onSelect,
  selected,
  state,
}: {
  disabled: boolean;
  onChange(id: string, state: DesignEditorState): void;
  onSelect(id: string): void;
  selected: boolean;
  state: VisualizationEditorState;
}): unknown {
  const sectionRef = React.useRef<HTMLElement | null>(null);
  React.useEffect(() => {
    const section = sectionRef.current;
    const container = section?.parentElement;
    if (!selected || section == null || container == null) return;
    container.scrollTop = Math.min(
      section.offsetTop,
      Math.max(container.scrollTop, section.offsetTop + section.offsetHeight - container.clientHeight),
    );
  }, [selected]);

  const select = () => onSelect(state.id);
  const changeValue = (callback: string, value: AnnotationControlValue) => {
    onChange(state.id, updateAnnotationControl(state, callback, value));
  };
  const resetValue = (callback: string) => {
    onChange(state.id, updateAnnotationControl(state, callback));
  };

  return jsxRuntime.jsxs("section", {
    ref: sectionRef,
    "aria-label": state.targetLabel,
    "data-selected": selected ? "true" : "false",
    onFocusCapture: select,
    onPointerDownCapture: select,
    children: [
      jsxRuntime.jsx("h3", {
        className: "min-w-0 truncate bg-text/5 px-4 py-2 text-base font-medium text-default select-none",
        children: state.targetLabel,
      }),
      jsxRuntime.jsx(DesignEditorControls, {
        editorState: state,
        isEditable: !disabled,
        onReset: resetValue,
        onValueChange: changeValue,
      }),
    ],
  });
}

function VisualizationAnnotationEditor(props: VisualizationAnnotationEditorProps): unknown {
  const {
    body,
    hasChanges,
    isOpen,
    onBodyChange,
    onChange,
    onClose,
    onOpen,
    onReset,
    onSelect,
    onSubmit,
    selectedId,
    states,
    submitting = false,
  } = props;
  const intl = useIntl();
  const panelId = React.useId();
  const panelRef = React.useRef<HTMLElement | null>(null);
  const dragRef = React.useRef<DragState | null>(null);
  const [position, setPosition] = React.useState<PanelPosition | null>(null);
  const [size, setSize] = React.useState<PanelSize>({ ...DEFAULT_SIZE });
  const viewport = parseViewport(React.useSyncExternalStore(subscribeViewport, getViewportSnapshot, getViewportSnapshot));
  React.useSyncExternalStore(subscribeObstacleStore, getObstacleSnapshot, getObstacleSnapshot);
  const obstacles = getObstacleRects();
  const canSubmit = !submitting && (hasChanges || body.trim().length > 0);
  const canReset = !submitting && states.some(hasControlChanges);

  React.useEffect(() => {
    if (!isOpen) {
      setPosition(null);
      return;
    }
    setPosition((current) => current == null
      ? chooseInitialPosition(size, viewport, obstacles)
      : clampPosition(current, size, viewport));
  }, [isOpen, size.height, size.width, viewport.height, viewport.width, getObstacleSnapshot()]);

  if (states.length === 0) return null;

  const openLabel = intl.formatMessage({
    id: "visualization.annotationControls.open",
    defaultMessage: "Adjust visualization",
  });
  const closeLabel = intl.formatMessage({
    id: "visualization.annotationControls.close",
    defaultMessage: "Close design controls",
  });
  const resetLabel = intl.formatMessage({
    id: "visualization.annotationControls.resetAll",
    defaultMessage: "Reset all",
  });
  const submitLabel = intl.formatMessage({
    id: "visualization.annotationControls.sendChanges",
    defaultMessage: "Send changes",
  });
  const noteLabel = intl.formatMessage({
    id: "visualization.annotationControls.note",
    defaultMessage: "Describe changes",
  });
  const notePlaceholder = intl.formatMessage({
    id: "visualization.annotationControls.notePlaceholder",
    defaultMessage: "Describe these changes…",
  });
  const titleLabel = intl.formatMessage({
    id: "visualization.annotationControls.title",
    defaultMessage: "Design controls",
  });
  const resizeHeightLabel = intl.formatMessage({
    id: "visualization.annotationControls.resizeHeight",
    defaultMessage: "Resize design controls height",
  });
  const resizeWidthLabel = intl.formatMessage({
    id: "visualization.annotationControls.resizeWidth",
    defaultMessage: "Resize design controls width",
  });

  const onPanelSubmit = (event: SubmitEventLike) => {
    event.preventDefault();
    if (canSubmit) onSubmit();
  };
  const onNoteKeyDown = (event: KeyboardEventLike) => {
    if (event.key !== "Enter" || event.nativeEvent.isComposing) return;
    event.preventDefault();
    event.currentTarget.form?.requestSubmit();
  };
  const finishDragging = (event: PointerEventLike) => {
    if (dragRef.current?.pointerId !== event.pointerId) return;
    dragRef.current = null;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  };
  const startDragging = (event: PointerEventLike) => {
    const panel = panelRef.current;
    if (!event.isPrimary || event.button !== 0 || panel == null || isButtonTarget(event.target)) return;
    event.preventDefault();
    dragRef.current = {
      pointerId: event.pointerId,
      rect: panel.getBoundingClientRect(),
      startX: event.clientX,
      startY: event.clientY,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
  };
  const movePanel = (event: PointerEventLike) => {
    const drag = dragRef.current;
    if (drag == null || drag.pointerId !== event.pointerId) return;
    event.preventDefault();
    const next = {
      left: drag.rect.left + event.clientX - drag.startX,
      bottom: drag.rect.bottom + event.clientY - drag.startY,
    };
    setPosition(clampPosition(next, size, viewport));
  };
  const resizePanel = (_edge: unknown, nextSize: unknown) => {
    if (typeof nextSize !== "object" || nextSize == null) return;
    const candidate = nextSize as { height?: unknown; width?: unknown };
    if (typeof candidate.height !== "number" || typeof candidate.width !== "number") return;
    setSize({
      height: Math.max(MINIMUM_SIZE.height, Math.min(candidate.height, viewport.height - PANEL_MARGIN * 2)),
      width: Math.max(MINIMUM_SIZE.width, Math.min(candidate.width, viewport.width - PANEL_MARGIN * 2)),
    });
  };

  const trigger = jsxRuntime.jsx("button", {
    type: "button",
    "aria-label": openLabel,
    className: "pointer-events-auto",
    onClick: onOpen,
    children: "⚙",
  });
  const panel = !isOpen ? null : jsxRuntime.jsxs("div", {
    ref: panelRef,
    role: "dialog",
    "aria-labelledby": panelId,
    className: "pointer-events-auto fixed z-50 flex flex-col overflow-hidden rounded-xl bg-surface text-default shadow-xl",
    style: {
      bottom: position == null ? PANEL_MARGIN : viewport.height - position.bottom,
      height: Math.min(size.height, viewport.height - PANEL_MARGIN * 2),
      left: position?.left ?? Math.max(PANEL_MARGIN, viewport.width - size.width - PANEL_MARGIN),
      maxHeight: viewport.height - PANEL_MARGIN * 2,
      maxWidth: viewport.width - PANEL_MARGIN * 2,
      width: Math.min(size.width, viewport.width - PANEL_MARGIN * 2),
    },
    children: [
      jsxRuntime.jsx(ResizeHandles, {
        currentSize: size,
        defaultSize: DEFAULT_SIZE,
        maximumSize: { height: viewport.height, width: viewport.width },
        minimumSize: MINIMUM_SIZE,
        heightLabel: resizeHeightLabel,
        widthLabel: resizeWidthLabel,
        onResize: resizePanel,
      }),
      jsxRuntime.jsxs("div", {
        className: "flex h-toolbar shrink-0 cursor-grab touch-none items-center px-3 select-none active:cursor-grabbing",
        onLostPointerCapture: finishDragging,
        onPointerCancel: finishDragging,
        onPointerDown: startDragging,
        onPointerMove: movePanel,
        onPointerUp: finishDragging,
        children: [
          jsxRuntime.jsx("h2", { id: panelId, className: "min-w-0 flex-1 truncate px-2 text-base text-tertiary", children: titleLabel }),
          jsxRuntime.jsx("button", { type: "button", "aria-label": resetLabel, disabled: !canReset, onClick: onReset, children: "↺" }),
          jsxRuntime.jsx("button", { type: "button", "aria-label": closeLabel, onClick: onClose, children: "×" }),
        ],
      }),
      jsxRuntime.jsxs("form", {
        className: "flex min-h-0 flex-1 flex-col",
        onSubmit: onPanelSubmit,
        children: [
          jsxRuntime.jsx("div", {
            className: "relative min-h-0 flex-1 overflow-y-auto overscroll-contain",
            children: states.map((state) => jsxRuntime.jsx(VisualizationControlSection, {
              disabled: submitting,
              onChange,
              onSelect,
              selected: state.id === selectedId,
              state,
            }, state.id)),
          }),
          jsxRuntime.jsxs("div", {
            className: "flex shrink-0 items-center gap-2 p-3",
            children: [
              jsxRuntime.jsx("textarea", {
                "aria-label": noteLabel,
                disabled: submitting,
                placeholder: notePlaceholder,
                rows: 1,
                value: body,
                onChange: (event: ChangeEventLike) => onBodyChange(event.currentTarget.value),
                onKeyDown: onNoteKeyDown,
              }),
              jsxRuntime.jsx("button", {
                type: "submit",
                "aria-label": submitLabel,
                "aria-busy": submitting,
                disabled: !canSubmit,
                children: submitting ? "…" : "↑",
              }),
            ],
          }),
        ],
      }),
    ],
  });

  return jsxRuntime.jsxs("div", {
    className: "pointer-events-none absolute inset-x-2 bottom-2 flex justify-end",
    "data-testid": "visualization-annotation-ui",
    children: [trigger, panel],
  });
}

export { VisualizationAnnotationEditor };
