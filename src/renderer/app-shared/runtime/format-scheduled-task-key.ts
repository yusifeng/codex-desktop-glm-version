/** Join a plugin id and scheduled-task key into the stable registry key. */
export function formatScheduledTaskKey(pluginId: string, taskKey: string): string {
  return `${pluginId}/${taskKey}`;
}
