type PrimaryWindowTrackingDependencies = {
  isFocused: () => boolean;
  now: () => number;
  addPrimaryWindow: () => void;
  setLastActiveWindow: () => void;
  setLastActiveAt: (timestamp: number) => void;
  hasLastActiveWindow: () => boolean;
  emitChange: () => void;
  on: (event: string, listener: () => void) => void;
};

/** Installs primary-window focus/blur tracking while leaving manager state ownership injected. */
function installPrimaryWindowTracking(dependencies: PrimaryWindowTrackingDependencies) {
  dependencies.addPrimaryWindow();
  if (dependencies.isFocused()) {
    dependencies.setLastActiveWindow();
    dependencies.setLastActiveAt(dependencies.now());
  } else if (!dependencies.hasLastActiveWindow()) {
    dependencies.setLastActiveWindow();
  }
  dependencies.emitChange();

  const focus = () => {
    dependencies.setLastActiveWindow();
    dependencies.setLastActiveAt(dependencies.now());
    dependencies.emitChange();
  };
  const blur = () => dependencies.setLastActiveAt(dependencies.now());
  dependencies.on(`focus`, focus);
  dependencies.on(`blur`, blur);
}

export { installPrimaryWindowTracking };
if (typeof module !== `undefined`) module.exports = { installPrimaryWindowTracking };
