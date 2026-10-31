export interface PipVideoFrameSubscriptionDependencies {
  addListener: (channel: string, handler: (event: unknown, message: any) => void) => void;
  removeListener: (channel: string, handler: (event: unknown, message: any) => void) => void;
  channel: string;
  onStopped: (threadID: string) => void;
  onFrame: (message: any) => void;
}

/** Owns the PIP frame IPC listener and preserves stopped/frame dispatch ordering. */
export function createPipVideoFrameSubscriptionController(dependencies: PipVideoFrameSubscriptionDependencies) {
  let active = true;
  const handler = (_event: unknown, message: any) => {
    if (!active) return;
    if (message != null && "stopped" in message) {
      dependencies.onStopped(message.threadID);
      return;
    }
    dependencies.onFrame(message);
  };
  dependencies.addListener(dependencies.channel, handler);
  return {
    dispose() {
      if (!active) return;
      active = false;
      dependencies.removeListener(dependencies.channel, handler);
    },
  };
}
