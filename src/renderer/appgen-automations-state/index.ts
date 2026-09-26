// appgen-automations-state —— Site 与自动化关联关系的查询配置状态。
// 原版：app/webview/assets/appgen-automations-state-1070007996b9.js。

import * as runtimeChunk from "@rchunk/rolldown-runtime";
import * as appSharedChunk from "@rchunk/app-shared";
import * as appInitialChunk from "@rchunk/app-initial";
import type {
  DerivedScopedSignalContext,
  MaitaiScope,
  ScopedQueryFamily,
} from "@rchunk/app-shared";

void runtimeChunk;

interface SiteAutomationAttachment extends Record<string, unknown> {
  id?: string;
}

interface AutomationBacklinksResponse extends Record<string, unknown> {
  sites: unknown[];
}

type ChunkItems = <T>(items: T[], size: number) => T[][];

interface AppInitialBindings {
  I1t(): { default: ChunkItems } | ChunkItems;
  cJt(): void;
  ett: unknown;
  mfn: unknown;
  pfn(): void;
  rJt: {
    safeGet<Result>(
      path: string,
      options: {
        parameters: {
          path?: { automation_id: string };
          query?: { project_ids: string[] };
        };
        signal: AbortSignal;
      },
    ): Promise<Result>;
  };
  stt(): void;
}

const {
  I1t: loadChunkUtility,
  cJt: initializeWebsiteQueries,
  ett: accountIdSignal,
  mfn: featureFlagFamily,
  pfn: initializeAccountSignals,
  rJt: appApiClient,
  stt: initializeAutomations,
} = appInitialChunk as unknown as AppInitialBindings;
const {
  $O: queryStaleTimes,
  FX: initializeMaitaiRuntime,
  QI: initializeQueryBridge,
  QX: createQueryFamily,
  ZI: AppScope,
  ek: initializeQueryRuntime,
} = appSharedChunk;

type AppScopeValue = Record<string, unknown>;
type QueryContext = DerivedScopedSignalContext<AppScopeValue>;

let automationBacklinksQuery: ScopedQueryFamily<
  AppScopeValue,
  string,
  AutomationBacklinksResponse
>;
let siteAutomationAttachmentsQuery: ScopedQueryFamily<
  AppScopeValue,
  string[],
  SiteAutomationAttachment[]
>;

function initializeAppgenAutomationsState(): void {
  const chunkModule = loadChunkUtility();
  const chunk = typeof chunkModule === "function" ? chunkModule : chunkModule.default;
  initializeMaitaiRuntime();
  initializeAutomations();
  initializeWebsiteQueries();
  initializeQueryBridge();
  initializeAccountSignals();
  initializeQueryRuntime();

  siteAutomationAttachmentsQuery = createQueryFamily<
    AppScopeValue,
    string[],
    SiteAutomationAttachment[]
  >(
    AppScope as MaitaiScope<AppScopeValue>,
    (projectIds: string[], { get }: QueryContext) => {
      const accountId = get<string | null>(accountIdSignal);
      return {
        enabled:
          accountId != null &&
          projectIds.length > 0 &&
          get<boolean>(featureFlagFamily, "282477705"),
        queryKey: ["site-automation-attachments", accountId, projectIds],
        queryFn: async ({ signal }) =>
          (
            await Promise.all(
              chunk(projectIds, 100).map((batch: string[]) =>
                appApiClient.safeGet<SiteAutomationAttachment[]>(
                  "/websites/automation-attachments",
                  {
                    parameters: { query: { project_ids: batch } },
                    signal,
                  },
                ),
              ),
            )
          ).flat(),
        staleTime: queryStaleTimes.THIRTY_SECONDS,
        refetchOnMount: "always",
        refetchInterval: queryStaleTimes.ONE_MINUTE,
        retry: false,
      };
    },
  );

  automationBacklinksQuery = createQueryFamily<
    AppScopeValue,
    string,
    AutomationBacklinksResponse
  >(
    AppScope as MaitaiScope<AppScopeValue>,
    (automationId: string, { get }: QueryContext) => {
      const accountId = get<string | null>(accountIdSignal);
      return {
        enabled:
          accountId != null &&
          get<boolean>(featureFlagFamily, "282477705"),
        queryKey: ["site-automation-backlinks", accountId, automationId],
        queryFn: ({ signal }) =>
          appApiClient.safeGet<AutomationBacklinksResponse>(
            "/websites/automations/{automation_id}/sites",
            {
              parameters: { path: { automation_id: automationId } },
              signal,
            },
          ),
        staleTime: queryStaleTimes.THIRTY_SECONDS,
        retry: false,
      };
    },
  );
}

export {
  automationBacklinksQuery as n,
  initializeAppgenAutomationsState as r,
  siteAutomationAttachmentsQuery as t,
};
