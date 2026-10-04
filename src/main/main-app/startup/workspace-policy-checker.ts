export type WorkspacePolicyNotification = { method?: string; params?: { success?: boolean; authMode?: string } };

export function createWorkspacePolicyChecker(options: {
  isAppQuitting: () => boolean;
  getAuthMethod: () => Promise<string>;
  hasStartupPolicyChanges: () => Promise<boolean>;
  onRestartRequired: () => void;
  onError?: (error: unknown) => void;
}) {
  let loggingIn = false;
  let restartShown = false;
  let generation = 0;
  const checkForChanges = async () => {
    const current = ++generation;
    if (loggingIn || restartShown || options.isAppQuitting()) return;
    try {
      if (await options.getAuthMethod() !== `chatgpt` || current !== generation || !(await options.hasStartupPolicyChanges()) || restartShown || options.isAppQuitting() || current !== generation) return;
      restartShown = true;
      options.onRestartRequired();
    } catch (error) {
      options.onError?.(error);
    }
  };
  return {
    checkForChanges,
    async handleNotification(notification: WorkspacePolicyNotification) {
      if (notification.method === `account/login/completed`) {
        if (notification.params?.success === true) { loggingIn = true; generation += 1; }
      } else if (notification.method === `account/updated`) {
        loggingIn = false;
        generation += 1;
        if (notification.params?.authMode === `chatgpt`) await checkForChanges();
      }
    },
  };
}

if (typeof module !== `undefined`) module.exports = { createWorkspacePolicyChecker };
