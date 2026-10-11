export interface ShortcutLinkResult {
  icon: string;
  target: string;
}

export type ShortcutLinkReader = (path: string) => ShortcutLinkResult;

/** Cache shell shortcut-link lookups while keeping the platform API injected. */
export function createShortcutLinkReader(readShortcutLink: ShortcutLinkReader): ShortcutLinkReader {
  const cache = new Map<string, ShortcutLinkResult>();
  return (path: string) => {
    let result = cache.get(path);
    if (result == null) {
      result = readShortcutLink(path);
      cache.set(path, result);
    }
    return { icon: result.icon, target: result.target };
  };
}

if (typeof module !== `undefined`) module.exports = { createShortcutLinkReader };
