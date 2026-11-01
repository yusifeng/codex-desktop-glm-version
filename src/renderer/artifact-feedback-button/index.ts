import { n as onceExport } from "@rchunk/rolldown-runtime";
import {
  FX as initializeQueryRuntime,
  H3 as initializeLazyRuntime,
  I3 as getJsxRuntime,
  Jm as createLazyComponentExport,
  K2 as initializeToastRuntime,
  LX as useApplicationScopeExport,
  Q3 as logger,
  Y2 as FormattedMessage,
  Yh as Button,
  Z3 as initializeIconAssetRuntime,
  Zh as initializeButtonRuntime,
  _w as feedbackIcon16,
  c_ as initializeFeedbackIconRuntime,
  e6 as getReactRuntime,
  gw as initializeFeedbackAssetsRuntime,
  hw as feedbackIcon20,
  lg as Icon,
  lk as initializeIconRuntime,
  mw as initializeFeedbackRuntime,
  n4 as useIntl,
  o_ as Tooltip,
  pk as toastService,
  qm as initializeIntlRuntime,
  ug as initializeTooltipRuntime,
  type JsxRuntime,
  type ReactRuntime,
} from "@rchunk/app-shared";
import {
  $en as applicationScopeSignal,
  $rt as ManualEditHeaderButton,
  Hi as initializeArtifactFeedbackRuntime,
  Uzt as openDialogExport,
  Vi as DialogErrorFallback,
  Vzt as initializeDialogRuntime,
  gfn as planContextSignal,
  itn as initializePlanContextRuntime,
  mnt as initializeApplicationScopeRuntime,
  pfn as initializeFeedbackTransportRuntime,
  pnt as desktopApi,
  rit as initializeFeedbackCorrelationRuntime,
  rtn as createFeedbackCorrelationIdExport,
  zzt as closeDialogExport,
} from "@rchunk/app-initial";
import {
  n as initializeThumbMixed,
  t as ThumbMixed,
} from "@rchunk/thumb-mixed";
import type {
  ArtifactFeedbackDialogProps,
  ArtifactFeedbackValue,
  FeedbackArtifact,
} from "@rchunk/artifact-feedback-dialog";

type ArtifactFeedbackButtonVariant = "icon" | "text" | "manualEditHeader";
interface ArtifactFeedbackButtonProps {
  artifacts: readonly FeedbackArtifact[];
  fileSizeBytes?: number;
  hostId?: string;
  showArtifactSelector?: boolean;
  variant?: ArtifactFeedbackButtonVariant;
}
interface ApplicationScope {
  value: unknown;
  get<Value>(signal: unknown): Value;
}
interface ToastService {
  danger(
    message: string,
    options: { errorAnalytics: { toastId: string } },
  ): void;
}

const once = onceExport as (initializer: () => void) => () => void;
const useApplicationScope = useApplicationScopeExport as unknown as (
  signal: unknown,
) => ApplicationScope;
const createLazyComponent = createLazyComponentExport as unknown as (
  loader: () => Promise<(props: ArtifactFeedbackDialogProps) => unknown>,
  options: { errorFallback: unknown },
) => (props: ArtifactFeedbackDialogProps) => unknown;
const openDialog = openDialogExport as unknown as (
  scope: ApplicationScope,
  component: (props: ArtifactFeedbackDialogProps) => unknown,
  props: Omit<ArtifactFeedbackDialogProps, "onClose">,
) => void;
const closeDialog = closeDialogExport as unknown as (
  scope: ApplicationScope,
  component: unknown,
) => void;
const createFeedbackCorrelationId =
  createFeedbackCorrelationIdExport as unknown as (
    scopeValue: unknown,
  ) => string;

let React: ReactRuntime;
let jsx: JsxRuntime;
let ArtifactFeedbackDialog: (props: ArtifactFeedbackDialogProps) => unknown;
let loadFeedbackUpload: () => Promise<typeof import("@rchunk/feedback-upload")>;
let loadSubmitArtifactFeedback: () => Promise<
  typeof import("@rchunk/submit-artifact-feedback")
>;

function feedbackClassification(
  rating: ArtifactFeedbackValue["rating"],
): "bad-result" | "good-result" | "other" {
  switch (rating) {
    case "better":
      return "good-result";
    case "same":
      return "other";
    case "worse":
      return "bad-result";
  }
}

function ArtifactFeedbackButton({
  artifacts,
  fileSizeBytes,
  hostId,
  showArtifactSelector = false,
  variant = "icon",
}: ArtifactFeedbackButtonProps): unknown {
  const scope = useApplicationScope(applicationScopeSignal);
  const intl = useIntl();
  const appInfoPromise = React.useRef<Promise<unknown> | null>(null);
  const showSubmitError = () => {
    scope.get<ToastService>(toastService).danger(
      String(
        intl.formatMessage({
          id: "feedback.dialog.submitError",
          defaultMessage:
            "We couldn't submit your feedback. Please try again in a moment",
          description: "Toast shown when feedback submission fails",
        }),
      ),
      { errorAnalytics: { toastId: "feedback.dialog.submitError" } },
    );
  };
  const submit = async (
    value: ArtifactFeedbackValue,
    selectedArtifact?: FeedbackArtifact,
  ): Promise<boolean> => {
    const artifact = selectedArtifact ?? artifacts[0]!;
    let appInfo: unknown;
    let startFeedbackUpload: typeof import("@rchunk/feedback-upload").startFeedbackUpload;
    let submitArtifactFeedback: typeof import("@rchunk/submit-artifact-feedback").submitArtifactFeedback;
    try {
      [appInfo, { startFeedbackUpload }, { submitArtifactFeedback }] =
        await Promise.all([
          Promise.resolve(appInfoPromise.current).then(
            (resolved) => resolved ?? desktopApi.appInfo.get(),
          ),
          loadFeedbackUpload(),
          loadSubmitArtifactFeedback(),
        ]);
    } catch (error) {
      logger.error("Failed to prepare artifact feedback submission", {
        safe: {},
        sensitive: { error },
      });
      showSubmitError();
      return false;
    }
    const correlationId = createFeedbackCorrelationId(scope.value);
    const classification = feedbackClassification(value.rating);
    const description = value.details || "No additional details provided";
    startFeedbackUpload({
      scope,
      hostId,
      initialCorrelationId: correlationId,
      internalSlackMessage: undefined,
      submit: async () => {
        const planType = scope
          .get<{
            getContext(): { user?: { custom?: { plan_type?: unknown } } };
          } | null>(planContextSignal)
          ?.getContext().user?.custom?.plan_type;
        return (
          await (
            submitArtifactFeedback as unknown as (
              scope: ApplicationScope,
              context: Record<string, unknown>,
              answers: ArtifactFeedbackValue,
            ) => Promise<{ feedbackId: string }>
          )(
            scope,
            {
              appInfo,
              artifactType: artifact.artifactType,
              classification,
              description,
              fileFormat: artifact.fileFormat,
              fileSizeBytes,
              hostId,
              path: artifact.path,
              planType: typeof planType === "string" ? planType : null,
              threadId: correlationId,
            },
            value,
          )
        ).feedbackId;
      },
    });
    return true;
  };
  const open = () => {
    appInfoPromise.current = desktopApi.appInfo.get().catch(() => null);
    openDialog(scope, ArtifactFeedbackDialog, {
      artifacts,
      onSubmit: submit,
      showArtifactSelector,
    });
  };

  if (variant === "text") {
    return jsx.jsx(Button, {
      className: "text-xs",
      color: "ghostTertiary",
      onClick: open,
      children: jsx.jsx(FormattedMessage, {
        id: "artifactFeedback.button.giveFeedback",
        defaultMessage: "Give feedback",
        description:
          "Text button that opens the artifact feedback survey from a citation file card",
      }),
    });
  }
  const label = intl.formatMessage({
    id: "artifactFeedback.button.label",
    defaultMessage: "Feedback",
    description:
      "Tooltip and accessible label for the button that opens the artifact preview feedback survey",
  });
  const button =
    variant === "manualEditHeader"
      ? jsx.jsx(ManualEditHeaderButton, {
          uniform: true,
          "aria-label": label,
          onClick: open,
          children: jsx.jsx(Icon, {
            icon: { assets: { 16: feedbackIcon16, 20: feedbackIcon20 } },
          }),
        })
      : jsx.jsx(Button, {
          color: "ghost",
          size: "icon",
          "aria-label": label,
          onClick: open,
          children: jsx.jsx(ThumbMixed, { className: "icon-sm" }),
        });
  return jsx.jsx(Tooltip, { tooltipContent: label, children: button });
}

const initializeArtifactFeedbackButton = once(() => {
  initializeQueryRuntime();
  initializeFeedbackAssetsRuntime();
  initializeFeedbackRuntime();
  React = getReactRuntime();
  initializeToastRuntime();
  initializeButtonRuntime();
  initializeIntlRuntime();
  initializeDialogRuntime();
  initializeTooltipRuntime();
  initializeIconRuntime();
  initializeFeedbackIconRuntime();
  initializeArtifactFeedbackRuntime();
  initializeThumbMixed();
  initializeApplicationScopeRuntime();
  initializePlanContextRuntime();
  initializeFeedbackTransportRuntime();
  initializeIconAssetRuntime();
  initializeFeedbackCorrelationRuntime();
  jsx = getJsxRuntime();
  initializeLazyRuntime();
  ArtifactFeedbackDialog = createLazyComponent(
    async () =>
      (await import("@rchunk/artifact-feedback-dialog")).ArtifactFeedbackDialog,
    {
      errorFallback: jsx.jsx(DialogErrorFallback, {
        onClose: (scope: ApplicationScope) =>
          closeDialog(scope, ArtifactFeedbackDialog),
      }),
    },
  );
  loadFeedbackUpload = () => import("@rchunk/feedback-upload");
  loadSubmitArtifactFeedback = () => import("@rchunk/submit-artifact-feedback");
});

export { initializeArtifactFeedbackButton as n, ArtifactFeedbackButton as t };
