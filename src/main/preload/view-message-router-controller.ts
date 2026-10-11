type ViewMessageRouterDependencies = {
  isChunkedHostMessage: (message: unknown) => boolean;
  setSharedObjectValue: (key: string, value: unknown) => void;
  disposePipLayout: (state: { activeThreadID: string; orderedPresentationIDs: string[] }) => void;
  dispatchMessage: (message: unknown) => void;
};

/** Routes host messages to preload snapshot/PIP cleanup owners before DOM dispatch. */
function createViewMessageRouterController(dependencies: ViewMessageRouterDependencies) {
  let disposed = false;
  const route = (message: any) => {
    if (disposed) return false;
    if (!dependencies.isChunkedHostMessage(message)) {
      if (message?.type === `shared-object-updated`) {
        dependencies.setSharedObjectValue(message.key as string, message.value);
      } else if (message?.type === `remote-hosted-pip-content-layout-state-changed`) {
        dependencies.disposePipLayout(message.state);
      }
    }
    dependencies.dispatchMessage(message);
    return true;
  };
  const dispose = () => { disposed = true; };
  return { route, dispose };
}

export { createViewMessageRouterController };
if (typeof module !== `undefined`) module.exports = { createViewMessageRouterController };
