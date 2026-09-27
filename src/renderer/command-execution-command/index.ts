import "@rchunk/rolldown-runtime";

export interface CommandExecution {
  command: string;
  commandActions: Array<{ command?: string | null } | null>;
}

function isShellInvocation(command: string): boolean {
  return /^(?:.*[/\\])?(?:bash|cmd(?:\.exe)?|fish|powershell(?:\.exe)?|pwsh(?:\.exe)?|sh|zsh)(?:\s|$)/i.test(
    command,
  );
}

function commandExecutionDisplayCommand(execution: CommandExecution): string {
  for (
    let index = execution.commandActions.length - 1;
    index >= 0;
    index -= 1
  ) {
    const command = execution.commandActions[index]?.command?.trim() ?? "";
    if (command.length > 0 && !isShellInvocation(command)) return command;
  }
  const command = execution.command.trim();
  return isShellInvocation(command) ? "" : command;
}

function initializeCommandExecutionCommand(): void {}
export {
  initializeCommandExecutionCommand as n,
  commandExecutionDisplayCommand as t,
};
