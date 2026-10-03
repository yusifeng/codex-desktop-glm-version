type BuildFlavorPolicy = {
  shouldIncludeSparkle(flavor: string, platform: string, env: Record<string, string | undefined>): boolean;
  shouldIncludeUpdater(flavor: string, platform: string, env: Record<string, string | undefined>): boolean;
  allowDevtools(flavor: string): boolean;
  allowDebugMenu(flavor: string): boolean;
  Dev: string;
  Agent: string;
};

function resolveStartupFlavorFlags({
  buildFlavor,
  platform,
  env,
  isPackaged,
  policy,
}: {
  buildFlavor: string;
  platform: string;
  env: Record<string, string | undefined>;
  isPackaged: boolean;
  policy: BuildFlavorPolicy;
}) {
  return {
    enableSparkle: policy.shouldIncludeSparkle(buildFlavor, platform, env),
    enableUpdater: policy.shouldIncludeUpdater(buildFlavor, platform, env),
    allowDevtools: policy.allowDevtools(buildFlavor),
    allowInspectElement: buildFlavor === policy.Dev || buildFlavor === policy.Agent,
    allowDebugMenu: policy.allowDebugMenu(buildFlavor),
    isDarwin: platform === `darwin`,
    isWindows: platform === `win32`,
    isUnpackaged: !isPackaged,
  };
}

function createStartupPhaseTracker({
  startedAtMs,
  now,
  phaseDurations,
  trace,
}: {
  startedAtMs: number;
  now: () => number;
  phaseDurations: Record<string, number>;
  trace: (phase: string, detail: { safe: Record<string, unknown> }) => void;
}) {
  return (phase: string, phaseStartedAtMs: number, metadata: Record<string, unknown> = {}) => {
    const timestamp = now();
    if (metadata.background !== true) phaseDurations[phase] = timestamp - phaseStartedAtMs;
    trace(phase, { safe: { phaseElapsedMs: timestamp - phaseStartedAtMs, startupElapsedMs: timestamp - startedAtMs, ...metadata } });
  };
}

function collectStartupPathExtensions(paths: Array<{ path: string }>, extname: (path: string) => string) {
  return Array.from(new Set(paths.map(({ path }) => extname(path).slice(1).toLowerCase()))).sort();
}

function shouldEnableDebugChromePages(allowDebugMenu: boolean, configured: unknown) {
  return allowDebugMenu && configured === true;
}

function resolveRemoteHostedPipProcessIdentifier(isUnpackaged: boolean, value: string | undefined) {
  const processIdentifier = Number(value);
  return isUnpackaged && Number.isSafeInteger(processIdentifier) && processIdentifier > 0
    ? processIdentifier
    : null;
}

export { collectStartupPathExtensions, createStartupPhaseTracker, resolveRemoteHostedPipProcessIdentifier, resolveStartupFlavorFlags, shouldEnableDebugChromePages };
if (typeof module !== `undefined`) module.exports = { collectStartupPathExtensions, createStartupPhaseTracker, resolveRemoteHostedPipProcessIdentifier, resolveStartupFlavorFlags, shouldEnableDebugChromePages };
