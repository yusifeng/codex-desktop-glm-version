// 桌面 feature availability（特性开关）状态模块（原版 3,265-3,438 + 3,088 rr 门）。
//
// 职责：
//   - 60+ 桌面特性开关的 zod schema（原 _r）与其 partial 严格变体（原 kte）；
//   - 全量默认值表（原 vr）、当前状态快照（原 br，模块级可变）、已加载标志
//     （原 xr）、两类订阅集——全量变更订阅（原 Sr）与 access 三态订阅（原 Cr）；
//   - 读取器：getDesktopFeatureAvailability（原 Tr，直接返回当前状态对象——
//     懒读取，调用期求值）、getDesktopAccessState（原 Er，未加载时返回
//     `{status:"loading"}`）；
//   - 订阅：Ate/Dr（返回反订阅函数）；
//   - 校验/比较/更新：Or（schema 校验）、jte（逐键差异）、kr（更新并通知，
//     首次三键齐备时置 ready）、Ar（叠加 win32 computer-use env 开关、Dev
//     flavor 的 CODEX_ELECTRON_DESKTOP_FEATURE_OVERRIDES 覆盖与 deviceAttestation）。
//
// 依赖约束：仅依赖 @chunk/shared 与 @chunk/bootstrap（BuildFlavor）。
// 深析 §7：Tr()/Er() 必须保持懒求值——本模块只在定义时构造空容器与常量，
// 无 Electron/fs/定时器副作用。
//
// 语义不确定点：
//   - 深析 §4 把状态更新器记作 `jr/Mr`(3,456-3,505)；核实原文后更新器是
//     `kr`(3,402-3,421)，3,453 的 `jr/Mr` 是本地 projects 读取器（属
//     projects-state-readers 簇，不在本模块）。
//   - 原文 `rr()`（3,088）是 deviceAttestation 的 darwin/win32 平台门，
//     属 devicecheck-attestation 簇（3,084-3,264，未派发）；availability 的
//     默认值/Ar 需要它，故此处按原语义内联同名实现，devicecheck 簇重写后
//     应改 import 并删除本副本。

import {
  wf as zObject,
  gf as zBool,
  Cf as zNumber,
  bf as zLiteral,
  Pf as zString,
  Ia as openLinkTargetPreference,
} from "@chunk/shared";
import { in as BuildFlavor } from "@chunk/bootstrap";

/** devicecheck attestation 的平台门（原 rr，3,088-3,090）。 */
export function deviceAttestationSupported({
  platform = process.platform,
}: { platform?: NodeJS.Platform } = {}): boolean {
  return platform === `darwin` || platform === `win32`;
}

// ---------------------------------------------------------------------------
// schema
// ---------------------------------------------------------------------------

/** 桌面特性开关全集 schema（原 _r，3,265-3,314）。 */
export const desktopFeatureAvailabilitySchema = zObject({
  ambientSuggestions: zBool(),
  ambientSuggestionsFeatureDiscovery: zBool(),
  noPluginListPhase2: zBool(),
  noPluginListPhase4: zBool(),
  ambientSuggestionsStaleTimeMs: zNumber().int().nonnegative().nullable(),
  appshotsEnabled: zBool(),
  artifactSession: zBool(),
  artifactTemplatePicker: zBool(),
  autoAuthForSites: zBool(),
  cuaPIP: zBool(),
  codexLocalAccess: zBool(),
  workCloudAccess: zBool(),
  workLocalAccess: zBool(),
  browserPane: zBool(),
  browserExtensions: zBool(),
  browserSettingsCloudSync: zBool(),
  inAppBrowserUse: zBool(),
  inAppBrowserUseAllowed: zBool(),
  inAppBrowserUseHistory: zBool(),
  browserUseTinysky: zBool(),
  defaultLinkOpenTargetPreference: openLinkTargetPreference.openLinkInTargetPreference.schema,
  localBackend: zBool(),
  localProjectTaskMembership: zBool(),
  localAutomationHabitatMigration: zBool(),
  externalBrowserUse: zBool(),
  externalBrowserUseAllowed: zBool(),
  computerUse: zBool(),
  computerUseAutoInstall: zBool(),
  nodeReplEnforceModelCheck: zBool(),
  messages: zBool(),
  recordAndReplay: zBool(),
  skysight: zBool(),
  sites: zBool(),
  control: zBool(),
  deviceAttestation: zBool(),
  dil: zBool(),
  multiWindow: zBool(),
  unifiedTabStrip: zBool(),
  quickChat: zBool(),
  remoteControlClientScopedEnvironments: zBool(),
  webMcp: zBool(),
  webMcpMaxTools: zNumber().int().positive(),
  codeReviewPlugin: zBool(),
  deepResearch: zBool(),
  userWriting: zBool(),
  visualizeLive: zBool(),
  visualizeTreatment: zBool(),
  workspaceDir: zBool(),
});

/** partial().strict() 变体（原 kte，3,315）：env 覆盖解析用。 */
export const desktopFeatureAvailabilityOverrideSchema = desktopFeatureAvailabilitySchema
  .partial()
  .strict();

// ---------------------------------------------------------------------------
// 状态（模块级可变，深析 §4）
// ---------------------------------------------------------------------------

/** 全量默认值（原 vr，3,316-3,365）。 */
export const DEFAULT_DESKTOP_FEATURE_AVAILABILITY = {
  ambientSuggestions: false,
  ambientSuggestionsFeatureDiscovery: false,
  noPluginListPhase2: false,
  noPluginListPhase4: false,
  ambientSuggestionsStaleTimeMs: null,
  appshotsEnabled: false,
  artifactSession: false,
  artifactTemplatePicker: false,
  autoAuthForSites: false,
  cuaPIP: false,
  codexLocalAccess: false,
  workCloudAccess: false,
  workLocalAccess: false,
  browserPane: false,
  browserExtensions: false,
  browserSettingsCloudSync: false,
  inAppBrowserUse: false,
  inAppBrowserUseAllowed: false,
  inAppBrowserUseHistory: false,
  browserUseTinysky: false,
  defaultLinkOpenTargetPreference: `external-browser`,
  localBackend: false,
  localProjectTaskMembership: false,
  localAutomationHabitatMigration: false,
  externalBrowserUse: false,
  externalBrowserUseAllowed: false,
  computerUse: false,
  computerUseAutoInstall: false,
  nodeReplEnforceModelCheck: false,
  messages: false,
  recordAndReplay: false,
  skysight: false,
  sites: false,
  control: false,
  deviceAttestation: deviceAttestationSupported(),
  dil: false,
  multiWindow: false,
  unifiedTabStrip: false,
  quickChat: false,
  remoteControlClientScopedEnvironments: false,
  webMcp: false,
  webMcpMaxTools: 100,
  codeReviewPlugin: false,
  deepResearch: false,
  userWriting: false,
  visualizeLive: false,
  visualizeTreatment: false,
  workspaceDir: false,
} as Record<string, unknown>;

/** 键名列表（原 yr，3,366）。 */
export const DESKTOP_FEATURE_KEYS = Object.keys(DEFAULT_DESKTOP_FEATURE_AVAILABILITY);

/** 当前状态（原 br，3,367——kr 更新时整体替换）。 */
let currentAvailability: Record<string, unknown> = { ...DEFAULT_DESKTOP_FEATURE_AVAILABILITY };

/** 已加载（三键齐备）标志（原 xr，3,368）。 */
let availabilityLoaded = false;

/** 全量变更订阅集（原 Sr，3,369）。 */
const availabilityChangeSubscribers = new Set<() => void>();

/** access 三态（codexLocalAccess 等）订阅集（原 Cr，3,370）。 */
const accessStateSubscribers = new Set<() => void>();

/** env 覆盖变量名（原 wr，3,371）。 */
export const FEATURE_OVERRIDES_ENV = `CODEX_ELECTRON_DESKTOP_FEATURE_OVERRIDES`;

// ---------------------------------------------------------------------------
// 读取器与订阅
// ---------------------------------------------------------------------------

/** 当前 feature availability（原 Tr，3,372；懒读取，调用期求值）。 */
export function getDesktopFeatureAvailability(): Record<string, unknown> {
  return currentAvailability;
}

/**
 * access 三态（原 Er，3,375-3,379）：未加载返回 `{status:"loading"}`，
 * 已加载返回 ready + codex/workCloud/workLocal 三键。
 */
export function getDesktopAccessState():
  | { status: `loading` }
  | {
      status: `ready`;
      codexLocalAccess: unknown;
      workCloudAccess: unknown;
      workLocalAccess: unknown;
    } {
  if (!availabilityLoaded) return { status: `loading` };
  let { codexLocalAccess, workCloudAccess, workLocalAccess } = currentAvailability as {
    codexLocalAccess: unknown;
    workCloudAccess: unknown;
    workLocalAccess: unknown;
  };
  return { status: `ready`, codexLocalAccess, workCloudAccess, workLocalAccess };
}

/** 订阅全量变更（原 Ate，3,380-3,387）。 */
export function subscribeDesktopFeatureAvailabilityChanged(listener: () => void): () => void {
  availabilityChangeSubscribers.add(listener);
  return () => {
    availabilityChangeSubscribers.delete(listener);
  };
}

/** 订阅 access 三态变更（原 Dr，3,388-3,395）。 */
export function subscribeDesktopAccessStateChanged(listener: () => void): () => void {
  accessStateSubscribers.add(listener);
  return () => {
    accessStateSubscribers.delete(listener);
  };
}

// ---------------------------------------------------------------------------
// 校验 / 比较 / 更新
// ---------------------------------------------------------------------------

/** schema 校验（原 Or，3,396-3,398）。 */
export function isValidDesktopFeatureAvailability(input: unknown): boolean {
  return desktopFeatureAvailabilitySchema.safeParse(input).success;
}

/** 逐键差异判定（原 jte，3,399-3,401）。 */
export function hasDesktopFeatureAvailabilityDiff(
  a: Record<string, unknown>,
  b: Record<string, unknown>,
): boolean {
  return DESKTOP_FEATURE_KEYS.some((key) => a[key] !== b[key]);
}

/**
 * 更新状态并通知订阅者（原 kr，3,402-3,421）。
 * - 合并时强制 deviceAttestation 重算（不信任远端开关）；
 * - 三键（codexLocalAccess/workCloudAccess/workLocalAccess）齐备时置 ready
 *   （只升不降）；
 * - ready 前置位或三键变化时额外通知 accessState 订阅者。
 * 返回是否存在键级差异。
 */
export function updateDesktopFeatureAvailability(
  patch: Record<string, unknown>,
): boolean {
  let becomingReady =
    !availabilityLoaded &&
    patch.codexLocalAccess != null &&
    patch.workCloudAccess != null &&
    patch.workLocalAccess != null;
  let next = {
    ...currentAvailability,
    ...patch,
    deviceAttestation: deviceAttestationSupported(),
  };
  let hasDiff = DESKTOP_FEATURE_KEYS.some((key) => next[key] !== currentAvailability[key]);
  let accessChanged =
    next.codexLocalAccess !== currentAvailability.codexLocalAccess ||
    next.workCloudAccess !== currentAvailability.workCloudAccess ||
    next.workLocalAccess !== currentAvailability.workLocalAccess;
  if (hasDiff) {
    currentAvailability = next;
    availabilityChangeSubscribers.forEach((listener) => listener());
  }
  if (becomingReady) availabilityLoaded = true;
  if (availabilityLoaded && (becomingReady || accessChanged)) {
    accessStateSubscribers.forEach((listener) => {
      listener();
    });
  }
  return hasDiff;
}

// ---------------------------------------------------------------------------
// 配置装配
// ---------------------------------------------------------------------------

/**
 * 叠加平台/env 覆盖（原 Ar，3,422-3,438）：
 * - win32 且 CODEX_ELECTRON_ENABLE_WINDOWS_COMPUTER_USE === "1" 时强制 computerUse；
 * - Dev flavor 时解析 FEATURE_OVERRIDES_ENV 的 JSON 覆盖（Mte）；
 * - 最后重算 deviceAttestation。
 */
export function resolveDesktopFeatureAvailability(
  availability: Record<string, unknown>,
  {
    buildFlavor = BuildFlavor.resolve(),
    env = process.env,
    platform = process.platform,
  }: {
    buildFlavor?: unknown;
    env?: Record<string, string | undefined>;
    platform?: NodeJS.Platform;
  } = {},
): Record<string, unknown> {
  let withPlatform =
    platform === `win32` && env.CODEX_ELECTRON_ENABLE_WINDOWS_COMPUTER_USE === `1`
      ? { ...availability, computerUse: true }
      : availability;
  let overrides = buildFlavor === BuildFlavor.Dev ? parseFeatureOverrides(env) : null;
  return overrides == null
    ? { ...withPlatform, deviceAttestation: deviceAttestationSupported({ platform }) }
    : {
        ...withPlatform,
        ...overrides,
        deviceAttestation: deviceAttestationSupported({ platform }),
      };
}

/** 解析 env 的 JSON 覆盖（原 Mte，3,439-3,452；仅在 Dev flavor 下调用）。 */
function parseFeatureOverrides(
  env: Record<string, string | undefined>,
): Record<string, unknown> | null {
  let raw = env[FEATURE_OVERRIDES_ENV]?.trim();
  if (!raw) return null;
  let parsed = JSON.parse(raw);
  if (typeof parsed != `object` || !parsed || Array.isArray(parsed))
    throw Error(`${FEATURE_OVERRIDES_ENV} must be a JSON object`);
  let result = desktopFeatureAvailabilityOverrideSchema.safeParse(parsed);
  if (!result.success) {
    let detail = result.error.issues
      .map(
        (issue: { path: (string | number)[]; message: string }) =>
          `${FEATURE_OVERRIDES_ENV}${
            issue.path.length > 0 ? `.${issue.path.join(`.`)}` : ``
          }: ${issue.message}`,
      )
      .join(`; `);
    throw Error(detail);
  }
  return result.data;
}
