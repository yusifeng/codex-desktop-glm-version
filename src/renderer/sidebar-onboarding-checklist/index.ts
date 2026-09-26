// sidebar-onboarding-checklist —— 侧边栏「Getting started」清单。
//
// 原版：app/webview/assets/sidebar-onboarding-checklist.electron-acd50317871a.js。
// 还原范围：运行时清单投影、进度与折叠状态、完成项排序、通知/项目/
// prompt/Claude 导入动作，以及键盘和读屏语义。

import * as appInitialChunk from "@rchunk/app-initial";
import * as appPrimaryChunk from "@rchunk/app-primary";
import * as appSharedChunk from "@rchunk/app-shared";
import * as mailProviderChunk from "@rchunk/onboarding-mail-provider";
import * as runtimeChunk from "@rchunk/rolldown-runtime";
import * as taskConfigChunk from "@rchunk/sidebar-onboarding-checklist-task-config";
import * as importedSetupChunk from "@rchunk/use-imported-setup-opportunity";

void appPrimaryChunk;
void runtimeChunk;

const appInitial = appInitialChunk as Record<string, any>;
const appShared = appSharedChunk as Record<string, any>;
const mailProvider = mailProviderChunk as Record<string, any>;
const taskConfig = taskConfigChunk as Record<string, any>;
const importedSetup = importedSetupChunk as Record<string, any>;

interface ReactRuntime {
  useEffect(effect: () => void | (() => void), dependencies: unknown[]): void;
  useMemo<T>(factory: () => T, dependencies: unknown[]): T;
  useRef<T>(value: T): { current: T };
  useState<T>(value: T): [T, (value: T | ((previous: T) => T)) => void];
}

interface JsxRuntime {
  Fragment: unknown;
  jsx(type: unknown, props: Record<string, unknown>, key?: string): unknown;
  jsxs(type: unknown, props: Record<string, unknown>, key?: string): unknown;
}

export interface SidebarChecklistItem {
  action?:
    | "create_project"
    | "enable_notifications"
    | "import_claude"
    | "start_prompt"
    | string;
  completed?: boolean;
  id: string;
  isAutoSubmitEnabled?: boolean;
  label?: string;
  message?: string | { defaultMessage?: string; id?: string };
  pluginMentions?: Array<{ pluginId: string }>;
  prompt?: string;
  snapshot?: { iconAppId?: string; label?: string; type?: string };
  threadId?: string;
}

export interface SidebarOnboardingChecklistProps {
  accountId?: string | null;
  accountState?: {
    collapsed?: boolean;
    dismissed?: boolean;
    expired?: boolean;
    items?: SidebarChecklistItem[];
  } | null;
  className?: string;
  isVisible?: boolean;
  items?: SidebarChecklistItem[];
  mailProvider?: unknown;
  onItemAction?(item: SidebarChecklistItem): void | Promise<void>;
  onStartPrompt?(item: SidebarChecklistItem): void | Promise<void>;
}

let React: ReactRuntime | null = null;
let jsx: JsxRuntime | null = null;

function callInitializer(chunk: Record<string, any>, name: string): unknown {
  const value = chunk[name];
  return typeof value === "function" ? value() : value;
}

function initializeSidebarOnboardingChecklist(): void {
  callInitializer(appShared, "FX");
  callInitializer(appShared, "QI");
  callInitializer(appInitial, "Bfn");
  callInitializer(appInitial, "M6t");
  taskConfig.a?.();
  taskConfig.m?.();
  taskConfig.v?.();
  React ??= callInitializer(appShared, "e6") as ReactRuntime;
  jsx ??= callInitializer(appShared, "I3") as JsxRuntime;
}

function useSignal<T>(signal: unknown, fallback: T): T {
  if (typeof appShared.HX !== "function" || signal == null) return fallback;
  return (appShared.HX(signal) as T | null | undefined) ?? fallback;
}

function cx(...values: Array<string | false | null | undefined>): string {
  return values.filter(Boolean).join(" ");
}

function messageText(intl: any, message: unknown, fallback: string): string {
  if (typeof message === "string") return message;
  if (message != null && typeof message === "object") {
    const descriptor = message as Record<string, unknown>;
    if (typeof intl?.formatMessage === "function") {
      try {
        return intl.formatMessage(descriptor);
      } catch {
        // A malformed remote descriptor should not make the checklist disappear.
      }
    }
    if (typeof descriptor.defaultMessage === "string")
      return descriptor.defaultMessage;
  }
  return fallback;
}

function itemLabel(item: SidebarChecklistItem, intl: any): string {
  const importedLabel = importedSetup.ft?.(item, intl);
  if (typeof importedLabel === "string") return importedLabel;
  if (item.snapshot?.label != null) return item.snapshot.label;
  if (item.label != null) return item.label;
  return messageText(intl, item.message, item.id.replaceAll("_", " "));
}

function normalizeItems(
  storedItems: SidebarChecklistItem[],
  intl: any,
  provider: unknown,
  plan: unknown,
): SidebarChecklistItem[] {
  const definitions = taskConfig.c?.({ disableExposureLog: true }) ?? {};
  const configured = importedSetup.pt?.({
    items: storedItems,
    locale: intl?.locale ?? "en",
    mailProvider: provider,
    plan,
    representativeRole: null,
    taskDefinitions: definitions,
  });
  const candidates: SidebarChecklistItem[] = Array.isArray(configured)
    ? configured
    : storedItems;
  const storedById = new Map(storedItems.map((item) => [item.id, item]));
  return candidates
    .map((item) => ({ ...item, ...storedById.get(item.id) }))
    .sort(
      (left, right) =>
        Number(left.completed === true) - Number(right.completed === true),
    );
}

async function runChecklistAction(
  item: SidebarChecklistItem,
  props: SidebarOnboardingChecklistProps,
): Promise<void> {
  switch (item.action) {
    case "create_project":
      document
        .querySelector<HTMLElement>("[data-testid='sidebar-project-create']")
        ?.click();
      return;
    case "enable_notifications":
      await appInitial.pnt?.systemPermissions?.openNotificationSettings?.();
      return;
    case "import_claude": {
      const { openExternalAgentImport } =
        await import("@rchunk/external-agent-config-import-flow");
      await openExternalAgentImport({ source: "onboarding_checklist" });
      return;
    }
    case "start_prompt":
      if (props.onStartPrompt != null) {
        await props.onStartPrompt(item);
        return;
      }
      break;
  }
  await props.onItemAction?.(item);
}

function ChecklistIcon({
  completed,
  loading,
}: {
  completed: boolean;
  loading: boolean;
}): unknown {
  const renderer = jsx as JsxRuntime;
  return renderer.jsx("span", {
    "aria-hidden": true,
    className: cx(
      "mt-0.5 inline-flex size-4 shrink-0 items-center justify-center rounded-full border text-[10px]",
      completed
        ? "border-transparent bg-primary-solid text-on-color"
        : "border-border text-tertiary",
      loading && "animate-pulse",
    ),
    children: loading ? "…" : completed ? "✓" : "",
  });
}

function ChecklistRow({
  item,
  intl,
  onRun,
}: {
  item: SidebarChecklistItem;
  intl: any;
  onRun(item: SidebarChecklistItem): Promise<void>;
}): unknown {
  const react = React as ReactRuntime;
  const renderer = jsx as JsxRuntime;
  const [loading, setLoading] = react.useState(false);
  const completed = item.completed === true;
  const label = itemLabel(item, intl);
  const activate = async () => {
    if (completed || loading) return;
    setLoading(true);
    try {
      await onRun(item);
    } finally {
      setLoading(false);
    }
  };
  return renderer.jsxs(
    "button",
    {
      type: "button",
      "aria-label": label,
      "aria-busy": loading,
      "aria-pressed": completed,
      className: cx(
        "sidebar-item flex w-full items-start gap-2 p-1.5 text-start focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-border",
        completed
          ? "cursor-default"
          : "cursor-interaction hover:bg-primary-ghost-hover",
      ),
      disabled: completed,
      onClick: activate,
      children: [
        renderer.jsx(ChecklistIcon, { completed, loading }),
        renderer.jsx("span", {
          className: cx(
            "min-w-0 flex-1 text-sm leading-5",
            completed && "text-tertiary line-through",
          ),
          children: label,
        }),
      ],
    },
    item.id,
  );
}

function SidebarOnboardingChecklist(
  props: SidebarOnboardingChecklistProps,
): unknown {
  initializeSidebarOnboardingChecklist();
  const react = React as ReactRuntime;
  const renderer = jsx as JsxRuntime;
  const intl =
    typeof appShared.n4 === "function"
      ? appShared.n4()
      : {
          locale: "en",
          formatMessage: ({ defaultMessage }: any) => defaultMessage,
        };
  const account = appInitial.N6t?.() ?? {};
  const accountId =
    props.accountId ?? account.accountId ?? account.userId ?? null;
  const accountCollection = useSignal(appInitial.xwt, null);
  const debugOverride = useSignal(appInitial.bwt, null);
  const runtimeState =
    props.accountState ??
    (accountId == null
      ? null
      : (appInitial.uwt?.(accountCollection, accountId, debugOverride) ??
        null));
  const [collapsedOverride, setCollapsedOverride] = react.useState<
    boolean | null
  >(null);
  const [hidden, setHidden] = react.useState(false);
  const headerRef = react.useRef<any>(null);
  const provider =
    mailProvider.a?.(props.mailProvider ?? "other", account.planAtLogin) ??
    props.mailProvider ??
    "other";
  const storedItems = props.items ?? runtimeState?.items ?? [];
  const items = react.useMemo(
    () => normalizeItems(storedItems, intl, provider, account.planAtLogin),
    [storedItems, intl, provider, account.planAtLogin],
  );
  const collapsed = collapsedOverride ?? runtimeState?.collapsed === true;
  const completedCount = items.filter((item) => item.completed === true).length;
  const totalCount = items.length;
  const progress =
    totalCount === 0 ? 0 : Math.round((completedCount / totalCount) * 100);

  react.useEffect(() => {
    if (accountId != null && typeof appInitial.ke === "function") {
      appInitial.ke(appShared.LX?.(appShared.ZI), accountId);
    }
  }, [accountId]);

  if (
    props.isVisible === false ||
    hidden ||
    runtimeState?.dismissed === true ||
    runtimeState?.expired === true ||
    totalCount === 0 ||
    completedCount >= totalCount
  ) {
    return null;
  }

  const title = messageText(
    intl,
    {
      id: "sidebarOnboardingChecklist.title",
      defaultMessage: "Getting started",
      description: "Title for the onboarding checklist shown in the sidebar.",
    },
    "Getting started",
  );
  const progressLabel = messageText(
    intl,
    {
      id: "sidebarOnboardingChecklist.progressCountAriaLabel",
      defaultMessage: `Onboarding progress: ${completedCount} of ${totalCount}`,
    },
    `Onboarding progress: ${completedCount} of ${totalCount}`,
  );
  const toggle = () => {
    const next = !collapsed;
    setCollapsedOverride(next);
    if (accountId != null)
      appInitial.vwt?.(appShared.LX?.(appShared.ZI), accountId, next);
  };
  const dismiss = () => {
    setHidden(true);
    if (accountId != null)
      appInitial.cwt?.(appShared.LX?.(appShared.ZI), accountId);
  };

  return renderer.jsx("section", {
    "aria-label": title,
    className: cx("w-full", props.className),
    children: renderer.jsxs("div", {
      className: "group rounded-lg px-2 py-1",
      children: [
        renderer.jsxs("div", {
          className: "grid grid-cols-[minmax(0,1fr)_auto] items-center gap-1",
          children: [
            renderer.jsxs("button", {
              ref: headerRef,
              type: "button",
              className:
                "flex min-w-0 items-center gap-2 rounded-md px-1 py-1 text-start focus-visible:outline focus-visible:outline-2 focus-visible:outline-border",
              "aria-expanded": !collapsed,
              onClick: toggle,
              children: [
                collapsed
                  ? renderer.jsx("span", {
                      role: "progressbar",
                      "aria-label": progressLabel,
                      "aria-valuemin": 0,
                      "aria-valuemax": 100,
                      "aria-valuenow": progress,
                      className:
                        "inline-flex size-3.5 items-center justify-center rounded-full border border-text/20 text-[9px] text-tertiary",
                      children: `${progress}%`,
                    })
                  : null,
                renderer.jsx("span", {
                  className: "truncate text-sm font-medium",
                  children: title,
                }),
              ],
            }),
            renderer.jsxs("div", {
              className: "flex items-center gap-1",
              children: [
                renderer.jsx("span", {
                  className: "px-1 text-xs tabular-nums text-tertiary",
                  children: `${completedCount} of ${totalCount}`,
                }),
                collapsed
                  ? null
                  : renderer.jsx("button", {
                      type: "button",
                      className:
                        "size-6 rounded-md text-tertiary hover:bg-primary-ghost-hover",
                      "aria-label": "Hide setup",
                      onClick: dismiss,
                      children: "×",
                    }),
                renderer.jsx("button", {
                  type: "button",
                  className:
                    "size-6 rounded-md text-tertiary hover:bg-primary-ghost-hover",
                  "aria-label": collapsed
                    ? "Expand checklist"
                    : "Collapse checklist",
                  "aria-expanded": !collapsed,
                  onClick: toggle,
                  children: collapsed ? "›" : "⌄",
                }),
              ],
            }),
          ],
        }),
        collapsed
          ? null
          : renderer.jsxs("div", {
              className: "flex flex-col px-2 pb-2",
              children: [
                renderer.jsx("div", {
                  role: "progressbar",
                  "aria-label": progressLabel,
                  "aria-valuemin": 0,
                  "aria-valuemax": 100,
                  "aria-valuenow": progress,
                  className:
                    "mx-2 mb-3 mt-1 h-1.5 overflow-hidden rounded-full bg-text/10",
                  children: renderer.jsx("div", {
                    className:
                      "h-full rounded-full bg-primary-solid transition-[width] duration-relaxed",
                    style: { width: `${progress}%` },
                  }),
                }),
                ...items.map((item) =>
                  renderer.jsx(
                    ChecklistRow,
                    {
                      item,
                      intl,
                      onRun: (selected: SidebarChecklistItem) =>
                        runChecklistAction(selected, props),
                    },
                    item.id,
                  ),
                ),
              ],
            }),
      ],
    }),
  });
}

export { SidebarOnboardingChecklist };
