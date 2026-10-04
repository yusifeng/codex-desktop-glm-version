/**
 * Build the markdown prefilled-prompt mention used by plugin-backed suggestions.
 *
 * The app-primary hub previously kept this as an inline helper.  The plugin
 * URI is trimmed before construction and markdown-sensitive backslashes and
 * closing parentheses are escaped exactly as the release helper does.
 */
export function createPrefilledPluginPrompt(input: {
  defaultPrompt?: string | null;
  pluginDisplayName: string;
  pluginId: string;
}): string {
  const pluginUri = `plugin://${input.pluginId.trim()}`
    .replaceAll("\\", "\\\\")
    .replaceAll(")", "\\)");
  return `[@${input.pluginDisplayName}](${pluginUri}) ${input.defaultPrompt?.trim() ?? ""}`;
}
