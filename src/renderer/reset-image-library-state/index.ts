import "@rchunk/rolldown-runtime";
interface QueryClient { resetQueries(options: { predicate(query: { queryKey: readonly unknown[] }): boolean; queryKey: readonly unknown[] }): Promise<unknown> | unknown }
function n(queryClient: QueryClient, fileIds?: readonly string[] | null): Promise<unknown> | unknown { const sources = fileIds == null ? null : new Set(fileIds.flatMap(id => [`file-service://${id}`, `sediment://${id}`])); return queryClient.resetQueries({ queryKey: ["file", "image-src"], predicate: ({ queryKey }) => queryKey[3] === "chatgpt-conversation" && queryKey[5] === "library-state" && (sources == null || (typeof queryKey[2] === "string" && sources.has(queryKey[2]))) }); }
function t(): void {}
export { n, t };
