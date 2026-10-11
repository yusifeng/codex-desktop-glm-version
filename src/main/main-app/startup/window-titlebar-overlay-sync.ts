type WindowTitlebarOverlaySyncDependencies = {
  platform: string;
  appearance: string;
  nativeTheme: { on: (event: string, listener: () => void) => void; off: (event: string, listener: () => void) => void };
  eligibleAppearances?: ReadonlySet<string>;
  isWindowEligible?: (appearance: string) => boolean;
  isDestroyed: () => boolean;
  setTitleBarOverlay: (options: unknown) => void;
  getOverlay: () => unknown;
};

/** Installs the native-theme title-bar overlay lifecycle and returns its cleanup. */
function installWindowTitlebarOverlaySync(dependencies: WindowTitlebarOverlaySyncDependencies) {
  const eligible = dependencies.isWindowEligible
    ? dependencies.isWindowEligible(dependencies.appearance)
    : dependencies.eligibleAppearances?.has(dependencies.appearance) === true;
  if ((dependencies.platform !== `win32` && dependencies.platform !== `linux`) || !eligible) return;

  const update = () => {
    if (!dependencies.isDestroyed()) dependencies.setTitleBarOverlay(dependencies.getOverlay());
  };
  dependencies.nativeTheme.on(`updated`, update);
  update();
  return () => dependencies.nativeTheme.off(`updated`, update);
}

export { installWindowTitlebarOverlaySync };
if (typeof module !== `undefined`) module.exports = { installWindowTitlebarOverlaySync };
