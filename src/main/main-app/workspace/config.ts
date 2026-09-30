import { projectlessWorkspaceInstructions } from "../misc/projectless-workspace";
export { projectlessWorkspaceInstructions };
const PROJECTLESS =
  /^(.*(?:^|[\/])Documents[\/]+Codex)[\/]+(?:\d{4}-\d{2}-\d{2}-[a-z0-9][a-z0-9-]*|\d{4}-\d{2}-\d{2}[\/]+[a-z0-9][a-z0-9-]*)[\/]*$/u;
export function extractProjectlessRoot(
  value: string | null | undefined,
): string | null {
  return value?.trim().match(PROJECTLESS)?.[1] ?? null;
}
export const nx = extractProjectlessRoot;
export function findProjectlessRootFromRoots(
  roots: readonly string[],
): { cwd: string; workspaceRoot: string } | null {
  for (let index = roots.length - 1; index >= 0; index -= 1) {
    const cwd = roots[index];
    if (cwd == null) continue;
    const workspaceRoot = extractProjectlessRoot(cwd);
    if (workspaceRoot != null) return { cwd, workspaceRoot };
  }
  return null;
}
export function resolveThreadCwd({
  cwd,
  fallbackCwd,
  workspaceBrowserRoot,
  workspaceKind,
}: {
  cwd?: string | null;
  fallbackCwd?: string | null;
  workspaceBrowserRoot?: string | null;
  workspaceKind?: string | null;
}): string | null {
  if (workspaceKind !== "projectless") return cwd ?? fallbackCwd ?? null;
  const fallback =
    workspaceBrowserRoot == null || workspaceBrowserRoot === "~"
      ? fallbackCwd
      : workspaceBrowserRoot;
  if (fallback == null || fallback === "~")
    return cwd === "~" ? null : (cwd ?? null);
  const normalized = fallback.replaceAll("\\", "/").replace(/\/+$/u, "");
  if (normalized === "") return null;
  if (cwd == null) return fallback;
  const current = cwd.replaceAll("\\", "/").replace(/\/+$/u, "");
  return current === normalized || current.startsWith(normalized + "/")
    ? cwd
    : fallback;
}
export function firstWritableRoot(policy: unknown): string | null {
  if (
    typeof policy !== "object" ||
    policy == null ||
    !("type" in policy) ||
    policy.type !== "workspaceWrite" ||
    !("writableRoots" in policy) ||
    !Array.isArray(policy.writableRoots)
  )
    return null;
  return (
    policy.writableRoots.find(
      (root): root is string => typeof root === "string" && root !== "~",
    ) ?? null
  );
}
export function resolveWorkspaceSandboxPolicy<T>({
  sandboxPolicy,
  workspaceKind,
}: {
  sandboxPolicy: T;
  workspaceKind?: string | null;
}): T {
  if (
    workspaceKind !== "projectless" ||
    firstWritableRoot(sandboxPolicy) != null
  )
    return sandboxPolicy;
  return {
    type: "workspaceWrite",
    writableRoots: [],
    networkAccess: false,
  } as unknown as T;
}
export function mergeThreadProfiles(
  config: Record<string, unknown>,
): Record<string, unknown> {
  const profiles = config.profiles;
  const profile = typeof config.profile === "string" ? config.profile : null;
  if (
    profile == null ||
    typeof profiles !== "object" ||
    profiles == null ||
    Array.isArray(profiles)
  )
    return config;
  const selected = (profiles as Record<string, unknown>)[profile];
  if (
    typeof selected !== "object" ||
    selected == null ||
    Array.isArray(selected)
  )
    return config;
  const merged = { ...config };
  for (const [key, value] of Object.entries(selected))
    if (value != null) merged[key] = value;
  return merged;
}
export const ox = mergeThreadProfiles;
interface RequestClient {
  sendRequest(
    method: string,
    params: unknown,
    options?: unknown,
  ): Promise<{ config?: Record<string, unknown> } | Record<string, unknown>>;
}
export async function readThreadCodexConfig(
  client: RequestClient,
  cwd: string | null | undefined,
  options?: unknown,
): Promise<Record<string, unknown>> {
  const response = await client.sendRequest(
    "config/read",
    { includeLayers: false, cwd: cwd ?? null },
    options,
  );
  const candidate = "config" in response ? response.config : response;
  const config =
    typeof candidate === "object" &&
    candidate != null &&
    !Array.isArray(candidate)
      ? (candidate as Record<string, unknown>)
      : {};
  return mergeThreadProfiles(config);
}
export async function readThreadCodexConfigSafe(
  client: RequestClient,
  cwd: string | null | undefined,
): Promise<Record<string, unknown> | undefined> {
  try {
    return await readThreadCodexConfig(client, cwd);
  } catch {
    return undefined;
  }
}
