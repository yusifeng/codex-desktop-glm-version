// @ts-nocheck

function hasPetAccess(accessState: Record<string, any>) {
  return (
    accessState.status === `ready` &&
    (accessState.codexLocalAccess || accessState.workCloudAccess || accessState.workLocalAccess)
  );
}

/** Owns the optional global shortcut that toggles the pet/avatar overlay. */
export function createPetHotkeyManager(options: Record<string, any>) {
  const {
    toggleAvatarOverlay,
    resolveCommandKeybinding,
    isMacOS,
    registerGlobalHotkey,
    subscribeAccessState,
    getAccessState,
    releaseCommandKeybinding,
    logger,
  } = options;

  let commandKeybinding = resolveCommandKeybinding({ commandId: `openAvatarOverlay`, isMacOS });
  let registeredKeybinding = null;
  let registration = null;

  const unregister = () => {
    registration?.unregister();
    registration = null;
    registeredKeybinding = null;
  };

  const hasAccess = () => hasPetAccess(getAccessState());
  const syncRegistration = () => {
    if (commandKeybinding == null || !hasAccess()) {
      unregister();
      return;
    }
    if (registeredKeybinding === commandKeybinding) return;

    const nextRegistration = registerGlobalHotkey(commandKeybinding, {
      onPressed: () => {
        if (!hasAccess()) {
          unregister();
          return;
        }
        toggleAvatarOverlay().catch((error: unknown) => {
          logger.warning(`Failed to toggle pet from global hotkey`, {
            safe: {},
            sensitive: { error },
          });
        });
      },
    });
    if (nextRegistration == null) {
      throw Error(`Unable to register pet hotkey: ${commandKeybinding}`);
    }
    unregister();
    registration = nextRegistration;
    registeredKeybinding = commandKeybinding;
  };

  const unsubscribeAccessState = subscribeAccessState(() => {
    try {
      syncRegistration();
    } catch (error) {
      logger.warning(`Failed to sync pet hotkey access`, {
        safe: {},
        sensitive: { error },
      });
    }
  });

  try {
    syncRegistration();
  } catch (error) {
    logger.warning(`Failed to register pet hotkey`, { safe: {}, sensitive: { error } });
  }

  return {
    dispose() {
      unsubscribeAccessState();
      unregister();
    },
    syncCommandKeybinding(nextKeybinding: unknown) {
      if (nextKeybinding != null && nextKeybinding !== commandKeybinding) {
        releaseCommandKeybinding(nextKeybinding);
      }
      commandKeybinding = nextKeybinding;
      try {
        syncRegistration();
      } catch (error) {
        logger.warning(`Failed to sync pet hotkey`, { safe: {}, sensitive: { error } });
      }
    },
  };
}

if (typeof module !== "undefined") {
  module.exports = { createPetHotkeyManager };
}
