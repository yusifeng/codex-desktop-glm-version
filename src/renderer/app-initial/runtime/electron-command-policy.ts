/**
 * Command ids registered by the Electron command registry.
 *
 * The app-initial hub keeps handlers for these commands in a runtime map. The
 * command-list consumer only needs the map's membership check, so keep that
 * pure policy separate from the handler registration and host-message effects.
 */
const ELECTRON_COMMAND_IDS = new Set([
  "newTask",
  "newProjectlessTask",
  "archiveThread",
  "renameThread",
  "toggleThreadPin",
  "openAvatarOverlay",
  "hotkeyWindow",
  "settings",
  "codexMicroSettings",
  "mcpSettings",
  "personalitySettings",
  "keyboardShortcuts",
  "manageTasks",
  "openSkills",
  "openFolder",
  "toggleSidebar",
  "toggleBottomPanel",
  "toggleTerminal",
  "openBrowserTab",
  "toggleSidePanel",
  "toggleFileTreePanel",
  "findInThread",
  "searchChats",
  "navigateBack",
  "navigateForward",
]);

export function isElectronCommandEnabled(commandId: string): boolean {
  return ELECTRON_COMMAND_IDS.has(commandId);
}

export { ELECTRON_COMMAND_IDS };
