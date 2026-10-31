// @ts-nocheck

/** Broadcasts native theme changes to live renderer windows and refreshes window backdrops. */
export function installNativeThemeWindowSync(options: Record<string, any>) {
  const { listWindows, nativeTheme, refreshWindowBackdrops, themeChannel } = options;
  const update = () => {
    const theme = nativeTheme.shouldUseDarkColors ? `dark` : `light`;
    refreshWindowBackdrops();
    for (const window of listWindows())
      if (!window.isDestroyed()) window.webContents.send(themeChannel, theme);
  };
  nativeTheme.on(`updated`, update);
  return () => nativeTheme.off(`updated`, update);
}

if (typeof module !== `undefined`) module.exports = { installNativeThemeWindowSync };
