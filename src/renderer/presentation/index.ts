// Presentation labels for first-party Codex tools.  The release chunk uses
// FormatJS descriptors and icon components; this source keeps that public
// contract while making the tool/state normalization explicit.

import { I3 as getJsxRuntime } from "@rchunk/app-shared";
import * as appInitial from "@rchunk/app-initial";

type MessageDescriptor = { id: string; defaultMessage: string; description?: string };
type ToolResult = { type?: string; raw?: unknown } | null | undefined;
type Presentation = {
  icon: unknown;
  key: string;
  message: MessageDescriptor;
  values: { state: ToolState; started?: number; total?: number };
};
type ToolState = "active" | "completed" | "following" | "failed" | "failedFollowing";

interface PresentationRequest {
  tool: string;
  arguments?: unknown;
  completed?: boolean;
  failed?: boolean;
  isLeading?: boolean;
  result?: ToolResult;
}

interface DynamicToolCall {
  namespace?: string | null;
  tool: string;
  arguments?: unknown;
  completed?: boolean;
  success?: boolean | null;
}

interface McpToolCall {
  invocation: { server: string; tool: string; arguments?: unknown };
  appContext?: { connectorId?: string | null; actionName?: string | null } | null;
  functionName?: string | null;
  completed?: boolean;
  result?: ToolResult;
}

interface ToolCopy { active: string; completed: string; failed: string }

const COPY: Record<string, ToolCopy> = {
  create_thread: copy("Creating chat", "Created chat", "Couldn’t create chat"),
  create_worktree: copy("Creating worktree", "Created worktree", "Couldn’t complete worktree setup"),
  fork_thread: copy("Forking chat", "Forked chat", "Couldn’t fork chat"),
  list_threads: copy("Listing chats", "Listed chats", "Couldn’t list chats"),
  list_archived_threads: copy("Listing archived chats", "Listed archived chats", "Couldn’t list archived chats"),
  read_thread: copy("Reading chat", "Read chat", "Couldn’t read chat"),
  send_message_to_thread: copy("Sending message to chat", "Sent message to chat", "Couldn’t send message to chat"),
  wait_threads: copy("Waiting for chats", "Waited for chats", "Couldn’t wait for chats"),
  handoff_thread: copy("Requesting chat handoff", "Requested chat handoff", "Couldn’t request chat handoff"),
  get_handoff_status: copy("Checking handoff status", "Checked handoff status", "Couldn’t check handoff status"),
  set_thread_archived: copy("Archiving chat", "Archived chat", "Couldn’t archive chat"),
  restore_chat: copy("Restoring chat", "Restored chat", "Couldn’t restore chat"),
  set_thread_title: copy("Renaming chat", "Renamed chat", "Couldn’t rename chat"),
  list_projects: copy("Listing projects", "Listed projects", "Couldn’t list projects"),
  create_sidebar_section: copy("Creating section", "Created section", "Couldn’t create section"),
  rename_sidebar_section: copy("Renaming section", "Renamed section", "Couldn’t rename section"),
  delete_sidebar_section: copy("Deleting section", "Deleted section", "Couldn’t delete section"),
  move_thread_to_sidebar_section: copy("Moving chat to section", "Moved chat to section", "Couldn’t move chat to section"),
  move_project_to_sidebar_section: copy("Moving project to section", "Moved project to section", "Couldn’t move project to section"),
  reorder_section: copy("Reordering section", "Reordered section", "Couldn’t reorder section"),
  reorder_sidebar_projects: copy("Reordering projects", "Reordered projects", "Couldn’t reorder projects"),
  reorder_sidebar_sections: copy("Reordering sections", "Reordered sections", "Couldn’t reorder sections"),
  share_thread: copy("Creating share link", "Created share link", "Couldn’t create share link"),
  automation_update: copy("Creating scheduled chat", "Created scheduled chat", "Couldn’t create scheduled chat"),
  automation_mode_update: copy("Updating scheduled chat", "Updated scheduled chat", "Couldn’t update scheduled chat"),
  automation_view: copy("Opening scheduled chat", "Opened scheduled chat", "Couldn’t open scheduled chat"),
  automation_delete: copy("Deleting scheduled chat", "Deleted scheduled chat", "Couldn’t delete scheduled chat"),
  automation_suggested_create: copy("Preparing scheduled chat", "Prepared scheduled chat", "Couldn’t prepare scheduled chat"),
  navigate_to_codex_page: copy("Opening chat", "Opened chat", "Couldn’t open chat"),
  open_in_codex: copy("Opening file", "Opened file", "Couldn’t open file"),
  open_browser: copy("Opening browser", "Opened browser", "Couldn’t open browser"),
  open_terminal: copy("Opening terminal", "Opened terminal", "Couldn’t open terminal"),
  open_review: copy("Opening review", "Opened review", "Couldn’t open review"),
  read_thread_terminal: copy("Reading terminal", "Read terminal", "Couldn’t read terminal"),
  attach_artifact: copy("Attaching artifact", "Attached artifact", "Couldn’t attach artifact"),
  list_artifacts: copy("Listing artifacts", "Listed artifacts", "Couldn’t list artifacts"),
  remove_artifact: copy("Removing artifact", "Removed artifact", "Couldn’t remove artifact"),
  read_settings: copy("Reading settings", "Read settings", "Couldn’t read settings"),
  write_settings: copy("Updating settings", "Updated settings", "Couldn’t update settings"),
  uninstall_plugin: copy("Uninstalling plugin", "Uninstalled plugin", "Couldn’t uninstall plugin"),
  get_usage_limits: copy("Checking usage limits", "Checked usage limits", "Couldn’t check usage limits"),
  consume_usage_reset: copy("Resetting usage", "Reset usage", "Couldn’t reset usage"),
  capture_screen_context: copy("Reading screen", "Read screen", "Couldn’t read screen"),
  end_realtime_voice_call: copy("Ending voice chat", "Ended voice chat", "Couldn’t end voice chat"),
  fire_confetti: copy("Celebrating", "Celebrated", "Couldn’t celebrate"),
  load_workspace_dependencies: copy("Loading workspace tools", "Loaded workspace tools", "Couldn’t load workspace tools"),
  create_project: copy("Creating project", "Created project", "Couldn’t create project"),
  list_hosts: copy("Listing hosts", "Listed hosts", "Couldn’t list hosts"),
  set_thread_pinned: copy("Pinning chat", "Pinned chat", "Couldn’t pin chat"),
  pin_chat: copy("Pinning chat", "Pinned chat", "Couldn’t pin chat"),
  unpin_chat: copy("Unpinning chat", "Unpinned chat", "Couldn’t unpin chat"),
  pin_project: copy("Pinning project", "Pinned project", "Couldn’t pin project"),
  unpin_project: copy("Unpinning project", "Unpinned project", "Couldn’t unpin project"),
  transfer_voice_call: copy("Transferring voice chat", "Transferred voice chat", "Couldn’t transfer voice chat"),
  get_screen_annotations: copy("Reading screen annotations", "Read screen annotations", "Couldn’t read screen annotations"),
  draw_screen_stroke: copy("Drawing on screen", "Drew on screen", "Couldn’t draw on screen"),
  erase_screen_strokes: copy("Erasing screen marks", "Erased screen marks", "Couldn’t erase screen marks"),
  request_option_picker: copy("Requesting a choice", "Requested a choice", "Couldn’t request a choice"),
  request_onboarding_input: copy("Requesting setup input", "Requested setup input", "Couldn’t request setup input"),
  setup_codex_step: copy("Setting up Codex", "Set up Codex", "Couldn’t set up Codex"),
  complete_conversational_onboarding_task: copy("Completing setup task", "Completed setup task", "Couldn’t complete setup task"),
  complete_sidebar_onboarding_checklist_task: copy("Completing setup checklist", "Completed setup checklist", "Couldn’t complete setup checklist"),
  "cloud_threads.list": copy("Listing cloud chats", "Listed cloud chats", "Couldn’t list cloud chats"),
  "cloud_threads.read": copy("Reading cloud chat", "Read cloud chat", "Couldn’t read cloud chat"),
  "cloud_threads.create": copy("Creating cloud chats", "Created cloud chats", "Couldn’t create cloud chats"),
  "cloud_threads.attach": copy("Attaching cloud chat", "Attached cloud chat", "Couldn’t attach cloud chat"),
  "cloud_threads.send_message": copy("Sending message to cloud chat", "Sent message to cloud chat", "Couldn’t send message to cloud chat"),
  "cloud_threads.create.partial": copy("Creating cloud chats", "Created some cloud chats", "Couldn’t create cloud chats"),
  comment_update: copy("Updating comment", "Updated comment", "Couldn’t update comment"),
  comment_delete: copy("Deleting comment", "Deleted comment", "Couldn’t delete comment"),
  comment_react: copy("Reacting to comment", "Reacted to comment", "Couldn’t react to comment"),
  comment_remove_reaction: copy("Removing comment reaction", "Removed comment reaction", "Couldn’t remove comment reaction"),
  replace_visualization: copy("Replacing visualization", "Replaced visualization", "Couldn’t replace visualization"),
};

function copy(active: string, completed: string, failed: string): ToolCopy {
  return { active, completed, failed };
}

function parseArguments(value: unknown): Record<string, unknown> | null {
  if (value != null && typeof value === "object" && !Array.isArray(value)) return value as Record<string, unknown>;
  if (typeof value !== "string") return null;
  try {
    const parsed: unknown = JSON.parse(value);
    return parsed != null && typeof parsed === "object" && !Array.isArray(parsed) ? parsed as Record<string, unknown> : null;
  } catch {
    return null;
  }
}

function normalizeTool(tool: string, args: Record<string, unknown> | null): string {
  if (tool === "set_thread_archived" && args?.archived === false) return "restore_chat";
  if (tool === "set_thread_pinned" && args?.pinned === false) return "unpin_chat";
  if (tool === "move_thread_to_sidebar_section" || tool === "move_project_to_sidebar_section") {
    const target = tool === "move_thread_to_sidebar_section" ? "chat" : "project";
    if (args?.sectionId === "pinned") return `pin_${target}`;
    if (args != null && Object.hasOwn(args, "sectionId") && (args.sectionId == null || args.sectionId === "threads" || args.sectionId === "chats")) return `unpin_${target}`;
  }
  if (tool === "manage_page_comment" && typeof args?.action === "string" && args.action !== "add") {
    return args.action === "react" && args.active === false ? "comment_remove_reaction" : `comment_${args.action}`;
  }
  if (tool === "create_page_visualization" && args?.replace_block != null) return "replace_visualization";
  if (tool === "automation_update" && typeof args?.mode === "string" && args.mode !== "create") {
    return args.mode === "update" ? "automation_mode_update" : `automation_${args.mode}`;
  }
  if (tool === "open_in_codex" && isRecord(args?.target) && args.target.type !== "file") return `open_${String(args.target.type)}`;
  return tool;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value != null && typeof value === "object" && !Array.isArray(value);
}

function cloudCreateCounts(result: ToolResult): { started: number; total: number } | null {
  if (result?.type !== "success") return null;
  const raw = isRecord(result.raw) ? result.raw : null;
  const structured = isRecord(raw?.structuredContent) ? raw.structuredContent : raw;
  const results = Array.isArray(structured?.results) ? structured.results : null;
  if (results == null || !results.some((entry) => isRecord(entry) && entry.status === "failed")) return null;
  return { started: results.filter((entry) => isRecord(entry) && entry.status === "started").length, total: results.length };
}

function resolveToolPresentation(request: PresentationRequest): Presentation | null {
  const args = parseArguments(request.arguments);
  let tool = normalizeTool(request.tool, args);
  let failed = request.failed === true;
  let counts: { started: number; total: number } | null = null;
  if (tool === "cloud_threads.create" && request.completed && !failed) {
    counts = cloudCreateCounts(request.result);
    if (counts != null) tool = counts.started === 0 ? tool : "cloud_threads.create.partial";
    if (counts?.started === 0) failed = true;
  }
  const copyForTool = COPY[tool];
  if (copyForTool == null) return null;
  const leading = request.isLeading !== false;
  const state: ToolState = request.completed
    ? failed ? (leading ? "failed" : "failedFollowing") : (leading ? "completed" : "following")
    : "active";
  const selected = state === "active" ? copyForTool.active : state === "failed" || state === "failedFollowing" ? copyForTool.failed : copyForTool.completed;
  const defaultMessage = leading || state === "active" ? selected : selected.charAt(0).toLowerCase() + selected.slice(1);
  return {
    icon: getJsxRuntime().jsx("span", { "aria-hidden": true, "data-tool-icon": tool }),
    key: `${tool}:${state}${counts == null ? "" : `:${counts.started}:${counts.total}`}`,
    message: {
      id: `localConversation.codexTool.${tool}.state`,
      defaultMessage,
      description: `Activity for the Codex tool action: ${tool}.`,
    },
    values: { state, started: counts?.started, total: counts?.total },
  };
}

function dynamicToolPresentation(item: DynamicToolCall, isLeading = true): Presentation | null {
  if (item.namespace !== "codex_app" && item.namespace != null) return null;
  return resolveToolPresentation({
    tool: item.tool,
    arguments: item.arguments,
    completed: item.completed,
    failed: item.success === false,
    isLeading,
  });
}

function resolveCodexToolName({ serverName, toolName, appContext, matchingApp }: {
  serverName: string;
  toolName: string;
  appContext?: McpToolCall["appContext"];
  matchingApp?: { id?: string | null } | null;
}): string | null {
  if (serverName === "codex_app") return toolName;
  if (serverName !== "codex_apps") return null;
  const connectorId = appContext?.connectorId ?? matchingApp?.id;
  if (connectorId != null && connectorId !== "connector_openai_threads") return null;
  const action = appContext?.actionName ?? toolName;
  const normalized = action.replace(/^cloud_threads[._]/, "");
  if (connectorId == null && normalized === action) return null;
  return ["list", "read", "create", "attach", "send_message"].includes(normalized) ? `cloud_threads.${normalized}` : null;
}

function findMatchingApp(item: McpToolCall, apps: unknown[]): { id?: string | null } | null {
  const matcher = (appInitial as Record<string, unknown>).Ern;
  if (typeof matcher !== "function") return null;
  return (matcher as (input: Record<string, unknown>) => { id?: string | null } | null)({
    appContext: item.appContext,
    apps,
    functionName: item.functionName,
    serverName: item.invocation.server,
    toolName: item.invocation.tool,
  });
}

function mcpToolPresentation(item: McpToolCall, apps: unknown[], isLeading = true): Presentation | null {
  const tool = resolveCodexToolName({
    serverName: item.invocation.server,
    toolName: item.invocation.tool,
    appContext: item.appContext,
    matchingApp: findMatchingApp(item, apps),
  });
  if (tool == null) return null;
  const result = item.result;
  const failureDetector = (appInitial as Record<string, unknown>).uXt;
  const failed = typeof failureDetector === "function"
    ? Boolean((failureDetector as (input: Record<string, unknown>) => unknown)({ result, isCodexAppsServer: item.invocation.server === "codex_apps" }))
    : result?.type === "error" || (isRecord(result as unknown) && (result as unknown as Record<string, unknown>).businessFailed === true);
  return resolveToolPresentation({ tool, arguments: item.invocation.arguments, completed: item.completed, failed, isLeading, result });
}

function AgentModeIcon(props: Record<string, unknown>): unknown {
  return getJsxRuntime().jsx("span", { ...props, "aria-hidden": true, "data-agent-mode-icon": "codex" });
}

function initializePresentationRuntime(): void {
  for (const name of ["Drn", "lXt", "r6", "s3t", "Fyt"] as const) {
    const initializer = (appInitial as Record<string, unknown>)[name];
    if (typeof initializer === "function") (initializer as () => void)();
  }
}

function initializePresentation(): void {
  initializePresentationRuntime();
}

export {
  initializePresentation as a,
  mcpToolPresentation as i,
  resolveToolPresentation as n,
  AgentModeIcon as o,
  dynamicToolPresentation as r,
  initializePresentationRuntime as s,
  resolveCodexToolName as t,
};
