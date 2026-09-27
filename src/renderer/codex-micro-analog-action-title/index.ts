import "@rchunk/rolldown-runtime";
import {
  M5t as getSkillDisplayName,
  P5t as initializeSkillMetadata,
} from "@rchunk/app-initial";
import {
  i as initializeCodexMicroCommands,
  n as getCodexMicroCommand,
} from "@rchunk/codex-micro-commands";
import {
  n as formatCommandMessage,
  r as initializeCommandMessages,
} from "@rchunk/command-messages";

type AnalogAction =
  | { commandId: string; type: "command" }
  | { skillName: string; skillPath: string; type: "skill" };

interface SkillMetadata {
  name: string;
  path: string;
  [key: string]: unknown;
}

function getAnalogActionTitle(
  action: AnalogAction,
  skills: SkillMetadata[],
  intl: unknown,
): string {
  if (action.type === "command") {
    const command = getCodexMicroCommand(action.commandId);
    return command == null
      ? action.commandId
      : formatCommandMessage(command, intl);
  }
  const skill = skills.find((candidate) =>
    candidate.name === action.skillName && candidate.path === action.skillPath);
  return `$${skill == null ? action.skillName : getSkillDisplayName(skill)}`;
}

function initializeCodexMicroAnalogActionTitle(): void {
  initializeCodexMicroCommands();
  initializeCommandMessages();
  initializeSkillMetadata();
}

export {
  initializeCodexMicroAnalogActionTitle as n,
  getAnalogActionTitle as t,
};
