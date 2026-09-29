import "@rchunk/rolldown-runtime";
import {
  I3 as getJsxRuntime,
  e6 as getReactRuntime,
  type JsxRuntime,
  type ReactRuntime,
} from "@rchunk/app-shared";
import "@rchunk/app-initial";
import "@rchunk/app-primary";
import "@rchunk/automation-editor-dialog";
import "@rchunk/chatgpt-tasks-runtime";
import "@rchunk/schedule-fields";
import "@rchunk/conversation-summary";
import "@rchunk/home-composer-mode-toggle-core";
import "@rchunk/use-chatgpt-composer-controller";
import "@rchunk/automations-page";

type TaskStatus = "active" | "paused" | "completed";
type LoadStatus = "idle" | "loading" | "ready" | "error";

interface ScheduledTask {
  canManage?: boolean;
  conversationId?: string | null;
  displayEmoji?: string | null;
  id: string;
  isWork?: boolean;
  lastRunAt?: string | null;
  prompt?: string;
  schedule?: string;
  status: TaskStatus;
  summary?: string;
  title: string;
  unread?: boolean;
}

interface SuggestedTask {
  id: string;
  prompt: string;
  title: string;
}

interface TaskPage {
  items: ScheduledTask[];
  nextCursor?: string | null;
}

interface ScheduledTasksService {
  dismissSuggestion?(suggestion: SuggestedTask): Promise<void> | void;
  loadDetail?(id: string): Promise<ScheduledTask>;
  loadSuggestions?(): Promise<SuggestedTask[]>;
  loadTasks(status: TaskStatus, cursor?: string): Promise<TaskPage>;
  runNow?(task: ScheduledTask): Promise<void> | void;
  selectSuggestion?(suggestion: SuggestedTask): Promise<void> | void;
  setEnabled?(id: string, enabled: boolean): Promise<void> | void;
}

interface ScheduledTasksPageProps {
  accountId?: string | null;
  composer?: unknown;
  initialSuggestions?: SuggestedTask[];
  initialTasks?: ScheduledTask[];
  onNavigate?(destination: string): void;
  onSearchParamsChange?(params: URLSearchParams, replace?: boolean): void;
  searchParams?: URLSearchParams | string;
  service?: ScheduledTasksService;
  showWorkMode?: boolean;
}

interface DynamicSharedTaskDialogProps {
  [key: string]: unknown;
  onClose(): void;
  postId: string;
}

interface DynamicShareDialogProps {
  [key: string]: unknown;
  automation: { id: string; prompt: string; status: TaskStatus; title: string };
  onClose(): void;
}

const defaultService: ScheduledTasksService = {
  async loadTasks(status, cursor) {
    const params = new URLSearchParams({ status });
    if (cursor != null) params.set("cursor", cursor);
    const response = await fetch(`/automations?${params.toString()}`);
    if (!response.ok) throw Error("Scheduled tasks request failed");
    return (await response.json()) as TaskPage;
  },
  async loadDetail(id) {
    const response = await fetch(`/automations/${encodeURIComponent(id)}`);
    if (!response.ok) throw Error("Scheduled task request failed");
    return (await response.json()) as ScheduledTask;
  },
  async loadSuggestions() {
    const response = await fetch("/suggested_automations", {
      headers: { "X-OpenAI-Task-Suggestions-Surface": "scheduled_page" },
    });
    if (!response.ok) throw Error("Suggested tasks request failed");
    return (await response.json()) as SuggestedTask[];
  },
  async setEnabled(id, enabled) {
    const response = await fetch(`/automations/${encodeURIComponent(id)}`, {
      body: JSON.stringify({ is_enabled: enabled }),
      headers: { "content-type": "application/json" },
      method: "PATCH",
    });
    if (!response.ok) throw Error("Scheduled task update failed");
  },
};

let React: ReactRuntime;
let jsx: JsxRuntime;

const SharedTaskDialog = getReactRuntime().lazy<DynamicSharedTaskDialogProps>(
  async () => {
    // @ts-expect-error The semantic dynamic entry is registered by the renderer build.
    const module = await import("@rchunk/scheduled-shared-task-dialog-entry");
    return { default: module.ScheduledSharedTaskDialog };
  },
);
const ShareDialog = getReactRuntime().lazy<DynamicShareDialogProps>(async () => {
  const module = await import("@rchunk/scheduled-task-share-dialog");
  return { default: module.ScheduledTaskShareDialog };
});
function toSearchParams(value: URLSearchParams | string | undefined): URLSearchParams {
  return new URLSearchParams(value instanceof URLSearchParams ? value : value ?? "");
}

function taskMatches(task: ScheduledTask, filter: TaskStatus): boolean {
  if (task.status === filter) return true;
  if (filter !== "active" || task.lastRunAt == null) return false;
  const elapsed = Date.now() - new Date(task.lastRunAt).getTime();
  return elapsed >= 0 && elapsed < 86_400_000;
}

function replaceTask(
  tasks: ScheduledTask[],
  id: string,
  patch: Partial<ScheduledTask>,
): ScheduledTask[] {
  return tasks.map((task) => (task.id === id ? { ...task, ...patch } : task));
}

function ScheduledTasksPage({
  accountId = "active-account",
  composer,
  initialSuggestions,
  initialTasks,
  onNavigate,
  onSearchParamsChange,
  searchParams,
  service = defaultService,
  showWorkMode = true,
}: ScheduledTasksPageProps = {}): unknown {
  const params = React.useMemo(() => toSearchParams(searchParams), [searchParams]);
  const [filter, setFilter] = React.useState<TaskStatus>("active");
  const [tasks, setTasks] = React.useState<ScheduledTask[]>(initialTasks ?? []);
  const [status, setStatus] = React.useState<LoadStatus>(
    initialTasks == null ? "idle" : "ready",
  );
  const [nextCursor, setNextCursor] = React.useState<string | null>(null);
  const [pageError, setPageError] = React.useState(false);
  const [suggestions, setSuggestions] = React.useState<SuggestedTask[]>(
    initialSuggestions ?? [],
  );
  const [suggestionsExpanded, setSuggestionsExpanded] = React.useState(true);
  const [suggestionPending, setSuggestionPending] = React.useState<string | null>(null);
  const [actionError, setActionError] = React.useState<string | null>(null);
  const [selectedId, setSelectedId] = React.useState<string | null>(
    params.get("automationId"),
  );
  const [detail, setDetail] = React.useState<ScheduledTask | null>(null);
  const [detailStatus, setDetailStatus] = React.useState<LoadStatus>("idle");
  const [editing, setEditing] = React.useState(
    params.get("edit") === "true" || params.get("edit_modal") === "true",
  );
  const [sharing, setSharing] = React.useState(params.get("share_dialog") === "true");
  const sharedPostId = params.get("shared_task");

  const loadPage = (cursor?: string) => {
    setStatus("loading");
    setPageError(false);
    service.loadTasks(filter, cursor).then(
      (page) => {
        setTasks((current) => (cursor == null ? page.items : [...current, ...page.items]));
        setNextCursor(page.nextCursor ?? null);
        setStatus("ready");
      },
      () => {
        setPageError(true);
        setStatus("error");
      },
    );
  };

  React.useEffect(() => {
    if (accountId == null || initialTasks != null) return;
    loadPage();
  }, [accountId, filter, initialTasks, service]);

  React.useEffect(() => {
    if (initialSuggestions != null || service.loadSuggestions == null) return;
    let active = true;
    service.loadSuggestions().then(
      (items) => {
        if (active) setSuggestions(items);
      },
      () => {
        if (active) setActionError("Couldn’t load suggested tasks");
      },
    );
    return () => {
      active = false;
    };
  }, [initialSuggestions, service]);

  const loadDetail = (id: string) => {
    setDetailStatus("loading");
    setDetail(null);
    const fromList = tasks.find((task) => task.id === id);
    const request = service.loadDetail?.(id) ??
      (fromList == null ? Promise.reject(Error("Task unavailable")) : Promise.resolve(fromList));
    request.then(
      (task) => {
        setDetail(task);
        setDetailStatus("ready");
      },
      () => setDetailStatus("error"),
    );
  };

  React.useEffect(() => {
    if (selectedId != null) loadDetail(selectedId);
  }, [selectedId, service]);

  if (accountId == null) return null;

  const updateParams = (mutate: (next: URLSearchParams) => void, replace = false) => {
    const next = new URLSearchParams(params);
    mutate(next);
    onSearchParamsChange?.(next, replace);
  };
  const openTask = (task: ScheduledTask, edit = false) => {
    setSelectedId(task.id);
    setEditing(edit);
    updateParams((next) => {
      next.set("automationId", task.id);
      next.set("automationSource", "cloud");
      next.delete("share_dialog");
      next.delete("shared_task");
      if (edit) next.set("edit_modal", "true");
      else next.delete("edit_modal");
    });
  };
  const closeTask = () => {
    setSelectedId(null);
    setDetail(null);
    setEditing(false);
    setSharing(false);
    updateParams((next) => {
      for (const key of [
        "automationId",
        "automationSource",
        "automationMode",
        "automationTeamId",
        "edit",
        "edit_modal",
        "share_dialog",
        "shared_task",
      ]) next.delete(key);
    }, true);
  };
  const visibleTasks = tasks.filter((task) => taskMatches(task, filter));

  const toggleTask = (task: ScheduledTask) => {
    if (task.canManage === false || task.status === "completed") return;
    const enabled = task.status === "paused";
    setActionError(null);
    Promise.resolve(service.setEnabled?.(task.id, enabled)).then(
      () => setTasks((current) => replaceTask(current, task.id, { status: enabled ? "active" : "paused" })),
      () => setActionError("Couldn’t update task status"),
    );
  };

  const selectSuggestion = (suggestion: SuggestedTask) => {
    if (suggestionPending != null) return;
    setSuggestionPending(suggestion.id);
    Promise.resolve(service.selectSuggestion?.(suggestion)).then(
      () => {
        setSuggestionPending(null);
        onNavigate?.(`/c/new?scheduledSuggestion=${encodeURIComponent(suggestion.id)}`);
      },
      () => {
        setSuggestionPending(null);
        setActionError("Couldn’t start this suggested task");
      },
    );
  };

  const dismissSuggestion = (suggestion: SuggestedTask) => {
    setSuggestions((current) => current.filter((item) => item.id !== suggestion.id));
    void service.dismissSuggestion?.(suggestion);
  };

  const renderTask = (task: ScheduledTask) =>
    jsx.jsxs("article", {
      "data-task-id": task.id,
      role: "listitem",
      children: [
        jsx.jsx("button", {
          type: "button",
          onClick: () => openTask(task),
          children: `${task.title}${task.isWork && showWorkMode ? " · Work" : ""}${task.unread ? " · unread result" : ""}`,
        }),
        jsx.jsx("p", { children: task.summary ?? task.schedule ?? task.prompt }),
        task.canManage === false || task.status === "completed"
          ? null
          : jsx.jsx("button", {
              type: "button",
              onClick: () => toggleTask(task),
              children: task.status === "paused" ? `Resume ${task.title}` : `Pause ${task.title}`,
            }),
        task.canManage === false
          ? null
          : jsx.jsx("button", { type: "button", onClick: () => openTask(task, true), children: `Edit ${task.title}` }),
      ],
    }, task.id);

  const detailPanel = selectedId == null
    ? null
    : jsx.jsxs(editing ? "dialog" : "aside", {
        open: editing ? true : undefined,
        "data-task-detail": selectedId,
        children: [
          detailStatus === "loading" ? jsx.jsx("p", { role: "status", children: "Loading task" }) : null,
          detailStatus === "error"
            ? jsx.jsxs("div", { role: "alert", children: ["Couldn’t load this task", jsx.jsx("button", { type: "button", onClick: () => loadDetail(selectedId), children: "Retry" })] })
            : null,
          detail == null ? null : jsx.jsxs("section", { children: [
            jsx.jsx("h2", { children: detail.title }),
            jsx.jsx("p", { children: detail.prompt }),
            editing || detail.canManage === false || detail.status === "completed" ? null : jsx.jsx("button", { type: "button", onClick: () => setEditing(true), children: "Edit" }),
            detail.status === "completed" ? null : jsx.jsx("button", { type: "button", onClick: () => void service.runNow?.(detail), children: "Run now" }),
            detail.canManage === false || detail.status === "completed" ? null : jsx.jsx("button", { type: "button", onClick: () => setSharing(true), children: "Share" }),
          ] }),
          sharing && detail != null
            ? jsx.jsx(ShareDialog, { automation: { id: detail.id, prompt: detail.prompt ?? "", status: detail.status, title: detail.title }, onClose: () => setSharing(false) })
            : null,
          jsx.jsx("button", { type: "button", onClick: closeTask, children: "Close task details" }),
        ],
      });

  return jsx.jsxs("main", {
    "data-scheduled-tasks-main": "",
    children: [
      jsx.jsx("h1", { children: "Scheduled" }),
      jsx.jsx("p", { children: "Ask ChatGPT to schedule tasks, set reminders, or monitor for updates" }),
      jsx.jsx("div", { "data-type": "unified-composer", children: composer ?? jsx.jsx("textarea", { "aria-label": "Describe a task or reminder" }) }),
      showWorkMode ? jsx.jsx("button", { type: "button", children: "Work mode" }) : null,
      jsx.jsx("label", { children: ["Filter tasks", jsx.jsx("select", { "aria-label": "Filter tasks", value: filter, onChange: (event: { currentTarget: { value: string } }) => { setFilter(event.currentTarget.value as TaskStatus); if (initialTasks != null) setStatus("ready"); }, children: ["active", "paused", "completed"].map((value) => jsx.jsx("option", { value, children: value === "active" ? "Active" : value === "paused" ? "Paused" : "Completed" }, value)) })] }),
      actionError == null ? null : jsx.jsx("p", { role: "alert", children: actionError }),
      pageError ? jsx.jsxs("div", { role: "alert", children: ["Couldn’t load scheduled tasks", jsx.jsx("button", { type: "button", onClick: () => loadPage(), children: "Retry" })] }) : null,
      status === "loading" ? jsx.jsx("p", { role: "status", children: "Loading tasks" }) : null,
      status === "ready" && visibleTasks.length === 0 ? jsx.jsx("p", { role: "status", children: "No tasks" }) : null,
      jsx.jsx("div", { role: "list", children: visibleTasks.map(renderTask) }),
      nextCursor == null ? null : jsx.jsx("button", { type: "button", onClick: () => loadPage(nextCursor), children: "Load more" }),
      suggestions.length === 0 ? null : jsx.jsxs("section", { children: [
        jsx.jsx("button", { type: "button", "aria-expanded": suggestionsExpanded, onClick: () => setSuggestionsExpanded((value) => !value), children: "Suggested tasks" }),
        suggestionsExpanded ? suggestions.map((suggestion) => jsx.jsxs("article", { children: [jsx.jsx("h2", { children: suggestion.title }), jsx.jsx("p", { children: suggestion.prompt }), jsx.jsx("button", { type: "button", disabled: suggestionPending != null, onClick: () => selectSuggestion(suggestion), children: "Try it" }), jsx.jsx("button", { type: "button", onClick: () => dismissSuggestion(suggestion), children: "Dismiss" })] }, suggestion.id)) : null,
      ] }),
      detailPanel,
      sharedPostId == null ? null : jsx.jsx(SharedTaskDialog, { postId: sharedPostId, onClose: closeTask }),
    ],
  });
}

function initializeScheduledTasksPage(): void {
  React = getReactRuntime();
  jsx = getJsxRuntime();
}

initializeScheduledTasksPage();

export { ScheduledTasksPage };
