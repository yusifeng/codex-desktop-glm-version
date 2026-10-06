/** Identifies commands that enter or operate the realtime voice surface. */
export function isRealtimeVoiceCommand(commandId: string): boolean {
  return commandId === "composer.startVoiceMode" || commandId === "realtimeVoice" || commandId.startsWith("realtimeVoice.");
}
