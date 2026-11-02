/** Narrow command metadata that supplies a localized description id. */
export function hasDescriptionIntlId(value: object): boolean {
  return "descriptionIntlId" in value;
}

/** Return whether an OS-global shortcut permits modifier-only bindings. */
export function allowsBareOsGlobalModifiers(value: object): boolean {
  return "shortcutScope" in value &&
    value.shortcutScope === "os-global" &&
    "allowsBareModifiers" in value &&
    value.allowsBareModifiers === true;
}

/** Select the primary modifier state for Apple versus non-Apple platforms. */
export function getPrimaryModifierPressed(
  event: { ctrlKey: boolean; metaKey: boolean },
  platform = globalThis.navigator?.platform,
): boolean {
  return /Mac|iPhone|iPad|iPod/.test(platform ?? "") ? event.metaKey : event.ctrlKey;
}

/** Recognize the two mouse navigation buttons supported by shortcut bindings. */
export function isNavigationMouseButton(value: string): boolean {
  return value === "MouseBack" || value === "MouseForward";
}

/** Narrow webview command descriptors that opt into the command menu. */
export function isWebviewCommandMenu(value: { kind: string; commandMenu?: unknown }): boolean {
  return value.kind === "webview" && "commandMenu" in value && value.commandMenu === true;
}

/** Check whether a command is available in the requested application surface. */
export function isCommandAvailableIn(value: { availableIn?: readonly string[] }, surface: string): boolean {
  return value.availableIn?.includes(surface) ?? true;
}

/** Exclude VS Code-only and explicitly fixed shortcut definitions from configuration. */
export function isCommandShortcutConfigurable(value: { kind: string; shortcutConfigurable?: boolean }): boolean {
  return value.kind !== "vscode-only" &&
    !("shortcutConfigurable" in value && value.shortcutConfigurable === false);
}
