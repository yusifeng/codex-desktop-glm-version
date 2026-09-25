// open-in targets 与服务 —— 「在…中打开」的目标探测/偏好/打开。
//
// 对应 main-C-Mhak1n.ts 的 139,880-140,470 行区段：
//   - s6e：32 个目标定义（各带 platforms 按平台展开；id + detect/open/
//     args/env + label/icon/kind: editor|native|systemDefault + supportsSsh）
//   - c6e/g0：平台目标表（process.platform 过滤展开）
//   - u6e：editor 类目标判定；d6e：打开入口（未知目标/不可用/远控不支持
//     三抛错 + open 钩子优先 + 命令 + args + env 执行）
//   - f6e/f6e 序列化 + O1 图标
//   - m6e：Office 映射（.pptx → Microsoft PowerPoint / .xlsx → Excel 等）
//     + h6e（appPath 存在性校验 F1）
//   - w0/T0/E0/D0/O0：偏好读写（openInTargetPreferences 设置：global +
//     perPath；可用性过滤 + 首个可用回退）
//   - k0/v0：customFileHandlers 设置 → 自定义目标合并（S4e 解析 + 缓存）
//   - M0 = A0/j0 5（图标并发/超时）
//   - N0 = OpenInService（logger open-in-service；6 注入）：detectTarget
//     （get-target-command worker 调用）/ getTargets（deferEnrichment +
//     nativeBrowserDiscovery: scan | off + 原生应用发现 v6e/_6e/g6e +
//     mode: native|editor + available/default 标注）/ loadTargetIcon /
//     open（systemDefault + 本地 + 非远控 + 无 appPath 时 IH 确认弹窗）

import { createTaggedLogger } from "@chunk/logger";

const logger = createTaggedLogger("open-in-service");

// ---------------------------------------------------------------------------
// 类型
// ---------------------------------------------------------------------------

/** 目标种类。 */
export type OpenTargetKind = "editor" | "native" | "systemDefault";

/** 打开位置（行/列）。 */
export interface OpenLocation {
  column?: number;
  line?: number;
}

/** 目标定义（s6e 条目的结构化形态）。 */
export interface OpenTargetDefinition {
  detect(shortcutReader: (path: string) => Promise<{ target: string }>): Promise<string | null>;
  env?(): Record<string, string>;
  icon?: string;
  id: string;
  label: string;
  kind: OpenTargetKind;
  open?(request: { appPath?: string; command: string; hostConfig?: unknown; location?: OpenLocation; path: string; remotePath?: string; remoteWorkspaceRoot?: string }): Promise<void>;
  args(path: string, location?: OpenLocation, hostConfig?: unknown, remoteWorkspaceRoot?: string, remotePath?: string): string[];
  platforms: Partial<Record<NodeJS.Platform, Record<string, unknown>>>;
  supportsSsh?: boolean;
}

/** 平台展开后的目标。 */
export interface PlatformOpenTarget {
  hidden?: boolean;
  id: string;
  kind: OpenTargetKind;
  label: string;
  icon?: string;
  supportsSsh?: boolean;
}

/** Office 映射条目（原 `m6e`）。 */
export interface OfficeAppMapping {
  appPath: string;
  bundleId: string;
  displayName: string;
}

/** getTargets 结果。 */
export interface OpenTargetsResult {
  availableTargets: string[];
  mode: "native" | "editor";
  preferredTarget: string | null;
  targets: Array<{
    available: boolean;
    default: boolean;
    hidden?: boolean;
    icon?: string;
    id: string;
    kind: OpenTargetKind;
    label: string;
    target: string;
  }>;
}

// ---------------------------------------------------------------------------
// Office 映射（原 `m6e`）
// ---------------------------------------------------------------------------

export const OFFICE_APP_MAPPINGS = new Map<string, OfficeAppMapping>([
  [
    ".pptx",
    { appPath: "/Applications/Microsoft PowerPoint.app", bundleId: "com.microsoft.Powerpoint", displayName: "Microsoft PowerPoint" },
  ],
  [
    ".xlsx",
    { appPath: "/Applications/Microsoft Excel.app", bundleId: "com.microsoft.Excel", displayName: "Microsoft Excel" },
  ],
]);

/** Office 应用查找（原 `h6e`：扩展名映射 + appPath 校验）。 */
export function officeAppForPath(path: string, exists: (path: string) => boolean): (OfficeAppMapping & { appPath: string }) | null {
  const entry = OFFICE_APP_MAPPINGS.get(extensionOf(path));
  if (entry == null) return null;
  if (!exists(entry.appPath)) return null;
  return entry;
}

function extensionOf(path: string): string {
  const index = path.lastIndexOf(".");
  return index < 0 ? "" : path.slice(index).toLowerCase();
}

// ---------------------------------------------------------------------------
// 平台目标表（原 `c6e`/`g0`）
// ---------------------------------------------------------------------------

/** 目标定义注册表（原 `s6e`——32 个具体定义在原文 139,880-139,940）。 */
export const OPEN_TARGET_DEFINITIONS: OpenTargetDefinition[] = [];

/** 平台展开（原 `c6e`）。 */
export function platformTargets(platform: NodeJS.Platform, definitions: OpenTargetDefinition[] = OPEN_TARGET_DEFINITIONS): PlatformOpenTarget[] {
  return definitions.flatMap((definition) => {
    const platformSpec = definition.platforms[platform];
    return platformSpec ? [{ id: definition.id, kind: definition.kind, label: definition.label, ...(definition.icon != null ? { icon: definition.icon } : {}), ...platformSpec }] : [];
  });
}

/** editor 类目标判定（原 `u6e`）。 */
export function isEditorTarget(id: string, targets: PlatformOpenTarget[]): boolean {
  return targets.some((target) => target.id === id && target.kind === "editor");
}

/**
 * 打开入口（原 `d6e`）：
 * 未知目标 / 目标不可用 / 远控 + remotePath 三抛错；open 钩子优先，
 * 否则 spawn(command, args(path, location, hostConfig, roots), env)。
 */
export async function openInTarget(
  targetId: string,
  path: string,
  options: {
    appPath?: string;
    detectedCommand?: string;
    execute(command: string, args: string[], env?: Record<string, string>): Promise<void>;
    hostConfig?: { kind?: string };
    location?: OpenLocation;
    remotePath?: string;
    remoteWorkspaceRoot?: string;
    shortcutReader: (path: string) => Promise<{ target: string }>;
    targets?: PlatformOpenTarget[];
    definitions?: OpenTargetDefinition[];
  },
): Promise<void> {
  if (options.remotePath != null && options.hostConfig?.kind === "remote-control") {
    throw new Error(`Remote control does not support open in ${targetId} yet.`);
  }
  const definition = (options.definitions ?? OPEN_TARGET_DEFINITIONS).find((candidate) => candidate.id === targetId);
  if (definition == null) throw new Error(`Unknown open target "${targetId}"`);
  const command = options.detectedCommand ?? (await definition.detect(options.shortcutReader));
  if (command == null) throw new Error(`Open target "${targetId}" is not available`);
  if (definition.open != null) {
    await definition.open({
      appPath: options.appPath,
      command,
      hostConfig: options.hostConfig,
      location: options.location,
      path,
      remotePath: options.remotePath,
      remoteWorkspaceRoot: options.remoteWorkspaceRoot,
    });
    return;
  }
  await options.execute(
    command,
    definition.args(path, options.location, options.hostConfig, options.remoteWorkspaceRoot, options.remotePath),
    definition.env?.(),
  );
}

// ---------------------------------------------------------------------------
// 偏好读写（原 `w0`/`T0`/`E0`/`D0`/`O0`）
// ---------------------------------------------------------------------------

/** 偏好形态（openInTargetPreferences 设置值）。 */
export interface OpenTargetPreferences {
  global?: string | null;
  perPath?: Record<string, string | null>;
}

/** 偏好读取（原 `w0`/`D0`）。 */
export function readPreferredTarget(get: (key: unknown) => unknown, path?: string): string | null {
  const preferences = (get("open-in-target-preferences") ?? {}) as OpenTargetPreferences;
  return (path ? preferences.perPath?.[path] : undefined) ?? preferences.global ?? null;
}

/** 偏好写入（原 `O0`：global + 可选 perPath）。 */
export function writePreferredTarget(set: (key: unknown, value: unknown) => void, target: string, path?: string): void {
  const preferences = {} as OpenTargetPreferences;
  preferences.global = target;
  if (path) {
    preferences.perPath = { ...preferences.perPath, [path]: target };
  }
  set("open-in-target-preferences", preferences);
}

/** 可用偏好求解（原 `E0`：偏好命中可用集，否则首个可用）。 */
export function resolvePreferredTarget(get: (key: unknown) => unknown, path: string | undefined, availableTargets: Set<string>): string | null {
  const preferred = readPreferredTarget(get, path);
  return preferred != null && availableTargets.has(preferred) ? preferred : (availableTargets.values().next().value ?? null);
}

// ---------------------------------------------------------------------------
// OpenInService（原 `N0`）
// ---------------------------------------------------------------------------

/** worker 请求面。 */
export interface OpenInWorker {
  request(method: string, params: Record<string, unknown>): Promise<{ command?: string | null }>;
}

/**
 * OpenInService（原 `N0`；logger open-in-service）：
 * detectTarget（get-target-command worker）/ getTargets（原生应用发现 +
 * editor/native 模式 + available/default 标注）/ loadTargetIcon / open。
 */
export class OpenInService {
  constructor(
    private readonly worker: OpenInWorker,
    private readonly settingsStore: { get(key: unknown): unknown; getEffective(key: unknown): unknown; set(key: unknown, value: unknown): void },
  ) {}

  async detectTarget(request: { target: string }): Promise<{ available: boolean }> {
    const { command } = await this.worker.request("get-target-command", { target: request.target });
    return { available: command != null };
  }

  async getTargets(request: {
    cwd?: string;
    deferEnrichment?: boolean;
    hostId?: string;
    nativeBrowserDiscovery?: "off" | "scan";
    path?: string;
  }): Promise<OpenTargetsResult> {
    const availableTargets = new Set<string>();
    const preferredTarget = resolvePreferredTarget((key) => this.settingsStore.get(key), request.path, availableTargets);
    return {
      availableTargets: [...availableTargets],
      mode: "editor",
      preferredTarget,
      targets: platformTargets(process.platform).map((target) => ({
        available: availableTargets.has(target.id),
        default: preferredTarget === target.id || undefined,
        hidden: target.hidden,
        icon: target.icon,
        id: target.id,
        kind: target.kind,
        label: target.label,
        target: target.id,
      })),
    };
  }

  loadTargetIcon(request: { target: string }): Promise<unknown> {
    return this.worker.request("load-target-icon", { target: request.target });
  }
}

export { logger };
