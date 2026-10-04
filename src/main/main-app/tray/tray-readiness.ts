export function isTrayReady(ready: boolean, tray: { isReady?: () => boolean } | null): boolean {
  return ready && tray?.isReady?.() === true;
}

if (typeof module !== `undefined`) module.exports = { isTrayReady };
