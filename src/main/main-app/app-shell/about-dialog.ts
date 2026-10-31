// @ts-nocheck

const DIALOG_WIDTH = 380;
const DEFAULT_DIALOG_HEIGHT = 360;
const APP_ICON_SIZE = 72;
const DARK_COLORS = `      --background: #202020;
      --border: #3a3a3a;
      --button-background: #2d2d2d;
      --button-background-hover: #383838;
      --button-border: #6b6b6b;
      --button-text: #f5f5f5;
      --footer-background: #252525;
      --muted-text: #c8c8c8;
      --selection: #005a9e;
      --text: #f5f5f5;`;
const LIGHT_COLORS = `      --background: #ffffff;
      --border: #d8d8d8;
      --button-background: #f3f3f3;
      --button-background-hover: #e9e9e9;
      --button-border: #8a8a8a;
      --button-text: #1f1f1f;
      --footer-background: #f5f5f5;
      --muted-text: #4f4f4f;
      --selection: #0078d4;
      --text: #1f1f1f;`;
const FOOTER_STYLES = `    .footer {
      display: flex;
      justify-content: flex-end;
      align-items: center;
      min-height: 56px;
      padding: 12px 14px 14px;
      border-top: 1px solid var(--border);
      background: var(--footer-background);
    }

    button {
      min-width: 76px;
      height: 28px;
      padding: 0 18px;
      border: 1px solid var(--button-border);
      border-radius: 2px;
      background: var(--button-background);
      color: var(--button-text);
      font: inherit;
      user-select: none;
      -webkit-user-select: none;
    }

    button:hover {
      background: var(--button-background-hover);
    }

    button:focus-visible {
      outline: 2px solid var(--selection);
      outline-offset: 1px;
    }`;

/** Owns the singleton About window, icon projection, secure HTML, sizing, and placement. */
export function createAboutDialog(dependencies: Record<string, any>) {
  const {
    app,
    BrowserWindow,
    screen,
    nativeImage,
    nativeTheme,
    platform,
    execPath,
    resourcesPath,
    join,
    getNativeIntl,
    parseReleaseDate,
    formatBuildFlavor,
    resolveMacAppIconPath,
    readMacIconDataUrl,
    resolveWindowsIcon,
    resolveLinuxIcon,
    iconBaseName,
    escapeHtml,
  } = dependencies;
  let aboutWindow = null;

  async function showAboutDialog({ buildFlavor, parent }: Record<string, any>) {
    if (aboutWindow != null && !aboutWindow.isDestroyed()) {
      if (aboutWindow.isMinimized()) aboutWindow.restore();
      aboutWindow.show();
      aboutWindow.focus();
      return;
    }
    const appName = app.getName();
    const appVersion = app.getVersion();
    const releaseDate = formatReleaseDate(appVersion, parseReleaseDate);
    const flavor = formatBuildFlavor(buildFlavor);
    const displayedVersion = flavor == null ? appVersion : `${appVersion} • ${flavor}`;
    const isMacOS = platform === `darwin`;
    const nativeIntl = getNativeIntl();
    const icons = await loadIcons(buildFlavor);
    const title = nativeIntl.formatMessage({
      messageId: `codex.aboutDialog.title`,
      defaultMessage: `About {appName}`,
      values: { appName },
    });
    const okLabel = isMacOS
      ? null
      : nativeIntl.formatMessage({
          messageId: `codex.aboutDialog.ok`,
          defaultMessage: `OK`,
        });
    const versionLine = releaseDate == null
      ? nativeIntl.formatMessage({
          messageId: `codex.aboutDialog.versionLine`,
          defaultMessage: `Version {version}`,
          values: { version: displayedVersion },
        })
      : nativeIntl
          .formatMessage({
            messageId: `codex.aboutDialog.versionLineWithDate`,
            defaultMessage: `Version {version} • Released {releaseDate}`,
            values: { version: displayedVersion, releaseDate },
          })
          .replace(/\s*•\s*(?=[^•]*$)/u, `\n\n`);
    const buildInfoLabel = nativeIntl.formatMessage({
      messageId: `codex.aboutDialog.buildInfoLabel`,
      defaultMessage: `Build information`,
    });
    const buildInfoText = [`Powered by Codex & OWL`, versionLine].join(`\n`);
    const validParent = parent != null && !parent.isDestroyed() ? parent : null;
    const isDark = nativeTheme.shouldUseDarkColors;
    const window = new BrowserWindow({
      width: DIALOG_WIDTH,
      height: DEFAULT_DIALOG_HEIGHT,
      useContentSize: true,
      title,
      show: false,
      resizable: false,
      minimizable: false,
      maximizable: false,
      fullscreenable: false,
      autoHideMenuBar: true,
      backgroundColor: isDark ? `#202020` : `#ffffff`,
      ...(icons.windowIcon.isEmpty() ? {} : { icon: icons.windowIcon }),
      ...(validParent == null
        ? {}
        : { parent: validParent, ...(isMacOS ? {} : { modal: true }) }),
      webPreferences: {
        contextIsolation: true,
        nodeIntegration: false,
        sandbox: true,
        spellcheck: false,
        devTools: false,
      },
    });
    aboutWindow = window;
    window.setMenuBarVisibility(false);
    if (!isMacOS) window.removeMenu();
    positionWindow(window, validParent);
    window.once(`closed`, () => {
      if (aboutWindow === window) aboutWindow = null;
    });
    window.webContents.setWindowOpenHandler(() => ({ action: `deny` }));
    window.webContents.on(`will-navigate`, (event: Record<string, any>) => {
      event.preventDefault();
    });
    try {
      await window.loadURL(
        `data:text/html;charset=utf-8,${encodeURIComponent(buildAboutDialogHtml({
          appDisplayName: appName,
          buildInfoLabel,
          buildInfoText,
          iconDataUrl: icons.htmlIconDataUrl,
          isDark,
          okLabel,
          title,
          escapeHtml,
        }))}`,
      );
      if (window.isDestroyed()) return;
      await resizeToContent(window);
      positionWindow(window, validParent);
      window.show();
      window.focus();
    } catch {
      if (aboutWindow === window) aboutWindow = null;
      if (!window.isDestroyed()) window.destroy();
    }
  }

  async function resizeToContent(window: Record<string, any>) {
    const measuredHeight = await window.webContents.executeJavaScript(
      `Math.ceil(document.querySelector(".dialog")?.getBoundingClientRect().height ?? document.documentElement.scrollHeight)`,
      true,
    );
    const height = typeof measuredHeight === `number` && Number.isFinite(measuredHeight)
      ? measuredHeight
      : DEFAULT_DIALOG_HEIGHT;
    window.setContentSize(DIALOG_WIDTH, height, false);
  }

  function positionWindow(window: Record<string, any>, parent: Record<string, any> | null) {
    if (parent == null || parent.isDestroyed()) {
      window.center();
      return;
    }
    const parentBounds = parent.getBounds();
    const windowBounds = window.getBounds();
    const workArea = screen.getDisplayMatching(parentBounds).workArea;
    const x = clamp(
      Math.round(parentBounds.x + (parentBounds.width - windowBounds.width) / 2),
      workArea.x,
      workArea.x + Math.max(0, workArea.width - windowBounds.width),
    );
    const y = clamp(
      Math.round(parentBounds.y + (parentBounds.height - windowBounds.height) / 2),
      workArea.y,
      workArea.y + Math.max(0, workArea.height - windowBounds.height),
    );
    window.setPosition(x, y, false);
  }

  async function loadIcons(buildFlavor: string) {
    const isMacOS = platform === `darwin`;
    const isWindows = platform === `win32`;
    const isLinux = platform === `linux`;
    let iconPath = execPath;
    if (isMacOS) {
      iconPath = resolveMacAppIconPath();
    } else if (isWindows) {
      iconPath = resolveWindowsIcon(buildFlavor) ?? join(
        app.isPackaged ? resourcesPath : join(app.getAppPath(), `src`, `icons`),
        `${iconBaseName(buildFlavor)}.ico`,
      );
    } else if (isLinux) {
      iconPath = resolveLinuxIcon(buildFlavor) ?? ``;
    }
    const [macIconDataUrl, windowIcon] = await Promise.all([
      isMacOS ? readMacIconDataUrl(iconPath) : null,
      isWindows || isLinux
        ? nativeImage.createFromPath(iconPath)
        : app.getFileIcon(iconPath, { size: `normal` }).catch(() => nativeImage.createEmpty()),
    ]);
    const themedWindowsIconPath = isWindows
      ? resolveWindowsIcon(buildFlavor, { isDark: nativeTheme.shouldUseDarkColors })
      : null;
    const htmlIcon = themedWindowsIconPath != null && themedWindowsIconPath !== iconPath
      ? nativeImage.createFromPath(themedWindowsIconPath)
      : windowIcon;
    return {
      htmlIconDataUrl:
        macIconDataUrl ?? (htmlIcon.isEmpty() ? null : htmlIcon.toDataURL()),
      windowIcon,
    };
  }

  return { showAboutDialog };
}

export function formatReleaseDate(version: string, parseReleaseDate: (value: string) => any) {
  const date = parseReleaseDate(version);
  return date == null
    ? null
    : new Intl.DateTimeFormat(undefined, { dateStyle: `medium` }).format(date);
}

export function clamp(value: number, minimum: number, maximum: number) {
  return Math.min(Math.max(value, minimum), maximum);
}

export function buildAboutDialogHtml(options: Record<string, any>) {
  const {
    appDisplayName,
    buildInfoLabel,
    buildInfoText,
    iconDataUrl,
    isDark,
    okLabel,
    title,
    escapeHtml,
  } = options;
  const icon = iconDataUrl == null
    ? ``
    : `<img class="app-icon" src="${escapeHtml(iconDataUrl)}" alt="">`;
  const footer = okLabel == null
    ? ``
    : `    <footer class="footer">
      <button id="ok" type="button" autofocus>${escapeHtml(okLabel)}</button>
    </footer>`;
  const clickHandler = okLabel == null
    ? ``
    : `
    document.getElementById("ok").addEventListener("click", closeDialog);`;
  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8">
  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src data:; style-src 'unsafe-inline'; script-src 'unsafe-inline'">
  <title>${escapeHtml(title)}</title>
  <style>
    :root {
      color-scheme: ${isDark ? `dark` : `light`};
${isDark ? DARK_COLORS : LIGHT_COLORS}
    }

    * { box-sizing: border-box; }
    body {
      margin: 0;
      width: 100vw;
      overflow: hidden;
      background: var(--background);
      color: var(--text);
      font-family: "Segoe UI", system-ui, -apple-system, BlinkMacSystemFont, sans-serif;
      font-size: 12px;
    }
    ::selection { background: var(--selection); color: #ffffff; }
    .dialog { display: flex; flex-direction: column; }
    .content {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: ${okLabel == null ? `32px` : `32px 32px 22px`};
      text-align: center;
    }
    .app-icon {
      width: ${APP_ICON_SIZE}px;
      height: ${APP_ICON_SIZE}px;
      object-fit: contain;
      margin-bottom: 14px;
      user-select: none;
      -webkit-user-drag: none;
    }
    .app-name {
      margin-bottom: 18px;
      font-size: 17px;
      line-height: 1.25;
      font-weight: 600;
    }
    .build-info {
      width: 100%;
      margin: 0;
      line-height: 1.45;
      color: var(--muted-text);
      white-space: pre-wrap;
      overflow-wrap: anywhere;
      border: 0;
      background: transparent;
      font: inherit;
    }
    .app-name, .build-info, .copyright {
      cursor: text;
      user-select: text;
      -webkit-user-select: text;
    }
    .copyright { margin-top: 14px; color: var(--muted-text); }

${okLabel == null ? `` : FOOTER_STYLES}
  </style>
</head>
<body>
  <main class="dialog">
    <section class="content" aria-labelledby="app-name">
      ${icon}
      <div class="app-name" id="app-name">${escapeHtml(appDisplayName)}</div>
      <pre class="build-info" aria-label="${escapeHtml(buildInfoLabel)}">${escapeHtml(buildInfoText)}</pre>
      <div class="copyright">© OpenAI</div>
    </section>
${footer}
  </main>
  <script>
    const closeDialog = () => window.close();
${clickHandler}
    window.addEventListener("keydown", (event) => {
      if (event.key === "Escape") {
        event.preventDefault();
        closeDialog();
      }
    });
  <\/script>
</body>
</html>`;
}

if (typeof module !== "undefined") {
  module.exports = { buildAboutDialogHtml, clamp, createAboutDialog, formatReleaseDate };
}
