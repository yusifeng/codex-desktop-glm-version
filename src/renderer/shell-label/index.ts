import * as appSharedChunk from "@rchunk/app-shared";
import "@rchunk/rolldown-runtime";

const { RR: shellLabels, wL: initializeShellLabels } = appSharedChunk;

function basename(value: string): string {
  return value.split(/[/\\]/).at(-1) ?? value;
}
function shellExecutable(command: string): string | null {
  let trimmed = command.trim();
  if (trimmed.length === 0) return null;
  const quoted = trimmed.match(/^(['"])(.*?)\1/);
  const quotedValue = quoted?.[2];
  if (quotedValue) {
    if (quoted[0].length === trimmed.length) trimmed = quotedValue.trim();
    else return basename(quotedValue);
  }
  const first = trimmed.match(/^\S+/)?.[0];
  return first == null ? null : basename(first);
}
function shellLabel(command: string): string | null {
  const executable = shellExecutable(command);
  return executable == null
    ? null
    : (shellLabels[executable.toLowerCase()] ?? null);
}
function initializeShellLabel(): void {
  initializeShellLabels();
}
export { initializeShellLabel as n, shellLabel as t };
