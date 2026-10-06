export type HotkeyPolicyDependencies = {
  isBareModifierAccelerator: (accelerator: string, platform: string) => boolean;
  isBareOrUnsupported: (accelerator: string) => boolean;
};

/** Pure global shortcut validation; registration and permission effects remain in global-shortcut.ts. */
export function validateGlobalShortcut(
  accelerator: string,
  platform: string,
  dependencies: HotkeyPolicyDependencies,
): string | null {
  const parts = accelerator
    .split("+")
    .map((part) => part.trim())
    .filter((part) => part.length > 0);
  if (dependencies.isBareModifierAccelerator(accelerator, platform)) return null;
  if (parts.some((part) => dependencies.isBareOrUnsupported(part)))
    return parts.length === 1
      ? platform === "darwin"
        ? dependencies.isBareModifierAccelerator(accelerator, platform)
          ? null
          : "This shortcut key is not supported."
        : "Choose a shortcut with Ctrl or Alt plus another key."
      : "Use Ctrl, Alt, or Command when combining with another key.";
  if (parts.length === 0) return "Shortcut cannot be empty.";
  const modifierTokens = new Set(["cmdorctrl", "command", "cmd", "control", "ctrl", "alt", "option", "super"]);
  const modifierOrShiftTokens = new Set([...modifierTokens, "shift"]);
  let hasCmdOrCtrlOrAlt = false;
  let nonModifier: string | null = null;
  for (const part of parts) {
    const lowered = part.toLowerCase();
    if (modifierOrShiftTokens.has(lowered)) {
      if (modifierTokens.has(lowered)) hasCmdOrCtrlOrAlt = true;
      continue;
    }
    if (nonModifier != null) return "Shortcut must include exactly one non-modifier key.";
    nonModifier = part;
  }
  return nonModifier == null
    ? "Shortcut must include a non-modifier key."
    : hasCmdOrCtrlOrAlt
      ? null
      : "Shortcut must include Cmd/Ctrl or Alt.";
}

if (typeof module !== "undefined") module.exports = { validateGlobalShortcut };
