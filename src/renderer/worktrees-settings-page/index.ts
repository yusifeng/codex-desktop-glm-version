import "@rchunk/rolldown-runtime";
import * as appSharedChunk from "@rchunk/app-shared";
import * as appInitialChunk from "@rchunk/app-initial";
import * as useCodexWorktreesChunk from "@rchunk/use-codex-worktrees";

const {
  $3: initializeRuntimeLazy,
  BX: useSignalFamilyValue,
  I3: getJsxRuntime,
  LX: useScope,
  ZI: AppScope,
  e6: getReactRuntime,
  n4: useIntl,
  pk: toastManagerSignal,
} = appSharedChunk;

interface WorktreeConversation {
  id: string;
  title?: string | null;
}

interface ManagedWorktree {
  branch?: string | null;
  conversations?: WorktreeConversation[];
  dir: string;
  gitDir?: string | null;
  isLocked?: boolean;
  status?: string | null;
}

interface WorktreeQueryResult {
  data?: { worktrees?: ManagedWorktree[] };
  error?: Error | null;
  isFetching?: boolean;
  isLoading?: boolean;
  refetch(): Promise<unknown> | unknown;
}

interface WorktreeConfig {
  autoCleanupEnabled?: boolean;
  keepCount?: number;
  worktreesRoot?: string | null;
}

interface ToastManager {
  danger(message: string, options?: { errorAnalytics?: { toastId: string } }): void;
  success(message: string): void;
}

const appRuntime = appInitialChunk as unknown as {
  F$: () => (conversationId: string, hostId: string) => void;
  Gp: (scope: unknown, options: { sourceConversationId?: string; workspaceRoot: string }) => void;
  Qln: (command: string, request: { params: { hostId: string; reason: string; worktree: string } }) => Promise<unknown>;
  Vfn: (hostId: string) => unknown;
  Xl: () => void;
  _e: () => { selectedHostId: string };
  su: () => void;
};
const {
  F$: useOpenConversation,
  Gp: startWorktreeChat,
  Qln: invokeMainCommand,
  Vfn: normalizeHost,
  Xl: initializeSettingsPage,
  _e: useSelectedHost,
  su: initializeSettingsRuntime,
} = appRuntime;

const worktreesRuntime = useCodexWorktreesChunk as unknown as {
  a: import("@rchunk/app-shared").SignalFamily<string, WorktreeConfig | null>;
  n: (host: unknown, surface: string, options: { enabled: boolean }) => WorktreeQueryResult;
  r: () => void;
  t: () => void;
};
const {
  a: worktreeConfigSignal,
  n: useCodexWorktrees,
  r: initializeWorktreeConfig,
  t: initializeUseCodexWorktrees,
} = worktreesRuntime;

let React: import("@rchunk/app-shared").ReactRuntime;
let jsx: import("@rchunk/app-shared").JsxRuntime;

function worktreeStatus(worktree: ManagedWorktree): { label: string; tone: string } {
  if (worktree.isLocked || worktree.status === "in-use" || worktree.status === "active") {
    return { label: "In use", tone: "text-warning" };
  }
  if (worktree.status === "error" || worktree.status === "failed") {
    return { label: "Needs attention", tone: "text-danger" };
  }
  if (worktree.status === "archived") return { label: "Archived", tone: "text-secondary" };
  return { label: "Ready", tone: "text-success" };
}

function SettingsSummary({ config }: { config: WorktreeConfig | null }): unknown {
  if (config == null) return null;
  return jsx.jsxs("section", {
    className: "rounded-xl border border-token-border-light",
    children: [
      jsx.jsx("header", { className: "border-b border-token-border-light px-4 py-3 font-semibold", children: "Management" }),
      jsx.jsxs("dl", {
        className: "grid gap-3 px-4 py-3 text-sm",
        children: [
          jsx.jsxs("div", { className: "flex justify-between gap-4", children: [jsx.jsx("dt", { children: "Worktree root" }), jsx.jsx("dd", { className: "truncate text-secondary", children: config.worktreesRoot?.trim() || "Default location" })] }),
          jsx.jsxs("div", { className: "flex justify-between gap-4", children: [jsx.jsx("dt", { children: "Automatic cleanup" }), jsx.jsx("dd", { children: config.autoCleanupEnabled === false ? "Off" : "On" })] }),
          jsx.jsxs("div", { className: "flex justify-between gap-4", children: [jsx.jsx("dt", { children: "Keep count" }), jsx.jsx("dd", { children: String(config.keepCount ?? 10) })] }),
        ],
      }),
    ],
  });
}

function WorktreeRow({
  hostId,
  onCleaned,
  worktree,
}: {
  hostId: string;
  onCleaned(): Promise<unknown> | unknown;
  worktree: ManagedWorktree;
}): unknown {
  const scope = useScope(AppScope);
  const intl = useIntl();
  const openConversation = useOpenConversation();
  const [cleaning, setCleaning] = React.useState(false);
  const status = worktreeStatus(worktree);
  const conversations = worktree.conversations ?? [];
  const firstConversation = conversations[0];

  const open = (): void => {
    if (firstConversation != null) {
      openConversation(firstConversation.id, hostId);
      return;
    }
    startWorktreeChat(scope, { workspaceRoot: worktree.dir });
  };

  const clean = async (): Promise<void> => {
    if (cleaning) return;
    setCleaning(true);
    try {
      await invokeMainCommand("worktree-delete", {
        params: { hostId, worktree: worktree.dir, reason: "settings-delete-targeted" },
      });
      await onCleaned();
      (scope.get(toastManagerSignal) as ToastManager).success(String(intl.formatMessage({
        id: "settings.worktrees.delete.success",
        defaultMessage: "Worktree deleted",
      })));
    } catch {
      (scope.get(toastManagerSignal) as ToastManager).danger(String(intl.formatMessage({
        id: "settings.worktrees.delete.error",
        defaultMessage: "Failed to delete worktree",
      })), { errorAnalytics: { toastId: "settings.worktrees.delete.error" } });
    } finally {
      setCleaning(false);
    }
  };

  return jsx.jsxs("article", {
    className: "grid gap-3 border-b border-token-border-light p-4 last:border-b-0",
    children: [
      jsx.jsxs("div", {
        className: "flex items-start justify-between gap-4",
        children: [
          jsx.jsxs("div", {
            className: "min-w-0",
            children: [
              jsx.jsx("div", { className: "truncate font-medium", children: worktree.branch?.trim() || "Worktree" }),
              jsx.jsx("div", { className: "mt-1 truncate text-xs text-secondary", children: worktree.dir }),
            ],
          }),
          jsx.jsx("span", { className: "shrink-0 text-xs " + status.tone, role: "status", children: status.label }),
        ],
      }),
      jsx.jsxs("div", {
        className: "flex items-center justify-between gap-3",
        children: [
          jsx.jsx("span", { className: "truncate text-xs text-secondary", children: conversations.length === 0 ? "No linked conversations" : conversations.length + " linked conversation" + (conversations.length === 1 ? "" : "s") }),
          jsx.jsxs("div", {
            className: "flex gap-2",
            children: [
              jsx.jsx("button", { type: "button", onClick: open, disabled: cleaning, children: firstConversation == null ? "New chat" : "Open" }),
              jsx.jsx("button", { type: "button", onClick: () => void clean(), disabled: cleaning, "aria-busy": cleaning, children: cleaning ? "Cleaning…" : "Clean up" }),
            ],
          }),
        ],
      }),
    ],
  });
}

function WorktreesSettingsPage(): unknown {
  const { selectedHostId } = useSelectedHost();
  const host = normalizeHost(selectedHostId);
  const config = useSignalFamilyValue(worktreeConfigSignal, selectedHostId) as WorktreeConfig | null;
  const query = useCodexWorktrees(host, "worktrees_settings_page", { enabled: config != null });
  const worktrees = query.data?.worktrees ?? [];
  const refreshing = query.isFetching === true;
  const refresh = (): void => { void query.refetch(); };

  const header = jsx.jsxs("header", {
    className: "flex items-center justify-between border-b border-token-border-light px-5 py-4",
    children: [
      jsx.jsxs("div", { children: [jsx.jsx("h1", { className: "text-lg font-semibold", children: "Worktrees" }), jsx.jsx("p", { className: "mt-1 text-sm text-secondary", children: "Manage worktrees created by ChatGPT." })] }),
      jsx.jsx("button", { type: "button", onClick: refresh, disabled: refreshing, "aria-busy": refreshing, children: refreshing ? "Refreshing…" : "Refresh" }),
    ],
  });

  let content: unknown;
  if (query.isLoading || config == null) {
    content = jsx.jsx("div", { className: "rounded-xl border border-token-border-light p-4 text-sm text-secondary", role: "status", children: "Fetching worktree details…" });
  } else if (query.error != null) {
    content = jsx.jsxs("div", {
      className: "rounded-xl border border-token-border-light p-4",
      role: "alert",
      children: [
        jsx.jsx("div", { className: "font-medium", children: "Unable to load worktrees" }),
        jsx.jsx("p", { className: "mt-1 text-sm text-secondary", children: query.error.message || "Something went wrong while loading worktrees." }),
        jsx.jsx("button", { className: "mt-3", type: "button", onClick: refresh, children: "Try again" }),
      ],
    });
  } else if (worktrees.length === 0) {
    content = jsx.jsxs("section", {
      className: "rounded-xl border border-token-border-light p-4",
      children: [jsx.jsx("h2", { className: "font-semibold", children: "No worktrees yet" }), jsx.jsx("p", { className: "mt-1 text-sm text-secondary", children: "Worktrees created by ChatGPT will appear here" })],
    });
  } else {
    content = jsx.jsx("section", {
      className: "overflow-hidden rounded-xl border border-token-border-light",
      children: worktrees.map((worktree) => jsx.jsx(WorktreeRow, { hostId: selectedHostId, onCleaned: query.refetch, worktree }, worktree.dir)),
    });
  }

  return jsx.jsxs("div", {
    className: "flex h-full min-h-0 flex-col",
    children: [header, jsx.jsx("main", { className: "flex-1 overflow-auto p-5", children: jsx.jsxs("div", { className: "mx-auto grid max-w-3xl gap-5", children: [jsx.jsx(SettingsSummary, { config }), content] }) })],
  });
}

let initialized = false;
function initializeWorktreesSettingsPage(): void {
  if (initialized) return;
  initializeRuntimeLazy();
  initializeSettingsPage();
  initializeSettingsRuntime();
  initializeWorktreeConfig();
  initializeUseCodexWorktrees();
  React = getReactRuntime();
  jsx = getJsxRuntime();
  initialized = true;
}

initializeWorktreesSettingsPage();
export { WorktreesSettingsPage };
