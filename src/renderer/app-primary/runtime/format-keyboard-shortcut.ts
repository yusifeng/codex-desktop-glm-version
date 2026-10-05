export interface KeyboardShortcutEvent { key?: string; ctrlKey?: boolean; metaKey?: boolean; altKey?: boolean; shiftKey?: boolean }

/** Format a keyboard event as the user-facing modifier/key shortcut label. */
export function formatKeyboardShortcut(event: KeyboardShortcutEvent, normalizeKey: (event: KeyboardShortcutEvent) => string | null): string | null {
  const key = normalizeKey(event);
  if (key == null) return null;
  const parts: string[] = [];
  if (event.ctrlKey) parts.push("Ctrl");
  if (event.metaKey) parts.push("Command");
  if (event.altKey) parts.push("Alt");
  if (event.shiftKey) parts.push("Shift");
  parts.push(key);
  return parts.join("+");
}
