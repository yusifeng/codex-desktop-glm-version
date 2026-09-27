import "@rchunk/app-shared";
import "@rchunk/app-initial";

export interface CategoryPlugin { id: string; remotePluginId?: string; [key: string]: unknown }
export interface CategoryQueryInput { categorySlug: string; hostId: string; searchQuery?: string; visibility?: { hiddenPluginIds?: Set<string> } }
export interface CategoryQueryPage { pagination: { next_page_token?: string | null }; plugins: CategoryPlugin[] }
function categoryPluginsQuery(input: CategoryQueryInput): Record<string, unknown> {
  const searchQuery = (input.searchQuery ?? "").trim();
  return {
    enabled: true,
    initialPageParam: null,
    queryKey: ["plugins", "category", input.hostId, input.categorySlug, ...(searchQuery ? ["search", searchQuery] : [])],
    retry: false,
    getNextPageParam: (page: CategoryQueryPage) => page.pagination.next_page_token ?? undefined,
    select: (data: { pages: CategoryQueryPage[] }) => deduplicate(data.pages.flatMap((page) => page.plugins).filter((plugin) => !input.visibility?.hiddenPluginIds?.has(plugin.id))),
  };
}
const deduplicate = (plugins: CategoryPlugin[]): CategoryPlugin[] => [...new Map(plugins.map((plugin) => [plugin.remotePluginId ?? plugin.id, plugin])).values()];
const initialize = (): void => {};
export { initialize as n, categoryPluginsQuery as t };
