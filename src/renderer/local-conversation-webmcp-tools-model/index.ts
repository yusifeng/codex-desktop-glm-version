import "@rchunk/rolldown-runtime";
import { hq as isWebMcpServer, wL as initializeUtilities } from "@rchunk/app-shared";
import { w$t as flattenConversationItems } from "@rchunk/app-initial";
import {
  n as initializeWebMcpToolCalls,
  t as getWebMcpCallsFromMetadata,
} from "@rchunk/webmcp-tool-calls";

export interface WebMcpToolCallItem {
  result?: { _meta?: unknown } | null;
  server: unknown;
  status: string;
  type: string;
}

export interface ConversationTurnWithItems {
  items?: unknown[] | null;
}

export interface WebMcpCall {
  name: string;
  [key: string]: unknown;
}

export interface WebMcpCallGroup {
  calls: WebMcpCall[];
  name: string;
}

function collectCompletedWebMcpCalls(turns: ConversationTurnWithItems[]): WebMcpCall[] {
  const calls: WebMcpCall[] = [];
  for (let turnIndex = turns.length - 1; turnIndex >= 0; turnIndex -= 1) {
    const items = flattenConversationItems(turns[turnIndex]?.items ?? []);
    for (let itemIndex = items.length - 1; itemIndex >= 0; itemIndex -= 1) {
      const item = items[itemIndex] as WebMcpToolCallItem | null | undefined;
      if (
        item?.type === "mcpToolCall" &&
        item.status !== "inProgress" &&
        isWebMcpServer(item.server)
      ) {
        calls.push(
          ...(getWebMcpCallsFromMetadata(item.result?._meta) as WebMcpCall[])
            .slice()
            .reverse(),
        );
      }
    }
  }
  return calls;
}

function groupWebMcpCallsByName(calls: WebMcpCall[]): WebMcpCallGroup[] {
  const groups = new Map<string, WebMcpCallGroup>();
  for (const call of calls) {
    const group = groups.get(call.name);
    if (group == null) groups.set(call.name, { calls: [call], name: call.name });
    else group.calls.push(call);
  }
  return Array.from(groups.values());
}

function getHostname(url: string): string | undefined {
  try {
    return new URL(url).hostname || undefined;
  } catch {
    return undefined;
  }
}

function initializeLocalConversationWebMcpToolsModel(): void {
  initializeUtilities();
  initializeWebMcpToolCalls();
}

export {
  initializeLocalConversationWebMcpToolsModel as i,
  collectCompletedWebMcpCalls as n,
  groupWebMcpCallsByName as r,
  getHostname as t,
};
