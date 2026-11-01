import "@rchunk/rolldown-runtime";
import {
  Ep as initializeCommandRegistry,
  Xp as allCommands,
  qp as supportsPlatform,
} from "@rchunk/app-shared";
import {
  hEt as initializeElectronCommands,
  mEt as isElectronCommandEnabled,
} from "@rchunk/app-initial";

interface CommandDefinition {
  id: string;
  kind: string;
  [key: string]: unknown;
}

let codexMicroCommands: CommandDefinition[];

function getCodexMicroCommand(commandId: string): CommandDefinition | null {
  const normalizedId = commandId === "newThread" ? "newTask" : commandId;
  return codexMicroCommands.find((command) => command.id === normalizedId) ?? null;
}

function getRecentThreadCommandIndex(commandId: string): number | null {
  const match = /^recentThread([1-6])$/.exec(commandId);
  return match == null ? null : Number(match[1]) - 1;
}

function initializeCodexMicroCommands(): void {
  initializeCommandRegistry();
  initializeElectronCommands();
  codexMicroCommands = (allCommands as CommandDefinition[]).filter((command) =>
    (command.kind === "webview" && supportsPlatform(command, "electron"))
    || (command.kind === "electron-only" && isElectronCommandEnabled(command.id)));
}

export {
  initializeCodexMicroCommands as i,
  getCodexMicroCommand as n,
  getRecentThreadCommandIndex as r,
  codexMicroCommands as t,
};
