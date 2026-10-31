export interface ConnectAppHostControllerDependencies {
  addMessageListener: (listener: (event: unknown) => void) => void;
  removeMessageListener: (listener: (event: unknown) => void) => void;
  postMessage: (channel: string, message: unknown, transfer: MessagePort[]) => void;
  channel: string;
  windowSource: unknown;
}

/** Owns the preload window-message listener that transfers app-host ports to main. */
export function createConnectAppHostController(dependencies: ConnectAppHostControllerDependencies) {
  let active = true;
  const onMessage = (event: any) => {
    if (!active || event?.source !== dependencies.windowSource || event?.data?.type !== `connect-app-host`) return;
    const port = event.data?.port;
    if (port == null) return;
    dependencies.postMessage(dependencies.channel, void 0, [port]);
  };
  dependencies.addMessageListener(onMessage);
  return {
    dispose() {
      if (!active) return;
      active = false;
      dependencies.removeMessageListener(onMessage);
    },
  };
}
