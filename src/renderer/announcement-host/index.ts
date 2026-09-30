// Workspace-discovery announcement host. Release chunk: announcement-host-46a475b49467.js.
import "@rchunk/rolldown-runtime";
import * as appSharedChunk from "@rchunk/app-shared";
import * as appInitialChunk from "@rchunk/app-initial";
import * as workspaceDiscoveryChunk from "@rchunk/workspace-discovery";

interface JsxRuntime {
  jsx(type: unknown, props: Record<string, unknown>, key?: unknown): unknown;
}
interface SharedRuntime {
  BX(signal: unknown, parameter?: unknown): unknown;
  HX(signal: unknown): {
    data?: unknown;
    isPending?: boolean;
    isError?: boolean;
  };
  I3(): JsxRuntime;
  [key: string]: unknown;
}
const shared = appSharedChunk as unknown as SharedRuntime;
const initial = appInitialChunk as unknown as Record<string, unknown>;
const workspace = workspaceDiscoveryChunk as unknown as Record<string, unknown>;
const jsxRuntime = shared.I3();

function WorkspaceDiscoveryAnnouncementHost({
  children,
}: {
  children: unknown;
}): unknown {
  const useAuth = initial.N6t as
    | (() => {
        authMethod?: string;
        userId?: string | null;
        accountId?: string | null;
      })
    | undefined;
  const auth = useAuth?.() ?? {};
  if (
    auth.authMethod !== "chatgpt" ||
    auth.userId == null ||
    auth.accountId == null
  ) {
    return children;
  }
  const eligibility = shared.BX(workspace.c, auth.userId) as boolean;
  if (!eligibility) return children;
  const workspaceQuery = shared.BX(workspace.a, auth.userId) as {
    data?: { workspaces?: unknown[] };
    isPending?: boolean;
    isError?: boolean;
  };
  if (workspaceQuery.isPending) return null;
  if (workspaceQuery.isError || !workspaceQuery.data?.workspaces?.length)
    return children;
  return jsxRuntime.jsx(workspace.t, {}, auth.accountId);
}

for (const [runtime, names] of [
  [shared as unknown as Record<string, unknown>, ["FX", "QI"]],
  [initial, ["Run", "M6t", "gC", "Sqt", "rht", "Rln"]],
  [workspace, ["l", "o", "n"]],
] as Array<[Record<string, unknown>, string[]]>) {
  for (const name of names) {
    const value = runtime[name];
    if (typeof value === "function") (value as () => void)();
  }
}

export { WorkspaceDiscoveryAnnouncementHost };
