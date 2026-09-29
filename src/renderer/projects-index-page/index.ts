import "@rchunk/rolldown-runtime";
import { I3 as getJsxRuntime, e6 as getReactRuntime, type JsxRuntime, type ReactRuntime } from "@rchunk/app-shared";
import { o_n as useNavigate } from "@rchunk/app-initial";
import "@rchunk/app-primary";
// @ts-expect-error The semantic exports are supplied by the renderer chunk.
import { n as initializeThreadEmoji, t as ThreadEmoji } from "@rchunk/thread-emoji";
import { n as initializeThreadOverflowMenu, t as ThreadOverflowMenu } from "@rchunk/thread-overflow-menu";
// @ts-expect-error The semantic chunk is registered by the renderer build.
import { n as useSearchablePageTitleVisibility, t as initializeSearchablePageTitleVisibility } from "@rchunk/use-searchable-page-title-visibility";

type ProjectKind = "cloud" | "local";
type SortDirection = "ascending" | "descending";
type SortKey = "modified" | "name";
interface ProjectThread { archived?: boolean; id: string; modifiedAt?: number | null; title: string; unread?: boolean }
interface ProjectRecord { canDelete?: boolean; id: string; kind: ProjectKind; modifiedAt?: number | null; name: string; path?: string; pinned?: boolean; threads?: ProjectThread[] }
interface ProjectsIndexPageProps {
  cloudSearchError?: boolean; isLoading?: boolean; isRetrying?: boolean; isSearching?: boolean;
  onArchiveProjectThreads?(project: ProjectRecord): void;
  onCreateProject?(kind: ProjectKind): void;
  onOpenProject?(project: ProjectRecord): void;
  onOpenThread?(project: ProjectRecord, thread: ProjectThread): void;
  onPinChange?(project: ProjectRecord, pinned: boolean): void;
  onRemoveProject?(project: ProjectRecord): void;
  onRetry?(): void;
  onStartChat?(project: ProjectRecord): void;
  projects?: ProjectRecord[];
  projectListError?: boolean;
  showChatGptProjects?: boolean;
  showLocalProjects?: boolean;
  workMode?: boolean;
}

let React: ReactRuntime;
let jsx: JsxRuntime;
const collator = new Intl.Collator(undefined, { sensitivity: "base" });

function projectMatches(project: ProjectRecord, query: string): boolean {
  if (query.length === 0) return true;
  const source = (project.name + " " + (project.path ?? "")).toLowerCase();
  return source.includes(query) || (project.threads ?? []).some((thread) => thread.title.toLowerCase().includes(query));
}
function sortProjects(projects: ProjectRecord[], key: SortKey, direction: SortDirection): ProjectRecord[] {
  return [...projects].sort((left, right) => {
    const comparison = key === "name"
      ? collator.compare(left.name, right.name) || left.id.localeCompare(right.id)
      : (left.modifiedAt ?? 0) - (right.modifiedAt ?? 0) || collator.compare(left.name, right.name);
    return direction === "ascending" ? comparison : -comparison;
  });
}
function projectStatus(input: { cloudSearchError: boolean; isLoading: boolean; isSearching: boolean; projectListError: boolean; rowCount: number; searching: boolean }): "empty" | "error" | "loading" | "partial-error" | "project-error" | "searching" | null {
  if (input.projectListError) return "project-error";
  if (input.rowCount === 0) {
    if (input.isLoading || input.isSearching) return input.searching ? "searching" : "loading";
    if (input.cloudSearchError && input.searching) return "error";
    return "empty";
  }
  return input.cloudSearchError && input.searching ? "partial-error" : input.isSearching ? "searching" : null;
}

function ProjectsIndexPage({ cloudSearchError = false, isLoading = false, isRetrying = false, isSearching = false, onArchiveProjectThreads, onCreateProject, onOpenProject, onOpenThread, onPinChange, onRemoveProject, onRetry, onStartChat, projects = [], projectListError = false, showChatGptProjects = true, showLocalProjects = true, workMode = true }: ProjectsIndexPageProps = {}): unknown {
  const navigate = useNavigate();
  const { scrollContainerRef, showTitleInToolbar, titleRef } = useSearchablePageTitleVisibility();
  const [query, setQuery] = React.useState("");
  const [sortKey, setSortKey] = React.useState<SortKey>("modified");
  const [sortDirection, setSortDirection] = React.useState<SortDirection>("descending");
  const [expanded, setExpanded] = React.useState<Set<string>>(() => new Set());
  const [showAll, setShowAll] = React.useState<Set<string>>(() => new Set());
  const normalizedQuery = query.trim().toLowerCase();
  const visibleKinds = projects.filter((project) => project.kind === "cloud" ? showChatGptProjects : showLocalProjects);
  const rows = sortProjects(visibleKinds.filter((project) => projectMatches(project, normalizedQuery)), sortKey, sortDirection);
  const status = projectStatus({ cloudSearchError, isLoading, isSearching, projectListError, rowCount: rows.length, searching: normalizedQuery.length > 0 && showChatGptProjects });
  const trulyEmpty = status === "empty" && visibleKinds.length === 0;

  const changeSort = (next: SortKey) => {
    if (next !== sortKey) { setSortKey(next); setSortDirection(next === "name" ? "ascending" : "descending"); return; }
    setSortDirection((current) => current === "ascending" ? "descending" : "ascending");
  };
  const toggleExpanded = (id: string) => setExpanded((current) => { const next = new Set(current); if (next.has(id)) next.delete(id); else next.add(id); return next; });
  const toggleShowAll = (id: string) => setShowAll((current) => { const next = new Set(current); if (next.has(id)) next.delete(id); else next.add(id); return next; });
  const openProject = (project: ProjectRecord) => { if (onOpenProject != null) onOpenProject(project); else navigate("/projects?projectId=" + encodeURIComponent(project.id)); };
  const openThread = (project: ProjectRecord, thread: ProjectThread) => { if (onOpenThread != null) onOpenThread(project, thread); else navigate("/c/" + encodeURIComponent(thread.id)); };

  const renderThread = (project: ProjectRecord, thread: ProjectThread) => jsx.jsxs("li", { "data-thread-id": thread.id, children: [
    jsx.jsx("button", { type: "button", onClick: () => openThread(project, thread), children: [jsx.jsx(ThreadEmoji, { threadId: thread.id }), thread.title, thread.unread ? " · unread" : ""] }),
    jsx.jsx(ThreadOverflowMenu, { conversationId: thread.id, onArchive: () => onArchiveProjectThreads?.(project), title: "Chat actions" }),
  ] }, thread.id);

  const renderProject = (project: ProjectRecord) => {
    const matchingThreads = (project.threads ?? []).filter((thread) => normalizedQuery.length === 0 || thread.title.toLowerCase().includes(normalizedQuery));
    const forcedExpanded = normalizedQuery.length > 0 && matchingThreads.length > 0;
    const isExpanded = forcedExpanded || expanded.has(project.id);
    const threadRows = showAll.has(project.id) ? matchingThreads : matchingThreads.slice(0, 3);
    return jsx.jsxs("article", { "data-project-id": project.id, children: [
      jsx.jsxs("header", { children: [
        jsx.jsx("button", { type: "button", "aria-expanded": isExpanded, "aria-label": "Toggle project", onClick: () => toggleExpanded(project.id), children: isExpanded ? "Collapse" : "Expand" }),
        jsx.jsx("button", { type: "button", onClick: () => openProject(project), children: project.name }),
        project.kind === "local" && workMode ? jsx.jsx("span", { children: "Local project" }) : null,
        jsx.jsx("time", { children: project.modifiedAt == null ? "-" : new Date(project.modifiedAt).toLocaleDateString() }),
        jsx.jsx("button", { type: "button", onClick: () => { const pinned = !project.pinned; onPinChange?.(project, pinned); }, children: project.pinned ? "Unpin project" : "Pin project" }),
        jsx.jsx("button", { type: "button", onClick: () => onStartChat?.(project), children: project.kind === "local" ? "Start new local chat in project" : "Start new chat in project" }),
        jsx.jsx("div", { role: "menu", "aria-label": "Project actions", children: [
          jsx.jsx("button", { type: "button", role: "menuitem", onClick: () => onArchiveProjectThreads?.(project), children: "Archive chats" }),
          project.canDelete === false ? null : jsx.jsx("button", { type: "button", role: "menuitem", onClick: () => onRemoveProject?.(project), children: "Remove project" }),
        ] }),
      ] }),
      isExpanded ? jsx.jsxs("section", { children: [
        jsx.jsx("h2", { children: normalizedQuery.length > 0 ? "Search matches in " + project.name : "Recent chats in " + project.name }),
        threadRows.length === 0 ? jsx.jsx("p", { children: "No chats" }) : jsx.jsx("ul", { children: threadRows.map((thread) => renderThread(project, thread)) }),
        matchingThreads.length > 3 ? jsx.jsx("button", { type: "button", onClick: () => toggleShowAll(project.id), children: showAll.has(project.id) ? "Show less" : "Show more" }) : null,
      ] }) : null,
    ] }, project.id);
  };

  const statusContent = status === "project-error" ? jsx.jsxs("div", { role: "alert", children: ["Unable to load projects", jsx.jsx("button", { type: "button", disabled: isRetrying, onClick: onRetry, children: "Retry" })] })
    : status === "loading" ? jsx.jsx("p", { role: "status", children: "Loading projects" })
      : status === "searching" ? jsx.jsx("p", { role: "status", children: "Searching ChatGPT chats…" })
        : status === "error" ? jsx.jsx("p", { role: "alert", children: "Couldn’t search ChatGPT chats" })
          : status === "partial-error" ? jsx.jsx("p", { role: "alert", children: "Some ChatGPT chats may be missing" })
            : status === "empty" && !trulyEmpty ? jsx.jsx("p", { role: "status", children: "No projects" }) : null;

  return jsx.jsxs("div", { className: "projects-index-page", children: [
    jsx.jsx("header", { children: [showTitleInToolbar ? jsx.jsx("h1", { children: "Projects" }) : null, !trulyEmpty ? jsx.jsx("button", { type: "button", onClick: () => onCreateProject?.(showChatGptProjects ? "cloud" : "local"), children: "Create" }) : null] }),
    jsx.jsxs("main", { ref: scrollContainerRef, children: [
      jsx.jsx("h1", { ref: titleRef, children: "Projects" }),
      trulyEmpty ? jsx.jsxs("section", { children: [jsx.jsx("p", { children: showChatGptProjects ? "Create a ChatGPT project to keep related chats, files, and instructions together" : "Create a project to organize chats and give ChatGPT access to folders on your computer." }), jsx.jsx("button", { type: "button", onClick: () => onCreateProject?.(showChatGptProjects ? "cloud" : "local"), children: "New project" })] }) : jsx.jsxs(jsx.Fragment, { children: [
        jsx.jsx("input", { id: "projects-index-search", "aria-label": "Search projects", placeholder: "Search projects", value: query, onChange: (event: { currentTarget: { value: string } }) => setQuery(event.currentTarget.value) }),
        jsx.jsxs("div", { "data-projects-header": true, children: [jsx.jsx("button", { type: "button", "data-active": sortKey === "name", onClick: () => changeSort("name"), children: "Name" }), jsx.jsx("button", { type: "button", "data-active": sortKey === "modified", onClick: () => changeSort("modified"), children: "Updated" })] }),
        jsx.jsx("div", { "data-projects-rows": true, children: rows.map(renderProject) }),
        statusContent,
      ] }),
    ] }),
  ] });
}

function initializeProjectsIndexPage(): void { React = getReactRuntime(); jsx = getJsxRuntime(); initializeSearchablePageTitleVisibility(); initializeThreadEmoji(); initializeThreadOverflowMenu(); }
initializeProjectsIndexPage();
export { ProjectsIndexPage };
