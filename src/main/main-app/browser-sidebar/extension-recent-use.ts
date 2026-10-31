const RECENTLY_USED_STATE_KEY = "electron-browser-extension-recently-used";

type ExtensionProfile = {
  listeners: Set<() => void>;
  recentlyUsedExtensionIds: string[];
};

class ExtensionRecentUseRegistry {
  private readonly profiles = new WeakMap<object, ExtensionProfile>();

  constructor(private readonly globalState: any) {}

  getRecentlyUsed(session: any, toolbarState: any) {
    const profile = this.profileFor(session);
    if (toolbarState.ready) this.reconcilePins(session, profile, toolbarState, false);
    return profile.recentlyUsedExtensionIds;
  }

  recordUse(session: any, extensionId: string) {
    const toolbarState = session.extensions.getExtensionToolbarState();
    if (!toolbarState.ready || !toolbarState.pinnedExtensionIds.includes(extensionId)) return;
    const profile = this.profileFor(session);
    this.reconcilePins(session, profile, toolbarState, false);
    this.setRecentlyUsed(
      session,
      profile,
      [extensionId, ...profile.recentlyUsedExtensionIds.filter((id) => id !== extensionId)],
      true,
    );
  }

  refreshPins(session: any) {
    const toolbarState = session.extensions.getExtensionToolbarState();
    if (toolbarState.ready) this.reconcilePins(session, this.profileFor(session), toolbarState, true);
  }

  subscribe(session: any, listener: () => void) {
    const profile = this.profileFor(session);
    profile.listeners.add(listener);
    return () => profile.listeners.delete(listener);
  }

  private profileFor(session: any) {
    let profile = this.profiles.get(session);
    if (profile == null) {
      const storagePath = session.storagePath;
      profile = {
        listeners: new Set(),
        recentlyUsedExtensionIds:
          storagePath == null ? [] : (this.globalState.get(RECENTLY_USED_STATE_KEY)?.[storagePath] ?? []),
      };
      this.profiles.set(session, profile);
    }
    return profile;
  }

  private reconcilePins(session: any, profile: ExtensionProfile, toolbarState: any, notify: boolean) {
    const retainedPins = new Set([...toolbarState.pinnedExtensionIds, ...toolbarState.storedPinnedExtensionIds]);
    const recentIds = new Set(profile.recentlyUsedExtensionIds);
    const newlyPinned = toolbarState.pinnedExtensionIds.filter((id: string) => !recentIds.has(id)).reverse();
    this.setRecentlyUsed(
      session,
      profile,
      Array.from(new Set([...newlyPinned, ...profile.recentlyUsedExtensionIds.filter((id) => retainedPins.has(id))])),
      notify,
    );
  }

  private setRecentlyUsed(session: any, profile: ExtensionProfile, ids: string[], notify: boolean) {
    if (
      ids.length === profile.recentlyUsedExtensionIds.length &&
      ids.every((id, index) => id === profile.recentlyUsedExtensionIds[index])
    )
      return;
    profile.recentlyUsedExtensionIds = ids;
    const storagePath = session.storagePath;
    if (storagePath != null)
      this.globalState.update(RECENTLY_USED_STATE_KEY, (value: any) => ({ ...value, [storagePath]: ids }));
    if (notify) for (const listener of profile.listeners) listener();
  }
}

export function createExtensionRecentUseRegistryFactory() {
  const registries = new WeakMap<object, ExtensionRecentUseRegistry>();
  return (globalState: object) => {
    let registry = registries.get(globalState);
    if (registry == null) {
      registry = new ExtensionRecentUseRegistry(globalState);
      registries.set(globalState, registry);
    }
    return registry;
  };
}
