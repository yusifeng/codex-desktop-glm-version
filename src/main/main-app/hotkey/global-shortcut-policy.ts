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

/** Purely remap a single accelerator key through a mac keyboard layout map. */
export function remapGlobalShortcutForLayout(
  accelerator: string,
  layoutMap: Record<string, string>,
): string {
  const parts = accelerator.split("+").filter(Boolean);
  const index = parts.findIndex((part) => /^[A-Z0-9]$/i.test(part));
  if (index === -1) return accelerator;
  const single = parts[index];
  if (single == null) return accelerator;
  const lowered = single.toLowerCase();
  for (const [code, label] of Object.entries(layoutMap)) {
    if (label.toLowerCase() !== lowered) continue;
    const mapped = /^Key[A-Z]$/.test(code) ? code.slice(3) : /^Digit[0-9]$/.test(code) ? code.slice(5) : null;
    if (mapped != null) return parts.map((part, partIndex) => (partIndex === index ? mapped : part)).join("+");
  }
  return accelerator;
}

export function isGlobalDictationWatchable(
  accelerator: string,
  platform: string,
  dependencies: {
    macModifierNames: (value: string) => string[];
    win32KeyGroups: (value: string, platform: string) => number[][] | null;
  },
): boolean {
  return platform === "darwin"
    ? dependencies.macModifierNames(accelerator).length > 0
    : dependencies.win32KeyGroups(accelerator, platform) != null;
}

const MAC_MODIFIER_NAMES: Record<string, string> = {
  cmdorctrl: "command", command: "command", cmd: "command", control: "control", ctrl: "control",
  alt: "alternate", option: "alternate", shift: "shift",
};

export function resolveMacModifierNames(accelerator: string): string[] {
  const names: string[] = [];
  for (const part of accelerator.split("+")) {
    const name = MAC_MODIFIER_NAMES[part.trim().toLowerCase()];
    if (name != null && !names.includes(name)) names.push(name);
  }
  return names;
}

if (typeof module !== "undefined") module.exports = { validateGlobalShortcut, remapGlobalShortcutForLayout, isGlobalDictationWatchable, resolveMacModifierNames };
