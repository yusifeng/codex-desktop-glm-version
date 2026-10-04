export interface CommandAccess {
  codexLocal: boolean;
  workLocal: boolean;
}

/** Pure command visibility predicates formerly exported by app-shared. */
export function isRealtimeVoiceCommand(commandId: string): boolean {
  return commandId === "composer.startVoiceMode" ||
    commandId === "realtimeVoice" ||
    commandId.startsWith("realtimeVoice.");
}

export function hasRequiredCommandAccess(
  command: { requiredAccess?: "codexLocal" | "codexOrWorkLocal" },
  access: CommandAccess,
): boolean {
  switch (command.requiredAccess) {
    case "codexLocal": return access.codexLocal;
    case "codexOrWorkLocal": return access.codexLocal || access.workLocal;
    default: return true;
  }
}
