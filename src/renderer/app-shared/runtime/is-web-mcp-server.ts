/** Whether an MCP server is backed by a browser-control runtime (former app-shared `hq`). */
export function isWebMcpServer(server: unknown): boolean {
  return server === "node_repl" || server === "cua_repl";
}
