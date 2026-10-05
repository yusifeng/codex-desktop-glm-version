/** Resolve a display label from action text, enum payload, or id. */
export function extractActionLabel(action: { text?: string | null; action_v2?: { action_enum?: string; text?: string | null }; id?: string | null }): string | null {
  const value = action.text ?? (action.action_v2?.action_enum === "copy_to_clipboard" ? action.action_v2.text : action.id);
  return value == null || value.trim().length === 0 ? null : value;
}
