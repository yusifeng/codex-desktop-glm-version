import * as appInitialChunk from "@rchunk/app-initial";
import * as appSharedChunk from "@rchunk/app-shared";
import * as bookOpenChunk from "@rchunk/book-open";
import * as memoryManagerGateChunk from "@rchunk/memory-manager-gate";
import "@rchunk/rolldown-runtime";
import type { JsxRuntime, ReactRuntime } from "@rchunk/app-shared";

export interface ResolvedApp {
  installUrl?: string | null;
  logoUrl?: string | null;
  logoUrlDark?: string | null;
  name?: string;
  [key: string]: unknown;
}
export interface ToolIconContentProps {
  resolvedApps: readonly ResolvedApp[];
  shouldBlockExternalEgress?: boolean;
  toolIcons?: readonly string[] | null;
}
export interface MemoryWriteItem {
  isUpdating?: boolean;
  writes: readonly string[];
}
export interface MemoryWriteContentProps {
  isParagen?: boolean;
  item: MemoryWriteItem;
}

type Component = (props: Record<string, unknown>) => unknown;
interface MemoryConfiguration {
  m3mEnabled?: boolean;
  m3mOptedOut?: boolean;
}
interface SharedDependencies {
  Cf: Component;
  Gm: Component;
  HX<Value>(signal: unknown): Value;
  I3(): JsxRuntime;
  Iv: Component;
  Qh: Component;
  S_: Component;
  Tf: Component;
  Y2: Component;
  Yh: Component;
  e6(): ReactRuntime;
  my: Component;
  xf: Component;
  [key: string]: unknown;
}
interface InitialDependencies {
  Dlt: Component;
  U6t: unknown;
  ofn(mode: string): boolean;
  yqt: unknown;
  [key: string]: unknown;
}

const shared = appSharedChunk as unknown as SharedDependencies;
const initial = appInitialChunk as unknown as InitialDependencies;
const BookOpenIcon = (bookOpenChunk as unknown as { t: Component }).t;
const memoryManagerMode = (memoryManagerGateChunk as unknown as { t(): string })
  .t;
let jsx: JsxRuntime;
let react: ReactRuntime;
let MemorySummaryDialog: Component;
let SavedMemoriesDialog: Component;

function ToolIconContent({
  resolvedApps,
  shouldBlockExternalEgress,
  toolIcons,
}: ToolIconContentProps): unknown {
  initializeToolIconContent();
  const icons = toolIcons
    ?.flatMap((rawIcon, index) => {
      const icon = rawIcon.trim();
      const key = `${icon}-${String(index)}`;
      const builtIn = renderBuiltInToolIcon(icon, key);
      if (builtIn != null) return [builtIn];
      const appInfo = resolvedApps.find((app) =>
        [app.logoUrl, app.logoUrlDark].some(
          (candidate) =>
            candidate === icon ||
            (icon.startsWith("/") && candidate?.endsWith(icon)),
        ),
      );
      const logoUrl =
        appInfo == null ? resolveRemoteToolIcon(icon, resolvedApps) : null;
      if (appInfo == null && logoUrl == null) return [];
      return [
        jsx.jsx(
          initial.Dlt,
          {
            alt: "",
            appInfo,
            className: "icon-xs shrink-0 object-contain",
            fallback: jsx.jsx(shared.Gm, { "aria-hidden": true }),
            loadRemote: !shouldBlockExternalEgress,
            logoUrl,
          },
          key,
        ),
      ];
    })
    .slice(0, 2);
  if (icons == null || icons.length === 0) return null;
  return jsx.jsx("span", {
    className: "flex shrink-0 items-center -space-x-1",
    children: icons,
  });
}

function renderBuiltInToolIcon(icon: string, key: string): unknown | null {
  const IconAsset = shared.S_;
  const asset = (name: string) => shared[name];
  switch (icon) {
    case "api_tool":
      return jsx.jsx(
        shared.Gm,
        { "aria-hidden": true, className: "icon-xs shrink-0" },
        key,
      );
    case "approved":
      return jsx.jsx(
        IconAsset,
        { className: "shrink-0", asset: asset("fm") },
        key,
      );
    case "book-open":
      return jsx.jsx(
        BookOpenIcon,
        { "aria-hidden": true, className: "icon-xs shrink-0" },
        key,
      );
    case "brush-stroke":
      return jsx.jsx(
        IconAsset,
        { className: "shrink-0", asset: asset("Gl") },
        key,
      );
    case "code":
    case "run-command":
      return jsx.jsx(
        IconAsset,
        { className: "shrink-0", asset: asset("Tw") },
        key,
      );
    case "code-searching":
      return jsx.jsx(
        IconAsset,
        { className: "shrink-0", asset: asset("Bm") },
        key,
      );
    case "denied":
      return jsx.jsx(
        IconAsset,
        { className: "shrink-0", asset: asset("ul") },
        key,
      );
    case "edit-files":
      return jsx.jsx(
        IconAsset,
        { className: "shrink-0", asset: asset("jT") },
        key,
      );
    case "globe":
      return jsx.jsx(
        IconAsset,
        { className: "shrink-0", asset: asset("gE") },
        key,
      );
    case "library":
    case "/images/ecosystem/apps/library/icon.png":
      return jsx.jsx(
        IconAsset,
        { className: "shrink-0", asset: asset("HD") },
        key,
      );
    case "list-files":
      return jsx.jsx(
        IconAsset,
        { className: "shrink-0", asset: asset("wE") },
        key,
      );
    case "stop":
      return jsx.jsx(
        IconAsset,
        { className: "shrink-0", asset: asset("Xa") },
        key,
      );
    case "thoughts":
      return jsx.jsx(
        IconAsset,
        { className: "shrink-0", asset: asset("ID") },
        key,
      );
    default:
      return null;
  }
}

function resolveRemoteToolIcon(
  icon: string,
  apps: readonly ResolvedApp[],
): string | null {
  if (icon.startsWith("/") && !icon.startsWith("//")) {
    const installUrl = apps
      .find((app) => app.installUrl?.trim())
      ?.installUrl?.trim();
    if (installUrl == null) return null;
    try {
      const resolved = new URL(icon, installUrl);
      return resolved.protocol === "http:" || resolved.protocol === "https:"
        ? resolved.toString()
        : null;
    } catch {
      return null;
    }
  }
  return icon.startsWith("data:") ||
    icon.startsWith("https://") ||
    icon.startsWith("connectors://")
    ? icon
    : null;
}

function MemoryWriteContent({
  isParagen,
  item,
}: MemoryWriteContentProps): unknown {
  initializeContent();
  const accountId = shared.HX<string | null>(initial.U6t);
  if (item.isUpdating) {
    return jsx.jsxs("div", {
      className:
        "flex items-center gap-1 py-1 text-sm text-secondary select-none",
      role: "status",
      children: [
        jsx.jsx(shared.Qh, { as: "span", className: "icon-2xs" }),
        jsx.jsx(shared.Y2, {
          id: "chatgptConversations.memoryWrite.updating",
          defaultMessage: "Updating memory",
          description:
            "Status below a ChatGPT response while a memory write is in progress or awaiting its result.",
        }),
      ],
    });
  }
  return jsx.jsx(
    MemoryWritePopover,
    { accountId, isParagen, writes: item.writes },
    accountId ?? undefined,
  );
}

function MemoryWritePopover({
  accountId,
  isParagen,
  writes,
}: {
  accountId: string | null;
  isParagen?: boolean;
  writes: readonly string[];
}): unknown {
  const memoryConfiguration = shared.HX<MemoryConfiguration | null>(
    initial.yqt,
  );
  const canUseMemoryManager =
    initial.ofn(memoryManagerMode()) &&
    accountId != null &&
    memoryConfiguration != null;
  const [open, setOpen] = react.useState(false);
  const [dialog, setDialog] = react.useState<"saved" | "summary" | null>(null);
  const manage = () => {
    if (!canUseMemoryManager || memoryConfiguration == null) return;
    setOpen(false);
    setDialog(
      memoryConfiguration.m3mEnabled != null && !memoryConfiguration.m3mOptedOut
        ? "summary"
        : "saved",
    );
  };
  const trigger = jsx.jsx(shared.Tf, {
    asChild: true,
    children: jsx.jsxs(shared.Yh, {
      className: "text-sm",
      color: "ghostTertiary",
      size: "inline",
      children: [
        jsx.jsx(shared.Iv, {}),
        jsx.jsx(shared.Y2, {
          id: "chatgptConversations.memoryUpdate.label",
          defaultMessage:
            "{count, plural, one {Memory updated} other {Memories updated}}",
          description:
            "Clickable status in a ChatGPT conversation after memory writes succeed. Opens a popover listing the changes. Count is the number of confirmed writes.",
          values: { count: writes.length },
        }),
      ],
    }),
  });
  const preventFocusRestore = (event: { preventDefault(): void }) => {
    if (dialog != null) event.preventDefault();
  };
  const popover = jsx.jsxs(shared.xf, {
    open,
    onOpenChange: setOpen,
    children: [
      trigger,
      jsx.jsx(shared.Cf, {
        size: "menuWide",
        variant: "menu",
        onCloseAutoFocus: preventFocusRestore,
        children: jsx.jsxs(jsx.Fragment, {
          children: [
            jsx.jsx("ul", {
              className: "flex flex-col gap-1",
              children: writes.map(renderMemoryWrite),
            }),
            jsx.jsxs(shared.Yh, {
              className: "w-full justify-between",
              color: "ghostSecondary",
              disabled: !canUseMemoryManager,
              size: "default",
              onClick: manage,
              children: [
                jsx.jsx(shared.Y2, {
                  id: "chatgptConversations.memoryWrite.manage",
                  defaultMessage: "Manage",
                  description:
                    "Button below the changed memories in a ChatGPT response popover. Opens Memory summary or legacy Saved memories for the current account.",
                }),
                jsx.jsx(shared.my, {}),
              ],
            }),
          ],
        }),
      }),
    ],
  });
  const savedDialog =
    canUseMemoryManager && dialog === "saved"
      ? jsx.jsx(SavedMemoriesDialog, {
          accountId,
          onClose: () => setDialog(null),
          onOptBackIn: () => setDialog("summary"),
        })
      : null;
  const summaryDialog =
    canUseMemoryManager && dialog === "summary"
      ? jsx.jsx(MemorySummaryDialog, {
          accountId,
          contextualHint: isParagen
            ? undefined
            : { source: "bio_tool_write", hints: writes },
          forceRefresh: true,
          source: "MemoryActionResult",
          onClose: () => setDialog(null),
        })
      : null;
  return jsx.jsxs(jsx.Fragment, {
    children: [popover, savedDialog, summaryDialog],
  });
}

function renderMemoryWrite(write: string, index: number): unknown {
  return jsx.jsx(
    "li",
    {
      className:
        "px-2 py-1.5 text-sm break-words whitespace-pre-wrap select-text first-letter:uppercase",
      children: write.trim().replace(/^(?:The user|User)(?:'s)? /, ""),
    },
    index,
  );
}

let toolIconsInitialized = false;
function initializeToolIconContent(): void {
  if (toolIconsInitialized) return;
  toolIconsInitialized = true;
  callInitializers([
    "wE",
    "LD",
    "pm",
    "dl",
    "TE",
    "_E",
    "zm",
    "Wl",
    "AT",
    "Ya",
    "ww",
    "Olt",
    "C_",
    "Km",
  ]);
  (bookOpenChunk as unknown as { n(): void }).n();
  jsx = shared.I3();
}

let contentInitialized = false;
function initializeContent(): void {
  initializeToolIconContent();
  if (contentInitialized) return;
  contentInitialized = true;
  callInitializers([
    "FX",
    "K2",
    "Zh",
    "lw",
    "qm",
    "Ef",
    "$h",
    "ifn",
    "Sqt",
    "H3",
  ]);
  react = shared.e6();
  jsx = shared.I3();
  MemorySummaryDialog = react.lazy(async () => {
    const module = await import("@rchunk/chatgpt-about-you-summary-panel");
    return { default: module.MemorySummaryDialog as Component };
  }) as Component;
  SavedMemoriesDialog = react.lazy(async () => {
    const module = await import("@rchunk/chatgpt-saved-memories-panel");
    return { default: module.SavedMemoriesDialog as Component };
  }) as Component;
}

function callInitializers(names: readonly string[]): void {
  for (const name of names) {
    const candidate = name in shared ? shared[name] : initial[name];
    if (typeof candidate === "function") (candidate as () => unknown)();
  }
}

initializeToolIconContent();
export {
  initializeToolIconContent as i,
  initializeContent as n,
  ToolIconContent as r,
  MemoryWriteContent as t,
};
