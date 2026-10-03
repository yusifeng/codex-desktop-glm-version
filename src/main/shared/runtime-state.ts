/** Windows primary-runtime framework root. 原 `tX`：进程级共享状态。 */
let primaryRuntimeFrameworkRoot: string | null = null;

/** 原 `fY`：读取 bootstrap 激活的 framework 根目录。 */
export function getPrimaryRuntimeFrameworkRoot(): string | null {
  return primaryRuntimeFrameworkRoot;
}

/** 原 `gX`：bootstrap 安装/激活后登记 framework 根目录。 */
export function setPrimaryRuntimeFrameworkRoot(root: string | null): void {
  primaryRuntimeFrameworkRoot = root;
}

/** 原 `XJ`：resume 前置状态尚未准备完成。 */
export class AppServerResumeNotReadyError extends Error {
  readonly result: { status: "not-ready"; reason: string };

  constructor(result: { status: "not-ready"; reason: string }) {
    super(`App-server task is not ready: ${result.reason}`);
    this.result = result;
    this.name = "AppServerResumeNotReadyError";
  }
}

function errorMessage(error: unknown): string | undefined {
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;
  if (typeof error === "object" && error != null && "message" in error) {
    const message = error.message;
    if (typeof message === "string" && message.length > 0) return message;
  }
  try {
    return JSON.stringify(error);
  } catch {
    return String(error);
  }
}

/** 原 `ZJ`：active turn 存在时修改 network requirements 的 writer 冲突。 */
export function isNetworkRequirementsWriterConflict(error: unknown): boolean {
  return errorMessage(error)
    ?.toLowerCase()
    .includes("network requirements cannot change while a thread has an active turn") ?? false;
}

export {
  getPrimaryRuntimeFrameworkRoot as Bn,
  isNetworkRequirementsWriterConflict as Gn,
  AppServerResumeNotReadyError as Wn,
  setPrimaryRuntimeFrameworkRoot as jn,
};
