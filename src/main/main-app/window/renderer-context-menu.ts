// @ts-nocheck

const ICON_SIZE = 16;
const SVG_DATA_URL_PREFIX = `data:image/svg+xml`;

/** Registers the renderer-driven native context menu RPC, including icon projection. */
export function registerRendererContextMenu(options: Record<string, any>) {
  const {
    ipcMain,
    channel,
    BrowserWindow,
    screen,
    nativeImage,
    Menu,
    platform,
    fileURLToPath,
    join,
    existsSync,
    iconSearchRoots,
    isTrustedIpcEvent,
  } = options;

  ipcMain.handle(channel, async (event: Record<string, any>, items: Record<string, any>[]) => {
    if (!isTrustedIpcEvent(event)) return { id: null };
    const ownerWindow = BrowserWindow.fromWebContents(event.sender);
    const displayScale = ownerWindow == null
      ? 1
      : screen.getDisplayMatching(ownerWindow.getBounds()).scaleFactor;
    const iconScale = Number.isFinite(displayScale) && displayScale > 0
      ? Math.max(1, Math.round(ICON_SIZE * displayScale)) / ICON_SIZE
      : 1;
    const renderedIcons = await renderSvgIcons(event.sender, items, iconScale);

    return new Promise((resolve) => {
      let resolved = false;
      const finish = (id: string | null) => {
        if (resolved) return;
        resolved = true;
        resolve({ id });
      };
      const projectItems = (sourceItems: Record<string, any>[]) =>
        sourceItems.map((item) =>
          item.type === `separator`
            ? { type: `separator` }
            : {
                id: item.id,
                type: item.type,
                checked: item.checked,
                label: item.label.replaceAll(`&`, `&&`),
                role: item.role,
                accelerator: item.accelerator,
                registerAccelerator: false,
                enabled: item.enabled ?? true,
                icon: loadIcon(
                  item.icon == null ? undefined : (renderedIcons.get(item.icon) ?? item.icon),
                  item.icon?.startsWith(SVG_DATA_URL_PREFIX),
                  item.icon != null && renderedIcons.has(item.icon) ? iconScale : undefined,
                ),
                toolTip: item.toolTip,
                click: () => finish(item.id),
                submenu: item.submenu ? projectItems(item.submenu) : undefined,
              },
        );
      Menu.buildFromTemplate(projectItems(items)).popup({
        window: ownerWindow ?? undefined,
        callback: () => finish(null),
      });
    });
  });

  return () => ipcMain.removeHandler(channel);

  async function renderSvgIcons(
    webContents: Record<string, any>,
    items: Record<string, any>[],
    scale: number,
  ) {
    const icons = new Set<string>();
    const collect = (sourceItems: Record<string, any>[]) => {
      for (const item of sourceItems) {
        if (
          item.icon?.startsWith(SVG_DATA_URL_PREFIX) ||
          (item.icon?.startsWith(`/apps/`) && item.icon.endsWith(`.svg`))
        ) {
          icons.add(item.icon);
        }
        if (item.submenu) collect(item.submenu);
      }
    };
    collect(items);
    if (icons.size === 0) return new Map();
    try {
      const result = await webContents.executeJavaScript(`Promise.all(${JSON.stringify([...icons])}.map(async (url) => {
        try {
          const image = new Image();
          if (url.startsWith(${JSON.stringify(SVG_DATA_URL_PREFIX)})) {
            const color = getComputedStyle(document.documentElement).color;
            const separator = url.indexOf(",");
            const encodedSvg = url.slice(separator + 1);
            const svg = url.slice(0, separator).endsWith(";base64")
              ? atob(encodedSvg)
              : decodeURIComponent(encodedSvg);
            image.src = "data:image/svg+xml;utf8," +
              encodeURIComponent(svg.replaceAll("currentColor", color));
          } else {
            image.src = url;
          }
          await image.decode();
          const canvas = document.createElement("canvas");
          canvas.width = ${Math.round(ICON_SIZE * scale)};
          canvas.height = ${Math.round(ICON_SIZE * scale)};
          const context = canvas.getContext("2d");
          if (context == null) return [url, null];
          context.drawImage(image, 0, 0, canvas.width, canvas.height);
          return [url, canvas.toDataURL("image/png")];
        } catch {
          return [url, null];
        }
      }))`);
      if (!Array.isArray(result)) return new Map();
      const entries = [];
      for (const entry of result) {
        if (
          Array.isArray(entry) &&
          entry.length === 2 &&
          typeof entry[0] === `string` &&
          typeof entry[1] === `string`
        ) {
          entries.push([entry[0], entry[1]]);
        }
      }
      return new Map(entries);
    } catch {
      return new Map();
    }
  }

  function resizeIcon(image: Record<string, any>) {
    const { width, height } = image.getSize();
    return !width || !height || (width <= ICON_SIZE && height <= ICON_SIZE)
      ? image
      : image.resize({ width: ICON_SIZE, height: ICON_SIZE, quality: `best` });
  }

  function loadIcon(value?: string, template = false, scale?: number) {
    if (!value) return undefined;
    try {
      if (value.startsWith(`data:`)) {
        const image = scale == null ? nativeImage.createFromDataURL(value) : nativeImage.createEmpty();
        if (scale != null) image.addRepresentation({ dataURL: value, scaleFactor: scale });
        const resized = resizeIcon(image);
        if (platform === `darwin` && template) resized.setTemplateImage(true);
        return resized;
      }
      if (value.startsWith(`file://`)) {
        return resizeIcon(nativeImage.createFromPath(fileURLToPath(value)));
      }
      if (value.startsWith(`/`) && !value.startsWith(`/apps/`)) {
        return resizeIcon(nativeImage.createFromPath(value));
      }
      for (const root of iconSearchRoots) {
        const candidate = value.startsWith(`/apps/`)
          ? join(root, value.slice(1))
          : new URL(value, `file://${root.endsWith(`/`) ? root : `${root}/`}`).pathname;
        if (!existsSync(candidate)) continue;
        const image = nativeImage.createFromPath(candidate);
        if (!image.isEmpty()) return resizeIcon(image);
      }
    } catch {}
    return undefined;
  }
}

if (typeof module !== "undefined") {
  module.exports = { registerRendererContextMenu };
}
