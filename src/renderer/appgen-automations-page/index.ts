// appgen-automations-page —— Site 详情中的云端自动化管理页面。
// 原版：app/webview/assets/appgen-automations-page-3aadbf574b7f.js。

import * as runtimeChunk from "@rchunk/rolldown-runtime";
import * as appSharedChunk from "@rchunk/app-shared";
import * as appInitialChunk from "@rchunk/app-initial";
import * as siteDetailLayoutChunk from "@rchunk/appgen-site-detail-layout";
import * as automationPanelChunk from "@rchunk/open-automation-side-panel-tab";
import * as automationsStateChunk from "@rchunk/appgen-automations-state";

void runtimeChunk;
const appShared = appSharedChunk as Record<string, any>;
const appInitial = appInitialChunk as Record<string, any>;
const siteDetailLayout = siteDetailLayoutChunk as Record<string, any>;
const automationPanel = automationPanelChunk as Record<string, any>;
const automationsState = automationsStateChunk as Record<string, any>;
let jsx: any;

function AppgenAutomationsPage() {
  const { projectId } = appInitial.l_n();
  if (projectId == null) {
    return jsx.jsx(appInitial.Ygn, { replace: true, to: "/sites" });
  }

  return jsx.jsx(siteDetailLayout.t, {
    projectId,
    selectedTab: "automations",
    children: renderAutomationsContent,
  });
}

function renderAutomationsContent(site: any) {
  return jsx.jsx(AppgenAutomationsContent, { site });
}

function AppgenAutomationsContent({ site }: { site: any }) {
  const scope = appShared.LX(appInitial.$en);
  const navigate = appInitial.o_n();
  const { isCapable } = appShared.BX(appInitial.Xet, {
    name: "automations.cloud",
  });
  const {
    data: attachments,
    isLoading: attachmentsLoading,
    isError: attachmentsError,
    refetch: refetchAttachments,
  } = appShared.BX(automationsState.t, [site.id]);
  const {
    data: cloudAutomations,
    isLoading: cloudLoading,
    isError: cloudError,
    refetch: refetchCloudAutomations,
  } = appShared.HX(appInitial.itt);

  const automationIds = attachments?.[0]?.automation_ids;
  const matchingAutomations = cloudAutomations?.items.filter(
    ({ automation }: any) => automationIds?.includes(automation.id),
  );

  let content;
  if (attachmentsLoading || cloudLoading) {
    content = jsx.jsx(appShared.Qh, {});
  } else if (
    attachmentsError ||
    cloudError ||
    cloudAutomations?.isAvailable === false
  ) {
    const retry = () => {
      Promise.all([refetchAttachments(), refetchCloudAutomations()]);
    };
    content = jsx.jsx(appInitial.n7, {
      type: "error",
      onPrimaryCtaClick: retry,
      primaryCtaText: jsx.jsx(appShared.Y2, {
        id: "appgenAutomations.retry",
        defaultMessage: "Try again",
        description: "Reload the Site schedules after a loading error",
      }),
      content: jsx.jsx(appShared.Y2, {
        id: "appgenAutomations.loadError",
        defaultMessage: "Couldn’t load schedules. Try again.",
        description: "Error when the Site's scheduled tasks cannot be loaded",
      }),
    });
  } else {
    const rows =
      matchingAutomations?.length === 0
        ? jsx.jsx(appShared.rl, {
            label: jsx.jsx(appShared.Y2, {
              id: "appgenAutomations.empty",
              defaultMessage: "No schedules yet",
              description:
                "Empty state for a Site with no associated scheduled tasks",
            }),
            control: null,
          })
        : matchingAutomations?.map(({ automation }: any) =>
            jsx.jsx(
              appShared.rl,
              {
                icon: automation.display_emoji || jsx.jsx(appShared.wy, {}),
                label: automation.title,
                description: jsx.jsx(appShared.Y2, {
                  ...appInitial.nnt[appInitial.wtt(automation)],
                }),
                control: jsx.jsx(appShared.Yh, {
                  color: "ghost",
                  size: "toolbar",
                  onClick: () =>
                    void navigate(
                      `${appInitial.VT()}?automationId=${encodeURIComponent(automation.id)}&automationSource=cloud`,
                    ),
                  children: jsx.jsx(appShared.Y2, {
                    id: "appgenAutomations.manage",
                    defaultMessage: "Open schedule",
                    description:
                      "Button to manage this Site's task using the Scheduled page",
                  }),
                }),
              },
              automation.id,
            ),
          );
    content = jsx.jsx(appShared.Zc, { children: rows });
  }

  const title = jsx.jsx(appShared.Y2, {
    id: "appgenSiteDetail.navigation.automations",
    defaultMessage: "Automations",
    description: "Tab label for a Site's cloud scheduled tasks",
  });
  const subtitle = jsx.jsx(appShared.Y2, {
    id: "appgenAutomations.description",
    defaultMessage:
      "Scheduled work for this Site runs in the cloud. Manage it in Scheduled.",
    description:
      "Description of the Site Automations tab and where to edit its tasks",
  });
  const createDisabled = !isCapable || site.status !== "active";
  const createSchedule = () =>
    automationPanel.i({
      scope,
      projectId: site.id,
      title: site.title,
      prompt: "",
    });
  const header = jsx.jsx(appInitial.aa.Header, {
    title,
    subtitle,
    actions: jsx.jsx(appShared.Yh, {
      color: "outline",
      size: "toolbar",
      disabled: createDisabled,
      onClick: createSchedule,
      children: jsx.jsx(appShared.Y2, {
        id: "appgenAutomations.create",
        defaultMessage: "Create schedule",
        description:
          "Button to open the existing cloud task setup for this Site",
      }),
    }),
  });

  return jsx.jsx(appInitial.au, {
    children: jsx.jsxs(appInitial.aa, { children: [header, content] }),
  });
}

function initializeAppgenAutomationsPage(): void {
  appShared.$3();
  appShared.FX();
  appShared.K2();
  appInitial.Qgn();
  appInitial.Zet();
  appInitial.rnt();
  appInitial.Dtt();
  appInitial.stt();
  automationPanel.t();
  appInitial.r7();
  appShared.Zh();
  appShared.lw();
  appShared.$h();
  appInitial.itn();
  appInitial.su();
  appInitial.oa();
  appShared.al();
  appShared.Qc();
  automationsState.r();
  siteDetailLayout.n();
  jsx = appShared.I3();
}

initializeAppgenAutomationsPage();

export { AppgenAutomationsPage };
