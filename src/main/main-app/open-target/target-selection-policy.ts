/** Pure target selection policy for open-in requests. */

export function resolveTargetFallback({
  target,
  hasExplicitTarget,
  allowPlatformFallback = true,
  platform,
}: {
  target: string | null | undefined;
  hasExplicitTarget: boolean;
  allowPlatformFallback?: boolean;
  platform: string;
}): string | null {
  return target || (!hasExplicitTarget && allowPlatformFallback && platform === `win32` ? `fileManager` : null);
}

export function resolveRequestedTarget({
  requestedTarget,
  requestedTargetWasFiltered,
  preferredTarget,
  shouldUseFileManager,
  shouldUsePlatformDefaultViewer,
  hasExplicitTarget,
  allowPlatformFallback = true,
  platform,
}: {
  requestedTarget: string | null | undefined;
  requestedTargetWasFiltered: boolean;
  preferredTarget: string | null | undefined;
  shouldUseFileManager: boolean;
  shouldUsePlatformDefaultViewer: boolean;
  hasExplicitTarget: boolean;
  allowPlatformFallback?: boolean;
  platform: string;
}): string | null {
  if (requestedTargetWasFiltered) {
    return resolveTargetFallback({ target: null, hasExplicitTarget, allowPlatformFallback, platform });
  }
  let target = requestedTarget ?? preferredTarget;
  if (!hasExplicitTarget && requestedTarget == null) {
    if (shouldUseFileManager) target = `fileManager`;
    else if (shouldUsePlatformDefaultViewer) target = `systemDefault`;
  }
  return resolveTargetFallback({ target, hasExplicitTarget, allowPlatformFallback, platform });
}

if (typeof module !== "undefined") module.exports = { resolveTargetFallback, resolveRequestedTarget };
