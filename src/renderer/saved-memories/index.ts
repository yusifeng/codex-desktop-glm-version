import "@rchunk/rolldown-runtime";
import "@rchunk/saved-memory-history";
import { I3 as getJsxRuntime, e6 as getReactRuntime } from "@rchunk/app-shared";
import { cJt as initializeApiClient, rJt as apiClient } from "@rchunk/app-initial";
import { Gp as updateAccountSetting, Wp as initializeAccountSettings } from "@rchunk/app-primary";
import { i as initializeSavedMemoryState, t as savedMemoriesQuery } from "@rchunk/chatgpt-saved-memory-state";

interface SavedMemory {
  content: string;
  id: string;
  status?: "cold" | "warm" | string;
  updated_at?: string;
  [key: string]: unknown;
}

interface SavedMemoriesResponse {
  memories: SavedMemory[];
  memory_max_tokens?: number;
  memory_num_tokens?: number;
}

interface SavedMemoriesProps {
  accountId: string;
  onClose(): void;
  onOptBackIn(): void;
  initialMemories?: SavedMemory[];
}

interface MemoryApiClient {
  safeDelete<Response>(path: string, options: Record<string, unknown>): Promise<Response>;
  safeGet<Response>(path: string, options: Record<string, unknown>): Promise<Response>;
  safePatch<Response>(path: string, options: Record<string, unknown>): Promise<Response>;
}

const jsx = getJsxRuntime();
const React = getReactRuntime();
const client = apiClient as unknown as MemoryApiClient;
const HELP_URL = "https://help.openai.com/en/articles/8590148-memory-faq";

function accountHeaders(accountId: string): Record<string, string> {
  return { "ChatGPT-Account-ID": accountId };
}

function SavedMemories({ accountId, onClose, onOptBackIn, initialMemories }: SavedMemoriesProps): unknown {
  const [memories, setMemories] = React.useState<SavedMemory[]>(initialMemories ?? []);
  const [query, setQuery] = React.useState("");
  const [loading, setLoading] = React.useState(initialMemories == null);
  const [error, setError] = React.useState<string | null>(null);
  const [deleteHistory, setDeleteHistory] = React.useState(false);

  React.useEffect(() => {
    if (initialMemories != null) return;
    const controller = new AbortController();
    setLoading(true);
    client.safeGet<SavedMemoriesResponse>("/memories", {
      additionalHeaders: accountHeaders(accountId),
      parameters: { query: { include_memory_entries: true } },
      signal: controller.signal,
    }).then(
      response => setMemories(response.memories),
      reason => {
        if (!controller.signal.aborted) setError(reason instanceof Error ? reason.message : "Could not load memories");
      },
    ).finally(() => {
      if (!controller.signal.aborted) setLoading(false);
    });
    return () => controller.abort();
  }, [accountId, initialMemories]);

  const visibleMemories = memories
    .filter(memory => memory.content.toLocaleLowerCase().includes(query.trim().toLocaleLowerCase()))
    .sort((left, right) => Number(left.status === "cold") - Number(right.status === "cold"));

  async function deleteMemory(memoryId: string): Promise<void> {
    setError(null);
    const result = await client.safeDelete<{ success: boolean }>("/memories/{memory_id}", {
      additionalHeaders: accountHeaders(accountId),
      parameters: { path: { memory_id: memoryId } },
    });
    if (!result.success) throw new Error("Memory deletion failed");
    setMemories(current => current.filter(memory => memory.id !== memoryId));
  }

  async function clearAll(): Promise<void> {
    setError(null);
    await client.safeDelete("/settings/clear_account_user_memory", {
      additionalHeaders: accountHeaders(accountId),
      requestBody: { delete_history: deleteHistory },
    });
    setMemories([]);
  }

  async function prioritize(memoryId: string): Promise<void> {
    setError(null);
    const result = await client.safePatch<{ success: boolean }>("/memories/{memory_id}/status", {
      additionalHeaders: accountHeaders(accountId),
      parameters: { path: { memory_id: memoryId } },
      requestBody: { status: "warm" },
    });
    if (!result.success) throw new Error("Memory status update failed");
    setMemories(current => current.map(memory => memory.id === memoryId ? { ...memory, status: "warm" } : memory));
  }

  const run = (operation: () => Promise<void>) => operation().catch(reason => {
    setError(reason instanceof Error ? reason.message : "Memory operation failed");
  });

  return jsx.jsxs("section", {
    "aria-label": "Saved memories",
    className: "flex min-h-0 flex-col gap-4",
    children: [
      jsx.jsxs("header", { className: "flex items-center justify-between", children: [
        jsx.jsx("h2", { children: "Saved memories" }),
        jsx.jsx("button", { type: "button", onClick: onClose, children: "Close" }),
      ] }),
      jsx.jsxs("div", { className: "flex gap-2", children: [
        jsx.jsx("input", {
          "aria-label": "Search memories",
          placeholder: "Search memories",
          role: "searchbox",
          value: query,
          onChange: (event: { currentTarget: { value: string } }) => setQuery(event.currentTarget.value),
        }),
        jsx.jsx("a", { href: HELP_URL, target: "_blank", rel: "noreferrer", children: "Memory help" }),
      ] }),
      loading ? jsx.jsx("p", { role: "status", children: "Loading memories…" }) : null,
      error ? jsx.jsxs("p", { role: "alert", children: [error, " ", jsx.jsx("button", { type: "button", onClick: onOptBackIn, children: "Review memory settings" })] }) : null,
      !loading && visibleMemories.length === 0 ? jsx.jsx("p", { children: query ? "No matching memories" : "No saved memories" }) : null,
      jsx.jsx("ul", { children: visibleMemories.map(memory => jsx.jsxs("li", {
        "data-memory-id": memory.id,
        children: [
          jsx.jsx("p", { children: memory.content }),
          memory.status === "cold" ? jsx.jsx("button", { type: "button", onClick: () => run(() => prioritize(memory.id)), children: "Prioritize" }) : null,
          jsx.jsx("button", { type: "button", onClick: () => run(() => deleteMemory(memory.id)), children: "Delete" }),
        ],
      }, memory.id)) }),
      jsx.jsxs("footer", { children: [
        jsx.jsxs("label", { children: [jsx.jsx("input", { type: "checkbox", checked: deleteHistory, onChange: (event: { currentTarget: { checked: boolean } }) => setDeleteHistory(event.currentTarget.checked) }), " Also delete chat history"] }),
        jsx.jsx("button", { type: "button", disabled: memories.length === 0, onClick: () => run(clearAll), children: "Delete all" }),
      ] }),
    ],
  });
}

function initializeSavedMemories(): void {
  initializeApiClient();
  initializeAccountSettings();
  initializeSavedMemoryState();
  void updateAccountSetting;
  void savedMemoriesQuery;
}

export { initializeSavedMemories as n, SavedMemories as t };
