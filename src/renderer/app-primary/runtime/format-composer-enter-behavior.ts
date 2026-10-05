/** Format the keyboard accelerator for a composer enter behavior. */
export function formatComposerEnterBehavior(value: string): string | undefined {
  switch (value) {
    case "enter": return "CmdOrCtrl+Enter";
    case "cmdIfMultiline":
    case "cmdAlways": return "CmdOrCtrl+Shift+Enter";
    default: return undefined;
  }
}
