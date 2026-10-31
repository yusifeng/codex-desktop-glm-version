// @ts-nocheck

/** Owns macOS notification authorization and shared objc RunLoop lifetime. */
export function createMacNotificationPermissionRuntime(dependencies: Record<string, any>) {
  const { platform, createLogger, loadObjcJs } = dependencies;
  const logger = createLogger(`mac-notification-permission`);
  const authorizationOptions = 7;
  const frameworkPath =
    `/System/Library/Frameworks/UserNotifications.framework/UserNotifications`;
  let notificationCenter;
  let runLoopUsers = 0;
  let stopRunLoop;

  async function getNotificationCenter() {
    if (notificationCenter == null) {
      let { NobjcLibrary } = await loadObjcJs();
      notificationCenter = new NobjcLibrary(
        frameworkPath,
      ).UNUserNotificationCenter.currentNotificationCenter();
    }
    return notificationCenter;
  }

  function retainRunLoop(RunLoop) {
    return (
      runLoopUsers === 0 && (stopRunLoop = RunLoop.run()),
      (runLoopUsers += 1),
      () => {
        (--runLoopUsers,
          runLoopUsers === 0 && (stopRunLoop?.(), (stopRunLoop = void 0)));
      }
    );
  }

  async function requestAuthorization() {
    let { RunLoop, typedBlock } = await loadObjcJs(),
      center = await getNotificationCenter();
    return new Promise((resolve, reject) => {
      let releaseRunLoop = retainRunLoop(RunLoop);
      try {
        center.requestAuthorizationWithOptions$completionHandler$(
          authorizationOptions,
          typedBlock({ returns: `v`, args: [`B`, `@`] }, (granted, error) => {
            if ((releaseRunLoop(), error != null)) {
              (logger().warning(`macOS notification permission request returned an error`, {
                safe: { code: error.code(), domain: error.domain().toString() },
                sensitive: { localizedDescription: error.localizedDescription().toString() },
              }),
                reject(
                  Error(`Failed to request macOS notification authorization`, { cause: error }),
                ));
              return;
            }
            resolve(granted);
          }),
        );
      } catch (error) {
        (releaseRunLoop(),
          reject(Error(`Failed to request macOS notification authorization`, { cause: error })));
      }
    });
  }

  async function requestNotificationAuthorization() {
    if (platform === `darwin`)
      try {
        logger().info(`macOS notification permission request started`, {
          safe: {},
          sensitive: {},
        });
        let granted = await requestAuthorization();
        logger().info(`macOS notification permission request completed`, {
          safe: { granted },
          sensitive: {},
        });
      } catch (error) {
        logger().warning(`Failed to request macOS notification authorization`, {
          safe: {},
          sensitive: { error },
        });
      }
  }

  return { requestNotificationAuthorization, requestAuthorization };
}

if (typeof module !== "undefined") {
  module.exports = { createMacNotificationPermissionRuntime };
}
