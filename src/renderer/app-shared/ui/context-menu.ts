import { Menu, type MenuEvent } from "./menu";

export type ContextMenuItemType =
  "item" | "checkbox" | "radio" | "label" | "separator";

export interface ContextMenuMessage {
  id: string;
  defaultMessage?: string;
}

export interface ContextMenuItem {
  id: string;
  type?: ContextMenuItemType;
  message?: ContextMenuMessage;
  messageValues?: Record<string, unknown>;
  tooltipMessage?: ContextMenuMessage;
  tooltipMessageValues?: Record<string, unknown>;
  checked?: boolean;
  closeOnSelect?: boolean;
  icon?: unknown;
  accelerator?: string;
  enabled?: boolean;
  href?: string;
  onClick?: (event: ContextMenuEvent) => void;
  onSelect?: () => void;
  selectAfterClose?: boolean;
  tone?: "default" | "danger";
  submenu?: ContextMenuItem[];
}

export interface PreparedContextMenuItem extends ContextMenuItem {
  nativeLabel: string;
  nativeTooltip?: string;
  submenu?: PreparedContextMenuItem[];
}

export interface NativeContextMenuItem {
  id: string;
  type?: "separator" | "radio";
  checked?: boolean;
  label: string;
  icon?: string;
  accelerator?: string;
  enabled: boolean;
  toolTip?: string;
  submenu?: NativeContextMenuItem[];
}

export interface ContextMenuEvent {
  altKey?: boolean;
  ctrlKey?: boolean;
  defaultPrevented?: boolean;
  key?: string;
  metaKey?: boolean;
  shiftKey?: boolean;
  target?: unknown;
  currentTarget?: {
    dispatchEvent?(event: unknown): void;
    getBoundingClientRect?(): { left: number; bottom: number };
  };
  preventDefault(): void;
  stopPropagation(): void;
}

export interface ContextMenuCloseEvent {
  defaultPrevented: boolean;
  preventDefault(): void;
}

export interface ContextMenuProps extends Record<string, unknown> {
  items?: ContextMenuItem[];
  getItems?: () => ContextMenuItem[] | Promise<ContextMenuItem[]>;
  children: ContextMenuElement;
  trigger?: "click" | "contextmenu";
  disableNative?: boolean;
  align?: "start" | "center" | "end";
  contentWidth?: "menu" | "trigger" | number | string;
  onOpenChange?: (open: boolean) => void;
  open?: boolean;
  onCloseAutoFocus?: (event: ContextMenuCloseEvent) => void;
  renderItem?: (item: PreparedContextMenuItem) => unknown;
  shortcuts?: Record<string, string>;
  awaitBeforeOpen?: boolean;
  onBeforeOpen?: () => void | Promise<void>;
}

export interface ContextMenuElement {
  type: unknown;
  props: Record<string, unknown>;
}

interface JsxRuntimeLike {
  Fragment: unknown;
  jsx(type: unknown, props: Record<string, unknown>, key?: unknown): unknown;
  jsxs(type: unknown, props: Record<string, unknown>, key?: unknown): unknown;
}

interface ReactLike {
  cloneElement(
    element: ContextMenuElement,
    props: Record<string, unknown>,
  ): ContextMenuElement;
  useEffect(
    effect: () => void | (() => void),
    dependencies: readonly unknown[],
  ): void;
  useRef<T>(value: T): { current: T };
  useState<T>(value: T): [T, (value: T) => void];
}

interface ElectronContextMenuBridge {
  showContextMenu?(
    items: NativeContextMenuItem[],
  ): Promise<{ id?: string } | undefined>;
}

interface ContextMenuWindow {
  electronBridge?: ElectronContextMenuBridge;
  addEventListener?(
    type: string,
    listener: () => void,
    options?: unknown,
  ): void;
}

function runtimeOf(): JsxRuntimeLike {
  return (
    (globalThis as { __RENDERER_JSX_RUNTIME__?: JsxRuntimeLike })
      .__RENDERER_JSX_RUNTIME__ ??
    (require("react/jsx-runtime") as JsxRuntimeLike)
  );
}

function reactOf(): ReactLike {
  return (
    (globalThis as { __RENDERER_REACT__?: ReactLike }).__RENDERER_REACT__ ??
    (require("react") as ReactLike)
  );
}

function windowOf(): ContextMenuWindow | undefined {
  return (globalThis as { window?: ContextMenuWindow }).window;
}

function substituteMessageValues(
  message: string,
  values: Record<string, unknown> | undefined,
): string {
  if (values == null) return message;
  return message.replace(/\{([^}]+)\}/g, (match, key: string) =>
    Object.hasOwn(values, key) ? String(values[key]) : match,
  );
}

function formatMessage(
  descriptor: ContextMenuMessage | undefined,
  values: Record<string, unknown> | undefined,
  fallback: string,
): string {
  return substituteMessageValues(
    descriptor?.defaultMessage ?? descriptor?.id ?? fallback,
    values,
  );
}

export function prepareContextMenuItems(
  items: readonly ContextMenuItem[],
): PreparedContextMenuItem[] {
  return items.map((item) => {
    if (item.type === "separator") {
      return { ...item, nativeLabel: "", submenu: undefined };
    }
    return {
      ...item,
      nativeLabel: formatMessage(item.message, item.messageValues, item.id),
      nativeTooltip:
        item.tooltipMessage == null
          ? undefined
          : formatMessage(
              item.tooltipMessage,
              item.tooltipMessageValues,
              item.tooltipMessage.id,
            ),
      submenu:
        item.submenu == null
          ? undefined
          : prepareContextMenuItems(item.submenu),
    };
  });
}

function serializeIcon(icon: unknown): string | undefined {
  if (typeof icon === "string") return icon;
  if (
    typeof icon !== "function" ||
    !("createElement" in icon) ||
    typeof icon.createElement !== "function" ||
    typeof document === "undefined" ||
    typeof XMLSerializer === "undefined"
  ) {
    return undefined;
  }
  return new XMLSerializer().serializeToString(icon.createElement(document));
}

export function toNativeContextMenuItems(
  items: readonly PreparedContextMenuItem[],
): NativeContextMenuItem[] {
  return items.map((item) => ({
    id: item.id,
    type:
      item.type === "separator" || item.type === "radio"
        ? item.type
        : undefined,
    checked: item.type === "radio" ? item.checked === true : undefined,
    label:
      item.type === "separator"
        ? ""
        : item.type !== "radio" && item.checked === true
          ? `✓ ${item.nativeLabel}`
          : item.nativeLabel,
    icon: serializeIcon(item.icon),
    accelerator: item.accelerator,
    enabled: item.type === "label" ? false : (item.enabled ?? true),
    toolTip: item.nativeTooltip,
    submenu:
      item.submenu == null ? undefined : toNativeContextMenuItems(item.submenu),
  }));
}

export function findContextMenuItem(
  items: readonly PreparedContextMenuItem[],
  id: string,
): PreparedContextMenuItem | undefined {
  for (const item of items) {
    if (item.type === "separator" || item.type === "label") continue;
    if (item.id === id) return item;
    if (item.submenu != null) {
      const nested = findContextMenuItem(item.submenu, id);
      if (nested != null) return nested;
    }
  }
  return undefined;
}

export function normalizeAccelerator(
  accelerator: string | undefined,
  isMac = typeof navigator !== "undefined" &&
    /Mac|iPhone|iPad/.test(navigator.platform),
): string | undefined {
  return accelerator
    ?.split("+")
    .map((key) => {
      if (key === "CmdOrCtrl" || key === "CommandOrControl") {
        return isMac ? "Meta" : "Control";
      }
      if (key === "Command" || key === "Cmd") return "Meta";
      if (key === "Ctrl") return "Control";
      if (key === "Option") return "Alt";
      return key;
    })
    .join("+");
}

function createCloseEvent(): ContextMenuCloseEvent {
  let prevented = false;
  return {
    get defaultPrevented() {
      return prevented;
    },
    preventDefault() {
      prevented = true;
    },
  };
}

function renderItemLabel(
  item: PreparedContextMenuItem,
  shortcut: string | undefined,
): unknown {
  return runtimeOf().jsxs("span", {
    className: "flex w-full items-center gap-1.5",
    children: [
      item.icon,
      runtimeOf().jsx("span", {
        className: "min-w-0 flex-1 truncate",
        children: item.nativeLabel,
      }),
      shortcut == null
        ? null
        : runtimeOf().jsx("span", {
            "aria-hidden": true,
            className: "ms-auto shrink-0 text-xs text-codex-description",
            children: shortcut,
          }),
    ],
  });
}

function renderWebItems(
  items: readonly PreparedContextMenuItem[],
  props: Pick<ContextMenuProps, "renderItem" | "shortcuts">,
  deferredSelection: { current: (() => void) | undefined },
): unknown[] {
  return items.map((item) => {
    const custom = props.renderItem?.(item);
    if (custom != null) return custom;
    if (item.type === "separator") {
      return runtimeOf().jsx(Menu.Separator, {}, item.id);
    }
    if (item.type === "label") {
      return runtimeOf().jsx(
        Menu.Title,
        { children: item.nativeLabel },
        item.id,
      );
    }
    const shortcut =
      props.shortcuts != null && Object.hasOwn(props.shortcuts, item.id)
        ? props.shortcuts[item.id]
        : item.accelerator;
    const label = renderItemLabel(item, shortcut);
    const select = (event: MenuEvent) => {
      if (item.enabled === false) {
        event.preventDefault();
        return;
      }
      if (item.selectAfterClose) deferredSelection.current = item.onSelect;
      else item.onSelect?.();
    };
    if (item.submenu != null) {
      return runtimeOf().jsx(
        Menu.FlyoutSubmenuItem,
        {
          children: renderWebItems(item.submenu, props, deferredSelection),
          disabled: item.enabled === false,
          label,
          tooltipText: item.nativeTooltip,
        },
        item.id,
      );
    }
    if (item.type === "checkbox") {
      return runtimeOf().jsx(
        Menu.CheckboxItem,
        {
          checked: item.checked,
          closeOnSelect: item.closeOnSelect,
          disabled: item.enabled === false,
          "aria-keyshortcuts": normalizeAccelerator(item.accelerator),
          onSelect: select,
          children: label,
        },
        item.id,
      );
    }
    return runtimeOf().jsx(
      Menu.Item,
      {
        disabled: item.enabled === false,
        href: item.href,
        role: item.type === "radio" ? "menuitemradio" : "menuitem",
        "aria-checked":
          item.type === "radio" ? item.checked === true : undefined,
        "aria-keyshortcuts":
          shortcut == null ? undefined : normalizeAccelerator(item.accelerator),
        onClick: item.onClick,
        onSelect: item.onClick == null ? select : undefined,
        tone: item.tone,
        tooltipText: item.nativeTooltip,
        children: label,
      },
      item.id,
    );
  });
}

/** 原 `Ift` / 压缩导出 `Df`。 */
export function ContextMenu(props: ContextMenuProps): unknown {
  const react = reactOf();
  const triggerMode = props.trigger ?? "contextmenu";
  const nativeMenu =
    !props.disableNative && windowOf()?.electronBridge?.showContextMenu != null;
  const initialItems = prepareContextMenuItems(props.items ?? []);
  const [preparedItems, setPreparedItems] = react.useState(initialItems);
  const [localOpen, setLocalOpen] = react.useState(false);
  const preparation = react.useRef<AbortController | null>(null);
  const deferredSelection = react.useRef<(() => void) | undefined>(undefined);

  react.useEffect(
    () => () => {
      preparation.current?.abort();
      deferredSelection.current = undefined;
    },
    [],
  );
  react.useEffect(() => {
    if (props.getItems == null) {
      setPreparedItems(prepareContextMenuItems(props.items ?? []));
    }
  }, [props.getItems, props.items]);

  const beginPreparation = () => {
    preparation.current?.abort();
    const controller = new AbortController();
    preparation.current = controller;
    return controller;
  };
  const loadItems = async (
    controller: AbortController,
  ): Promise<PreparedContextMenuItem[]> => {
    const getRawItems = () => props.getItems?.() ?? props.items ?? [];
    if (props.awaitBeforeOpen ?? true) {
      await props.onBeforeOpen?.();
    }
    const raw = await getRawItems();
    if (controller.signal.aborted) return [];
    const prepared = prepareContextMenuItems(raw);
    setPreparedItems(prepared);
    if (!(props.awaitBeforeOpen ?? true)) {
      const beforeOpen = props.onBeforeOpen?.();
      if (beforeOpen != null) {
        void Promise.resolve(beforeOpen).then(async () => {
          const refreshed = await getRawItems();
          if (!controller.signal.aborted) {
            setPreparedItems(prepareContextMenuItems(refreshed));
          }
        });
      }
    }
    return prepared;
  };
  const setOpen = (open: boolean) => {
    setLocalOpen(open);
    props.onOpenChange?.(open);
    if (open) {
      const controller = beginPreparation();
      void loadItems(controller).catch(() => controller.abort());
    } else {
      preparation.current?.abort();
    }
  };
  const closeWebMenu = (event: ContextMenuCloseEvent) => {
    const selection = deferredSelection.current;
    deferredSelection.current = undefined;
    if (selection != null) {
      event.preventDefault();
      selection();
    }
    props.onCloseAutoFocus?.(event);
  };
  const openNativeMenu = async (event: ContextMenuEvent) => {
    if (!nativeMenu) return;
    event.preventDefault();
    const activeElement =
      typeof document === "undefined" ? undefined : document.activeElement;
    const controller = beginPreparation();
    const items = await loadItems(controller);
    if (controller.signal.aborted || items.length === 0) return;
    props.onOpenChange?.(true);
    try {
      const result = await windowOf()?.electronBridge?.showContextMenu?.(
        toNativeContextMenuItems(items),
      );
      if (controller.signal.aborted) return;
      const selected =
        result?.id == null ? undefined : findContextMenuItem(items, result.id);
      props.onOpenChange?.(false);
      const closeEvent = createCloseEvent();
      if (selected?.selectAfterClose) closeEvent.preventDefault();
      props.onCloseAutoFocus?.(closeEvent);
      if (
        !closeEvent.defaultPrevented &&
        activeElement != null &&
        "focus" in activeElement &&
        typeof activeElement.focus === "function"
      ) {
        activeElement.focus();
      }
      if (selected?.enabled !== false) selected?.onSelect?.();
    } finally {
      controller.abort();
    }
  };

  const child = props.children;
  const previousClick = child.props.onClick;
  const previousContextMenu = child.props.onContextMenu;
  const previousKeyDown = child.props.onKeyDown;
  const trigger = react.cloneElement(child, {
    "aria-haspopup":
      triggerMode === "click" ? "menu" : child.props["aria-haspopup"],
    onClick(event: ContextMenuEvent) {
      if (typeof previousClick === "function") previousClick(event);
      if (event.defaultPrevented) return;
      if (nativeMenu && triggerMode === "click") void openNativeMenu(event);
      else if (triggerMode === "click") setOpen(true);
    },
    onContextMenu(event: ContextMenuEvent) {
      if (typeof previousContextMenu === "function") previousContextMenu(event);
      event.stopPropagation();
      if (event.defaultPrevented) return;
      if (nativeMenu && triggerMode === "contextmenu")
        void openNativeMenu(event);
      else if (triggerMode === "contextmenu") setOpen(true);
    },
    onKeyDown(event: ContextMenuEvent) {
      if (typeof previousKeyDown === "function") previousKeyDown(event);
      if (
        event.defaultPrevented ||
        event.target !== event.currentTarget ||
        (event.key !== "ContextMenu" &&
          !(event.key === "F10" && event.shiftKey)) ||
        event.altKey ||
        event.ctrlKey ||
        event.metaKey
      ) {
        return;
      }
      event.preventDefault();
      event.stopPropagation();
      if (nativeMenu) void openNativeMenu(event);
      else setOpen(true);
    },
  });

  if (nativeMenu) return trigger;
  const open = props.open ?? localOpen;
  const visibleItems =
    props.open === true && props.items != null
      ? prepareContextMenuItems(props.items)
      : preparedItems;
  const content = open
    ? runtimeOf().jsx(Menu.Content, {
        align: props.align,
        "data-content-width": props.contentWidth ?? "menu",
        onCloseAutoFocus: closeWebMenu,
        children: renderWebItems(visibleItems, props, deferredSelection),
      })
    : null;
  return runtimeOf().jsxs("div", {
    "data-context-menu": triggerMode,
    "data-state": open ? "open" : "closed",
    children: [trigger, content],
  });
}

/** 原 `Kft` / 压缩导出 `Of`。 */
export function initializeContextMenu(): void {}
