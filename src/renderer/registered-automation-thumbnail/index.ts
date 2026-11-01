import { n as onceExport } from "@rchunk/rolldown-runtime";
import * as appSharedChunk from "@rchunk/app-shared";
import * as appInitialChunk from "@rchunk/app-initial";
import {
  n as initializeReasoningTranslations,
  t as ReasoningEffortTranslation,
} from "@rchunk/model-and-reasoning-effort-translations";

interface JsxRuntime {
  jsx(type: unknown, props: Record<string, unknown>): unknown;
  jsxs(type: unknown, props: Record<string, unknown>): unknown;
}
interface ReactRuntime {
  useState<T>(initial: T | (() => T)): [T, (value: T) => void];
}
interface IntlRuntime {
  formatMessage(descriptor: {
    defaultMessage: string;
    description?: string;
    id: string;
  }): string;
}
interface QueryClient {
  getData(key: unknown, id?: string): unknown;
}
interface AutomationScope {
  query: QueryClient;
}
interface AutomationPreview {
  cloudAutomation?: unknown;
  destination: "cloud" | "existing-chat" | "new-chat";
  model: string | null;
  reasoningEffort: string | null;
  rrule: string | null;
  scheduleLabel: string | null;
  title: string;
}
interface AutomationRequest {
  proposal?: { rrule?: string | null };
  type: string;
}
interface AutomationThumbnailProps {
  readState(): { savedAutomationId?: string | null } | null;
  request: AutomationRequest;
  title: string;
}

const once = onceExport as (initializer: () => void) => () => void;

const {
  $3: initializeRuntime,
  FX: initializeSignals,
  I3: getJsxRuntime,
  K2: initializeCompiler,
  LX: useScope,
  Y2: FormattedMessage,
  e6: getReactRuntime,
  lw: initializeIcons,
  n4: useIntl,
  wL: initializeLinks,
  wy: AutomationIcon,
  zY: isHeartbeatAutomation,
} = appSharedChunk as unknown as {
  $3(): void;
  FX(): void;
  I3(): JsxRuntime;
  K2(): void;
  LX(signal: unknown): AutomationScope;
  Y2: unknown;
  e6(): ReactRuntime;
  lw(): void;
  n4(): IntlRuntime;
  wL(): void;
  wy: unknown;
  zY(value: unknown): boolean;
};
const {
  Ctt: formatCloudSchedule,
  Dtt: initializeAutomationFormatting,
  GYt: initializeScheduleFormatting,
  HYt: formatSchedule,
  Lg: resolveAutomationRequest,
  M0t: isReasoningEffort,
  N0t: initializeReasoningEffort,
  QCt: localAutomationsQuery,
  Rtt: mergeAutomationSeed,
  Xd: TabThumbnail,
  Xtt: initializeAutomationRequests,
  ZCt: initializeAutomationSelectors,
  cet: appScope,
  let: initializeAppScope,
  stt: cloudAutomationSignal,
  ttt: initializeCloudAutomation,
} = appInitialChunk as unknown as {
  Ctt(value: unknown, intl: IntlRuntime): unknown;
  Dtt(): void;
  GYt(): void;
  HYt(input: {
    fallbackMessage: string;
    intl: IntlRuntime;
    rrule: string;
  }): unknown;
  Lg(input: {
    request: AutomationRequest;
    savedAutomationId: string | null;
  }): Record<string, unknown>;
  M0t(value: string): boolean;
  N0t(): void;
  QCt: unknown;
  Rtt(input: {
    seed: unknown;
    targetAutomation: unknown;
  }): Record<string, unknown>;
  Xd: unknown;
  Xtt(): void;
  ZCt(): void;
  cet: unknown;
  let(): void;
  stt: unknown;
  ttt(): void;
};

let jsx: JsxRuntime;
function metadataRow(label: unknown, value: unknown): Record<string, unknown> {
  return {
    kind: "block",
    content: jsx.jsxs("div", {
      className: "flex items-start justify-between gap-3 text-xs leading-4",
      children: [
        jsx.jsx("span", {
          className: "shrink-0 text-codex-description",
          children: label,
        }),
        jsx.jsx("span", {
          className: "min-w-0 text-end text-secondary",
          children: value,
        }),
      ],
    }),
  };
}
function AutomationThumbnailView({
  cloudAutomation,
  destination,
  model,
  reasoningEffort,
  rrule,
  scheduleLabel,
  title,
}: AutomationPreview): unknown {
  const intl = useIntl();
  const schedule =
    cloudAutomation == null
      ? (scheduleLabel ??
        (rrule == null
          ? null
          : formatSchedule({
              rrule,
              intl,
              fallbackMessage: intl.formatMessage({
                id: "settings.automations.rruleSummaryFallback",
                defaultMessage: "Custom schedule",
                description:
                  "Fallback label when RRULE summary cannot be generated",
              }),
            })))
      : formatCloudSchedule(cloudAutomation, intl);
  const destinationLabel = jsx.jsx(
    FormattedMessage,
    destination === "cloud"
      ? {
          id: "tabThumbnail.automation.destination.cloud",
          defaultMessage: "Cloud",
          description:
            "Destination metadata shown in a scheduled task tab thumbnail for a task that runs in the cloud",
        }
      : destination === "existing-chat"
        ? {
            id: "tabThumbnail.automation.destination.existingChat",
            defaultMessage: "Existing chat",
            description:
              "Destination metadata shown in a scheduled task tab thumbnail for a task that runs in an existing chat",
          }
        : {
            id: "tabThumbnail.automation.destination.newChat",
            defaultMessage: "New chat",
            description:
              "Destination metadata shown in a scheduled task tab thumbnail for a task that starts a new chat",
          },
  );
  const reasoning =
    reasoningEffort != null && isReasoningEffort(reasoningEffort)
      ? jsx.jsx(ReasoningEffortTranslation, { effort: reasoningEffort })
      : null;
  const label = (id: string, defaultMessage: string, description: string) =>
    jsx.jsx(FormattedMessage, { id, defaultMessage, description });
  const rows = [
    schedule == null
      ? null
      : metadataRow(
          label(
            "tabThumbnail.automation.schedule",
            "Schedule",
            "Label for schedule metadata in a scheduled task tab thumbnail",
          ),
          schedule,
        ),
    metadataRow(
      label(
        "tabThumbnail.automation.destination",
        "Runs in",
        "Label for destination metadata in a scheduled task tab thumbnail",
      ),
      destinationLabel,
    ),
    model == null
      ? null
      : metadataRow(
          label(
            "tabThumbnail.automation.modelLabel",
            "Model",
            "Label for model metadata in a scheduled task tab thumbnail",
          ),
          model,
        ),
    reasoning == null
      ? null
      : metadataRow(
          label(
            "tabThumbnail.automation.reasoning",
            "Reasoning",
            "Label for reasoning metadata in a scheduled task tab thumbnail",
          ),
          reasoning,
        ),
  ].filter((value): value is Record<string, unknown> => value != null);
  return jsx.jsx(TabThumbnail, {
    icon: jsx.jsx(AutomationIcon, {}),
    subtitle: null,
    title,
    sections: rows,
  });
}

function RegisteredAutomationThumbnail({
  readState,
  request,
  title,
}: AutomationThumbnailProps): unknown {
  const scope = useScope(appScope);
  const [preview] = getReactRuntime().useState<AutomationPreview | null>(() => {
    if (request.type === "site")
      return {
        destination: "cloud",
        model: null,
        reasoningEffort: null,
        rrule: request.proposal?.rrule ?? null,
        scheduleLabel: null,
        title,
      };
    const resolved = resolveAutomationRequest({
      request,
      savedAutomationId: readState()?.savedAutomationId ?? null,
    });
    if (resolved.type === "proposal") {
      const items =
        (
          scope.query.getData(localAutomationsQuery) as
            { items?: Array<{ id: string }> } | undefined
        )?.items ?? [];
      const targetAutomation =
        items.find((item) => item.id === resolved.targetAutomationId) ?? null;
      const seed = mergeAutomationSeed({
        seed: resolved.seed,
        targetAutomation,
      });
      const heartbeat = seed.kind === "heartbeat";
      return {
        destination: heartbeat ? "existing-chat" : "new-chat",
        model: heartbeat ? null : (seed.model as string),
        reasoningEffort: heartbeat ? null : (seed.reasoningEffort as string),
        rrule: seed.rawRrule as string | null,
        scheduleLabel: null,
        title,
      };
    }
    const id =
      typeof resolved.automationId === "string" ? resolved.automationId : "";
    const local = (
      (
        scope.query.getData(localAutomationsQuery) as
          { items?: Array<Record<string, unknown>> } | undefined
      )?.items ?? []
    ).find((item) => item.id === id);
    if (local != null) {
      const heartbeat = isHeartbeatAutomation(local);
      return {
        destination: heartbeat ? "existing-chat" : "new-chat",
        model: heartbeat ? null : (local.model as string),
        reasoningEffort: heartbeat ? null : (local.reasoningEffort as string),
        rrule: local.rrule as string | null,
        scheduleLabel: null,
        title,
      };
    }
    const cloud = scope.query.getData(cloudAutomationSignal, id);
    return cloud == null
      ? null
      : {
          cloudAutomation: cloud,
          destination: "cloud",
          model: null,
          reasoningEffort: null,
          rrule: null,
          scheduleLabel: null,
          title,
        };
  });
  return preview == null
    ? null
    : jsx.jsx(
        AutomationThumbnailView,
        preview as unknown as Record<string, unknown>,
      );
}

const initializeRegisteredAutomationThumbnail = once((): void => {
  initializeRuntime();
  initializeCompiler();
  initializeAppScope();
  initializeReasoningEffort();
  initializeReasoningTranslations();
  initializeIcons();
  initializeScheduleFormatting();
  initializeAutomationFormatting();
  initializeCloudAutomation();
  initializeSignals();
  initializeLinks();
  initializeAutomationSelectors();
  initializeAutomationRequests();
  jsx = getJsxRuntime();
});
initializeRegisteredAutomationThumbnail();
export { RegisteredAutomationThumbnail };
