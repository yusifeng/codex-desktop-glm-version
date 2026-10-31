// @ts-nocheck

/** Buffers completed-thread state until the optional macOS Dock menu controller exists. */
export function createDockMenuLifecycle(options: Record<string, any>) {
  const { createController, enabled } = options;
  let completedThreads: Array<unknown> = [];
  let controller: any = null;

  return {
    start() {
      if (!enabled || controller != null) return controller;
      controller = createController();
      controller.setCompletedThreads(completedThreads);
      return controller;
    },
    setCompletedThreads(nextCompletedThreads: Array<unknown>) {
      completedThreads = nextCompletedThreads;
      controller?.setCompletedThreads(nextCompletedThreads);
    },
    refreshMenu() {
      controller?.refreshMenu();
    },
    getController() {
      return controller;
    },
  };
}

if (typeof module !== `undefined`) module.exports = { createDockMenuLifecycle };
