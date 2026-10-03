/** Appshot global-shortcut policy extracted from main-C-Mhak1n.ts 164,768-164,779. */

/**
 * Appshot accepts only a physical double-modifier shortcut. Separators are
 * intentionally ignored to match Electron command-keybinding serialization.
 */
export function isDoubleModifierShortcut(shortcut: string): boolean {
  const normalized = shortcut.replace(/[\s_-]/g, "").toLowerCase();
  return (
    normalized === "doublealt" ||
    normalized === "leftalt+rightalt" ||
    normalized === "doubleshift" ||
    normalized === "leftshift+rightshift"
  );
}

