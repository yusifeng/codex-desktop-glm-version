export function shouldRecoverRendererCrash(options: {
  isAppQuitting: boolean;
  reason: string;
  isWindowDestroyed: boolean;
  isWebContentsDestroyed: boolean;
  alreadyAttempted: boolean;
}): boolean {
  return !options.isAppQuitting && options.reason !== "clean-exit" && !options.isWindowDestroyed && !options.isWebContentsDestroyed && !options.alreadyAttempted;
}

if (typeof module !== "undefined") module.exports = { shouldRecoverRendererCrash };
