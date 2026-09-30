type DynamicTool =
  | { type: `namespace`; tools: Array<{ name: string }> }
  | { type?: string; name: string };

export function buildOnboardingToolResponse(value: unknown) {
  return { contentItems: [{ type: `inputText`, text: JSON.stringify(value) }], success: true };
}

export function hasThreadReferences({
  dynamicTools,
  config,
}: {
  dynamicTools?: DynamicTool[] | null;
  config?: Record<string, unknown> | null;
}): boolean {
  const enabledTools =
    config?.[`plugins.codex-app-tools@openai-bundled.mcp_servers.codex_app.enabled_tools`] ??
    config?.[`mcp_servers.codex_app.enabled_tools`];
  return (
    dynamicTools?.some((tool) =>
      `tools` in tool
        ? tool.tools.some(({ name }) => name === `read_thread`)
        : `name` in tool && tool.name === `read_thread`,
    ) === true ||
    (Array.isArray(enabledTools) && enabledTools.includes(`read_thread`))
  );
}

export { buildOnboardingToolResponse as Th, hasThreadReferences as Dh };
