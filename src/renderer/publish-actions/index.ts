import {
  BX as useScopedFamilyValue,
  HX as useScopedValue,
  I3 as getJsxRuntime,
  type JsxRuntime,
} from "@rchunk/app-shared";
import {
  $m as environmentNeedsReview,
  Bm as environmentSavePending,
  Fm as environmentPublishMutation,
  Gm as environmentDraftSaveMutation,
  Jpt as environmentPublishingOperation,
  Km as environmentConfigurationQuery,
  Kpt as environmentSetupState,
  Ypt as conversationEnvironmentConfiguration,
  pmt as environmentSetupTask,
} from "@rchunk/app-initial";
import { r as environmentPanelActive } from "@rchunk/side-panel";
import "@rchunk/rolldown-runtime";

export interface PublishActionButtonProps {
  children: unknown;
  disabled?: boolean;
  loading?: boolean;
  tooltipContent?: unknown;
  color?: "primary" | "secondary";
  onClick?(): void;
}

export interface EnvironmentPublishActionsProps {
  conversationId: string;
  children?: unknown;
  onReview?(): void;
  hasPendingVpn?: boolean;
}

interface SetupState {
  phase?: string;
  [key: string]: unknown;
}
interface ConversationConfiguration {
  accountId?: string;
  userId?: string;
  configId?: string;
  approval?: unknown;
  promotedTurnId?: string | null;
  promotedVersionId?: string | null;
  [key: string]: unknown;
}
interface EnvironmentConfig {
  draft?: unknown;
  version_id?: string;
  [key: string]: unknown;
}
interface MutationState {
  error?: unknown;
  isPending?: boolean;
  mutate(input: Record<string, unknown>): void;
}
interface SetupTask {
  id?: string;
  isActive?: boolean;
  [key: string]: unknown;
}

let jsx: JsxRuntime;

function PublishActionButton(props: PublishActionButtonProps): unknown {
  const runtime = ensureJsx();
  return runtime.jsxs("span", {
    className: "publish-action",
    "aria-disabled": props.disabled || props.loading || undefined,
    title:
      typeof props.tooltipContent === "string"
        ? props.tooltipContent
        : undefined,
    children: [
      runtime.jsx("button", {
        type: "button",
        disabled: props.disabled || props.loading,
        "aria-busy": props.loading || undefined,
        "data-color": props.color ?? "primary",
        onClick: props.onClick,
        children: props.children,
      }),
      props.tooltipContent == null
        ? null
        : runtime.jsx("span", {
            role: "tooltip",
            children: props.tooltipContent,
          }),
    ],
  });
}

function EnvironmentPublishActions(
  props: EnvironmentPublishActionsProps,
): unknown {
  const runtime = ensureJsx();
  const panelActive = Boolean(useScopedValue(environmentPanelActive));
  const setup = useScopedFamilyValue(
    environmentSetupState,
    props.conversationId,
  ) as unknown as SetupState | null;
  const configuration = useScopedFamilyValue(
    conversationEnvironmentConfiguration,
    props.conversationId,
  ) as unknown as ConversationConfiguration | null;
  const query = useScopedFamilyValue(
    environmentConfigurationQuery,
    props.conversationId,
  ) as unknown as { data?: EnvironmentConfig } | null;
  const publishing = useScopedFamilyValue(
    environmentPublishMutation,
    props.conversationId,
  ) as unknown as MutationState | null;
  const savePending =
    Boolean(
      useScopedFamilyValue(environmentSavePending, props.conversationId),
    ) || props.hasPendingVpn === true;
  const needsReview = Boolean(
    useScopedFamilyValue(environmentNeedsReview, props.conversationId),
  );
  const setupTask = useScopedFamilyValue(
    environmentSetupTask,
    props.conversationId,
  ) as unknown as SetupTask | null;
  const operation = useScopedFamilyValue(
    environmentPublishingOperation,
    props.conversationId,
  );
  const draftSaving = Boolean(
    (
      useScopedFamilyValue(
        environmentDraftSaveMutation,
        props.conversationId,
      ) as { isPending?: boolean } | null
    )?.isPending,
  );

  if (!setup || !configuration || !query?.data || !publishing) return null;
  const hasDraft = query.data.draft != null;
  const setupReady =
    setupTask != null &&
    setupTask.isActive === false &&
    setup.phase === "ready";
  const checkingStatus = configuration.approval != null;
  const isPending = publishing.isPending === true;
  const blockedBySave = savePending || draftSaving;
  const shouldReview =
    props.onReview != null &&
    (needsReview || savePending) &&
    !isPending &&
    !checkingStatus;
  const publishDisabled =
    blockedBySave || (!checkingStatus && (needsReview || !setupReady));

  if (
    !hasDraft &&
    !checkingStatus &&
    !needsReview &&
    setupReady &&
    configuration.promotedVersionId === query.data.version_id
  ) {
    return runtime.jsxs("div", {
      className: "environment-published",
      children: [
        runtime.jsx("span", {
          role: "status",
          children: "Environment published",
        }),
        props.children,
      ],
    });
  }

  let label = "Publish";
  if (isPending) label = "Publishing environment…";
  else if (checkingStatus) label = "Check status";
  else if (publishing.error != null) label = "Retry publishing";
  else if (configuration.promotedVersionId != null) label = "Republish";

  let guidance = "Environment setup must finish before you can publish";
  if (needsReview) guidance = "Save your reviewed configuration, then publish";
  else if (setupReady)
    guidance = "Your configuration is saved and ready to publish";
  if (publishing.error != null)
    guidance =
      operation == null
        ? "Couldn’t publish environment"
        : "We couldn’t confirm whether publishing finished. Check status and try again";

  const action = shouldReview
    ? runtime.jsx(PublishActionButton, {
        color: "primary",
        disabled: panelActive,
        tooltipContent:
          "Review your configuration in the Environment panel, then save",
        onClick: props.onReview,
        children: "Review",
      })
    : runtime.jsx(PublishActionButton, {
        color: needsReview && !checkingStatus ? "secondary" : "primary",
        disabled: publishDisabled,
        loading: isPending,
        tooltipContent: guidance,
        onClick: () =>
          publishing.mutate({
            config: query.data,
            configuration: checkingStatus
              ? { ...configuration, approval: undefined }
              : configuration,
            retry: publishing.error != null,
          }),
        children: label,
      });

  return runtime.jsxs("div", {
    className: "environment-publish-actions",
    children: [
      !isPending && !checkingStatus
        ? runtime.jsx("p", {
            role: publishing.error ? "alert" : "status",
            children: guidance,
          })
        : null,
      runtime.jsxs("div", { children: [props.children, action] }),
    ],
  });
}

function initializePublishActionButton(): void {
  jsx = getJsxRuntime();
}
function initializeEnvironmentPublishActions(): void {
  jsx = getJsxRuntime();
}
function ensureJsx(): JsxRuntime {
  if (jsx == null) jsx = getJsxRuntime();
  return jsx;
}

export {
  initializePublishActionButton as i,
  initializeEnvironmentPublishActions as n,
  PublishActionButton as r,
  EnvironmentPublishActions as t,
};
