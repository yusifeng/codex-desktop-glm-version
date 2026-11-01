import { n as onceExport } from "@rchunk/rolldown-runtime";
import {
  G2 as defineMessages,
  K2 as initializeInternationalization,
  RI as initializePathRuntime,
} from "@rchunk/app-shared";
import {
  Fcn as initializeToolActivity,
  _9t as initializePathLabels,
  b9t as pathLabel,
  v9t as isInternalKnowledgeSkill,
} from "@rchunk/app-initial";
import {
  a as classifyVisualizationCommand,
  l as isSuccessfulExecutionStatus,
  n as initializeSkillPathHelpers,
  s as initializeSkillExplorationLabels,
  t as getSkillDefinition,
  u as visualizationMessages,
} from "@rchunk/skill-exploration-labels";
import type { MessageDescriptor } from "@rchunk/app-shared";
import { getPathBasename as displayPath } from "../app-shared/runtime/get-path-basename";

interface ParsedCommand {
  cmd: string;
  displayLabel?: string;
  isFinished?: boolean;
  name?: string;
  path?: string;
  query?: string;
  type: string;
}
interface ToolActivity {
  callId?: string;
  cwd?: string;
  executionStatus?: string;
  parsedCmd: ParsedCommand;
  type?: string;
  [key: string]: unknown;
}
interface ActivityLabel {
  activityKey?: string;
  icon: string;
  message: MessageDescriptor;
  values?: Record<string, string>;
}

const once = onceExport as (initializer: () => void) => () => void;
const REGEX_META = new Set([
  ".",
  "*",
  "+",
  "?",
  "^",
  "$",
  "{",
  "}",
  "(",
  ")",
  "|",
  "[",
  "]",
]);
let messages: Record<string, MessageDescriptor>;

function splitUnescapedPipes(value: string): string[] {
  const output = [];
  let start = 0;
  let escaped = false;
  for (let index = 0; index < value.length; index += 1) {
    const character = value[index];
    if (escaped) {
      escaped = false;
      continue;
    }
    if (character === "\\") {
      escaped = true;
      continue;
    }
    if (character === "|") {
      output.push(value.slice(start, index));
      start = index + 1;
    }
  }
  if (output.length === 0) return [];
  output.push(value.slice(start));
  return output;
}

function unescapeSearchTerm(value: string): string | null {
  let result = "";
  let escaped = false;
  for (const character of value) {
    if (escaped) {
      if (/^[A-Za-z0-9]$/.test(character)) return null;
      result += character;
      escaped = false;
      continue;
    }
    if (character === "\\") {
      escaped = true;
      continue;
    }
    if (REGEX_META.has(character)) return null;
    result += character;
  }
  return escaped ? null : result;
}

function formatSearchQuery(
  query: string,
  formatter: (values: string[]) => string,
): string {
  const pipeline = splitUnescapedPipes(query);
  const terms = pipeline.length < 2 ? null : pipeline.map(unescapeSearchTerm);
  const values =
    terms != null &&
    terms.every((term): term is string => term != null && term.length > 0)
      ? terms
      : [unescapeSearchTerm(query) ?? query];
  return formatter(
    values.map(
      (value) => `“${value.replace(/^["']+/, "").replace(/["']+$/, "")}”`,
    ),
  );
}

function defaultTermList([first, ...rest]: string[]): string {
  let output = first;
  rest.forEach((value, index) => {
    output +=
      index === rest.length - 1
        ? rest.length === 1
          ? " and "
          : ", and "
        : ", ";
    output += value;
  });
  return output;
}

function commandLabel(activity: ToolActivity): ActivityLabel {
  const command = activity.parsedCmd.cmd.trim();
  const stopped = activity.executionStatus === "interrupted";
  const finished = activity.parsedCmd.isFinished === true;
  const message = stopped
    ? messages.commandStopped
    : finished
      ? messages.commandRan
      : messages.commandRunning;
  if (command.length === 0)
    return {
      activityKey: activity.callId,
      icon: stopped ? "stop" : "run-command",
      message,
    };
  return {
    activityKey: activity.callId,
    icon: stopped ? "stop" : "run-command",
    message: stopped
      ? messages.commandStoppedWithDetail
      : finished
        ? messages.commandRanWithDetail
        : messages.commandRunningWithDetail,
    values: { command },
  };
}

function labelForExec(
  activity: ToolActivity,
  threadDetailLevel?: string,
  formatter = defaultTermList,
): ActivityLabel | undefined {
  const command = activity.parsedCmd;
  const visualization = isSuccessfulExecutionStatus(activity.executionStatus)
    ? classifyVisualizationCommand(command.cmd)
    : null;
  if (visualization != null)
    return {
      activityKey: activity.callId,
      icon: "edit-files",
      message:
        visualization === "create"
          ? visualizationMessages.activeCreating
          : visualizationMessages.activeUpdating,
    };
  switch (command.type) {
    case "read": {
      const target =
        command.displayLabel ??
        displayPath(pathLabel(command.path ?? command.name ?? ""));
      const skill = getSkillDefinition({
        summary: command as unknown as Record<string, unknown>,
        cwd: activity.cwd,
      }) as { isSkillDefinitionFile?: boolean; skillName?: string } | null;
      const isSkill = skill?.isSkillDefinitionFile === true;
      return skill != null && isSkill && isInternalKnowledgeSkill(skill)
        ? {
            activityKey: activity.callId,
            icon: "internal-knowledge",
            message: messages.readInternalKnowledge,
          }
        : {
            activityKey: activity.callId,
            icon: "run-command",
            message: isSkill ? messages.readSkill : messages.read,
            values: isSkill ? { skillName: skill.skillName ?? "" } : { target },
          };
    }
    case "search":
      if (command.path)
        return {
          activityKey: activity.callId,
          icon: "code-searching",
          message: messages.searchFolder,
          values: { folder: pathLabel(command.path) },
        };
      if (command.query)
        return {
          activityKey: activity.callId,
          icon: "code-searching",
          message: messages.searchQuery,
          values: {
            query:
              threadDetailLevel === "STEPS_PROSE"
                ? formatSearchQuery(command.query, formatter)
                : command.query,
          },
        };
      return {
        activityKey: activity.callId,
        icon: "code-searching",
        message: messages.searchFiles,
      };
    case "list_files":
      return command.path == null
        ? {
            activityKey: activity.callId,
            icon: "list-files",
            message: messages.listFiles,
          }
        : {
            activityKey: activity.callId,
            icon: "list-files",
            message: messages.listFolder,
            values: { folder: pathLabel(command.path) },
          };
    case "format":
    case "lint":
    case "noop":
    case "test":
    case "unknown":
      return commandLabel(activity);
  }
}

function getActiveToolActivityLabel({
  items,
  threadDetailLevel,
  formatSearchQueryTermList,
}: {
  items: Array<ToolActivity | null | undefined>;
  threadDetailLevel?: string;
  formatSearchQueryTermList?: (values: string[]) => string;
}): ActivityLabel | null {
  const find = (inProgressOnly: boolean) => {
    for (let index = items.length - 1; index >= 0; index -= 1) {
      const item = items[index];
      if (
        item?.type !== "exec" ||
        (inProgressOnly &&
          (item.executionStatus === "interrupted" || item.parsedCmd.isFinished))
      )
        continue;
      const label = labelForExec(
        item,
        threadDetailLevel,
        formatSearchQueryTermList,
      );
      if (label != null) return label;
    }
    return null;
  };
  return find(true) ?? find(false);
}

const initializeActiveToolActivityLabel = once(() => {
  initializeInternationalization();
  initializeToolActivity();
  initializePathRuntime();
  initializeSkillExplorationLabels();
  initializeSkillPathHelpers();
  initializePathLabels();
  messages = defineMessages({
    read: {
      id: "localConversation.toolActivity.active.read",
      defaultMessage: "<action>Reading</action> <detail>{target}</detail>",
      description: "Active tool activity summary while Codex is reading a file",
    },
    readSkill: {
      id: "localConversation.toolActivity.active.readSkill",
      defaultMessage:
        "<action>Reading</action> <detail>{skillName} skill</detail>",
      description:
        "Active tool activity summary while Codex is reading a skill definition",
    },
    readInternalKnowledge: {
      id: "localConversation.toolActivity.active.readInternalKnowledge",
      defaultMessage:
        "<action>Reading</action> <detail>Internal Knowledge</detail>",
      description:
        "Active tool activity summary while Codex is reading the canonical Internal Knowledge skill definition",
    },
    searchFolder: {
      id: "localConversation.toolActivity.active.search.folder",
      defaultMessage:
        "<action>Searching</action> <detail>files in {folder} folder</detail>",
      description:
        "Active tool activity summary while Codex is searching files in a folder",
    },
    searchQuery: {
      id: "localConversation.toolActivity.active.search.query",
      defaultMessage: "<action>Searching</action> <detail>for {query}</detail>",
      description:
        "Active tool activity summary while Codex is searching for a query",
    },
    searchFiles: {
      id: "localConversation.toolActivity.active.search.files",
      defaultMessage: "<action>Searching</action> <detail>files</detail>",
      description:
        "Active tool activity summary while Codex is searching files",
    },
    listFiles: {
      id: "localConversation.toolActivity.active.list.files",
      defaultMessage: "<action>Listing</action> <detail>files</detail>",
      description: "Active tool activity summary while Codex is listing files",
    },
    listFolder: {
      id: "localConversation.toolActivity.active.list.folder",
      defaultMessage:
        "<action>Listing</action> <detail>files in {folder} folder</detail>",
      description:
        "Active tool activity summary while Codex is listing files in a folder",
    },
    commandStopped: {
      id: "localConversation.toolActivity.active.command.stopped",
      defaultMessage: "<action>Stopped command</action>",
      description: "Active tool activity summary after Codex stops a command",
    },
    commandStoppedWithDetail: {
      id: "localConversation.toolActivity.active.command.stopped.detail",
      defaultMessage: "<action>Stopped</action> <detail>{command}</detail>",
      description: "Active tool activity summary after Codex stops a command",
    },
    commandRan: {
      id: "localConversation.toolActivity.active.command.ran",
      defaultMessage: "<action>Ran command</action>",
      description: "Active tool activity summary after Codex runs a command",
    },
    commandRanWithDetail: {
      id: "localConversation.toolActivity.active.command.ran.detail",
      defaultMessage: "<action>Ran</action> <detail>{command}</detail>",
      description: "Active tool activity summary after Codex runs a command",
    },
    commandRunning: {
      id: "localConversation.toolActivity.active.command.running",
      defaultMessage: "<action>Running command</action>",
      description: "Active tool activity summary while Codex runs a command",
    },
    commandRunningWithDetail: {
      id: "localConversation.toolActivity.active.command.running.detail",
      defaultMessage: "<action>Running</action> <detail>{command}</detail>",
      description: "Active tool activity summary while Codex runs a command",
    },
  });
});

export {
  initializeActiveToolActivityLabel as n,
  getActiveToolActivityLabel as t,
};
