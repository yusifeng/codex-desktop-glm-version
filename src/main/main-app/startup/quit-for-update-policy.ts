export function applyQuitForUpdatePolicy(options: {
  exitImmediately: boolean;
  exitImmediatelyForUpdateInstall: () => void;
  quitForUpdateInstall: () => void;
  allowQuitTemporarily: () => void;
}): void {
  if (options.exitImmediately) {
    options.exitImmediatelyForUpdateInstall();
    return;
  }
  options.allowQuitTemporarily();
  options.quitForUpdateInstall();
}

if (typeof module !== "undefined") module.exports = { applyQuitForUpdatePolicy };
