type DisplayChangeGeometryRefreshDependencies = {
  platform: string;
  screen: { on: (event: string, listener: () => void) => void; off: (event: string, listener: () => void) => void };
  refresh: () => void;
};

/** Installs display geometry refresh subscriptions and returns their cleanup. */
function installDisplayChangeGeometryRefresh(dependencies: DisplayChangeGeometryRefreshDependencies) {
  if (dependencies.platform !== `darwin`) return;
  const refresh = () => dependencies.refresh();
  dependencies.screen.on(`display-added`, refresh);
  dependencies.screen.on(`display-removed`, refresh);
  dependencies.screen.on(`display-metrics-changed`, refresh);
  return () => {
    dependencies.screen.off(`display-added`, refresh);
    dependencies.screen.off(`display-removed`, refresh);
    dependencies.screen.off(`display-metrics-changed`, refresh);
  };
}

export { installDisplayChangeGeometryRefresh };
if (typeof module !== `undefined`) module.exports = { installDisplayChangeGeometryRefresh };
