export interface WindowsNativeAppIconCache<T> {
  get(key: string, load?: () => Promise<T>): Promise<T>;
}

export function createWindowsNativeAppIconCache<T>(
  load: (key: string) => Promise<T>,
  maxEntries = 100,
  isEmpty: (value: T) => boolean = (value) => value == null,
): WindowsNativeAppIconCache<T> {
  const entries = new Map<string, Promise<T>>();

  return {
    get(key, loadOverride) {
      const cached = entries.get(key);
      if (cached != null) {
        entries.delete(key);
        entries.set(key, cached);
        return cached;
      }
      const pending = loadOverride == null ? load(key) : loadOverride();
      entries.set(key, pending);
      pending.then(
        (value) => {
          if (isEmpty(value) && entries.get(key) === pending) entries.delete(key);
        },
        () => {
          if (entries.get(key) === pending) entries.delete(key);
        },
      );
      while (entries.size > maxEntries) {
        const oldest = entries.keys().next().value;
        if (oldest == null) break;
        entries.delete(oldest);
      }
      return pending;
    },
  };
}
