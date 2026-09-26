const SANDBOX_PARTITION_PREFIX = "codex-mcp-app-sandbox";
const SANDBOX_HOST = "web-sandbox.oaiusercontent.com";

export interface SandboxPartitionOptions {
  persist?: boolean;
}

export interface SandboxOriginOptions {
  requireSkybridge?: boolean;
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
