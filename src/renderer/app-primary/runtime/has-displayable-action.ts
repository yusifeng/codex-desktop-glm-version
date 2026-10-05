export interface DisplayableAction { text?: string | null; id?: string | null; action_v2?: { action_enum?: string; text?: string | null } }

/** Return whether an action has a non-blank label or fallback identifier. */
export function hasDisplayableAction(action: DisplayableAction): boolean {
  const text = action.text ?? (action.action_v2?.action_enum === "copy_to_clipboard" ? action.action_v2.text : action.id);
  return text != null && text.trim().length > 0;
}
