/** Return the release shortcut label for the current desktop platform. */
export function getPlatformCommandShortcutLabel(platform = globalThis.navigator?.platform): "Ctrl I" | "⌘I" {
  return /Win|Linux/.test(platform ?? "") ? "Ctrl I" : "⌘I";
}
