import path from "node:path";

/** Path-like values include home-relative and platform-absolute paths (原 sce/f). */
export function isPathlike(value: string, pathApi: Pick<typeof path, "isAbsolute"> = path): boolean {
  return value === "~" || value.startsWith("~/") || value.startsWith("~\\") || pathApi.isAbsolute(value);
}

/** Deferred startup configuration holder (原 Lce/o). */
export class StartupConfigClient<T> {
  #config: T | null = null;
  #resolve!: (value: T) => void;
  #reject!: (reason?: unknown) => void;
  readonly #promise = new Promise<T>((resolve, reject) => {
    this.#resolve = resolve;
    this.#reject = reject;
  });

  get(): Promise<T> { return this.#promise; }
  getResolved(): T | null { return this.#config; }
  resolve(value: T): void { this.#config = value; this.#resolve(value); }
  reject(reason?: unknown): void { this.#reject(reason); }
}

interface ResponseLike {
  status: number;
  clone(): { json(): Promise<unknown> };
}

/** Parse workspace IP authorization failures from a 401 response (原 Zce/t). */
export async function workspaceAuthErrorOf(response: ResponseLike): Promise<{ errorCode: "ip_not_authorized"; message: string } | null> {
  if (response.status !== 401) return null;
  try {
    let body = await response.clone().json();
    if (body == null || typeof body !== "object") return null;
    let error = (body as { error?: unknown }).error;
    if (error == null || typeof error !== "object") return null;
    let record = error as { type?: unknown; code?: unknown; message?: unknown };
    if (
      record.type !== "ip_not_authorized" &&
      record.code !== "ip_not_authorized" &&
      record.code !== "validate_whitelist_failed" &&
      record.code !== "workspace_ip_not_authorized"
    ) return null;
    return {
      errorCode: "ip_not_authorized",
      message: typeof record.message === "string" && record.message.length > 0
        ? record.message
        : "Your current IP address is not authorized for this workspace. Connect from an approved network or contact your workspace administrator for access.",
    };
  } catch {
    return null;
  }
}

/** Wait for IPC initialization and return the remaining request timeout (original `v9`). */
export async function waitUntilIpcInitialized(
  client: { waitUntilInitialized(options: { timeoutMs: number }): Promise<unknown> },
  timeoutMs = 5_000,
): Promise<number> {
  const startedAt = Date.now();
  await client.waitUntilInitialized({ timeoutMs });
  return Math.max(0, timeoutMs - (Date.now() - startedAt));
}

export { isPathlike as f, StartupConfigClient as o, workspaceAuthErrorOf as t, waitUntilIpcInitialized as _ };
