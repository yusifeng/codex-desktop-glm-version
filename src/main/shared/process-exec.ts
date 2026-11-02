export type AutomationDelivery = { stage: string; [key: string]: unknown };

export class AppServerRequestDeliveryError extends Error {
  readonly delivery: AutomationDelivery;
  constructor(delivery: AutomationDelivery, cause?: unknown) {
    let message = "Codex app-server is not available";
    if (cause instanceof Error) message = cause.message;
    else if (typeof cause === "string") message = cause;
    super(message, { cause });
    this.name = "AppServerRequestDeliveryError";
    this.delivery = delivery;
  }
}

export class AppServerSshSetupError extends Error {
  readonly stage: string;
  readonly failureReason: string;
  constructor(input: { failureReason: string; message: string; stage: string }) {
    super(input.message);
    this.name = "AppServerSshSetupError";
    this.stage = input.stage;
    this.failureReason = input.failureReason;
  }
}

export const WebSocketReadyState = { Connecting: 0, Open: 1, Closing: 2, Closed: 3 } as const;

/** Read PATH using the platform's canonical environment-key casing (original `Qq`). */
export function getPathEnvironment(environment: NodeJS.ProcessEnv): string | undefined {
  return environment[pathEnvironmentKey(environment)];
}

/** Replace PATH without leaving case-insensitive duplicates on Windows (original `$q`). */
export function setPathEnvironment(environment: NodeJS.ProcessEnv, value: string): void {
  const key = pathEnvironmentKey(environment);
  if (process.platform === "win32") {
    for (const candidate of Object.keys(environment))
      if (candidate !== key && candidate.toLowerCase() === "path") delete environment[candidate];
  }
  environment[key] = value;
}

function pathEnvironmentKey(environment: NodeJS.ProcessEnv): string {
  if (process.platform !== "win32") return "PATH";
  if (environment.Path != null) return "Path";
  if (environment.PATH != null) return "PATH";
  return Object.keys(environment).find((key) => key.toLowerCase() === "path") ?? "Path";
}

export function classifyComputerUseError(error: unknown): { code: string; source: "computer_use" | "os_status" } | null {
  if (error instanceof AggregateError) {
    for (const nested of error.errors) {
      const classified = classifyComputerUseError(nested);
      if (classified) return classified;
    }
    return null;
  }
  if (!(error instanceof Error)) return null;
  const computerUseCode = error.message.match(/^Codex Computer Use Apple Event error (-?\d+):/)?.[1];
  if (computerUseCode) return { code: computerUseCode, source: "computer_use" };
  const osStatusCode = error.message.match(/^AE.+ failed with (-?\d+)(?:\s|$)/)?.[1];
  return osStatusCode ? { code: osStatusCode, source: "os_status" } : null;
}

export function classifyComputerUsePermission(error: unknown): "denied" | "pending" | null {
  if (error instanceof AggregateError) {
    for (const nested of error.errors) {
      const classified = classifyComputerUsePermission(nested);
      if (classified) return classified;
    }
    return null;
  }
  const classified = classifyComputerUseError(error);
  if (classified?.source !== "computer_use") return null;
  if (classified.code === "-10009") return "denied";
  if (classified.code === "-10014") return "pending";
  return null;
}

export {
  AppServerRequestDeliveryError as mr,
  AppServerSshSetupError as fr,
  WebSocketReadyState as pr,
  classifyComputerUsePermission as gr,
  classifyComputerUseError as hr,
  getPathEnvironment as Yn,
  setPathEnvironment as Xn,
};
