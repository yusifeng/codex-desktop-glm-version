/** Narrow command metadata to shortcuts registered at OS-global scope. */
export function isOsGlobalShortcut(value: object): boolean {
  return "shortcutScope" in value && value.shortcutScope === "os-global";
}
