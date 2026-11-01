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
import type {
  IntlShape,
  JsxRuntime,
  MessageDescriptor,
  ReadableSignal,
} from "@rchunk/app-shared";
import type { MailProvider } from "@rchunk/onboarding-mail-provider";

void appPrimaryChunk;
void runtimeChunk;

interface ReactRuntime {
  useEffect(effect: () => void | (() => void), dependencies: unknown[]): void;
  useMemo<T>(factory: () => T, dependencies: unknown[]): T;
  useRef<T>(value: T): { current: T };
  useState<T>(value: T): [T, (value: T | ((previous: T) => T)) => void];
}

const {
  FX: initializeSignalRuntime,
  HX: useSignalValue,
  I3: getJsxRuntime,
  LX: useSignalScope,
  QI: initializeSharedRuntime,
  ZI: applicationScope,
  e6: reactRuntime,
  n4: useIntl,
} = appSharedChunk;
const {
  Bfn: initializeSidebarOnboardingState,
  M6t: initializeAuthentication,
  N6t: useAuthentication,
  bwt: onboardingDebugOverrideSignal,
  cwt: dismissOnboardingChecklist,
  Ewt: recordOnboardingChecklistView,
  pnt: appServices,
  uwt: selectOnboardingAccountState,
  vwt: setOnboardingChecklistCollapsed,
  xwt: onboardingAccountCollectionSignal,
} = appInitialChunk;
const { a: resolveMailProvider } = mailProviderChunk;
const {
  a: initializeRemoteTaskConfig,
  c: useRemoteTaskDefinitions,
  m: initializeCandidateTaskConstants,
  v: initializePermissionPromptState,
} = taskConfigChunk;
const {
  ft: resolveImportedSetupLabel,
  pt: projectImportedSetupItems,
} = importedSetupChunk;

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
  message?: string | MessageDescriptor;
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
  mailProvider?: MailProvider;
  onItemAction?(item: SidebarChecklistItem): void | Promise<void>;
  onStartPrompt?(item: SidebarChecklistItem): void | Promise<void>;
}

const React: ReactRuntime = reactRuntime;
let jsx: JsxRuntime;

function initializeSidebarOnboardingChecklist(): void {
  initializeSignalRuntime();
  initializeSharedRuntime();
  initializeSidebarOnboardingState();
  initializeAuthentication();
  initializeRemoteTaskConfig();
  initializeCandidateTaskConstants();
  initializePermissionPromptState();
  jsx ??= getJsxRuntime();
}

function useSignal<T>(signal: ReadableSignal<T>, fallback: T): T {
  return useSignalValue(signal) ?? fallback;
}

function cx(...values: Array<string | false | null | undefined>): string {
  return values.filter(Boolean).join(" ");
}

function messageText(intl: IntlShape, message: unknown, fallback: string): string {
  if (typeof message === "string") return message;
  if (message != null && typeof message === "object") {
    const descriptor = message as Record<string, unknown>;
    if (typeof descriptor.id === "string") {
      try {
        const formatted = intl.formatMessage(
          descriptor as unknown as MessageDescriptor,
        );
        if (typeof formatted === "string") return formatted;
      } catch {
        // A malformed remote descriptor should not make the checklist disappear.
      }
    }
    if (typeof descriptor.defaultMessage === "string")
      return descriptor.defaultMessage;
  }
  return fallback;
}

function itemLabel(item: SidebarChecklistItem, intl: IntlShape): string {
  const importedLabel = resolveImportedSetupLabel(item, intl);
  if (typeof importedLabel === "string") return importedLabel;
  if (item.snapshot?.label != null) return item.snapshot.label;
  if (item.label != null) return item.label;
  return messageText(intl, item.message, item.id.replaceAll("_", " "));
}

function normalizeItems(
  storedItems: SidebarChecklistItem[],
  intl: IntlShape,
  provider: unknown,
  plan: unknown,
): SidebarChecklistItem[] {
  const definitions = useRemoteTaskDefinitions({ disableExposureLog: true });
  const configured = projectImportedSetupItems({
    items: storedItems,
    locale: intl?.locale ?? "en",
    mailProvider: provider,
    plan,
    representativeRole: null,
    taskDefinitions: definitions,
  });
  const candidates: SidebarChecklistItem[] = configured;
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
      await appServices.systemPermissions.openNotificationSettings();
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
  const renderer = jsx;
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
  intl: IntlShape;
  onRun(item: SidebarChecklistItem): Promise<void>;
}): unknown {
  const react = React;
  const renderer = jsx;
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
  const react = React;
  const renderer = jsx;
  const intl = useIntl();
  const scope = useSignalScope(applicationScope);
  const account = useAuthentication();
  const accountId =
    props.accountId ?? account.accountId ?? account.userId ?? null;
  const accountCollection = useSignal(onboardingAccountCollectionSignal, null);
  const debugOverride = useSignal(onboardingDebugOverrideSignal, null);
  const runtimeState =
    props.accountState ??
    (accountId == null
      ? null
      : selectOnboardingAccountState(accountCollection, accountId, debugOverride));
  const [collapsedOverride, setCollapsedOverride] = react.useState<
    boolean | null
  >(null);
  const [hidden, setHidden] = react.useState(false);
  const headerRef = react.useRef<HTMLElement | null>(null);
  const provider =
    resolveMailProvider(props.mailProvider ?? "other", account.planAtLogin);
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
    if (accountId != null)
      recordOnboardingChecklistView(scope, accountId);
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
      setOnboardingChecklistCollapsed(scope, accountId, next);
  };
  const dismiss = () => {
    setHidden(true);
    if (accountId != null)
      dismissOnboardingChecklist(scope, accountId);
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
