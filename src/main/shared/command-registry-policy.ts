/** Pure shortcut policy shared by the command registry and its consumers.
 *
 * This is the semantic slice of the original worker command registry that
 * decides whether two commands compete for a binding and how an accelerator
 * is compared across platforms.  It intentionally has no filesystem,
 * Electron, or keymap state dependencies.
 */

/** Mouse accelerators are not user-configurable keyboard shortcuts. */
export function isMouseAccelerator(accelerator: string): boolean {
  return accelerator === "MouseBack" || accelerator === "MouseForward";
}

/** Semantic command pairs that share one effective shortcut slot. */
const CONFLICTING_COMMAND_GROUPS: readonly (readonly [string, string])[] = [
  ["globalDictationHold", "globalDictationToggle"],
  ["closeTab", "closeWindow"],
  ["nextTab", "nextThread"],
  ["nextTab", "nextRecentThread"],
  ["previousTab", "previousThread"],
  ["previousTab", "previousRecentThread"],
  ["goToLine", "focusBrowserAddressBar"],
  ["file.goToDefinition", "navigateForward"],
];

/** Whether two command ids compete for a shortcut binding. */
export function commandsConflict(commandId: string, otherCommandId: string): boolean {
  return (
    commandId === otherCommandId ||
    CONFLICTING_COMMAND_GROUPS.some((group) => group.includes(commandId) && group.includes(otherCommandId))
  );
}

/** Normalize an accelerator for platform-aware collision comparison. */
export function normalizeAccelerator(accelerator: string, isMacOS: boolean): string {
  return (accelerator.trim().split(/\s+/, 1)[0] ?? "")
    .toLowerCase()
    .split("+")
    .map((token) => {
      switch (token) {
        case "cmdorctrl":
        case "commandorcontrol":
          return isMacOS === false ? "ctrl" : "meta";
        case "cmd":
        case "command":
        case "super":
          return "meta";
        case "control":
          return "ctrl";
        case "option":
          return "alt";
        default:
          return token;
      }
    })
    .sort()
    .join("+");
}

/** Whether a binding is a platform-specific modified Enter shortcut. */
export function isModifiedEnter(accelerator: string, isMacOS: boolean): boolean {
  const parts = accelerator.trim().split(/\s+/, 1)[0]?.split("+");
  if (parts?.length !== 2 || !parts.some((part) => part.toLowerCase() === "enter")) return false;
  const modifier = parts[0]?.toLowerCase() === "enter" ? parts[1] : parts[0];
  return (
    modifier === "CmdOrCtrl" ||
    (isMacOS !== false && (modifier === "Command" || modifier === "Cmd")) ||
    (isMacOS !== true && (modifier === "Ctrl" || modifier === "Control"))
  );
}
