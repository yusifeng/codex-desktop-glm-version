import type { CommandDefinition, PlatformAccessFlags, RequiredAccess } from "./command-registry";
import { isMouseAccelerator } from "./command-registry-policy";

/** Resolve a command's required local/worktree access against runtime flags. */
export function commandAvailableForAccess(definition: CommandDefinition, flags: PlatformAccessFlags): boolean {
  return accessAvailable(definition.requiredAccess, flags);
}

function accessAvailable(required: RequiredAccess | undefined, flags: PlatformAccessFlags): boolean {
  switch (required) {
    case "codexLocal":
      return flags.codexLocal;
    case "codexOrWorkLocal":
      return flags.codexLocal || flags.workLocal;
    case undefined:
      return true;
  }
}

/** Whether a command can be represented by a configurable keyboard shortcut. */
export function isShortcutConfigurable(definition: CommandDefinition): boolean {
  if (definition.kind === "vscode-only") return false;
  if (definition.shortcutConfigurable === false) return false;
  const bindings = definition.electron?.defaultKeybindings ?? [];
  return !bindings.some((binding) => isMouseAccelerator(binding.key));
}
