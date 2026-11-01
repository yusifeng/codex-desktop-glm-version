import * as appInitialChunk from "@rchunk/app-initial";
import * as appSharedChunk from "@rchunk/app-shared";
import "@rchunk/rolldown-runtime";
import type { JsxRuntime, ReactRuntime } from "@rchunk/app-shared";

type Destination = "bottom" | "left" | "right";
type Direction = "ltr" | "rtl";

interface TabIdentity {
  dndId: string;
  tabId: string;
  [key: string]: unknown;
}
interface TabController {
  tabById$: unknown;
  tabIds$: unknown;
}
interface ContentDragState {
  draggedTab: TabIdentity;
  sourceController: TabController;
}
interface ChatTabDragState {
  canDrop(destination: Destination): boolean;
  dropDestinations?: Destination[];
}
interface WorkspaceDragContext {
  chatTabDragState?: ChatTabDragState | null;
  dragState?: ContentDragState | null;
  registerSelectionCapture?(capture: () => () => void): () => void;
}
interface DroppableResult {
  isOver: boolean;
  setNodeRef(node: unknown): void;
}
interface FloatingResult {
  floatingStyles: Record<string, unknown>;
  refs: { setFloating(node: unknown): void; setReference(node: unknown): void };
}
interface ReactDomRuntime {
  createPortal(node: unknown, container: unknown): unknown;
}
interface ScopeApi {
  get<T>(signal: unknown): T;
  set<T>(signal: unknown, value: T): void;
}

interface SharedDependencies {
  BX<Parameter, Value>(family: unknown, parameter: Parameter): Value;
  HX<Value>(signal: unknown): Value;
  I3(): JsxRuntime;
  LX(scope: unknown): ScopeApi;
  P3(): ReactDomRuntime;
  __<Callback extends (...arguments_: never[]) => unknown>(
    callback: Callback,
  ): Callback;
  e6(): ReactRuntime;
  e$<Input, Output>(input: Input, project: (input: Input) => Output): Output;
  f1(options: Record<string, unknown>): unknown;
  m1: unknown;
  m4(...values: unknown[]): string;
  o$: { div: unknown };
  p1(options: Record<string, unknown>): FloatingResult;
  u1(value: unknown): unknown;
  x_(): number;
  [key: string]: unknown;
}
interface InitialDependencies {
  $en: unknown;
  Bct(
    input: { kind: "content"; tab: TabIdentity },
    destination: Destination,
  ): boolean;
  Cet: unknown;
  Hct(
    scope: ScopeApi,
    input: { kind: "content"; tab: TabIdentity },
    destination: Destination,
    sourceController: TabController,
  ): void;
  NDt(tab: TabIdentity): Destination[];
  T7: unknown;
  V7: unknown;
  Vvt: TabController;
  cvt: unknown;
  fbt: unknown;
  mbt: unknown;
  mxt(
    contentPaneWidthRatio: number,
    mainContentWidth: number,
    mode: "unified",
  ): number;
  pxt(): {
    bottomPanelTargetHeight: number;
    contentPaneWidthRatio: number;
    mainContentWidth: number;
  };
  rCn(options: { data: Record<string, unknown>; id: string }): DroppableResult;
  sxt(locale: string): Direction;
  [key: string]: unknown;
}

const shared = appSharedChunk as unknown as SharedDependencies;
const initial = appInitialChunk as unknown as InitialDependencies;
let jsx: JsxRuntime;
let react: ReactRuntime;
let reactDom: ReactDomRuntime;

function QuickChatDropZones(): unknown {
  initializeQuickChatDropZones();
  const scope = shared.LX(initial.$en);
  const portalContainer = react.useContext<HTMLElement | null>(initial.T7);
  const dragContext = react.useContext<WorkspaceDragContext | null>(
    initial.Cet,
  );
  const contentDrag = dragContext?.dragState ?? null;
  const chatDrag = dragContext?.chatTabDragState ?? null;
  const liveTab = shared.BX<string | null, TabIdentity | null>(
    contentDrag?.sourceController.tabById$ ?? null,
    contentDrag?.draggedTab.tabId ?? null,
  );
  const draggedTab =
    liveTab?.dndId === contentDrag?.draggedTab.dndId ? liveTab : null;
  const supportsBottomDestination = shared.HX<boolean>(initial.fbt);
  const intl = (appSharedChunk as unknown as { n4(): { locale: string } }).n4();
  const direction = initial.sxt(intl.locale);
  const captureSelection = react.useCallback(() => {
    const selection = scope.get<unknown>(initial.cvt);
    return () => scope.set(initial.cvt, selection);
  }, [scope]);
  const stableCapture = shared.__(
    captureSelection as (...arguments_: never[]) => unknown,
  );
  react.useLayoutEffect(
    () =>
      dragContext?.registerSelectionCapture?.(
        stableCapture as () => () => void,
      ),
    [stableCapture, dragContext?.registerSelectionCapture],
  );

  const destinations =
    chatDrag?.dropDestinations ??
    (draggedTab == null ? undefined : initial.NDt(draggedTab));
  if (
    portalContainer == null ||
    (contentDrag == null && chatDrag == null) ||
    destinations == null
  )
    return null;
  const availableDestinations = destinations.filter(
    (destination) =>
      (destination !== "bottom" || supportsBottomDestination) &&
      (chatDrag == null
        ? draggedTab != null &&
          initial.Bct({ kind: "content", tab: draggedTab }, destination)
        : chatDrag.canDrop(destination)),
  );
  if (availableDestinations.length === 0) return null;

  return reactDom.createPortal(
    jsx.jsx("div", {
      "aria-hidden": true,
      className: "pointer-events-none absolute inset-0 z-50",
      dir: direction,
      children: availableDestinations.map((destination) =>
        jsx.jsx(
          DropTarget,
          {
            destination,
            direction,
            hasBottomDestination: availableDestinations.includes("bottom"),
          },
          destination,
        ),
      ),
    }),
    portalContainer,
  );
}

function DropTarget({
  destination,
  direction,
  hasBottomDestination,
}: {
  destination: Destination;
  direction: Direction;
  hasBottomDestination: boolean;
}): unknown {
  const scope = shared.LX(initial.$en);
  const bottomPanelOffset = react.useContext<number | null>(initial.V7);
  const canOffsetForBottomPanel = shared.HX<boolean>(initial.mbt);
  const effectiveBottomOffset = canOffsetForBottomPanel
    ? (bottomPanelOffset ?? undefined)
    : undefined;
  const onDrop = react.useCallback(
    ({ draggedTab, sourceController }: ContentDragState) =>
      initial.Hct(
        scope,
        { kind: "content", tab: draggedTab },
        destination,
        sourceController,
      ),
    [destination, scope],
  );
  const dropTarget = react.useMemo(
    () => ({ destination, kind: "app-shell-tab-drop-target", onDrop }),
    [destination, onDrop],
  );
  const { isOver, setNodeRef } = initial.rCn({
    id: `unified-workspace-${destination}`,
    data: dropTarget,
  });
  const className = shared.m4(
    "pointer-events-none absolute z-50",
    destination === "bottom"
      ? "inset-x-0 bottom-0 h-1/4"
      : shared.m4(
          "top-0 w-1/4",
          destination === "left" ? "left-0" : "right-0",
          hasBottomDestination ? "bottom-1/4" : "bottom-0",
        ),
  );
  const style = {
    bottom:
      destination !== "bottom" && hasBottomDestination
        ? effectiveBottomOffset
        : undefined,
    height: destination === "bottom" ? effectiveBottomOffset : undefined,
  };
  return jsx.jsxs(jsx.Fragment, {
    children: [
      jsx.jsx(shared.o$.div, {
        ref: setNodeRef,
        "aria-hidden": true,
        className,
        "data-unified-workspace-drop-target": destination,
        dir: "ltr",
        style,
      }),
      isOver ? jsx.jsx(DropIndicator, { destination, direction }) : null,
    ],
  });
}

function DropIndicator({
  destination,
  direction,
  surface,
}: {
  destination: Destination;
  direction: Direction;
  surface?: "chat" | "content";
}): unknown {
  initializeQuickChatDropZones();
  const { bottomPanelTargetHeight, contentPaneWidthRatio, mainContentWidth } =
    initial.pxt();
  const dragContext = react.useContext<WorkspaceDragContext | null>(
    initial.Cet,
  );
  const bottomPanelOffset = react.useContext<number | null>(initial.V7);
  const canOffsetForBottomPanel = shared.HX<boolean>(initial.mbt);
  const tabIds = shared.HX<string[]>(initial.Vvt.tabIds$);
  const movingLastContentTab =
    dragContext?.dragState?.sourceController === initial.Vvt &&
    tabIds.length === 1;
  const effectiveBottomOffset =
    canOffsetForBottomPanel && !movingLastContentTab
      ? (bottomPanelOffset ?? undefined)
      : undefined;
  const splitWidth = shared.e$<[number, number], number>(
    [mainContentWidth, contentPaneWidthRatio],
    ([width, ratio]) => {
      const contentWidth = Math.min(
        width,
        initial.mxt(ratio, width, "unified"),
      );
      const targetSurface =
        surface ?? (dragContext?.chatTabDragState == null ? "content" : "chat");
      return targetSurface === "chat" ? width - contentWidth : contentWidth;
    },
  );
  const floating = shared.p1({
    placement: "bottom-start",
    strategy: "fixed",
    middleware: [
      shared.u1(
        ({ rects }: { rects: { reference: { height: number } } }) =>
          -rects.reference.height,
      ),
      shared.f1({
        apply({
          elements,
          rects,
        }: {
          elements: { floating: HTMLElement };
          rects: { reference: { height: number; width: number } };
        }) {
          Object.assign(elements.floating.style, {
            height: `${rects.reference.height}px`,
            width: `${rects.reference.width}px`,
          });
        },
      }),
    ],
    whileElementsMounted: shared.m1,
  });
  const referenceRef = shared.__(
    floating.refs.setReference as (...arguments_: never[]) => unknown,
  );
  const floatingRef = shared.__(
    floating.refs.setFloating as (...arguments_: never[]) => unknown,
  );
  const referenceClassName = shared.m4(
    "pointer-events-none absolute",
    destination === "bottom" && "inset-x-0 bottom-0",
    destination === "left" && "inset-y-0 left-0",
    destination === "right" && "inset-y-0 right-0",
  );
  const referenceStyle = {
    bottom: destination === "bottom" ? undefined : effectiveBottomOffset,
    height: destination === "bottom" ? bottomPanelTargetHeight : undefined,
    width: destination === "bottom" ? undefined : splitWidth,
  };
  return jsx.jsxs(jsx.Fragment, {
    children: [
      jsx.jsx(shared.o$.div, {
        ref: referenceRef,
        "aria-hidden": true,
        className: referenceClassName,
        dir: "ltr",
        style: referenceStyle,
      }),
      reactDom.createPortal(
        jsx.jsx("div", {
          ref: floatingRef,
          "aria-hidden": true,
          className: "pointer-events-none z-50",
          "data-unified-workspace-drop-indicator": destination,
          dir: direction,
          style: floating.floatingStyles,
          children: jsx.jsx(DropOverlay, { destination }),
        }),
        document.body,
      ),
    ],
  });
}

function DropOverlay({ destination }: { destination: Destination }): unknown {
  const iconScale = shared.x_();
  const className = shared.m4(
    "absolute top-0 left-0 border-default bg-codex-drop-overlay/60 select-none",
    destination === "bottom" && "border-t",
    destination === "left" && "border-r",
    destination === "right" && "border-l",
  );
  return jsx.jsx("div", {
    className,
    style: {
      height: `calc(100% / ${iconScale})`,
      transform: `scale(${iconScale})`,
      transformOrigin: "top left",
      width: `calc(100% / ${iconScale})`,
    },
  });
}

let initialized = false;
function initializeQuickChatDropZones(): void {
  if (initialized) return;
  initialized = true;
  const call = (name: string) => {
    const candidate = (
      name in shared ? shared[name] : initial[name]
    ) as unknown;
    if (typeof candidate === "function") (candidate as () => unknown)();
  };
  for (const name of [
    "$Sn",
    "l1",
    "h4",
    "a$",
    "$Q",
    "FX",
    "K2",
    "U7",
    "fxt",
    "E7",
    "Wvt",
    "wet",
    "FDt",
    "hxt",
    "Ebt",
    "y_",
    "itn",
    "g_",
    "Vct",
    "rvt",
  ])
    call(name);
  react = shared.e6();
  reactDom = shared.P3();
  jsx = shared.I3();
}

initializeQuickChatDropZones();
export {
  QuickChatDropZones as n,
  initializeQuickChatDropZones as r,
  DropIndicator as t,
};
