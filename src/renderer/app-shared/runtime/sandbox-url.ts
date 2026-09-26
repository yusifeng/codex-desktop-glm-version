const SANDBOX_PARTITION_PREFIX = "codex-mcp-app-sandbox";
const SANDBOX_HOST = "web-sandbox.oaiusercontent.com";
const INIT_ID_PARAMETER = "initId";
const SANDBOX_ID_PARAMETER = "sandboxId";

export const requiredSandboxMethods = [
  "navigate",
  "notifyMcpAppsHostContext",
  "notifyMcpAppsToolCancelled",
  "notifyMcpAppsToolInput",
  "notifyMcpAppsToolResult",
  "requestMcpAppsResourceTeardown",
  "runWidgetCode",
  "setAdditionalGlobals",
  "setSafeArea",
  "setTheme",
  "setWidgetData",
  "setWidgetView",
] as const;

export const optionalSandboxMethods = [
  "notifyMcpAppsMcpNotification",
  "prepareEnvironment",
  "runUserCode",
  "screenshot",
  "stop",
] as const;

const allowedSandboxMethods = new Set<string>([
  ...requiredSandboxMethods,
  ...optionalSandboxMethods,
]);

export interface SandboxPartitionOptions {
  persist?: boolean;
}

export interface SandboxOriginOptions {
  requireSkybridge?: boolean;
}

export interface SandboxEntryUrlOptions {
  locale: string;
  scheme?: "https" | "codex-sandbox";
  subdomain: string;
}

export interface SandboxInitializationOptions {
  initId: string;
  sandboxId: string;
  sourceUrl: string;
}

export type ResourceActivity = "read" | "created" | "updated";

export interface SandboxResourceActivity {
  id: string;
  url: string;
  title?: string;
  mimeType?: string;
  activities: ResourceActivity[];
}

export type SandboxResourceActivitiesResult =
  | { status: "absent" }
  | { status: "invalid" }
  | { status: "valid"; resources: SandboxResourceActivity[] };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value != null && !Array.isArray(value);
}

/** 原 `pVe` / 压缩导出 `QH`。 */
export function getSandboxResourceUri(metadata: unknown): string | null {
  if (!isRecord(metadata)) return null;
  const outputTemplate = metadata["openai/outputTemplate"];
  const flatResourceUri = metadata["ui/resourceUri"];
  const ui = metadata.ui;
  if (
    (outputTemplate != null && typeof outputTemplate !== "string") ||
    (flatResourceUri !== undefined && typeof flatResourceUri !== "string") ||
    (ui !== undefined && !isRecord(ui)) ||
    (isRecord(ui) &&
      ui.resourceUri !== undefined &&
      typeof ui.resourceUri !== "string")
  ) {
    return null;
  }
  return (
    (isRecord(ui) ? (ui.resourceUri as string | undefined) : undefined) ??
    (flatResourceUri as string | undefined) ??
    (outputTemplate as string | null | undefined) ??
    null
  );
}

/** 原 `_Ve` / 压缩导出 `JH`。 */
export function areSandboxMethodsAllowed(methods: readonly unknown[]): boolean {
  if (methods.some((method) => typeof method !== "string")) return false;
  const methodSet = new Set(methods as readonly string[]);
  return (
    methodSet.size === methods.length &&
    requiredSandboxMethods.every((method) => methodSet.has(method)) &&
    methods.every(
      (method) =>
        typeof method === "string" && allowedSandboxMethods.has(method),
    )
  );
}

/** 原 `SVe` / 压缩导出 `WH`。 */
export function createSandboxEntryUrl({
  locale,
  scheme = "https",
  subdomain,
}: SandboxEntryUrlOptions): string {
  const url = new URL(`${scheme}://${SANDBOX_HOST}`);
  url.hostname = `${subdomain}.${url.hostname}`;
  url.pathname = "/";
  url.searchParams.set("app", "skybridge");
  url.searchParams.set("locale", locale);
  url.searchParams.set("deviceType", "desktop");
  url.searchParams.set("unsafeSkipTargetOriginCheck", "true");
  url.searchParams.set("backgroundMode", "transparent");
  return url.toString();
}

/** 原 `wVe` / 压缩导出 `UH`。 */
export function attachSandboxInitialization({
  initId,
  sandboxId,
  sourceUrl,
}: SandboxInitializationOptions): string {
  const url = new URL(sourceUrl);
  url.hash = new URLSearchParams({
    [INIT_ID_PARAMETER]: initId,
    [SANDBOX_ID_PARAMETER]: sandboxId,
  }).toString();
  return url.toString();
}

/** 原 `TVe` / 压缩导出 `GH`。 */
export function getSandboxInitId(value?: string | null): string | null {
  if (value == null) return null;
  let parsed: URL;
  try {
    parsed = new URL(value);
  } catch {
    return null;
  }
  if (parsed.hash.length === 0) return null;
  const initId = new URLSearchParams(parsed.hash.slice(1)).get(
    INIT_ID_PARAMETER,
  );
  return initId != null && /^[A-Za-z0-9_-]{1,128}$/.test(initId)
    ? initId
    : null;
}

function isHttpResourceUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return (
      (url.protocol === "http:" || url.protocol === "https:") &&
      url.username === "" &&
      url.password === ""
    );
  } catch {
    return false;
  }
}

/** 原 `MVe` / 压缩导出 `RH`。 */
export function parseSandboxResourceActivities(
  metadata: unknown,
): SandboxResourceActivitiesResult {
  if (!isRecord(metadata) || !("openai/resourceActivities" in metadata)) {
    return { status: "absent" };
  }
  const activityMetadata = metadata["openai/resourceActivities"];
  if (
    !isRecord(activityMetadata) ||
    activityMetadata.version !== 1 ||
    !Array.isArray(activityMetadata.resources)
  ) {
    return { status: "invalid" };
  }
  const resources: SandboxResourceActivity[] = [];
  for (const resource of activityMetadata.resources) {
    if (!isRecord(resource)) return { status: "invalid" };
    const { id, url, title, mimeType, activities } = resource;
    if (
      typeof id !== "string" ||
      id.length === 0 ||
      typeof url !== "string" ||
      !isHttpResourceUrl(url) ||
      (title !== undefined && typeof title !== "string") ||
      (mimeType !== undefined && typeof mimeType !== "string") ||
      !Array.isArray(activities) ||
      activities.length === 0 ||
      activities.some(
        (activity) =>
          activity !== "read" &&
          activity !== "created" &&
          activity !== "updated",
      )
    ) {
      return { status: "invalid" };
    }
    resources.push({
      id,
      url,
      ...(typeof title === "string" ? { title } : {}),
      ...(typeof mimeType === "string" ? { mimeType } : {}),
      activities: [...activities] as ResourceActivity[],
    });
  }
  return { status: "valid", resources };
}

/** 原 `xVe` / 压缩导出 `KH`。 */
export function createSandboxPartition(
  sandboxId: string,
  { persist = false }: SandboxPartitionOptions = {},
): string {
  return `${persist ? "persist:" : ""}${SANDBOX_PARTITION_PREFIX}:${sandboxId}`;
}

function parseTrustedSandboxUrl(value: string | URL): URL | null {
  let parsed: URL;
  try {
    parsed = value instanceof URL ? value : new URL(value);
  } catch {
    return null;
  }
  const trustedHost =
    parsed.hostname === SANDBOX_HOST ||
    parsed.hostname.endsWith(`.${SANDBOX_HOST}`);
  if (
    (parsed.protocol !== "https:" && parsed.protocol !== "codex-sandbox:") ||
    parsed.port !== "" ||
    parsed.username !== "" ||
    parsed.password !== "" ||
    !trustedHost
  ) {
    return null;
  }
  return parsed;
}

/** 原 `CVe` / 压缩导出 `qH`。 */
export function getTrustedSandboxOrigin(
  value: string | URL,
  { requireSkybridge = false }: SandboxOriginOptions = {},
): string | null {
  const parsed = parseTrustedSandboxUrl(value);
  if (
    parsed == null ||
    (requireSkybridge &&
      (parsed.pathname !== "/" ||
        parsed.searchParams.get("app") !== "skybridge"))
  ) {
    return null;
  }
  return `${parsed.protocol}//${parsed.host}`;
}

/** 原 `XV` / 压缩导出 `YH`。 */
export function initializeSandboxUrls(): void {}
