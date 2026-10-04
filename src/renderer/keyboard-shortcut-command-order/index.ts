import { Dp as commandMenuGroupOrder, Ep as initializeCommandRegistry, Np as getCommand, kp as unifiedTabCommands } from "@rchunk/app-shared";
import { hasRequiredCommandAccess, isRealtimeVoiceCommand } from "../app-shared/runtime/command-visibility-predicates";
import "@rchunk/rolldown-runtime";

export interface CommandAccess { codexLocal: boolean; workLocal: boolean; }
export interface CommandVisibilityOptions {
  allowDebugMenu?: boolean;
  browserEnabled?: boolean;
  commandAccess: CommandAccess;
  fileLanguageFeaturesEnabled?: boolean;
  isAutomationsEnabled?: boolean;
  isDictationEnabled?: boolean;
  isGlobalDictationEnabled?: boolean;
  isHotkeyWindowEnabled?: boolean;
  isPriorityFilterEnabled?: boolean;
  isRealtimeVoiceCommandEnabled?: boolean;
  isUnifiedTabStripEnabled?: boolean;
  modeSwitchAvailable?: boolean;
  platform?: string;
}
export interface ShortcutCommand extends Record<string, unknown> {
  commandMenuGroupKey?: string | null;
  id: string;
  kind: string;
  requiredAccess?: "codexLocal" | "codexOrWorkLocal";
}

function isCommandAvailable(commandId: string, options: Omit<CommandVisibilityOptions, "browserEnabled" | "commandAccess" | "platform">): boolean {
  if (commandId === "showWorkspaceTabView" || unifiedTabCommands.some(id => id === commandId)) return options.isUnifiedTabStripEnabled === true;
  if (commandId === "toggleDebugModal") return options.allowDebugMenu === true;
  if (!options.fileLanguageFeaturesEnabled && ["file.goToDefinition", "file.navigateBack", "file.navigateForward"].includes(commandId)) return false;
  if (commandId === "hotkeyWindow") return options.isHotkeyWindowEnabled === true;
  if (commandId === "manageTasks") return options.isAutomationsEnabled === true;
  if (["switchToMode1", "switchToMode2", "switchToMode3"].includes(commandId)) return options.modeSwitchAvailable === true;
  if (commandId === "togglePriorityFilter") return options.isPriorityFilterEnabled === true;
  if (isRealtimeVoiceCommand(commandId)) return options.isRealtimeVoiceCommandEnabled === true;
  if (commandId === "composer.startDictation") return options.isDictationEnabled === true;
  if (commandId === "globalDictationHold" || commandId === "globalDictationToggle") return options.isGlobalDictationEnabled === true;
  return true;
}

function shouldShowShortcutCommand(commandId: string, options: CommandVisibilityOptions): boolean {
  const command = getCommand(commandId);
  if (command != null && !hasRequiredCommandAccess(command, options.commandAccess)) return false;
  if (!isCommandAvailable(commandId, options)) return false;
  if (commandId === "copyConversationPath") return options.platform === "macOS";
  if (commandId === "stepWorkspaceLayout") return options.isUnifiedTabStripEnabled === true || options.browserEnabled === true;
  if (["hardReloadBrowserPage", "openBrowserTab", "reloadBrowserPage"].includes(commandId)) return options.browserEnabled === true;
  return commandId !== "toggleTraceRecording";
}

function shouldShowShortcutDefinition(command: ShortcutCommand, options: Omit<CommandVisibilityOptions, "browserEnabled" | "platform">): boolean {
  return command.id !== "personalitySettings" && hasRequiredCommandAccess(command, options.commandAccess) && isCommandAvailable(command.id, options);
}

let priorityCommandIds: string[] | undefined;
function commandPriority(commandId: string): number {
  if (priorityCommandIds == null) throw new Error("Keyboard shortcut command order is not initialized");
  const index = priorityCommandIds.indexOf(commandId);
  return index === -1 ? priorityCommandIds.length : index;
}
function groupPriority(command: ShortcutCommand): number {
  return command.kind !== "webview" || command.commandMenuGroupKey == null
    ? commandMenuGroupOrder.length
    : commandMenuGroupOrder.indexOf(command.commandMenuGroupKey);
}
function compareShortcutCommands(left: ShortcutCommand, right: ShortcutCommand): number {
  const groupDifference = groupPriority(left) - groupPriority(right);
  if (groupDifference !== 0) return groupDifference;
  const commandDifference = commandPriority(left.id) - commandPriority(right.id);
  return commandDifference === 0 ? left.id.localeCompare(right.id) : commandDifference;
}

let availabilityInitialized = false;
function initializeShortcutAvailability(): void {
  if (availabilityInitialized) return;
  availabilityInitialized = true;
  initializeCommandRegistry();
}
let initialized = false;
function initializeKeyboardShortcutCommandOrder(): void {
  if (initialized) return;
  initialized = true;
  initializeCommandRegistry();
  priorityCommandIds = ["newTask", "temporaryChat", "quickChat", "archiveThread", "newProjectlessTask", "openSideChat"];
}

export { shouldShowShortcutDefinition as a, shouldShowShortcutCommand as i, initializeKeyboardShortcutCommandOrder as n, initializeShortcutAvailability as r, compareShortcutCommands as t };
