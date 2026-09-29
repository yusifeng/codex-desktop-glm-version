import "@rchunk/rolldown-runtime";
import { I3 as getJsxRuntime, e6 as getReactRuntime, type JsxRuntime, type ReactRuntime } from "@rchunk/app-shared";
import { o_n as useNavigate } from "@rchunk/app-initial";
import "@rchunk/tabs";
import "@rchunk/partition";
import "@rchunk/conversation-move-menu-items";
import "@rchunk/source-dashed-border";
import "@rchunk/chatgpt-projects-runtime";
import "@rchunk/project-share-model";

type ProjectTab = "chats" | "sources";
type LoadState = "error" | "loading" | "ready";
type SourceType = "all" | "apps" | "files" | "saves";
type SourceSort = "alphabetical" | "newest" | "oldest";
interface ProjectInfo { canEdit?: boolean; canShare?: boolean; creatorName?: string; description?: string; id: string; isPinned?: boolean; isShared?: boolean; memberCount?: number; name: string }
interface ProjectChat { archived?: boolean; id: string; isOwner?: boolean; pinned?: boolean; title?: string; updatedAt?: string }
interface ProjectSource { createdAt?: string; id: string; name: string; type: Exclude<SourceType, "all"> }
type DialogComponent = (props: Record<string, unknown>) => unknown;
interface ChatGptProjectHomeProps {
  activeTab?: ProjectTab; chats?: ProjectChat[]; chatsNextCursor?: string | null; chatsState?: LoadState; composer?: unknown; invitationError?: string; invitationState?: "declining" | "idle" | "joining" | "refreshing"; invited?: boolean; project?: ProjectInfo | null; projectId: string; projectState?: "error" | "loading" | "ready" | "unavailable"; sourceAccessWarning?: boolean; sourceFileLimit?: number; sources?: ProjectSource[]; sourcesState?: LoadState;
  onArchiveChat?(chat: ProjectChat): void; onDeclineInvitation?(): Promise<void> | void; onDeleteChat?(chat: ProjectChat): void; onDeleteSource?(source: ProjectSource): Promise<void> | void; onJoinInvitation?(): Promise<void> | void; onLoadMoreChats?(): void; onMoveChat?(chat: ProjectChat): void; onNavigate?(path: string): void; onPinChat?(chat: ProjectChat, pinned: boolean): void; onPinProject?(pinned: boolean): void; onRenameChat?(chat: ProjectChat, title: string): void; onRetryChats?(): void; onRetryProject?(): void; onRetrySources?(): void; onShareChat?(chat: ProjectChat): void; onStartChat?(): void;
}

let React: ReactRuntime;
let jsx: JsxRuntime;
async function loadSettingsDialog(): Promise<DialogComponent> {
  const module = await import("@rchunk/chatgpt-project-settings-modal"); return module.ChatGptProjectSettingsModal;
}
async function loadShareDialog(): Promise<DialogComponent> {
  const module = await import("@rchunk/chatgpt-project-share-dialog"); return module.ChatGptProjectShareDialog;
}
async function loadReportDialog(): Promise<DialogComponent> {
  const module = await import("@rchunk/chatgpt-project-report-dialog");
  return module.ChatGptProjectReportDialog as unknown as DialogComponent;
}
async function loadAddSourcesDialog(): Promise<DialogComponent> {
  const module = await import("@rchunk/chatgpt-project-add-sources-dialog"); return module.ChatGptProjectAddSourcesDialog;
}
async function loadDeleteSourceDialog(): Promise<DialogComponent> {
  const module = await import("@rchunk/source-file-delete-dialog");
  return module.ChatGptProjectFileDeleteDialog as unknown as DialogComponent;
}
function statusView(state: LoadState, loading: string, error: string, onRetry?: () => void): unknown {
  if (state === "loading") return jsx.jsx("p", { role: "status", children: loading });
  if (state === "error") return jsx.jsxs("div", { role: "alert", children: [error, jsx.jsx("button", { type: "button", onClick: onRetry, children: "Try again" })] });
  return null;
}
function ChatGptProjectHome({ activeTab = "chats", chats = [], chatsNextCursor = null, chatsState = "ready", invitationError = "", invitationState = "idle", invited = false, project = null, projectId, projectState = "ready", sourceAccessWarning = false, sourceFileLimit, sources = [], sourcesState = "ready", onArchiveChat, onDeclineInvitation, onDeleteChat, onDeleteSource, onJoinInvitation, onLoadMoreChats, onMoveChat, onNavigate, onPinChat, onPinProject, onRenameChat, onRetryChats, onRetryProject, onRetrySources, onShareChat, onStartChat }: ChatGptProjectHomeProps): unknown {
  const navigate = useNavigate();
  const [tab, setTab] = React.useState<ProjectTab>(activeTab);
  const [sourceType, setSourceType] = React.useState<SourceType>("all");
  const [sourceSort, setSourceSort] = React.useState<SourceSort>("newest");
  const [dialog, setDialog] = React.useState<{ component: DialogComponent; kind: string; target?: ProjectSource } | null>(null);
  const [dialogError, setDialogError] = React.useState("");
  const [renameChatId, setRenameChatId] = React.useState<string | null>(null);
  const [renameValue, setRenameValue] = React.useState("");
  const [actionMessage, setActionMessage] = React.useState("");
  const go = (path: string) => onNavigate?.(path) ?? navigate(path);
  const openDialog = async (kind: string, loader: () => Promise<DialogComponent>, target?: ProjectSource) => { setDialogError(""); try { setDialog({ component: await loader(), kind, target }); } catch { setDialogError("Could not open project action. Try again"); } };
  const selectTab = (next: ProjectTab) => { setTab(next); go(next === "sources" ? "/projects/" + encodeURIComponent(projectId) + "?tab=sources" : "/projects/" + encodeURIComponent(projectId)); };

  if (projectState === "loading" || (projectState === "ready" && project == null)) return jsx.jsx("p", { role: "status", children: "Loading project" });
  if (projectState === "error") return jsx.jsxs("div", { role: "alert", children: ["This project is unavailable", jsx.jsx("button", { type: "button", onClick: onRetryProject, children: "Try again" })] });
  if (projectState === "unavailable") return jsx.jsxs("div", { role: "alert", children: ["This project is unavailable", jsx.jsx("button", { type: "button", onClick: () => go("/"), children: "Go home" })] });
  if (project == null) return null;

  if (invited) {
    const join = async () => { try { await onJoinInvitation?.(); } catch { setActionMessage("An error has occurred"); } };
    const decline = async () => { try { await onDeclineInvitation?.(); } catch { setActionMessage("Could not decline invitation"); } };
    return jsx.jsxs("main", { className: "chatgpt-project-home invitation", children: [jsx.jsx("h1", { children: project.name }), jsx.jsx("p", { children: project.creatorName ? project.creatorName + " invited you to join the project" : "You've been invited to join the project" }), project.memberCount == null ? null : jsx.jsx("p", { children: String(project.memberCount) + " members" }), jsx.jsx("button", { type: "button", disabled: invitationState !== "idle", onClick: () => void join(), children: invitationState === "joining" ? "Joining…" : "Join project" }), jsx.jsx("button", { type: "button", disabled: invitationState !== "idle", onClick: () => void decline(), children: invitationState === "declining" ? "Declining…" : "Decline" }), invitationError || actionMessage ? jsx.jsx("p", { role: "alert", children: invitationError || actionMessage }) : null] });
  }

  const visibleSources = sources.filter((source) => sourceType === "all" || source.type === sourceType).sort((left, right) => { if (sourceSort === "alphabetical") return left.name.localeCompare(right.name); const comparison = (left.createdAt ?? "").localeCompare(right.createdAt ?? ""); return sourceSort === "oldest" ? comparison : -comparison; });
  const chatsPanel = jsx.jsxs("section", { role: "tabpanel", "aria-label": "Chats", hidden: tab !== "chats", children: [statusView(chatsState, "Loading project chats", "Could not load project chats", onRetryChats), chatsState === "ready" && chats.length === 0 ? jsx.jsxs("div", { children: [jsx.jsx("h2", { children: "No chats yet" }), jsx.jsx("p", { children: "Chats in " + project.name + " will live here" })] }) : null, chatsState === "ready" ? jsx.jsx("ul", { children: chats.map((chat) => jsx.jsxs("li", { "data-chat-id": chat.id, children: [
    jsx.jsx("button", { type: "button", onClick: () => go("/c/" + encodeURIComponent(chat.id)), children: chat.title || "Untitled" }), chat.updatedAt ? jsx.jsx("time", { children: chat.updatedAt }) : null, renameChatId === chat.id ? jsx.jsxs("div", { children: [jsx.jsx("input", { "aria-label": "Rename chat", value: renameValue, onChange: (event: { currentTarget: { value: string } }) => setRenameValue(event.currentTarget.value) }), jsx.jsx("button", { type: "button", disabled: renameValue.trim() === "", onClick: () => { onRenameChat?.(chat, renameValue.trim()); setRenameChatId(null); }, children: "Save name" })] }) : null, jsx.jsx("div", { role: "menu", "aria-label": "Chat actions", children: [jsx.jsx("button", { type: "button", role: "menuitem", onClick: () => { setRenameChatId(chat.id); setRenameValue(chat.title ?? ""); }, children: "Rename" }), jsx.jsx("button", { type: "button", role: "menuitem", disabled: chat.isOwner === false, onClick: () => onPinChat?.(chat, !chat.pinned), children: chat.pinned ? "Unpin" : "Pin" }), jsx.jsx("button", { type: "button", role: "menuitem", onClick: () => onArchiveChat?.(chat), children: "Archive" }), jsx.jsx("button", { type: "button", role: "menuitem", onClick: () => onMoveChat?.(chat), children: "Move" }), jsx.jsx("button", { type: "button", role: "menuitem", disabled: chat.isOwner === false, onClick: () => onShareChat?.(chat), children: "Share chat" }), jsx.jsx("button", { type: "button", role: "menuitem", onClick: () => onDeleteChat?.(chat), children: "Delete" })] })
  ] }, chat.id)) }) : null, chatsNextCursor ? jsx.jsx("button", { type: "button", onClick: onLoadMoreChats, children: "Load more" }) : null] });
  const sourcesPanel = jsx.jsxs("section", { role: "tabpanel", "aria-label": "Sources", hidden: tab !== "sources", children: [sourceAccessWarning ? jsx.jsxs("div", { role: "alert", children: [jsx.jsx("strong", { children: "Some apps are unavailable" }), "Contact your workspace administrator to use connected project apps."] }) : null, sourceFileLimit != null && sources.length >= sourceFileLimit ? jsx.jsx("p", { role: "alert", children: "This project has reached its limit of " + sourceFileLimit + " files" }) : null, jsx.jsxs("div", { children: [jsx.jsx("select", { "aria-label": "Sort sources", value: sourceSort, onChange: (event: { currentTarget: { value: string } }) => setSourceSort(event.currentTarget.value as SourceSort), children: [jsx.jsx("option", { value: "newest", children: "Newest" }), jsx.jsx("option", { value: "oldest", children: "Oldest" }), jsx.jsx("option", { value: "alphabetical", children: "Alphabetical" })] }), jsx.jsx("select", { "aria-label": "Filter sources", value: sourceType, onChange: (event: { currentTarget: { value: string } }) => setSourceType(event.currentTarget.value as SourceType), children: [jsx.jsx("option", { value: "all", children: "All" }), jsx.jsx("option", { value: "files", children: "Files" }), jsx.jsx("option", { value: "saves", children: "Saves" }), jsx.jsx("option", { value: "apps", children: "Apps" })] }), jsx.jsx("button", { type: "button", disabled: sourceFileLimit != null && sources.length >= sourceFileLimit, onClick: () => void openDialog("add-sources", loadAddSourcesDialog), children: "Add sources" })] }), statusView(sourcesState, "Loading project sources", "Could not load project sources", onRetrySources), sourcesState === "ready" && visibleSources.length === 0 ? jsx.jsx("p", { children: "No sources found" }) : null, sourcesState === "ready" ? jsx.jsx("ul", { children: visibleSources.map((source) => jsx.jsxs("li", { children: [jsx.jsx("strong", { children: source.name }), jsx.jsx("span", { children: source.type === "files" ? "File" : source.type === "saves" ? "Saved response" : "App" }), jsx.jsx("button", { type: "button", onClick: () => void openDialog("delete-source", loadDeleteSourceDialog, source), children: "Delete source" })] }, source.id)) }) : null] });
  const Dialog = dialog?.component;
  return jsx.jsxs("main", { className: "chatgpt-project-home", children: [
    jsx.jsxs("header", { children: [jsx.jsx("h1", { children: project.name || "Project" }), project.description ? jsx.jsx("p", { children: project.description }) : null, jsx.jsx("button", { type: "button", onClick: onStartChat, children: "New chat" }), project.canShare === false ? null : jsx.jsx("button", { type: "button", onClick: () => void openDialog("share", loadShareDialog), children: "Share" }), project.canEdit === false ? null : jsx.jsx("button", { type: "button", onClick: () => void openDialog("settings", loadSettingsDialog), children: "Project actions" }), jsx.jsx("button", { type: "button", onClick: () => onPinProject?.(!project.isPinned), children: project.isPinned ? "Unpin project" : "Pin project" }), project.isShared ? jsx.jsx("button", { type: "button", onClick: () => void openDialog("report", loadReportDialog), children: "Report project" }) : null] }),
    jsx.jsx("nav", { "aria-label": "Project views", children: [jsx.jsx("button", { type: "button", "aria-current": tab === "chats" ? "page" : undefined, onClick: () => selectTab("chats"), children: "Chats" }), jsx.jsx("button", { type: "button", "aria-current": tab === "sources" ? "page" : undefined, onClick: () => selectTab("sources"), children: "Sources" })] }), chatsPanel, sourcesPanel, actionMessage ? jsx.jsx("p", { role: "alert", children: actionMessage }) : null, dialogError ? jsx.jsx("p", { role: "alert", children: dialogError }) : null, Dialog == null ? null : jsx.jsx(Dialog, { accountId: "account", onClose: () => setDialog(null), onOpenChange: (open: unknown) => { if (!open) setDialog(null); }, project, projectId, source: dialog?.target, onDelete: dialog?.target == null ? undefined : async () => { try { await onDeleteSource?.(dialog.target as ProjectSource); setDialog(null); } catch { setActionMessage("Could not delete source"); } } }),
  ] });
}
function initializeChatGptProjectHome(): void { React = getReactRuntime(); jsx = getJsxRuntime(); }
initializeChatGptProjectHome();
export { ChatGptProjectHome };
