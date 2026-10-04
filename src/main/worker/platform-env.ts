/** Environment shaping used before spawning child processes. */

/**
 * Electron/Crashpad injects process-only variables that must not leak into
 * WSL, Git, shell, or editor child processes. Keep matching case-insensitive
 * because Windows environment keys are case-insensitive.
 */
export const CHILD_PROCESS_ENV_BLOCKLIST = new Set([
  "BREAKPAD_DUMP_LOCATION",
  "CHROME_CRASHPAD_PIPE_NAME",
  "CRASHPAD_HANDLER_PID",
  "ELECTRON_CRASH_REPORTER_PROCESS_TYPE",
  "__CFBUNDLEIDENTIFIER",
]);

export function sanitizeChildProcessEnv<T extends Record<string, unknown>>(env: T): T {
  const sanitized = { ...env } as T;
  for (const key of Object.keys(sanitized)) {
    if (CHILD_PROCESS_ENV_BLOCKLIST.has(key.toUpperCase())) delete sanitized[key];
  }
  return sanitized;
}

module.exports = { CHILD_PROCESS_ENV_BLOCKLIST, sanitizeChildProcessEnv };
