/** Recognize the automation-update tool output envelope. */
export function isAutomationUpdateOutput(value: { namespace?: unknown; name?: unknown; output?: unknown } | null | undefined, isAutomationIdLine: (output: string) => boolean): boolean {
  if (value?.namespace !== "codex_app" || value.name !== "automation_update" || typeof value.output !== "string") return false;
  return (value.output.startsWith("Automation: ") && value.output.includes(" Automation ID: ")) || isAutomationIdLine(value.output);
}
