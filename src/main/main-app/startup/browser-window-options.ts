export function buildBrowserWindowOptions(input: {
  width: number;
  height: number;
  x?: number;
  y?: number;
  title: string;
  icon?: string | null;
  backgroundColor: string;
  show: boolean;
  parent?: unknown;
  focusable?: boolean;
  autoHideMenuBar: boolean;
  backgroundMaterial?: unknown;
  hasNativeGlass: boolean;
  supportsWindowTiling?: boolean;
  appearanceOptions: Record<string, unknown>;
  minWidth?: number;
  minHeight?: number;
  webPreferences: Record<string, unknown>;
}) {
  return {
    width: input.width,
    height: input.height,
    ...(input.x === undefined || input.y === undefined ? {} : { x: input.x, y: input.y }),
    title: input.title,
    ...(input.icon == null ? {} : { icon: input.icon }),
    backgroundColor: input.backgroundColor,
    show: input.show,
    parent: input.parent,
    ...(input.focusable === undefined ? {} : { focusable: input.focusable }),
    ...(input.autoHideMenuBar ? { autoHideMenuBar: true } : {}),
    backgroundMaterial: input.backgroundMaterial ?? undefined,
    hasNativeGlass: input.hasNativeGlass,
    supportsWindowTiling: input.supportsWindowTiling,
    ...input.appearanceOptions,
    minWidth: input.minWidth,
    minHeight: input.minHeight,
    webPreferences: input.webPreferences,
  };
}

if (typeof module !== `undefined`) module.exports = { buildBrowserWindowOptions };
