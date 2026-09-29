import "@rchunk/rolldown-runtime";
import {
  $3 as initializeSharedRuntime,
  BX as useSignalFamilyImport,
  FX as initializeMaitaiRuntime,
  HX as useSignalValue,
  I3 as getJsxRuntime,
  Ih as Dialog,
  K2 as initializeUiRuntime,
  LX as useScope,
  Lh as DialogText,
  Oh as DialogBody,
  Ph as initializeDialogTitle,
  QI as initializeExternalSignals,
  Rh as DialogTitle,
  Y2 as FormattedMessage,
  Yh as Button,
  ZI as appScope,
  Zh as initializeButtons,
  c_ as initializeDialogRuntime,
  e6 as getReactRuntime,
  kh as DialogActions,
  o_ as Tooltip,
  zh as initializeTooltipRuntime,
  type JsxRuntime,
} from "@rchunk/app-shared";
import {
  G6t as initializeAccountRuntime,
  K6t as currentAccountIdSignal,
  Qgn as initializeIdentityRuntime,
  ifn as initializeFeatureFlags,
  lfn as getDynamicConfigService,
  m0t as dynamicConfigFamily,
  o_n as useNavigate,
  ofn as useFeatureFlag,
  p0t as initializeDynamicConfig,
} from "@rchunk/app-initial";
// @ts-expect-error The navigation initializer is absent from the shared declaration baseline.
import { iE as initializeNavigationRuntime } from "@rchunk/app-initial";
// @ts-expect-error The GPT editor route is absent from the shared declaration baseline.
import { rE as gptEditorRoute } from "@rchunk/app-initial";
import {
  n as initializeHostedPluginCreationActions,
  t as HostedPluginCreationActions,
} from "@rchunk/hosted-plugin-creation-actions";

interface PromptProps {
  accountId: string;
  onClose(): void;
}

interface CreationState {
  canCreatePlugin: boolean;
  isCreatingPlugin?: boolean;
  isPluginCreatorDisabledByAdmin?: boolean;
  isWorkspacePluginUseDenied?: boolean;
  onCreatePlugin(): void;
}

interface DynamicConfig {
  get(key: string, fallback: boolean): boolean;
}

interface ScopeApi {
  watch(listener: (context: { get<T>(signal: unknown): T }) => void): void | (() => void);
}

interface ReactHooks {
  useEffect(effect: () => void | (() => void), dependencies: readonly unknown[]): void;
  useEffectEvent(callback: () => void): () => void;
}

const useSignalFamily = useSignalFamilyImport as unknown as (
  family: unknown,
  key: string,
) => DynamicConfig | undefined;

let initialized = false;
let jsx: JsxRuntime;
let react: ReactHooks;

function message(id: string, defaultMessage: string): unknown {
  return jsx.jsx(FormattedMessage, { id, defaultMessage });
}

function CreationPrompt({
  canCreatePlugin,
  gptCreationDisabled,
  isCreatingPlugin = false,
  isPluginCreatorEnabled = true,
  isPluginCreatorDisabledByAdmin = false,
  isWorkspacePluginUseDenied = false,
  onClose,
  onCreatePlugin,
  onCreateGpt,
}: CreationState & {
  gptCreationDisabled: boolean;
  isPluginCreatorEnabled?: boolean;
  onClose(): void;
  onCreateGpt(): void;
}): unknown {
  let disabledTooltip: unknown;
  if (!isPluginCreatorEnabled) {
    disabledTooltip = message(
      "chatgptConversations.gpts.create.creatorUnavailableTooltip",
      "Plugin Creator is not available for your account yet",
    );
  } else if (isWorkspacePluginUseDenied) {
    disabledTooltip = message(
      "chatgptConversations.gpts.create.workspacePluginUseDeniedTooltip",
      "Your workspace must allow you to use plugins to create a plugin. Contact your admin for access.",
    );
  } else if (isPluginCreatorDisabledByAdmin) {
    disabledTooltip = message(
      "chatgptConversations.gpts.create.creatorDisabledByAdminTooltip",
      "You do not have permission to create a plugin via conversation. Contact your admin to enable Plugin Creator",
    );
  }

  const onOpenChange = (open: boolean): void => {
    if (!open) onClose();
  };
  const onSubmit = (event: { preventDefault(): void }): void => {
    event.preventDefault();
    if (canCreatePlugin) onCreatePlugin();
  };

  const unavailable =
    gptCreationDisabled && !canCreatePlugin && !isCreatingPlugin
      ? message(
          "chatgptConversations.gpts.create.unavailableDescription",
          "GPT creation is no longer available, and you don’t have access to create plugins",
        )
      : null;
  const pluginOnly =
    gptCreationDisabled && (canCreatePlugin || isCreatingPlugin)
      ? message(
          "chatgptConversations.gpts.create.pluginOnlyDescription",
          "You can no longer create GPTs. Plugins are the new home for custom tools.",
        )
      : null;
  const transition = !gptCreationDisabled
    ? message(
        "chatgptConversations.gpts.create.pluginDescription",
        "Plugins are replacing GPTs as the home for custom tools. You can still create a GPT for now, but this option is going away.",
      )
    : null;

  const primaryButton = jsx.jsx(Button, {
    className: "w-full",
    "aria-disabled": !canCreatePlugin || undefined,
    "aria-busy": isCreatingPlugin,
    color: "primary",
    loading: isCreatingPlugin,
    size: "promotionalAction",
    type: "submit",
    children: message(
      "chatgptConversations.gpts.create.plugin",
      "Create plugin",
    ),
  });
  const primaryAction = jsx.jsx(Tooltip, {
    cloneCustomTrigger: true,
    tooltipContent: disabledTooltip,
    children: primaryButton,
  });
  const gptAction = gptCreationDisabled
    ? null
    : jsx.jsx(Button, {
        className: "w-full",
        color: "ghostSecondary",
        size: "promotionalLink",
        type: "button",
        onClick: onCreateGpt,
        children: message(
          "chatgptConversations.gpts.create.gpt",
          "Create GPT",
        ),
      });

  return jsx.jsx(Dialog, {
    open: true,
    variant: "centeredText",
    size: "feature",
    onOpenChange,
    children: jsx.jsx(DialogBody, {
      as: "form",
      variant: "chatgpt",
      onSubmit,
      children: jsx.jsxs("div", {
        className: "flex flex-col gap-8 p-6 pt-14 text-center sm:p-10",
        children: [
          jsx.jsxs("div", {
            className: "flex flex-col gap-4",
            children: [
              jsx.jsx(DialogTitle, {
                className: "text-heading-lg leading-7 font-semibold select-none",
                variant: "promotional",
                children: message(
                  "chatgptConversations.gpts.create.pluginTitle",
                  "Create a plugin instead",
                ),
              }),
              jsx.jsxs(DialogText, {
                className: "text-onboarding-body text-secondary select-none",
                "aria-live": "polite",
                children: [unavailable, pluginOnly, transition],
              }),
            ],
          }),
          jsx.jsxs(DialogActions, {
            className: "flex-col",
            children: [primaryAction, gptAction],
          }),
        ],
      }),
    }),
  });
}

function GptCreatePluginPrompt({ accountId, onClose }: PromptProps): unknown {
  const scope = useScope(appScope) as unknown as ScopeApi;
  const navigate = useNavigate();
  const currentAccountId = useSignalValue<string | null>(
    currentAccountIdSignal as unknown as Parameters<typeof useSignalValue<string | null>>[0],
  );
  const creationEnabled = useFeatureFlag("2160578039");
  const pluginCreatorEnabled = useFeatureFlag("1663164947");
  const config = useSignalFamily(dynamicConfigFamily, "2513446768");
  const configService = getDynamicConfigService() as unknown as {
    getDynamicConfig(key: string): DynamicConfig;
  };
  const closeFromEffect = react.useEffectEvent(onClose);

  react.useEffect(
    () =>
      scope.watch(({ get }) => {
        if (get<string | null>(currentAccountIdSignal) !== accountId) {
          closeFromEffect();
        }
      }),
    [accountId, scope],
  );

  if (currentAccountId !== accountId) return null;

  return jsx.jsx(HostedPluginCreationActions, {
    enabled: creationEnabled,
    logSkillCreationEvent: false,
    mode: "browse",
    onNavigate: onClose,
    children: (state: CreationState) =>
      jsx.jsx(CreationPrompt, {
        ...state,
        isPluginCreatorEnabled: pluginCreatorEnabled,
        gptCreationDisabled:
          config?.get("disable_gpt_creation", false) === true,
        onClose,
        onCreateGpt: () => {
          if (
            configService
              .getDynamicConfig("2513446768")
              .get("disable_gpt_creation", false)
          ) {
            return;
          }
          onClose();
          navigate(gptEditorRoute);
        },
      }),
  });
}

function initializeGptCreatePluginPrompt(): void {
  if (initialized) return;
  initialized = true;
  initializeSharedRuntime();
  initializeNavigationRuntime();
  initializeMaitaiRuntime();
  react = getReactRuntime() as unknown as ReactHooks;
  initializeUiRuntime();
  initializeIdentityRuntime();
  initializeAccountRuntime();
  initializeButtons();
  initializeTooltipRuntime();
  initializeDialogTitle();
  initializeDialogRuntime();
  initializeHostedPluginCreationActions();
  initializeExternalSignals();
  initializeFeatureFlags();
  initializeDynamicConfig();
  jsx = getJsxRuntime();
}

initializeGptCreatePluginPrompt();

export { GptCreatePluginPrompt };
