type CrashRuntimeDependencies = {
  notificationSchema: { safeParse(value: unknown): any };
  parseShellWords(command: string): string[];
  path: any;
  pathContains(path: string, parent: string): boolean;
};

const METADATA_TIMEOUT_MS = 2_000;
const ENV_ASSIGNMENT = /^[A-Za-z_][A-Za-z0-9_]*=/u;
const EXIT_SIGNALS = new Map<number, string>([
  [-4, "SIGILL"],
  [-6, "SIGABRT"],
  [-7, "SIGBUS"],
  [-11, "SIGSEGV"],
  [132, "SIGILL"],
  [134, "SIGABRT"],
  [135, "SIGBUS"],
  [139, "SIGSEGV"],
]);
const OUTPUT_SIGNALS = [
  { pattern: /\b(?:abort trap(?::\s*\d+)?|sigabrt)\b/iu, signal: "SIGABRT" },
  { pattern: /\b(?:segmentation fault|sigsegv)\b/iu, signal: "SIGSEGV" },
  { pattern: /\b(?:bus error|sigbus)\b/iu, signal: "SIGBUS" },
  { pattern: /\b(?:illegal instruction|sigill)\b/iu, signal: "SIGILL" },
];

/** Owns native-command crash classification, primary-runtime attribution, dedupe, and reporting. */
export function createNativeCommandCrashRuntime(dependencies: CrashRuntimeDependencies) {
  const path = dependencies.path.default ?? dependencies.path;

  function installNativeCommandCrashReporting(options: {
    captureMessage(message: string, context: any): void;
    diagnosePrimaryRuntimeDependencies(): Promise<any>;
    getMetadataTags(threadId: string): Promise<any>;
    getPlatformOs(): Promise<string>;
    getPrimaryRuntimeDependencyRoot(): Promise<string | null>;
    registerInternalNotificationHandler(handler: (notification: unknown) => void): unknown;
  }) {
    const seen = new Set<string>();
    return options.registerInternalNotificationHandler((notification) => {
      const crash = classifyCrashNotification(notification);
      if (crash == null || seen.has(crash.dedupeKey)) return;
      seen.add(crash.dedupeKey);
      void reportNativeCommandCrash({ ...options, crash });
    });
  }

  function normalizeSessionSource(value: any) {
    if (value == null || typeof value === "string") return value;
    if ("custom" in value) return "custom";
    const { subAgent } = value;
    return typeof subAgent === "string"
      ? `subAgent.${subAgent}`
      : "thread_spawn" in subAgent
        ? "subAgent.thread_spawn"
        : "subAgent.other";
  }

  function classifyCrashNotification(notification: any) {
    if (notification?.method !== "item/completed") return null;
    const parsed = dependencies.notificationSchema.safeParse(notification.params);
    if (!parsed.success) return null;
    const { item } = parsed.data;
    if (item.source === "userShell" || item.status === "declined") return null;

    let signal = EXIT_SIGNALS.get(item.exitCode ?? 0) ?? null;
    let signalSource = "exit-code";
    if (signal == null && item.status === "failed" && item.exitCode !== 0) {
      signal = OUTPUT_SIGNALS.find(({ pattern }) =>
        pattern.test(item.aggregatedOutput ?? ""),
      )?.signal ?? null;
      signalSource = "output";
    }
    if (signal == null) return null;

    const commands = item.commandActions == null || item.commandActions.length === 0
      ? [item.command]
      : item.commandActions.map(({ command }: any) => command);
    return {
      commands,
      cwd: item.cwd ?? null,
      dedupeKey: `${parsed.data.threadId}:${parsed.data.turnId ?? ""}:${item.id}`,
      durationMs: item.durationMs ?? null,
      executable: resolveExecutable(commands),
      exitCode: item.exitCode ?? null,
      signal,
      signalSource,
      source: item.source ?? "agent",
      threadId: parsed.data.threadId,
    };
  }

  async function reportNativeCommandCrash(options: {
    captureMessage(message: string, context: any): void;
    crash: any;
    diagnosePrimaryRuntimeDependencies(): Promise<any>;
    getMetadataTags(threadId: string): Promise<any>;
    getPlatformOs(): Promise<string>;
    getPrimaryRuntimeDependencyRoot(): Promise<string | null>;
  }) {
    const { crash } = options;
    const [platform, primaryRuntimeRoot] = await Promise.all([
      options.getPlatformOs().catch(() => process.platform),
      options.getPrimaryRuntimeDependencyRoot().catch(() => null),
    ]);
    const attribution = attributePrimaryRuntime({ crash, primaryRuntimeRoot });
    if (
      crash.signalSource === "output" &&
      crash.executable !== "soffice" &&
      attribution?.attribution !== "primary-runtime-script"
    ) return;

    const diagnosis = attribution == null
      ? null
      : await options.diagnosePrimaryRuntimeDependencies().catch(() => null);
    const usedPrimaryRuntime = attribution != null;
    const installedPrimaryRuntime = usedPrimaryRuntime && diagnosis?.installed === true;
    let metadata: any = {};
    let timer: any;
    try {
      metadata = await Promise.race([
        options.getMetadataTags(crash.threadId),
        new Promise((resolve) => { timer = setTimeout(() => resolve({}), METADATA_TIMEOUT_MS); }),
      ]);
    } catch {
      // Metadata is best-effort and must not suppress crash reporting.
    } finally {
      clearTimeout(timer);
    }

    try {
      options.captureMessage("Native command crashed", {
        level: "error",
        fingerprint: ["native-command-crash", platform, crash.executable, crash.signal],
        tags: {
          app_build: metadata.app_build,
          app_version: metadata.app_version,
          cli_version: metadata.cli_version,
          runtime_bundle_version: metadata.runtime_bundle_version,
          session_source: metadata.session_source,
          component: "codex-execution",
          "event.process": crash.executable,
          "exit.code": crash.exitCode ?? undefined,
          "exit.reason": "crashed",
          "exit.signal": crash.signal,
          "runtime.bundle_version": installedPrimaryRuntime ? diagnosis.bundleVersion : undefined,
          "runtime.script_name": attribution?.scriptName,
        },
        extra: {
          commandSource: crash.source,
          durationMs: crash.durationMs,
          processAttribution:
            attribution?.attribution ??
            (crash.executable === "unknown" ? "unknown" : "direct-command"),
          usedPrimaryRuntime,
        },
      });
    } catch {
      // Diagnostics must never affect the command lifecycle.
    }
  }

  function resolveExecutable(commands: string[]) {
    let executable: string | null = null;
    for (const command of commands) {
      for (const segment of splitShellSegments(command)) {
        const token = firstExecutableToken(segment);
        const current = token == null ? null : classifyExecutable(token);
        if (current == null || (executable != null && current !== executable)) return "unknown";
        executable = current;
      }
    }
    return executable ?? "unknown";
  }

  function firstExecutableToken(command: string) {
    for (const token of safeParseShellWords(command))
      if (!ENV_ASSIGNMENT.test(token)) return token;
    return null;
  }

  function attributePrimaryRuntime({ crash, primaryRuntimeRoot }: {
    crash: any;
    primaryRuntimeRoot: string | null;
  }) {
    const [firstCommand] = crash.commands;
    if (
      primaryRuntimeRoot == null ||
      firstCommand == null ||
      crash.commands.some((command: string) => command !== firstCommand)
    ) return null;
    const parsedSegments = splitShellSegments(firstCommand)
      .map((segment) => safeParseShellWords(segment))
      .filter((tokens) => tokens.some((token) => !ENV_ASSIGNMENT.test(token)));
    const [tokens] = parsedSegments;
    if (tokens == null || parsedSegments.length !== 1) return null;
    const executableIndex = tokens.findIndex((token) => !ENV_ASSIGNMENT.test(token));
    const executablePath = tokens[executableIndex];
    if (executablePath == null) return null;
    const scriptPath = resolvePrimaryRuntimeScript({
      args: tokens.slice(executableIndex + 1),
      executable: crash.executable,
    });
    return scriptPath != null && isInsidePrimaryRuntime({
      allowBareRelativePath: true,
      cwd: crash.cwd,
      primaryRuntimeRoot,
      value: scriptPath,
    })
      ? { attribution: "primary-runtime-script", scriptName: path.basename(scriptPath) }
      : isInsidePrimaryRuntime({
          allowBareRelativePath: false,
          cwd: crash.cwd,
          primaryRuntimeRoot,
          value: executablePath,
        })
        ? { attribution: "primary-runtime-executable" }
        : null;
  }

  function resolvePrimaryRuntimeScript({ args, executable }: { args: string[]; executable: string }) {
    const [candidate] = args;
    if (candidate == null || candidate.startsWith("-")) return null;
    const extension = path.extname(candidate).toLowerCase();
    switch (executable) {
      case "node":
        return [".cjs", ".js", ".mjs"].includes(extension) ? candidate : null;
      case "python":
        return extension === ".py" ? candidate : null;
      case "git":
      case "pdfinfo":
      case "pdftoppm":
      case "soffice":
      case "unknown":
        return null;
    }
  }

  function safeParseShellWords(command: string) {
    try {
      return dependencies.parseShellWords(command);
    } catch {
      return [];
    }
  }

  function splitShellSegments(command: string) {
    const segments: string[] = [];
    let escaped = false;
    let quote: string | null = null;
    let start = 0;
    for (let index = 0; index < command.length; index += 1) {
      const character = command[index];
      if (escaped) {
        escaped = false;
        continue;
      }
      if (character === "\\" && quote !== "'") {
        escaped = true;
        continue;
      }
      if (quote != null) {
        if (character === quote) quote = null;
        continue;
      }
      if (character === '"' || character === "'") {
        quote = character;
        continue;
      }
      const next = command[index + 1];
      let separatorLength = 0;
      if (character === ";" || character === "\n")
        separatorLength = next === character ? 2 : 1;
      else if (character === "|")
        separatorLength = next === "|" || next === "&" ? 2 : 1;
      else if (character === "&") {
        const previous = command[index - 1];
        if (next === "&") separatorLength = 2;
        else if (next !== ">" && previous !== ">" && previous !== "<") separatorLength = 1;
      }
      if (separatorLength !== 0) {
        segments.push(command.slice(start, index));
        index += separatorLength - 1;
        start = index + 1;
      }
    }
    segments.push(command.slice(start));
    return segments;
  }

  function isInsidePrimaryRuntime({
    allowBareRelativePath,
    cwd,
    primaryRuntimeRoot,
    value,
  }: {
    allowBareRelativePath: boolean;
    cwd: string | null;
    primaryRuntimeRoot: string;
    value: string;
  }) {
    let resolved: string | null = null;
    if (path.isAbsolute(value)) resolved = path.resolve(value);
    else if (cwd != null && (allowBareRelativePath || value.includes(path.sep)))
      resolved = path.resolve(cwd, value);
    return resolved != null && dependencies.pathContains(resolved, path.resolve(primaryRuntimeRoot));
  }

  function classifyExecutable(value: string) {
    const executable = path.win32.basename(value).toLowerCase().replace(/\.exe$/u, "");
    if (/^python(?:3(?:\.\d+)*)?$/u.test(executable)) return "python";
    switch (executable) {
      case "git":
      case "node":
      case "pdfinfo":
      case "pdftoppm":
        return executable;
      case "libreoffice":
      case "soffice":
        return "soffice";
      default:
        return null;
    }
  }

  return {
    attributePrimaryRuntime,
    classifyCrashNotification,
    classifyExecutable,
    firstExecutableToken,
    installNativeCommandCrashReporting,
    normalizeSessionSource,
    reportNativeCommandCrash,
    resolveExecutable,
    resolvePrimaryRuntimeScript,
    splitShellSegments,
  };
}
