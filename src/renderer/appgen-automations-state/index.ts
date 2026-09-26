// appgen-automations-state —— Site 与自动化关联关系的查询配置状态。
// 原版：app/webview/assets/appgen-automations-state-1070007996b9.js。

import * as runtimeChunk from "@rchunk/rolldown-runtime";
import * as appSharedChunk from "@rchunk/app-shared";
import * as appInitialChunk from "@rchunk/app-initial";

void runtimeChunk;
const appShared = appSharedChunk as Record<string, any>;
const appInitial = appInitialChunk as Record<string, any>;
let automationBacklinksQuery: any;
let siteAutomationAttachmentsQuery: any;

function initializeAppgenAutomationsState(): void {
  const chunkModule = appInitial.I1t();
  const chunk = chunkModule?.default ?? chunkModule;
  appShared.FX?.();
  appInitial.stt?.();
  appInitial.cJt?.();
  appShared.QI?.();
  appInitial.pfn?.();
  appShared.ek?.();

  siteAutomationAttachmentsQuery = appShared.QX(
    appShared.ZI,
    (projectIds: string[], { get }: any) => {
      const accountId = get(appInitial.ett);
      return {
        enabled:
          accountId != null &&
          projectIds.length > 0 &&
          get(appInitial.mfn, "282477705"),
        queryKey: ["site-automation-attachments", accountId, projectIds],
        queryFn: async ({ signal }: any) =>
          (
            await Promise.all(
              chunk(projectIds, 100).map((batch: string[]) =>
                appInitial.rJt.safeGet("/websites/automation-attachments", {
                  parameters: { query: { project_ids: batch } },
                  signal,
                }),
              ),
            )
          ).flat(),
        staleTime: appShared.$O.THIRTY_SECONDS,
        refetchOnMount: "always",
        refetchInterval: appShared.$O.ONE_MINUTE,
        retry: false,
      };
    },
  );

  automationBacklinksQuery = appShared.QX(
    appShared.ZI,
    (automationId: string, { get }: any) => {
      const accountId = get(appInitial.ett);
      return {
        enabled: accountId != null && get(appInitial.mfn, "282477705"),
        queryKey: ["site-automation-backlinks", accountId, automationId],
        queryFn: ({ signal }: any) =>
          appInitial.rJt.safeGet(
            "/websites/automations/{automation_id}/sites",
            {
              parameters: { path: { automation_id: automationId } },
              signal,
            },
          ),
        staleTime: appShared.$O.THIRTY_SECONDS,
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
