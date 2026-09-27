import "@rchunk/rolldown-runtime";
import "@rchunk/app-shared";
import "@rchunk/app-initial";

export interface SearchablePlugin { id: string; name: string; description?: string; }
function searchPlugins(plugins: readonly SearchablePlugin[], query: string): SearchablePlugin[] {
  const normalized = query.trim().toLocaleLowerCase();
  if (normalized.length === 0) return [...plugins];
  return plugins.filter((plugin) => `${plugin.name} ${plugin.description ?? ""}`.toLocaleLowerCase().includes(normalized));
}
function initializeSearchPlugins(): void {}
export { initializeSearchPlugins as n, searchPlugins as t };
