// @ts-nocheck

const PROGRESS_LABELS = {
  sqlite: {
    title: {
      messageId: `codex.sqliteBackfillProgress.title`,
      defaultMessage: `Rebuilding conversation history`,
    },
    detail: {
      messageId: `codex.sqliteBackfillProgress.detail`,
      defaultMessage: `This may take several minutes — keep the app open`,
    },
  },
  appServer: {
    title: {
      messageId: `codex.appServerStartupProgress.title`,
      defaultMessage: `Codex is still starting`,
    },
    detail: {
      messageId: `codex.appServerStartupProgress.detail`,
      defaultMessage: `This may take several minutes — keep the app open`,
    },
  },
};

/** Creates the startup progress-window lifecycle and delayed wrapper. */
export function createStartupProgressWindowRuntime(dependencies: Record<string, any>) {
  const {
    BrowserWindow,
    getNativeIntl,
    escapeHtml,
    createDelayedProgressWindow,
  } = dependencies;

  async function createStartupProgressWindow({
    activate = true,
    kind,
    onQuit,
    windowIconPath,
  }: Record<string, any>) {
    const nativeIntl = getNativeIntl();
    const labels = kind === `app-server` ? PROGRESS_LABELS.appServer : PROGRESS_LABELS.sqlite;
    const title = nativeIntl.formatMessage(labels.title);
    const detail = nativeIntl.formatMessage(labels.detail);
    let programmaticClose = false;
    let handlingUserClose = false;
    const progressWindow = new BrowserWindow({
      width: 420,
      height: 176,
      resizable: false,
      maximizable: false,
      fullscreenable: false,
      show: false,
      title,
      ...(windowIconPath == null ? {} : { icon: windowIconPath }),
      webPreferences: {
        contextIsolation: true,
        nodeIntegration: false,
        sandbox: true,
        spellcheck: false,
        devTools: false,
      },
    });

    progressWindow.setMenuBarVisibility(false);
    progressWindow.on(`close`, (event: Record<string, any>) => {
      if (programmaticClose || handlingUserClose) return;
      event.preventDefault();
      handlingUserClose = true;
      try {
        onQuit();
      } finally {
        handlingUserClose = false;
      }
    });
    progressWindow.webContents.setWindowOpenHandler(() => ({ action: `deny` }));
    progressWindow.webContents.on(`will-navigate`, (event: Record<string, any>) => {
      event.preventDefault();
    });

    try {
      await progressWindow.loadURL(
        `data:text/html;charset=utf-8,${encodeURIComponent(buildProgressWindowHtml(title, detail, escapeHtml))}`,
      );
    } catch (error) {
      programmaticClose = true;
      if (!progressWindow.isDestroyed()) progressWindow.destroy();
      throw error;
    }

    if (!progressWindow.isDestroyed()) {
      progressWindow.center();
      if (activate) {
        progressWindow.show();
        progressWindow.focus();
      } else {
        progressWindow.showInactive();
      }
    }
    return () => {
      programmaticClose = true;
      if (!progressWindow.isDestroyed()) progressWindow.destroy();
    };
  }

  function createDelayedStartupProgressWindow({
    delayMs,
    onError,
    ...options
  }: Record<string, any>) {
    return createDelayedProgressWindow({
      delayMs,
      show: () => createStartupProgressWindow(options),
      onError,
    });
  }

  return { createStartupProgressWindow, createDelayedStartupProgressWindow };
}

export function buildProgressWindowHtml(
  title: string,
  detail: string,
  escapeHtml: (value: string) => string,
) {
  const escapedTitle = escapeHtml(title);
  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    :root { color-scheme: light dark; }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      min-height: 100vh;
      display: flex;
      align-items: center;
      background: Canvas;
      color: CanvasText;
      font-family: system-ui, sans-serif;
    }
    main { width: 100%; padding: 28px 32px; }
    h1 { margin: 0; font-size: 17px; font-weight: 600; }
    p { margin: 8px 0 0; color: GrayText; font-size: 13px; line-height: 1.45; }
    progress { width: 100%; margin-top: 22px; }
  </style>
</head>
<body>
  <main>
    <h1>${escapedTitle}</h1>
    <p>${escapeHtml(detail)}</p>
    <progress aria-label="${escapedTitle}"></progress>
  </main>
</body>
</html>`;
}

if (typeof module !== "undefined") {
  module.exports = { buildProgressWindowHtml, createStartupProgressWindowRuntime };
}
