const macChordLabels = new Map([
  ["LeftOption+RightOption", "⌥ + ⌥"],
  ["LeftAlt+RightAlt", "⌥ + ⌥"],
  ["LeftCommand+RightCommand", "⌘ + ⌘"],
  ["LeftCmd+RightCmd", "⌘ + ⌘"],
  ["LeftMeta+RightMeta", "⌘ + ⌘"],
  ["LeftShift+RightShift", "⇧ + ⇧"],
]);

function formatKey(key: string | null, isMac: boolean): string {
  if (key == null) return "";
  if (isMac && key === "Plus") return "+";
  const labels: Record<string, string | [string, string]> = {
    Enter: "⏎", Escape: "Esc", LeftOption: ["Left Option", "Left ⌥"], RightOption: ["Right Option", "Right ⌥"],
    DoubleOption: ["Double Option", "⌥ + ⌥"], LeftCommand: ["Left Command", "Left ⌘"],
    DoubleCommand: ["Double Command", "⌘ + ⌘"], RightCommand: ["Right Command", "Right ⌘"],
    LeftControl: ["Left Control", "Left ⌃"], RightControl: ["Right Control", "Right ⌃"],
    LeftShift: ["Left Shift", "Left ⇧"], RightShift: ["Right Shift", "Right ⇧"],
    DoubleShift: ["Double Shift", "⇧ + ⇧"], Fn: "Fn", MouseBack: "Mouse Back", MouseForward: "Mouse Forward",
  };
  const label = labels[key];
  return Array.isArray(label) ? label[isMac ? 1 : 0] : (label ?? key);
}

function formatChord(chord: string, isMac: boolean, isLinux: boolean): string {
  const special = macChordLabels.get(chord);
  if (isMac && special != null) return special;
  const modifiers = new Set<string>();
  let key: string | null = null;
  for (const part of chord.split("+").filter(Boolean)) {
    switch (part) {
      case "CmdOrCtrl": modifiers.add(isMac ? "Command" : "Ctrl"); break;
      case "Command": case "Cmd": case "Super": modifiers.add(isMac ? "Command" : isLinux ? "Super" : "Win"); break;
      case "Control": case "Ctrl": modifiers.add("Ctrl"); break;
      case "Alt": case "Option": modifiers.add("Alt"); break;
      case "Shift": modifiers.add("Shift"); break;
      default: key = part;
    }
  }
  if (isMac && key === "/" && modifiers.has("Shift")) {
    modifiers.delete("Shift");
    key = "?";
  }
  const formattedKey = formatKey(key, isMac);
  if (isMac) {
    const symbols: Record<string, string> = { Ctrl: "⌃", Alt: "⌥", Shift: "⇧", Command: "⌘" };
    return `${["Ctrl", "Alt", "Shift", "Command"].filter((item) => modifiers.has(item)).map((item) => symbols[item]).join("")}${formattedKey}`;
  }
  const normalized = Array.from(modifiers).map((item) => item === "Command" ? "Cmd" : item);
  return [...["Ctrl", "Alt", "Shift", "Cmd", "Super", "Win"].filter((item) => normalized.includes(item)), formattedKey].filter(Boolean).join("+");
}

/** Format one or more whitespace-delimited shortcut chords for the active platform. */
export function formatKeyboardShortcut(
  value: string,
  isMac = typeof navigator === "undefined" ? false : (navigator.platform ?? "").startsWith("Mac"),
  isLinux = !isMac && (typeof navigator === "undefined" ? false : (navigator.platform ?? "").startsWith("Linux")),
): string {
  return value.trim().split(/\s+/u).filter(Boolean).map((chord) => formatChord(chord, isMac, isLinux)).join(" ");
}

