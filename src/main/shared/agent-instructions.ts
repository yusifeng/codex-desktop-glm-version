// shared chunk：agent 系统指令装配 + 权限沙箱快照 + 自动化计划模板
//（agent-instructions 分区）。
//
// 对应 src-DldfpmrL.ts 的 L55,867-56,240 + L2-9,44/21,008-21,023 依赖：
//   - b3（Ht）：thread detail level 过滤后的权限快照——STEPS_COMMANDS
//     只留 network/fileSystem；write 权限按「是否触及 home 目录」降级为
//     entries（x3/S3/C3/w3 家族：路径类型 T3 wsl|windows|posix、home 段
//     E3、~/%USERPROFILE% 展开 D3、Windows 尾部点/空格归一 k3/P3、
//     WSL /mnt/<drive>/Users 4 段判定 N3、special 权限 j3、
//     appdata/library 排除 v3/y3）
//   - F3（Vt）：扫描已安装 marketplace 插件的 <pluginRoot>/scheduled/
//     *.json 计划模板（I3 组读取 + L3 插件根解析 + R3 单文件 zod 解析
//     OD/ED：hourly/daily/weekdays/weekly → RRULE）
//   - i6（Rt）：完整指令组装（X3 桌面上下文段 + t6 心跳 + e6 git 段 +
//     z3 app-context 包装）；a6（Bt）= i6 + threadId 心跳活跃判定（zB）
//   - r6（zt）：基础指令与心跳段合并（hostedAutomations 开启时 n6 把
//     automation_update 指令替换为 automations app 说法）
//
// 兼容导出（5 个压缩名）：Bt=a6、Ht=b3、Rt=i6、Vt=F3、zt=r6。

import { Buffer } from "node:buffer";

import { z } from "zod";

// ---------------------------------------------------------------------------
// 路径类别辅助（原 `Gb`/`Vb`/`Ub`/`Wb`/`Jb`/`Yb`，L17,915-17,946）
// ---------------------------------------------------------------------------

const WINDOWS_DRIVE_PATH = /^[A-Za-z]:[\\/]/;
const UNC_BACKSLASH_PATH = /^\\\\[^\\]+\\[^\\]+/;
const UNC_FORWARD_PATH = /^\/\/[^/]+\/[^/]+/;

/** 反斜杠归一（原 `Gb`）。 */
function toForwardSlashes(path: string): string {
  return path.replace(/\\/g, "/");
}

/** Windows 盘符路径判定（原 `Jb`）。 */
function isWindowsDrivePath(path: string): boolean {
  return WINDOWS_DRIVE_PATH.test(path);
}

/** UNC 路径判定（原 `Yb`）。 */
function isUncPath(path: string): boolean {
  return UNC_BACKSLASH_PATH.test(path) || UNC_FORWARD_PATH.test(path);
}

// ---------------------------------------------------------------------------
// 权限快照（原 `b3` 家族，L55,869-55,988）
// ---------------------------------------------------------------------------

/** home 下的普通排除目录（posix，原 `v3`）。 */
const POSIX_EXCLUDED_HOME_CHILDREN = ["library"];

/** home 下的 appdata 排除（windows/wsl，原 `y3`）。 */
const WINDOWS_EXCLUDED_HOME_CHILDREN = ["appdata"];

/** 路径形态。 */
type PathFlavor = "wsl" | "windows" | "posix";

/** 权限文件系统访问条目。 */
export interface FileSystemAccessEntry {
  access: "deny" | "read" | "write";
  path:
    | { type: "path"; path: string }
    | { type: "glob_pattern"; pattern: string }
    | { type: "special"; value: { kind: string } | string };
}

/** 权限文件系统段。 */
export interface FileSystemPermissions {
  entries?: FileSystemAccessEntry[] | null;
  read?: unknown;
  write?: unknown;
  [key: string]: unknown;
}

/** 权限快照请求。 */
export interface PermissionsForInstructionsInput {
  homeDirectory: string;
  permissions: { network?: unknown; fileSystem?: FileSystemPermissions | null };
  threadDetailLevel?: string;
}

/** 路径形态判定（原 `T3`）。 */
function pathFlavorOf(path: string): PathFlavor {
  const normalized = toForwardSlashes(path);
  if (/^\/\/(?:wsl\$|wsl\.localhost)\/[^/]+(?:\/|$)/i.test(normalized)) return "wsl";
  if (isWindowsDrivePath(path) || isUncPath(path)) return "windows";
  return "posix";
}

/** 拆路径段（原 `E3`：相对段数组，`..`/`.` 跳过，越界返回 null）。 */
function pathSegmentsOf(path: string, flavor: PathFlavor, caseInsensitive = flavor === "windows"): string[] | null {
  const normalized = normalizeForFlavor(path, flavor);
  if (normalized == null) return null;
  const segments: string[] = [];
  for (const rawSegment of normalized.split("/")) {
    const segment = trailingDotsTrimmed(rawSegment, caseInsensitive);
    if (segment.length === 0 || segment === ".") continue;
    const dotted = caseInsensitive && segment.length > 1 && /^\.+$/.test(segment);
    if (segment === ".." || dotted) return null;
    segments.push(segment);
  }
  return segments;
}

/** 形态归一（原 `O3`：windows 小写、wsl 剥 UNC 前缀）。 */
function normalizeForFlavor(path: string, flavor: PathFlavor): string | null {
  const normalized = toForwardSlashes(path);
  if (flavor === "windows") return normalized.toLowerCase();
  if (flavor === "posix") return normalized;
  const wslMatch = normalized.match(/^\/\/(?:wsl\$|wsl\.localhost)\/([^/]+)(?:\/(.*))?$/i);
  return wslMatch == null ? null : `/${wslMatch[1]}/${wslMatch[2] ?? ""}`;
}

/** Windows 尾部空格/点归一（原 `k3`）。 */
function trailingDotsTrimmed(segment: string, caseInsensitive: boolean): string {
  if (!caseInsensitive) return segment;
  const spaceTrimmed = segment.replace(/ +$/g, "");
  return /^\.+$/.test(spaceTrimmed) ? spaceTrimmed : spaceTrimmed.replace(/[ .]+$/g, "");
}

/** ~ / %USERPROFILE% 展开（原 `D3`）。 */
function expandHomeAlias(alias: string, homeDirectory: string, flavor: PathFlavor, caseInsensitive: boolean): string[] | null {
  const normalized = toForwardSlashes(alias);
  if (flavor === "windows" && (normalized.toLowerCase() === "%userprofile%" || normalized.toLowerCase().startsWith("%userprofile%/")))
    return pathSegmentsOf(`${homeDirectory}/${normalized.slice(13)}`, flavor, caseInsensitive);
  if (flavor !== "windows" && (normalized === "~" || normalized.startsWith("~/")))
    return pathSegmentsOf(`${homeDirectory}/${normalized.slice(1)}`, flavor, caseInsensitive);
  return null;
}

/** WSL home 判定（原 `N3`：/mnt/<drive>/Users 4 段）。 */
function isWslMountedHome(segments: string[]): boolean {
  return segments.length === 4 && segments[0] === "mnt" && segments[1]?.length === 1 && segments[2]?.toLowerCase() === "users";
}

/** 段归一小写（原 `A3`/`P3`）。 */
function lowercasedSegments(segments: string[], caseInsensitive: boolean): string[] {
  if (!caseInsensitive) return segments;
  return segments.map((segment) =>
    segment
      .toLowerCase()
      .replace(/ +$/g, "")
      .replace(/[ .]+$/g, ""),
  );
}

/** special 权限是否可能触及 home（原 `j3`）。 */
function specialAccessMayTouchHome(value: { kind: string } | string): boolean {
  switch (typeof value === "string" ? value : value.kind) {
    case "tmpdir":
    case "slash_tmp":
    case "minimal":
    case "project_roots":
      return false;
    case "root":
    case "unknown":
      return true;
  }
}

/** home 子目录是否在排除列表（原 `M3`）。 */
function excludedHomeChild({ homeDirectoryPathFlavor, homeDirectorySegments, requestedHomeChild }: { homeDirectoryPathFlavor: PathFlavor; homeDirectorySegments: string[]; requestedHomeChild: string }): boolean {
  const caseInsensitive = homeDirectoryPathFlavor === "windows" || isWslMountedHome(homeDirectorySegments);
  const child = caseInsensitive ? lowercasedSegments([requestedHomeChild], true)[0] : requestedHomeChild.toLowerCase();
  return caseInsensitive ? WINDOWS_EXCLUDED_HOME_CHILDREN.includes(child) : POSIX_EXCLUDED_HOME_CHILDREN.includes(child);
}

/** write 路径是否触及 home（原 `w3`）。 */
function writePathTouchesHome(requestedPath: string, homeDirectory: string): boolean {
  const flavor = pathFlavorOf(homeDirectory);
  const homeSegments = pathSegmentsOf(homeDirectory, flavor);
  if (homeSegments == null || homeSegments.length === 0) return true;
  const caseInsensitive = flavor === "windows" || isWslMountedHome(homeSegments);
  const requestedSegments =
    expandHomeAlias(requestedPath, homeDirectory, flavor, caseInsensitive) ??
    (flavor === pathFlavorOf(requestedPath) ? pathSegmentsOf(requestedPath, flavor, caseInsensitive) : null);
  if (requestedSegments == null || requestedSegments.length <= homeSegments.length) return true;
  const home = lowercasedSegments(homeSegments, caseInsensitive);
  const requestedLower = lowercasedSegments(requestedSegments, caseInsensitive);
  if (!home.every((segment, index) => requestedLower[index] === segment)) return true;
  const child = requestedLower[homeSegments.length];
  return child == null || excludedHomeChild({ homeDirectoryPathFlavor: flavor, homeDirectorySegments: homeSegments, requestedHomeChild: child });
}

/** 单条 write 权限是否可暴露（原 `S3`/`C3`）。 */
function entryTouchesHome(entry: FileSystemAccessEntry, homeDirectory: string): boolean {
  switch (entry.access) {
    case "deny":
    case "read":
      return false;
    case "write":
      switch (entry.path.type) {
        case "path":
          return writePathTouchesHome(entry.path.path, homeDirectory);
        case "glob_pattern":
          return true;
        case "special":
          return specialAccessMayTouchHome(entry.path.value);
      }
  }
}

/** 过滤 write-to-home 条目（原 `x3`）。 */
function visibleEntries(entries: FileSystemAccessEntry[] | null | undefined, homeDirectory: string): FileSystemAccessEntry[] | null {
  if (!entries?.length) return null;
  const filtered = entries.filter((entry) => !entryTouchesHome(entry, homeDirectory));
  return filtered.length === 0 ? null : filtered;
}

/**
 * 指令用权限快照（原 `b3`，导出 `Ht`）。
 * STEPS_COMMANDS 级别保留 network/fileSystem 原样；其余级别剥离
 * 触及 home 的 write 条目（保留 entries 供展示）。
 */
export function permissionsForInstructions({ homeDirectory, permissions, threadDetailLevel }: PermissionsForInstructionsInput) {
  if (threadDetailLevel === "STEPS_COMMANDS")
    return { network: permissions.network ?? undefined, fileSystem: permissions.fileSystem ?? undefined };
  if (permissions.fileSystem == null) return { network: permissions.network ?? undefined };
  const entries = visibleEntries(permissions.fileSystem.entries ?? null, homeDirectory);
  return {
    network: permissions.network ?? undefined,
    fileSystem: entries == null ? undefined : { ...permissions.fileSystem, read: null, write: null, entries },
  };
}

// ---------------------------------------------------------------------------
// 计划模板（原 `F3`/`I3`/`L3`/`R3`/`OD`/`ED`，L20,989-21,044 + L55,989-56,044）
// ---------------------------------------------------------------------------

const WEEKDAY_CODES = ["MO", "TU", "WE", "TH", "FR", "SA", "SU"] as const;
const WEEKDAY_ORDER = new Map<string, number>(WEEKDAY_CODES.map((code, index) => [code, index]));
const WEEKDAY_CODES_SET = z.enum(WEEKDAY_CODES);
const WEEKDAY_LIST = z.array(WEEKDAY_CODES_SET).min(1).refine((days) => new Set(days).size === days.length);
const TIME_OF_DAY = z.string().regex(/^(?:[01]\d|2[0-3]):[0-5]\d$/);

/** 计划 schema（原 `ED`：hourly/daily/weekdays/weekly）。 */
const scheduleSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("hourly"), intervalHours: z.number().int().positive(), days: WEEKDAY_LIST.optional() }).strict(),
  z.object({ type: z.literal("daily"), time: TIME_OF_DAY }).strict(),
  z.object({ type: z.literal("weekdays"), time: TIME_OF_DAY }).strict(),
  z.object({ type: z.literal("weekly"), days: WEEKDAY_LIST, time: TIME_OF_DAY }).strict(),
]) as z.ZodType<Record<string, unknown>>;

/** 计划模板文件 schema（原 `DD`）。 */
const scheduledTemplateSchema = z.object({ name: z.string().trim().min(1), prompt: z.string().trim().min(1), schedule: scheduleSchema }).strict() as z.ZodType<Record<string, unknown>>;

const SCHEDULED_FILENAME = /^[a-z0-9]+(?:-[a-z0-9]+)*\.json$/;

/** RRULE 周列表（原 `jD`）。 */
function rruleDays(days: string[]): string {
  return [...days].sort((a, b) => (WEEKDAY_ORDER.get(a) ?? 0) - (WEEKDAY_ORDER.get(b) ?? 0)).join(",");
}

/** 周计划 RRULE（原 `AD`）。 */
function weeklyRrule(time: string, days: string[]): string {
  const [hour, minute] = time.split(":").map(Number);
  return ["RRULE:FREQ=WEEKLY", `BYHOUR=${hour}`, `BYMINUTE=${minute}`, `BYDAY=${rruleDays(days)}`].join(";");
}

/** schedule → RRULE（原 `kD`）。 */
function rruleForSchedule(schedule: { type: string; intervalHours?: number; days?: string[]; time?: string }): string {
  switch (schedule.type) {
    case "hourly":
      return [
        "RRULE:FREQ=HOURLY",
        `INTERVAL=${schedule.intervalHours}`,
        "BYMINUTE=0",
        `BYDAY=${rruleDays(schedule.days ?? Array.from<string>(WEEKDAY_CODES))}`,
      ].join(";");
    case "daily":
      return weeklyRrule(schedule.time!, Array.from<string>(WEEKDAY_CODES));
    case "weekdays":
      return weeklyRrule(schedule.time!, WEEKDAY_CODES.slice(0, 5));
    case "weekly":
      return weeklyRrule(schedule.time!, schedule.days!);
  }
}

/** 计划模板（解析后形态）。 */
export interface ScheduledTemplate {
  key: string;
  name: string;
  prompt: string;
  rrule: string;
}

/** 单文件解析（原 `OD`）。 */
function parseScheduledTemplate(fileName: string, parsed: unknown): ScheduledTemplate | null {
  if (!SCHEDULED_FILENAME.test(fileName)) return null;
  const result = scheduledTemplateSchema.safeParse(parsed);
  if (!result.success) return null;
  const data = result.data as { name: string; prompt: string; schedule: { type: string; intervalHours?: number; days?: string[]; time?: string } };
  return { key: fileName.slice(0, -5), name: data.name, prompt: data.prompt, rrule: rruleForSchedule(data.schedule) };
}

/** 插件根解析（原 `L3`：local source 直取 / 缓存版本目录 uD）。 */
function pluginRootFor({ codexHome, marketplaceName, plugin }: { codexHome: string; marketplaceName: string; plugin: ScheduledPluginSummary }): string | null {
  if (plugin.localVersion == null)
    return plugin.source.type === "local" ? toForwardSlashes(plugin.source.path) : null;
  const home = toForwardSlashes(codexHome);
  const root = [
    home,
    "plugins",
    "cache",
    sanitizePathSegment(marketplaceName),
    sanitizePathSegment(plugin.name),
    sanitizePathSegment(plugin.localVersion ?? "local"),
  ].join("/");
  return isUncPath(home) ? `/${root}` : root;
}

/** 路径段消毒（原 `lD.parse`：拒绝越界段）。 */
function sanitizePathSegment(segment: string): string {
  if (segment.length === 0 || segment === "." || segment === "..") throw new Error(`unsafe path segment: ${segment}`);
  return segment;
}

/** 已安装插件摘要（F3 输入的元素形态）。 */
export interface ScheduledPluginSummary {
  id: string;
  name: string;
  enabled: boolean;
  installed: boolean;
  availability: string;
  localVersion: string | null;
  source: { type: string; path?: string };
  interface?: { displayName?: string | null };
}

/** 文件系统读取面（F3 依赖的最小接口）。 */
export interface TemplateFilesystemLike {
  readDirectory(path: string): Promise<{ isFile: boolean; name: string }[]>;
  readFile(path: string): Promise<unknown>;
}

export interface TemplatePathLike {
  join(...segments: string[]): string;
}

/** 插件计划模板组。 */
export interface PluginScheduledTemplates {
  plugin: { id: string; name: string; displayName: string };
  templates: ScheduledTemplate[];
}

/**
 * 扫描已安装插件的计划模板（原 `F3`，导出 `Vt`）。
 * 遍历 marketplaces 中 enabled+installed+AVAILABLE 的插件，
 * 读 <pluginRoot>/scheduled/*.json，按 displayName 排序。
 */
export async function collectScheduledTemplates({
  codexHome,
  filesystem,
  marketplaces,
  path,
}: {
  codexHome: string;
  filesystem: TemplateFilesystemLike;
  marketplaces: { name: string; plugins: ScheduledPluginSummary[] }[];
  path: TemplatePathLike;
}): Promise<{ groups: PluginScheduledTemplates[] }> {
  const seen = new Set<string>();
  const candidates: { plugin: ScheduledPluginSummary; pluginRoot: string }[] = [];
  for (const marketplace of marketplaces)
    for (const plugin of marketplace.plugins) {
      if (seen.has(plugin.id) || !plugin.enabled || !plugin.installed || plugin.availability !== "AVAILABLE") continue;
      seen.add(plugin.id);
      const pluginRoot = pluginRootFor({ codexHome, marketplaceName: marketplace.name, plugin });
      if (pluginRoot != null) candidates.push({ plugin, pluginRoot });
    }
  const groups = (
    await Promise.all(
      candidates.map(({ plugin, pluginRoot }) => readPluginTemplates({ filesystem, path, plugin, pluginRoot })),
    )
  )
    .filter((group): group is PluginScheduledTemplates => group != null)
    .sort((a, b) => a.plugin.displayName.localeCompare(b.plugin.displayName));
  return { groups };
}

/** 单插件模板组（原 `I3`）。 */
async function readPluginTemplates({ filesystem, path, plugin, pluginRoot }: { filesystem: TemplateFilesystemLike; path: TemplatePathLike; plugin: ScheduledPluginSummary; pluginRoot: string }): Promise<PluginScheduledTemplates | null> {
  const scheduledRoot = path.join(pluginRoot, "scheduled");
  const entries = await filesystem.readDirectory(scheduledRoot).catch(() => null);
  if (entries == null) return null;
  const jsonFiles = entries
    .filter((entry) => entry.isFile && entry.name.toLowerCase().endsWith(".json"))
    .sort((a, b) => a.name.localeCompare(b.name));
  const templates = (
    await Promise.all(
      jsonFiles.map((file) =>
        readScheduledFile({ fileName: file.name, filesystem, path, scheduledRoot }).catch(() => null),
      ),
    )
  ).filter((template): template is ScheduledTemplate => template != null);
  if (templates.length === 0) return null;
  return {
    plugin: { id: plugin.id, name: plugin.name, displayName: plugin.interface?.displayName?.trim() || plugin.name },
    templates,
  };
}

/** 单模板文件（原 `R3`：readFile → Response bytes → JSON → zod）。 */
async function readScheduledFile({ fileName, filesystem, path, scheduledRoot }: { fileName: string; filesystem: TemplateFilesystemLike; path: TemplatePathLike; scheduledRoot: string }): Promise<ScheduledTemplate | null> {
  const content = await new Response(await filesystem.readFile(path.join(scheduledRoot, fileName)) as BodyInit).arrayBuffer();
  return parseScheduledTemplate(fileName, JSON.parse(Buffer.from(content).toString("utf8")));
}

// ---------------------------------------------------------------------------
// 指令段常量（原 `B3`/`V3`/`H3`/`U3`/`W3`/`G3`/`K3`/`q3`/`J3`/`Y3`/`Z3`/`Q3`）
// ---------------------------------------------------------------------------

const DESKTOP_CONTEXT_SECTION = `# Codex desktop context
- You are running inside the Codex (desktop) app, which allows some additional features not available in the CLI alone:

### Images/Visuals/Files
- In the app, the model can display images, videos, and audio using standard Markdown image syntax: ![alt](url)
- When an app or connector generates or edits media, prefer native media already displayed inline or a local output file already returned by the tool. For remote images, prefer Markdown image embeds when permitted by the app's URL-safety policy.
- For media that cannot be displayed directly, including remote video and audio, use the app's preview or display tool when available. Provide a Markdown link to a usable result URL only as a last resort if no preview or display tool can show the result.
- Do not download remote media to work around display restrictions.
- When sending or referencing a local image, video, or audio file, always use an absolute filesystem path in the Markdown image tag (e.g., ![alt](/absolute/path.png)); relative paths and plain text will not render the media.
- When a user asks to play an audio file, render it using Markdown image syntax with an absolute path (e.g., ![audio](/absolute/path.mp3)).
- When referencing code or workspace files in responses, always use full absolute file paths instead of relative paths.
- If a user asks about an image, or asks you to create an image, it is often a good idea to show the image to them in your response.
- Return web URLs as Markdown links (e.g., [label](https://example.com)).`;

const WORKSPACE_DEPENDENCIES_SECTION =
  "### Workspace Dependencies\n- For sheets, slides, and documents, use the MCP server's `load_workspace_dependencies` tool (`mcp__codex_app__load_workspace_dependencies`) to find the bundled runtime and libraries.";

const PR_DIFF_LINKS_SECTION = `### Pull request diff links
When referencing code from a GitHub PR, you can link directly to its diff in the app using:
[label](codex://review?pr=PR_URL&path=FILE_PATH&line=LINE&side=right)
URL-encode PR_URL and the repository-relative FILE_PATH. Use a verified one-based LINE from the current PR diff. Use side=left for the original code or side=right for the updated code. Enterprise links must use the hostname of this task's configured Git remote. Use ordinary file links for workspace code.`;

const AUTOMATION_UPDATE_DIRECTIVE =
  "When the user asks to create, view, update, delete, or ask about automations, search for the `automation_update` tool first, then follow its schema instead of writing raw automation directives by hand.";

const AUTOMATIONS_SECTION = `### Automations
- This app supports recurring automations, reminders, monitors, follow-ups, and thread wakeups. ${AUTOMATION_UPDATE_DIRECTIVE}
- For heartbeat monitors, preserve the user's notification intent in the saved prompt. Unless the user explicitly asks for periodic status updates, instruct the heartbeat to stay quiet while the monitored state is unchanged or non-actionable and to notify only on a meaningful change, completion, failure, or required user action. Do not add instructions such as "leave a brief status update" on every run.
- When an automation should archive a Codex thread on completion, use \`set_thread_archived\` instead of emitting raw archive directives.`;

const THREAD_COORDINATION_SECTION =
  '### Thread Coordination\n- Treat the terms "task", "thread", "chat", and "conversation" as synonyms when they clearly refer to Codex. Tool names use the term "thread" and Codex uses "task" in the UI. When providing user-facing responses, use "task".\n- When the user asks to create, fork, inspect, continue, hand off, pin, archive, unarchive, rename, or otherwise manage Codex threads, search for the relevant thread tool first: `create_thread`, `fork_thread`, `list_threads`, `list_archived_threads`, `read_thread`, `wait_threads`, `send_message_to_thread`, `handoff_thread`, `set_thread_pinned`, `set_thread_archived`, or `set_thread_title`.\n- When following another task\'s progress, prefer compact `wait_threads` snapshots over repeated `read_thread` calls. Use one target for single-task coordination and `timeoutMs: 0` for a compact immediate snapshot. `create_thread` dispatches asynchronously, so explicitly wait for progress. Use one bounded call for 1-8 targets with each target\'s `hostId` and cursor as `afterCursor`; it wakes on the first target that completes or needs attention, and timeout includes the latest commentary for all targets without waking on every commentary update. An up-to-date cursor suppresses already-delivered final text. Separate waits from one task may run serially. Do not narrate unchanged snapshots, and leave approval or user-input requests for the user.\n- Only use `create_thread` when the user explicitly asks to create a new thread. Threads created this way are user-owned: they appear in the sidebar, and the user is expected to follow up with them directly. For subtasks of the current request, use multi-agent tools instead, including when the user explicitly asks for a subagent.\n- After a successful `create_thread` call, emit `::created-thread{threadId="..."}` for a created thread or `::created-thread{clientThreadId="..."}` for queued worktree setup on its own line in your final response.';

const SIDEBAR_ORGANIZATION_SECTION =
  "### Sidebar Organization\n- Use `list_threads` to inspect pinned, custom, project, and task sidebar sections, and `list_projects` for project details. Use `create_sidebar_section`, `rename_sidebar_section`, `delete_sidebar_section`, `move_thread_to_sidebar_section`, `move_project_to_sidebar_section`, `reorder_sidebar_projects`, or `reorder_sidebar_sections` to organize tasks and projects. Moving an item into the pinned section pins it.";

const NON_TECHNICAL_UI_SECTION = `### Non-technical UI
- The user has requested a non-technical UI.
- The app will take care of aspects of this, such as hiding bash tool outputs and similar.
- Prefer non-technical language when conversing with the user. For example, don't name bash commands you're running. Instead, describe what they do.
- When writing code to perform non-coding tasks--such as writing and running python to build slide artifacts--avoid mentioning or citing these intermediate code items. Just focus on outputs.
- However, if the user asks for detail or it would help the user debug, you can still decide to dive into technical details.`;

const INLINE_CODE_COMMENTS_SECTION = `### Inline Code Comments
- Use the ::code-comment{...} directive when you need to attach feedback directly to specific code lines.
- Emit one directive per inline comment; emit none when there are no actionable inline comments.
- Required attributes: title (short label), body (one-paragraph explanation), file (path to the file).
- Optional attributes: start, end (1-based line numbers), priority (0-3).
- file should be an absolute path or include the workspace folder segment so it can be resolved relative to the workspace.
- Keep line ranges tight; end defaults to start.
- Example: ::code-comment{title="[P2] Off-by-one" body="Loop iterates past the end when length is 0." file="/path/to/foo.ts" start=10 end=11 priority=2}`;

const INLINE_ARTIFACT_SECTION =
  '### Inline Artifact Follow-Ups\n- Format each artifact follow-up as an unescaped Markdown list item, `- :codex-followup[visible phrase]{prompt="Complete user request"}`; avoid closing brackets in the visible phrase and escape double quotes in the prompt.';

const HEARTBEAT_AUTOMATION_UPDATE_REPLACEMENT =
  'The current heartbeat trigger includes `<automation_id>`. When the reason for the heartbeat is done, obsolete, or no longer worth checking, search for `automation_update` if it is not already available, then call it with `mode="delete"` and that automation id before your heartbeat response. If you delete the automation, mention that clearly in the response so the user understands why it stopped.';

const HEARTBEATS_SECTION = `## Heartbeats

Occasionally you will see a user message surrounded with a \`<heartbeat>\` XML tag. This is a special heartbeat message. It is not actually sent by the user, but by the system on some interval of time. The purpose of heartbeats is to make you feel magical and proactive. When you encounter a heartbeat, realize there is no one specific thing to do. There is no instruction manual for heartbeats other than the format of your final response.

A general guideline is to use your existing tools and capabilities. Orient yourself, be proactive, and think big picture. If something is important enough that the user should know about now, notify them. Otherwise, stay quiet.

Routine polling results are quiet by default. Choose \`DONT_NOTIFY\` when the monitored state is unchanged or still non-actionable, such as pending, queued, in progress, or healthy. Choose \`NOTIFY\` only for a meaningful update the user should know about now, such as completion, failure, a material state change, or required user action. Do not treat the heartbeat firing, work performed, or an automation prompt's generic request for a status update as sufficient reason to notify. Honor routine periodic updates only when the user explicitly asked for them.

\`\`\`xml
<heartbeat>
  <automation_id>automation id string</automation_id>
  <decision>NOTIFY</decision>
  <message>One short user-facing notification message.</message>
</heartbeat>
\`\`\`

\`\`\`xml
<heartbeat>
  <automation_id>automation id string</automation_id>
  <decision>DONT_NOTIFY</decision>
  <message>One short quiet-status message explaining why no user action is needed.</message>
</heartbeat>
\`\`\`

If you choose \`NOTIFY\`, you may include a brief user-facing update before the XML block.
If you choose \`DONT_NOTIFY\`, include the short quiet-status \`<message>\`, but do not include any user-facing prose outside the XML block, including commentary or progress updates while the heartbeat runs.

Every heartbeat turn must end with exactly one non-empty final response containing one of the XML blocks above. Never finish a heartbeat with an empty final response, even when there is no change to report; return the \`DONT_NOTIFY\` block with a short quiet-status message instead.

${HEARTBEAT_AUTOMATION_UPDATE_REPLACEMENT} If the task has changed and the heartbeat is still useful, update the automation instead of leaving stale instructions in place.`;

// ---------------------------------------------------------------------------
// 指令组装（原 `z3`/`$3`/`X3`/`e6`/`t6`/`n6`/`i6`/`a6`/`r6`）
// ---------------------------------------------------------------------------

/** app-context 包装（原 `z3`）。 */
function wrapAppContext(section: string): string {
  return `<app-context>\n${section.trim()}\n</app-context>`;
}

/** 非空段连接（原 `$3`）。 */
function joinSections(...sections: (string | null | undefined)[]): string {
  return sections
    .map((section) => section?.trim())
    .filter((section): section is string => section != null && section.length > 0)
    .join("\n\n");
}

/** 桌面上下文段（原 `X3`）。 */
function desktopContextSection({
  instructionOverrides,
  sidebarSectionToolsEnabled = false,
  threadToolsEnabled = false,
  workspaceDependenciesEnabled = false,
  includeProseDetailLevelInstructions = false,
}: {
  instructionOverrides?: { desktopContextSection?: string; workspaceDependenciesSection?: string } | null;
  sidebarSectionToolsEnabled?: boolean;
  threadToolsEnabled?: boolean;
  workspaceDependenciesEnabled?: boolean;
  includeProseDetailLevelInstructions?: boolean;
} = {}): string {
  const threadCoordination = threadToolsEnabled && sidebarSectionToolsEnabled
    ? THREAD_COORDINATION_SECTION.replace("`set_thread_pinned`, ", "")
    : THREAD_COORDINATION_SECTION;
  return joinSections(
    instructionOverrides?.desktopContextSection ?? DESKTOP_CONTEXT_SECTION,
    PR_DIFF_LINKS_SECTION,
    workspaceDependenciesEnabled ? (instructionOverrides?.workspaceDependenciesSection ?? WORKSPACE_DEPENDENCIES_SECTION) : null,
    AUTOMATIONS_SECTION,
    threadToolsEnabled ? threadCoordination : null,
    threadToolsEnabled && sidebarSectionToolsEnabled ? SIDEBAR_ORGANIZATION_SECTION : null,
    includeProseDetailLevelInstructions ? NON_TECHNICAL_UI_SECTION : null,
    INLINE_CODE_COMMENTS_SECTION,
    INLINE_ARTIFACT_SECTION,
  );
}

// 模块加载期形状检查（原 `z3(X3())` 顶层调用）。
void wrapAppContext(desktopContextSection());

/** git 指令段（原 `e6`）。 */
function gitSection(gitSettings?: { branchPrefix?: string | null; commitInstructions?: string | null; pullRequestInstructions?: string | null } | null): string {
  const lines: string[] = [];
  const { branchPrefix, commitInstructions, pullRequestInstructions } = gitSettings ?? {};
  if (branchPrefix != null && branchPrefix.trim().length > 0)
    lines.push(
      `- Branch prefix: \`${branchPrefix.trim()}\`. Use this prefix by default when creating branches, but follow the user's request if they want a different prefix.`,
    );
  if (commitInstructions != null && commitInstructions.trim().length > 0)
    lines.push(`- Commit instructions: ${commitInstructions.trim()}`);
  if (pullRequestInstructions != null && pullRequestInstructions.trim().length > 0)
    lines.push(`- Pull request instructions: ${pullRequestInstructions.trim()}`);
  if (lines.length === 0) return "";
  return `### Git\n${lines.join("\n")}`;
}

/** 心跳段（原 `t6`）。 */
function heartbeatsSection(enabled: boolean): string {
  return enabled ? HEARTBEATS_SECTION : "";
}

/** hosted automations 替换（原 `n6`）。 */
function hostedAutomationsVariants(text: string): string {
  return text
    .replaceAll(
      AUTOMATION_UPDATE_DIRECTIVE,
      "When the user asks to create, view, update, stop, or ask about automations, use the `automations` app. Search for its `create`, `update`, `list`, or `peek` tool as needed, then follow its schema instead of writing raw automation directives by hand.\n- Target the current task by default. Set `project_id` only when the user requests a standalone project automation. Multiple automations can target the same task.\n- To stop an automation, use `update` with its id as `jawbone_id` and `is_enabled=false`. To resume it, use `is_enabled=true`. A stopped automation is paused, not deleted.",
    )
    .replaceAll(
      HEARTBEAT_AUTOMATION_UPDATE_REPLACEMENT,
      "The current heartbeat trigger includes `<automation_id>`. When the reason for the heartbeat is done, obsolete, or no longer worth checking, use the `automations` app's `update` tool with `jawbone_id` set to that automation id and `is_enabled=false` before your heartbeat response. Search for the tool if it is not already available. If the update succeeds, mention in the response that you paused the automation so the user understands why it stopped. If it fails, report the failure instead of claiming the automation stopped.",
    );
}

/** 指令组装参数。 */
export interface AgentInstructionsInput {
  baseInstructions?: string | null;
  gitSettings?: { branchPrefix?: string | null; commitInstructions?: string | null; pullRequestInstructions?: string | null } | null;
  instructionOverrides?: { desktopContextSection?: string; workspaceDependenciesSection?: string } | null;
  isNonGitWorkspace?: boolean;
  heartbeatEnabled?: boolean;
  sidebarSectionToolsEnabled?: boolean;
  threadToolsEnabled?: boolean;
  workspaceDependenciesEnabled?: boolean;
  includeProseDetailLevelInstructions?: boolean;
  hostedAutomationsEnabled?: boolean;
}

/**
 * 完整 agent 指令（原 `i6`，导出 `Rt`）。
 * desktop context 段 + 心跳段 + git 段（非 git 工作区跳过），包 app-context。
 */
export function agentInstructions({
  baseInstructions,
  gitSettings,
  instructionOverrides,
  isNonGitWorkspace = false,
  heartbeatEnabled,
  sidebarSectionToolsEnabled = false,
  threadToolsEnabled = false,
  workspaceDependenciesEnabled = false,
  includeProseDetailLevelInstructions = false,
  hostedAutomationsEnabled = false,
}: AgentInstructionsInput): string {
  const context = wrapAppContext(
    desktopContextSection({
      instructionOverrides,
      sidebarSectionToolsEnabled,
      threadToolsEnabled,
      workspaceDependenciesEnabled,
      includeProseDetailLevelInstructions,
    }),
  );
  const combined = joinSections(context, heartbeatsSection(heartbeatEnabled), isNonGitWorkspace ? null : gitSection(gitSettings));
  const merged = joinSections(baseInstructions ?? "", combined);
  return hostedAutomationsEnabled ? hostedAutomationsVariants(merged) : merged;
}

/** 心跳活跃判定注入面（原 `zB` 依赖：threadId 是否有 ACTIVE heartbeat）。 */
export let isHeartbeatActiveForThread: (threadId: string) => boolean = () => false;

/** 安装心跳活跃判定（shared 内部接线，供 `a6` 使用）。 */
export function installHeartbeatActivityProbe(probe: (threadId: string) => boolean): void {
  isHeartbeatActiveForThread = probe;
}

/**
 * thread 绑定指令（原 `a6`，导出 `Bt`）。
 * heartbeatEnabled 由 threadId 的活跃 heartbeat 决定。
 */
export function agentInstructionsForThread({
  baseInstructions,
  gitSettings,
  instructionOverrides,
  threadId,
  isNonGitWorkspace = false,
  sidebarSectionToolsEnabled = false,
  threadToolsEnabled = false,
  workspaceDependenciesEnabled = false,
  includeProseDetailLevelInstructions = false,
  hostedAutomationsEnabled = false,
}: AgentInstructionsInput & { threadId: string | null }): string {
  return agentInstructions({
    baseInstructions,
    gitSettings,
    instructionOverrides,
    isNonGitWorkspace,
    heartbeatEnabled: threadId != null && isHeartbeatActiveForThread(threadId),
    sidebarSectionToolsEnabled,
    threadToolsEnabled,
    workspaceDependenciesEnabled,
    includeProseDetailLevelInstructions,
    hostedAutomationsEnabled,
  });
}

/**
 * 基础指令与心跳段合并（原 `r6`，导出 `zt`）。
 */
export function withHeartbeatInstructions({
  baseInstructions,
  hostedAutomationsEnabled = false,
}: {
  baseInstructions?: string | null;
  hostedAutomationsEnabled?: boolean;
}): string {
  const heartbeats = hostedAutomationsEnabled ? hostedAutomationsVariants(HEARTBEATS_SECTION) : HEARTBEATS_SECTION;
  const merged = hostedAutomationsEnabled ? hostedAutomationsVariants(baseInstructions ?? "") : baseInstructions ?? "";
  return merged.includes(heartbeats) ? merged : joinSections(merged, heartbeats);
}

// ---------------------------------------------------------------------------
// 兼容导出（agent-instructions 分区 5 个压缩名）
// ---------------------------------------------------------------------------

export {
  agentInstructionsForThread as Bt,
  permissionsForInstructions as Ht,
  agentInstructions as Rt,
  collectScheduledTemplates as Vt,
  withHeartbeatInstructions as zt,
};
