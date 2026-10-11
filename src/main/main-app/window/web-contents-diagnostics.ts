type WebContentsDiagnosticsDependencies = {
  webContents: { on: (event: string, listener: (...args: any[]) => void) => void; getURL: () => string };
  windowId: number;
  webContentsId: number;
  appearance: string;
  errorReporter: { reportFatal: (error: Error, context: Record<string, unknown>) => void };
  isAppQuitting: () => boolean;
  maybeRecoverFromRendererCrash: (reason: string) => boolean;
  clearRecoveryAttempt: () => void;
  onPrimaryRendererGone: () => void;
  formatUrl: (url: string) => string;
};

/** Installs renderer health/error event handlers while keeping manager recovery injected. */
function installWebContentsDiagnostics(dependencies: WebContentsDiagnosticsDependencies) {
  const { webContents, windowId, webContentsId, errorReporter } = dependencies;
  webContents.on(`render-process-gone`, (_event, details) => {
    if (details.reason === `clean-exit` || dependencies.isAppQuitting()) return;
    const fatal = details.reason !== `launch-failed` && details.reason !== `killed`;
    if (fatal) {
      errorReporter.reportFatal(Error(`Renderer process gone (${details.reason})`), {
        groupingFingerprint: [`renderer-process-gone`, details.reason],
        tags: { errorType: `renderer-process-gone`, reason: details.reason },
        extra: { windowId, webContentsId, exitCode: details.exitCode },
      });
    }
    const recovered = dependencies.maybeRecoverFromRendererCrash(details.reason);
    if (dependencies.appearance === `primary` && fatal && recovered) dependencies.onPrimaryRendererGone();
  });
  webContents.on(`did-finish-load`, () => dependencies.clearRecoveryAttempt());
  webContents.on(`unresponsive`, () => {
    errorReporter.reportFatal(Error(`Renderer unresponsive`), {
      tags: { errorType: `renderer-unresponsive` },
      extra: { windowId, webContentsId, url: dependencies.formatUrl(webContents.getURL()) },
    });
  });
  webContents.on(`did-fail-load`, (_event, errorCode, errorDescription, validatedURL, isMainFrame, frameProcessId, frameRoutingId) => {
    if (isMainFrame && errorCode !== -3) {
      errorReporter.reportFatal(Error(`Renderer did-fail-load`), {
        tags: { errorType: `renderer-did-fail-load` },
        extra: { windowId, webContentsId, errorCode, errorDescription, validatedURL: dependencies.formatUrl(validatedURL), frameProcessId, frameRoutingId },
      });
    }
  });
}

export { installWebContentsDiagnostics };
if (typeof module !== `undefined`) module.exports = { installWebContentsDiagnostics };
