import "@rchunk/rolldown-runtime";
import { I3 as getJsxRuntime, e6 as getReactRuntime, type JsxRuntime, type ReactRuntime } from "@rchunk/app-shared";
import { o_n as useNavigate } from "@rchunk/app-initial";
import "@rchunk/app-primary";
import "@rchunk/suggestion-card";
import "@rchunk/tabs";
import { n as initializeAppConnectModal, t as AppConnectModal } from "@rchunk/app-connect-modal";
import "@rchunk/ecosystem-widget-queries";
import "@rchunk/use-chatgpt-composer-controller";
import "@rchunk/app-info";
import "@rchunk/plugin-skill-queries";
import "@rchunk/shuffle";

type HealthTab = "accounts" | "chats" | "home" | "records";
type LoadState = "error" | "loading" | "ready";
interface HealthEligibility { health: boolean; healthEligibilityStatus?: "age_restricted" | "eligible" | "ineligible" }
interface HealthRecord { date?: string; id: string; kind?: string; summary?: string; title: string }
interface HealthChat { id: string; title?: string; updatedAt?: string }
interface StarterPrompt { description?: string; id: string; prompt: string; title: string }
interface HealthPageProps {
  accountId?: string | null; activeTab?: HealthTab; chats?: HealthChat[]; chatsNextCursor?: string | null; chatsState?: LoadState; connected?: boolean; connectionState?: LoadState; eligibility?: HealthEligibility; eligibilityState?: LoadState; isPinned?: boolean; records?: HealthRecord[]; recordsState?: LoadState; selectedRecordId?: string | null; showAddTestData?: boolean; starterPrompts?: StarterPrompt[]; starterPromptsState?: LoadState;
  onAddTestData?(): Promise<void> | void; onConnect?(): void; onLoadMoreChats?(): void; onNavigate?(path: string): void; onOpenRecord?(record: HealthRecord): void; onRefresh?(): void; onRetryChats?(): void; onRetryConnection?(): void; onRetryEligibility?(): void; onRetryRecords?(): void; onSelectPrompt?(prompt: StarterPrompt): void; onSubmit?(message: string, record?: HealthRecord): Promise<void> | void; onTogglePinned?(pinned: boolean): void;
}

let React: ReactRuntime;
let jsx: JsxRuntime;
const tabLabels: Record<HealthTab, string> = { home: "Home", records: "Records", chats: "Chats", accounts: "Accounts" };
const healthApp = { appMetadata: null, branding: null, description: "Connect medical records and wellness apps to ChatGPT Health", iconAssets: null, iconDarkAssets: null, id: "connector_openai_olympic", installUrl: undefined, isAccessible: true, isEnabled: true, labels: null, logoUrl: undefined, logoUrlDark: undefined, name: "Health", pluginDisplayNames: [] };
function statusView(state: LoadState, loading: string, error: string, onRetry?: () => void): unknown {
  if (state === "loading") return jsx.jsx("p", { role: "status", children: loading });
  if (state === "error") return jsx.jsxs("div", { role: "alert", children: [error, jsx.jsx("button", { type: "button", onClick: onRetry, children: "Try again" })] });
  return null;
}
function HealthPage({ accountId = "account", activeTab = "home", chats = [], chatsNextCursor = null, chatsState = "ready", connected = false, connectionState = "ready", eligibility, eligibilityState = "ready", isPinned = false, records = [], recordsState = "ready", selectedRecordId = null, showAddTestData = false, starterPrompts = [], starterPromptsState = "ready", onAddTestData, onConnect, onLoadMoreChats, onNavigate, onOpenRecord, onRefresh, onRetryChats, onRetryConnection, onRetryEligibility, onRetryRecords, onSelectPrompt, onSubmit, onTogglePinned }: HealthPageProps = {}): unknown {
  const navigate = useNavigate();
  const [tab, setTab] = React.useState<HealthTab>(activeTab);
  const [connectOpen, setConnectOpen] = React.useState(false);
  const [prompt, setPrompt] = React.useState("");
  const [selectedRecord, setSelectedRecord] = React.useState<HealthRecord | null>(() => records.find((record) => record.id === selectedRecordId) ?? null);
  const [dismissedPrompts, setDismissedPrompts] = React.useState(false);
  const [promptPage, setPromptPage] = React.useState(0);
  const [submitState, setSubmitState] = React.useState<"error" | "idle" | "submitting">("idle");
  const [testDataState, setTestDataState] = React.useState<"error" | "idle" | "loading">("idle");
  const go = (path: string) => onNavigate?.(path) ?? navigate(path);
  const openConnect = () => { onConnect?.(); setConnectOpen(true); };
  const selectTab = (next: HealthTab) => { setTab(next); go("/health?tab=" + next); };
  const submit = async () => {
    if (prompt.trim() === "" || onSubmit == null) return;
    setSubmitState("submitting");
    try { await onSubmit(prompt.trim(), selectedRecord ?? undefined); setPrompt(""); setSelectedRecord(null); setSubmitState("idle"); } catch { setSubmitState("error"); }
  };
  const addTestData = async () => { if (onAddTestData == null) return; setTestDataState("loading"); try { await onAddTestData(); setTestDataState("idle"); } catch { setTestDataState("error"); } };

  if (eligibilityState !== "ready") return jsx.jsxs("main", { children: [jsx.jsx("h1", { children: "Health" }), statusView(eligibilityState, "Loading Health…", "Health couldn’t be loaded", onRetryEligibility)] });
  if (eligibility == null) return jsx.jsxs("main", { children: [jsx.jsx("h1", { children: "Health" }), jsx.jsx("p", { role: "status", children: "Loading Health…" })] });
  if (!eligibility.health && eligibility.healthEligibilityStatus === "age_restricted") return jsx.jsxs("main", { children: [jsx.jsx("h1", { children: "Health" }), jsx.jsx("p", { children: "Health is only available to people aged 18 and older" }), jsx.jsx("a", { href: "https://chatgpt.com/verify_age", children: "Verify age" })] });
  if (!eligibility.health) return jsx.jsxs("main", { children: [jsx.jsx("h1", { children: "Health isn’t available for this account" }), jsx.jsx("p", { children: "Health is currently unavailable for your account. You can continue using ChatGPT as usual." })] });
  if (accountId == null) return null;

  if (connectionState !== "ready") return jsx.jsxs("main", { children: [jsx.jsx("h1", { children: "Health" }), statusView(connectionState, "Loading Health connection…", "Unable to connect Health right now", onRetryConnection)] });
  if (!connected) return jsx.jsxs("main", { className: "health-page health-invite", children: [
    jsx.jsx("h1", { children: "Health" }), jsx.jsx("div", { "aria-hidden": true, children: "♥" }), jsx.jsx("h2", { children: "Connect your health data" }), jsx.jsx("p", { children: "Securely connect your medical records and Apple Health to ChatGPT" }), jsx.jsx("button", { type: "button", onClick: openConnect, children: "Connect Health" }),
    connectOpen ? jsx.jsx(AppConnectModal, { app: healthApp, onOpenChange: setConnectOpen, postConnectSource: null, waitForConnectedHandler: true }) : null, jsx.jsx("p", { children: "ChatGPT can make mistakes. Check important health information." }),
  ] });

  const selectedPrompt = starterPrompts.length === 0 ? null : starterPrompts[promptPage % starterPrompts.length];
  const renderComposer = () => jsx.jsxs("section", { "aria-label": "Health composer", children: [
    selectedRecord ? jsx.jsxs("div", { children: [jsx.jsx("span", { children: "Selected record: " + selectedRecord.title }), jsx.jsx("button", { type: "button", "aria-label": "Remove selected Health record", onClick: () => setSelectedRecord(null), children: "Remove" })] }) : null,
    jsx.jsx("textarea", { "aria-label": "Ask a health question", placeholder: "Ask a health question", value: prompt, onChange: (event: { currentTarget: { value: string } }) => setPrompt(event.currentTarget.value) }), jsx.jsx("button", { type: "button", disabled: prompt.trim() === "" || submitState === "submitting", onClick: () => void submit(), children: submitState === "submitting" ? "Sending…" : "Send" }),
    submitState === "error" ? jsx.jsx("p", { role: "alert", children: "Your health question couldn’t be sent" }) : null, jsx.jsx("p", { children: "ChatGPT can make mistakes. Check important health information." }),
  ] });
  const homePanel = jsx.jsxs("section", { role: "tabpanel", "aria-label": "Home", hidden: tab !== "home", children: [
    starterPromptsState === "loading" ? jsx.jsx("p", { role: "status", children: "Loading suggestions…" }) : starterPromptsState === "error" ? jsx.jsx("p", { role: "alert", children: "Health suggestions couldn’t be loaded" }) : dismissedPrompts || selectedPrompt == null ? null : jsx.jsxs("section", { children: [jsx.jsx("h2", { children: "How can I help?" }), jsx.jsx("button", { type: "button", onClick: () => { onSelectPrompt?.(selectedPrompt); setPrompt(selectedPrompt.prompt); }, children: selectedPrompt.title }), selectedPrompt.description ? jsx.jsx("p", { children: selectedPrompt.description }) : null, starterPrompts.length > 1 ? jsx.jsxs("div", { children: [jsx.jsx("button", { type: "button", "aria-label": "Previous Health suggestion", onClick: () => setPromptPage((page) => (page - 1 + starterPrompts.length) % starterPrompts.length), children: "Previous" }), jsx.jsx("button", { type: "button", "aria-label": "Next Health suggestion", onClick: () => setPromptPage((page) => (page + 1) % starterPrompts.length), children: "Next" })] }) : null, jsx.jsx("button", { type: "button", "aria-label": "Dismiss health starter prompts", onClick: () => setDismissedPrompts(true), children: "Dismiss" })] }), renderComposer(),
  ] });
  const recordsPanel = jsx.jsxs("section", { role: "tabpanel", "aria-label": "Records", hidden: tab !== "records", children: [
    statusView(recordsState, "Loading health records…", "Health records couldn’t be loaded", onRetryRecords), recordsState === "ready" && records.length === 0 ? jsx.jsx("p", { children: "Your health records will appear here" }) : null, recordsState === "ready" ? jsx.jsx("ul", { children: records.map((record) => jsx.jsx("li", { children: jsx.jsx("button", { type: "button", onClick: () => { setSelectedRecord(record); onOpenRecord?.(record); }, children: record.title }) }, record.id)) }) : null, selectedRecord ? jsx.jsxs("div", { role: "dialog", "aria-label": "Health details", children: [jsx.jsx("h2", { children: selectedRecord.title }), selectedRecord.date ? jsx.jsx("time", { children: selectedRecord.date }) : null, jsx.jsx("p", { children: selectedRecord.summary ?? "No details available" }), jsx.jsx("button", { type: "button", onClick: () => setSelectedRecord(null), children: "Close details" })] }) : null,
  ] });
  const chatsPanel = jsx.jsxs("section", { role: "tabpanel", "aria-label": "Chats", hidden: tab !== "chats", children: [
    statusView(chatsState, "Loading Health chats…", "Health chats couldn’t be loaded", onRetryChats), chatsState === "ready" && chats.length === 0 ? jsx.jsx("p", { children: "Health chats will appear here" }) : null, chatsState === "ready" ? jsx.jsx("ul", { children: chats.map((chat) => jsx.jsx("li", { children: jsx.jsx("button", { type: "button", onClick: () => go("/c/" + encodeURIComponent(chat.id)), children: chat.title || "Untitled" }) }, chat.id)) }) : null, chatsNextCursor ? jsx.jsx("button", { type: "button", onClick: onLoadMoreChats, children: "Load more" }) : null,
  ] });
  const accountsPanel = jsx.jsxs("section", { role: "tabpanel", "aria-label": "Accounts", hidden: tab !== "accounts", children: [jsx.jsx("h2", { children: "Connected health data" }), jsx.jsx("p", { children: "Health connected" }), jsx.jsx("button", { type: "button", onClick: openConnect, children: "Manage connections" })] });

  return jsx.jsxs("main", { className: "health-page", children: [
    jsx.jsxs("header", { children: [jsx.jsx("h1", { children: "Health" }), jsx.jsx("button", { type: "button", onClick: onRefresh, children: "Refresh" }), jsx.jsx("button", { type: "button", onClick: () => onTogglePinned?.(!isPinned), children: isPinned ? "Unpin Health" : "Pin Health" }), jsx.jsx("a", { href: "https://help.openai.com/articles/20001036-health-in-chatgpt", children: "Health Help Center" }), showAddTestData ? jsx.jsx("button", { type: "button", disabled: testDataState === "loading", onClick: () => void addTestData(), children: "Add test health data" }) : null] }), testDataState === "error" ? jsx.jsx("p", { role: "alert", children: "Test health data couldn’t be added" }) : null,
    jsx.jsx("nav", { "aria-label": "Health tabs", children: (["home", "records", "chats", "accounts"] as const).map((key) => jsx.jsx("button", { type: "button", "aria-current": tab === key ? "page" : undefined, onClick: () => selectTab(key), children: tabLabels[key] }, key)) }), homePanel, recordsPanel, chatsPanel, accountsPanel,
    connectOpen ? jsx.jsx(AppConnectModal, { app: healthApp, onOpenChange: setConnectOpen, postConnectSource: null, waitForConnectedHandler: true }) : null,
  ] });
}
function initializeHealthPage(): void { React = getReactRuntime(); jsx = getJsxRuntime(); initializeAppConnectModal(); }
initializeHealthPage();
export { HealthPage };
