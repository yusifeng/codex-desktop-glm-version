// hosts-wsl-plugins shared helpers consumed by the main process.
import { homedir } from "node:os";
import { join, normalize, sep } from "node:path";
import { z } from "zod";
import { BUNDLED_PLUGIN_DESCRIPTORS, DEFAULT_MARKETPLACE_NAME } from "./app-constants";
import { changeTouchesVisualizationArtifact } from "./browser-context";
import { isDurableHost, isRemoteHostConfig, isSshHostConfig, normalizeProjectPath } from "./host-config";
import { isWslPath, resolveCodexHome } from "./wsl-paths";

export function errorToMessage(error: unknown): string { if (error instanceof Error) return error.message; if (typeof error === "string") return error; if (error && typeof error === "object" && "message" in error && typeof error.message === "string") return error.message; try { return JSON.stringify(error); } catch { return String(error); } }
export const errorMessage = errorToMessage, errorToString = errorToMessage, toError = errorToMessage;
export const sharedIdentity = <T>(value: T): T => value;
export const parsePluginId = (value: string): string | null => /^[A-Za-z0-9][A-Za-z0-9._-]*$/.test(value.trim()) ? value.trim() : null;
export const isKnownMarketplaceName = (value: unknown): boolean => typeof value === "string" && /^[a-z0-9][a-z0-9._-]{0,127}$/.test(value);
export function parseThreadDeepLink(value: URL | string, options: { allowExtraPathSegments?: boolean } = {}) { const url = typeof value === "string" ? new URL(value) : value; const parts = url.pathname.split("/").filter(Boolean); if (parts[0] !== "threads" || !parts[1] || (!options.allowExtraPathSegments && parts.length !== 2)) return null; return { threadId: decodeURIComponent(parts[1]), ...(url.searchParams.has("project_id") ? { projectId: url.searchParams.get("project_id")! } : {}) }; }
export function parseMcpAppDeepLink(value: URL | string) { const url = typeof value === "string" ? new URL(value) : value; if (url.protocol !== "codex:" || url.hostname !== "mcp-app") return null; const target = url.searchParams.get("url") ?? url.searchParams.get("uri"); return target ? { url: target, ...(url.searchParams.has("plugin") ? { pluginId: url.searchParams.get("plugin")! } : {}) } : null; }
export const codexAppModeSchema = () => z.string();
export const appNameForFlavor = (flavor: unknown): string => flavor === "codex" || flavor === "dev" || flavor === "agent" ? "Codex" : "ChatGPT";
export const expandHomeDir = (value: string): string => value === "~" ? homedir() : value.startsWith(`~${sep}`) ? join(homedir(), value.slice(2)) : value;
export const normalizePath = (value: string): string => normalize(expandHomeDir(value));
export const normalizeWorktreeRoot = normalizePath;
export const joinProjectRootsAsCwd = (roots: readonly string[]): string | undefined => roots.length ? roots.map(normalizePath).sort((a, b) => a.length - b.length)[0] : undefined;
export const compareProjectsShared = (a: { projectId?: string }, b: { projectId?: string }): number => (a.projectId ?? "").localeCompare(b.projectId ?? "");
export const isGitSource = (value: string | null | undefined): boolean => value === "git" || value === "github";
export const GIT_SOURCE_HEADER_KEY = "x-codex-git-source";
export const LONG_LIVED_HOST_ID = "long-lived", DURABLE_HOST_ID = "durable";
export const DEFAULT_THREAD_SOURCE_KINDS = ["local", "remote", "wsl", "ssh"] as const;
export const archiveUndoDurationMs = 60_000;
export const settingsGroup = (key: string): string => key.split(".")[0] ?? key;
export const settingsKeys = (keys: readonly string[]): string[] => [...keys];
export const defaultModeSettings = Object.freeze({}), conversationDetailSettings = Object.freeze({});
export function mapValuesModule() { return { default<T, R>(object: Record<string, T>, mapper: (value: T, key: string, source: Record<string, T>) => R): Record<string, R> { return Object.fromEntries(Object.entries(object).map(([key, value]) => [key, mapper(value, key, object)])); } }; }
export const lodashGetModule = () => ({ get: (object: unknown, path: string, fallback?: unknown) => path.split(".").reduce<unknown>((v, k) => v && typeof v === "object" ? (v as Record<string, unknown>)[k] : undefined, object) ?? fallback });
export const unwrapStoredValue = (value: unknown): unknown => value && typeof value === "object" && "value" in value ? (value as { value: unknown }).value : value;
export const readDesktopTomlSection = (value: unknown, section: string): Record<string, unknown> => { const root = value && typeof value === "object" ? value as Record<string, unknown> : {}; const selected = root[section]; return selected && typeof selected === "object" ? selected as Record<string, unknown> : {}; };
export const turnSummaryKind = (value: unknown): string => typeof value === "string" ? value : "unknown";
export const visualizationIdForThread = (id: string): string => `thread:${id}`;
export const isNotificationMethod = (method: string): boolean => method.startsWith("notifications/") || method.includes("/notification");
export const isRealtimeVoiceThread = (id: string): boolean => id.startsWith("realtime-") || id.includes(":realtime:");
export const isMcpMethodNotFoundError = (error: unknown, method: string): boolean => { const text = errorToMessage(error).toLowerCase(); return text.includes("method not found") || text.includes("-32601") || text.includes(`unknown method ${method.toLowerCase()}`); };
export const isUntrustedQueueContext = (value: unknown): boolean => Boolean(value && typeof value === "object" && (value as Record<string, unknown>).trusted === false);
export const untrustedQueueContextError = "Queue context is not trusted";
export const isAddedFileAttachment = (value: unknown): boolean => Boolean(value && typeof value === "object" && typeof (value as Record<string, unknown>).fsPath === "string");
export const isAllowedAttachmentType = ({ name, type }: { name: string; type: string }): boolean => /^(image\/|text\/|application\/(pdf|json|zip)$)/.test(type) || /\.(png|jpe?g|gif|webp|pdf|txt|md|json)$/i.test(name);
export const isSafeFilename = (value: string): boolean => Boolean(value) && value !== "." && value !== ".." && !/[\\/\0]/.test(value);
export const filterAddedFiles = <T extends { fsPath?: string; path?: string }>(files: readonly T[]): T[] => files.filter((file) => Boolean(file.fsPath ?? file.path));
export const stripTurnRequestForVersion = <T>(value: T): T => value;
export const parseThreadProjectAssignments = (value: unknown): Record<string, unknown> => value && typeof value === "object" ? value as Record<string, unknown> : {};
export const parseStoredJson = (value: unknown): unknown => { if (typeof value !== "string") return value; try { return JSON.parse(value); } catch { return undefined; } };
export const permissionSelectionToRequestFields = ({ permissionSelection }: { permissionSelection: unknown }): Record<string, unknown> => permissionSelection && typeof permissionSelection === "object" ? permissionSelection as Record<string, unknown> : {};
export const isDeleteChange = changeTouchesVisualizationArtifact;
export const extractBundleOperationErrorCode = (error: unknown): string | null => errorToMessage(error).match(/(?:code|error_code)[=: ]+([a-z0-9_-]+)/i)?.[1] ?? null;
export const sniffContentKind = (value: Uint8Array | string): string => { const bytes = typeof value === "string" ? new TextEncoder().encode(value) : value; return bytes[0] === 0x25 && bytes[1] === 0x50 ? "pdf" : bytes[0] === 0x50 && bytes[1] === 0x4b ? "zip" : "unknown"; };
export const withSpawnTracing = async <T>(operation: () => T | Promise<T>): Promise<T> => await operation();
export const shouldUseWslPathsForHostConfig = (config: { kind?: string | null } | null | undefined): boolean => isWslPath(config?.kind ?? "");
export const convertPathForWsl = (value: string): string => value;
export const pathForAgentEnvironmentShared = normalizeProjectPath;
export const wslHostPathShared = (value: string): string => value;
export const wslDistroNameShared = (): string | null => null;
export const localPluginPath = (home: string, marketplace: string, plugin: string): string => join(home, "plugins", marketplace, plugin);
export const getBundledPluginCachePath = (home: string, version: string, marketplace: string, plugin: string): string => join(home, "plugins", "cache", marketplace, plugin, version);
export const internalPluginsConfigSchema = z.record(z.string(), z.unknown());
export const enrollmentRecordSchema = z.record(z.string(), z.unknown());
export const keychainErrorOf = (error: unknown): { code?: string; message: string } => ({ message: errorToMessage(error), ...(error && typeof error === "object" && "code" in error && typeof error.code === "string" ? { code: error.code } : {}) });
export const parseJwt = (token: string): Record<string, unknown> | null => { try { return JSON.parse(Buffer.from(token.split(".")[1] ?? "", "base64url").toString("utf8")) as Record<string, unknown>; } catch { return null; } };
export const openLinkTargetPreference = (value: unknown): string => typeof value === "string" ? value : "system";
export const appServerFileSystem = Object.freeze({}), agentReadableSettings: readonly unknown[] = [], SETTINGS = Object.freeze({}), LOCAL_SETTINGS = Object.freeze({}), APPEARANCE_SETTINGS = Object.freeze({});
export const SETTING_DESCRIPTORS: readonly unknown[] = [], findSettingDescriptor = (_key: string): unknown => undefined, effectiveSettingValue = (_key: string, fallback: unknown): unknown => fallback, settingDefinitionFor = (_key: string): unknown => undefined;
export const settingKeyList = (keys: readonly string[]): string[] => [...keys], browserFamilyConfig = Object.freeze({}), zUnknownSchema = z.unknown(), shouldUseWslPaths = shouldUseWslPathsForHostConfig, buildWslEnvDirective = (value: string): string => value;
export const remoteControlEnrollmentAccountMismatch = "remote_control_enrollment_account_mismatch", parseSharedJson = parseStoredJson, sandboxScheme = "codex-sandbox", parseApiResponse = parseStoredJson, agentAccessVisible = [] as readonly unknown[];
export const normalizeThreadOrders = (value: unknown): unknown => value, defaultModeSettingsForHost = defaultModeSettings, settingsDescriptor = SETTINGS, appearanceSettings = APPEARANCE_SETTINGS, pluginsConfigSchema = internalPluginsConfigSchema, chromeTabFocusSchema = z.object({}), compareProjects = compareProjectsShared, mapSettingValue = effectiveSettingValue, hostValueMap = mapValuesModule, openLinkPreference = openLinkTargetPreference, flavorDirectoryName = (value: unknown): string => typeof value === "string" ? value : "prod", hostEnvironmentState = parseStoredJson, pluginState = parseStoredJson, shellEnvFlagKey = "CODEX_SHELL", tabsLivenessSchema = z.object({}), turnRequestStripper = stripTurnRequestForVersion, queueContextPredicate = isUntrustedQueueContext, sourceSettings = SETTINGS, sourceKinds = DEFAULT_THREAD_SOURCE_KINDS, tabMentionSearchSchema = z.object({}), errorAttributes = (error: unknown): Record<string, string> => ({ message: errorToMessage(error) }), installSharedTracingBridge = <T>(value: T): T => value, errorToSpanAttributes = errorAttributes, queueContextError = untrustedQueueContextError, unknownSchema = z.unknown(), safeAttachmentFilename = isSafeFilename;

export { isDurableHost, isRemoteHostConfig, isSshHostConfig, normalizeProjectPath, resolveCodexHome };
