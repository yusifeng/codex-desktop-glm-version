// appgen-automations-page —— Site 详情中的云端自动化管理页面。
// 原版：app/webview/assets/appgen-automations-page-3aadbf574b7f.js。

import * as runtimeChunk from "@rchunk/rolldown-runtime";
import * as appSharedChunk from "@rchunk/app-shared";
import * as appInitialChunk from "@rchunk/app-initial";
import * as siteDetailLayoutChunk from "@rchunk/appgen-site-detail-layout";
import * as automationPanelChunk from "@rchunk/open-automation-side-panel-tab";
import * as automationsStateChunk from "@rchunk/appgen-automations-state";
import type {
  JsxRuntime,
  MaitaiScope,
  MessageDescriptor,
  ReadableSignal,
  ScopedQueryFamily,
  ScopedQueryResult,
  SignalFamily,
} from "@rchunk/app-shared";
import type { AppgenSiteDetailSite } from "@rchunk/appgen-site-detail-layout";

void runtimeChunk;

interface SiteAutomationAttachment {
  automation_ids?: string[];
}

interface CloudAutomation {
  display_emoji?: string | null;
  id: string;
  kind: string;
  title: string;
}

interface CloudAutomationsResult {
  isAvailable?: boolean;
  items: Array<{ automation: CloudAutomation }>;
}

interface CapabilityResult {
  isCapable: boolean;
}

interface AppInitialBindings {
  $en: MaitaiScope<Record<string, unknown>>;
  Dtt(): void;
  Qgn(): void;
  VT(): string;
  Xet: SignalFamily<{ name: string }, CapabilityResult>;
  Ygn: unknown;
  Zet(): void;
  aa: { Header: unknown };
  au: unknown;
  itt: ReadableSignal<ScopedQueryResult<CloudAutomationsResult>>;
  itn(): void;
  l_n(): { projectId?: string | null };
  n7: unknown;
  nnt: Record<string, MessageDescriptor>;
  o_n(): (destination: string) => void;
  oa(): void;
  r7(): void;
  rnt(): void;
  stt(): void;
  su(): void;
  wtt(automation: CloudAutomation): string;
}

const {
  $3: initializeRuntimeLazy,
  $h: initializeResourceButton,
  BX: useSignalFamilyValue,
  FX: initializeSignalRuntime,
  HX: useSignalValue,
  I3: getJsxRuntime,
  K2: initializeSharedComponents,
  LX: useSignalScope,
  Qc: initializeSettingsGroup,
  Qh: LoadingSpinner,
  Y2: FormattedMessage,
  Yh: Button,
  Zc: SettingsGroup,
  Zh: initializeButton,
  al: initializeSettingsRow,
  lw: initializeBrowserProfileIcon,
  rl: SettingsRow,
  wy: AutomationFallbackIcon,
} = appSharedChunk;
const {
  $en: routeScope,
  Dtt: initializeAutomationTypes,
  Qgn: initializeGptResources,
  VT: scheduledRoute,
  Xet: capabilityQuery,
  Ygn: Navigate,
  Zet: initializeCapabilities,
  aa: pageComponents,
  au: PageBody,
  itt: cloudAutomationsQuery,
  itn: initializeAutomationRoutes,
  l_n: useRouteParams,
  n7: ErrorState,
  nnt: automationScheduleMessages,
  o_n: useNavigate,
  oa: initializePageBody,
  r7: initializeErrorState,
  rnt: initializeAutomationQueries,
  stt: initializeAutomationState,
  su: initializePageComponents,
  wtt: getAutomationScheduleKind,
} = appInitialChunk as unknown as AppInitialBindings;
const {
  n: initializeSiteDetailLayout,
  t: SiteDetailLayout,
} = siteDetailLayoutChunk;
const {
  i: openAutomationSidePanel,
  t: initializeAutomationSidePanel,
} = automationPanelChunk;
const {
  r: initializeAppgenAutomationsState,
  t: siteAutomationAttachmentsQuery,
} = automationsStateChunk;

let jsx: JsxRuntime;

function AppgenAutomationsPage() {
  const { projectId } = useRouteParams();
  if (projectId == null) {
    return jsx.jsx(Navigate, { replace: true, to: "/sites" });
  }

  return jsx.jsx(SiteDetailLayout, {
    projectId,
    selectedTab: "automations",
    children: renderAutomationsContent,
  });
}

function renderAutomationsContent(site: AppgenSiteDetailSite): unknown {
  return jsx.jsx(AppgenAutomationsContent, { site });
}

function AppgenAutomationsContent({
  site,
}: {
  site: AppgenSiteDetailSite;
}): unknown {
  const scope = useSignalScope(routeScope);
  const navigate = useNavigate();
  const { isCapable } = useSignalFamilyValue(capabilityQuery, {
    name: "automations.cloud",
  });
  const {
    data: attachments,
    isLoading: attachmentsLoading,
    isError: attachmentsError,
    refetch: refetchAttachments,
  } = useSignalFamilyValue(siteAutomationAttachmentsQuery, [site.id]);
  const {
    data: cloudAutomations,
    isLoading: cloudLoading,
    isError: cloudError,
    refetch: refetchCloudAutomations,
  } = useSignalValue(cloudAutomationsQuery);

  const automationIds = attachments?.[0]?.automation_ids;
  const matchingAutomations = cloudAutomations?.items.filter(
    ({ automation }) => automationIds?.includes(automation.id),
  );

  let content;
  if (attachmentsLoading || cloudLoading) {
    content = jsx.jsx(LoadingSpinner, {});
  } else if (
    attachmentsError ||
    cloudError ||
    cloudAutomations?.isAvailable === false
  ) {
    const retry = () => {
      Promise.all([refetchAttachments(), refetchCloudAutomations()]);
    };
    content = jsx.jsx(ErrorState, {
      type: "error",
      onPrimaryCtaClick: retry,
      primaryCtaText: jsx.jsx(FormattedMessage, {
        id: "appgenAutomations.retry",
        defaultMessage: "Try again",
        description: "Reload the Site schedules after a loading error",
      }),
      content: jsx.jsx(FormattedMessage, {
        id: "appgenAutomations.loadError",
        defaultMessage: "Couldn’t load schedules. Try again.",
        description: "Error when the Site's scheduled tasks cannot be loaded",
      }),
    });
  } else {
    const rows =
      matchingAutomations?.length === 0
        ? jsx.jsx(SettingsRow, {
            label: jsx.jsx(FormattedMessage, {
              id: "appgenAutomations.empty",
              defaultMessage: "No schedules yet",
              description:
                "Empty state for a Site with no associated scheduled tasks",
            }),
            control: null,
          })
        : matchingAutomations?.map(({ automation }) =>
            jsx.jsx(
              SettingsRow,
              {
                icon:
                  automation.display_emoji ||
                  jsx.jsx(AutomationFallbackIcon, {}),
                label: automation.title,
                description: jsx.jsx(FormattedMessage, {
                  ...automationScheduleMessages[
                    getAutomationScheduleKind(automation)
                  ],
                }),
                control: jsx.jsx(Button, {
                  color: "ghost",
                  size: "toolbar",
                  onClick: () =>
                    void navigate(
                      `${scheduledRoute()}?automationId=${encodeURIComponent(automation.id)}&automationSource=cloud`,
                    ),
                  children: jsx.jsx(FormattedMessage, {
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
    content = jsx.jsx(SettingsGroup, { children: rows });
  }

  const title = jsx.jsx(FormattedMessage, {
    id: "appgenSiteDetail.navigation.automations",
    defaultMessage: "Automations",
    description: "Tab label for a Site's cloud scheduled tasks",
  });
  const subtitle = jsx.jsx(FormattedMessage, {
    id: "appgenAutomations.description",
    defaultMessage:
      "Scheduled work for this Site runs in the cloud. Manage it in Scheduled.",
    description:
      "Description of the Site Automations tab and where to edit its tasks",
  });
  const createDisabled = !isCapable || site.status !== "active";
  const createSchedule = () =>
    openAutomationSidePanel({
      scope,
      projectId: site.id,
      title: site.title,
      prompt: "",
    });
  const header = jsx.jsx(pageComponents.Header, {
    title,
    subtitle,
    actions: jsx.jsx(Button, {
      color: "outline",
      size: "toolbar",
      disabled: createDisabled,
      onClick: createSchedule,
      children: jsx.jsx(FormattedMessage, {
        id: "appgenAutomations.create",
        defaultMessage: "Create schedule",
        description:
          "Button to open the existing cloud task setup for this Site",
      }),
    }),
  });

  return jsx.jsx(PageBody, {
    children: jsx.jsxs(pageComponents, { children: [header, content] }),
  });
}

function initializeAppgenAutomationsPage(): void {
  initializeRuntimeLazy();
  initializeSignalRuntime();
  initializeSharedComponents();
  initializeGptResources();
  initializeCapabilities();
  initializeAutomationQueries();
  initializeAutomationTypes();
  initializeAutomationState();
  initializeAutomationSidePanel();
  initializeErrorState();
  initializeButton();
  initializeBrowserProfileIcon();
  initializeResourceButton();
  initializeAutomationRoutes();
  initializePageComponents();
  initializePageBody();
  initializeSettingsRow();
  initializeSettingsGroup();
  initializeAppgenAutomationsState();
  initializeSiteDetailLayout();
  jsx = getJsxRuntime();
}

initializeAppgenAutomationsPage();

export { AppgenAutomationsPage };
