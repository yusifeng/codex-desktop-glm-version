// onboarding-login-content —— Desktop onboarding 的托管登录方式解析和登录控件。

import * as appInitialChunk from "@rchunk/app-initial";
import * as appSharedChunk from "@rchunk/app-shared";
import * as runtimeChunk from "@rchunk/rolldown-runtime";
import type {
  DerivedScopedSignalContext,
  JsxRuntime,
  ScopedDerivedFamily,
  ScopedQueryFamily,
  ScopedQueryResult,
} from "@rchunk/app-shared";

void runtimeChunk;

type LoginMethodState =
  | { status: "loading" | "error" | "unsupported" }
  | { status: "ready"; api: boolean; chatgpt: boolean };

interface HostRequirementsResponse {
  requirements?: unknown;
}

interface LocalConfigResponse {
  config: { forced_login_method?: "api" | "chatgpt" | null };
  configReadSucceeded: boolean;
}

interface LoginMethodReader {
  get(
    signal: ScopedQueryFamily<
      Record<string, unknown>,
      { hostId: string },
      HostRequirementsResponse
    >,
    parameter: { hostId: string },
  ): ScopedQueryResult<HostRequirementsResponse>;
  get(
    signal: ScopedQueryFamily<
      Record<string, unknown>,
      string,
      LocalConfigResponse
    >,
    parameter: string,
  ): ScopedQueryResult<LocalConfigResponse>;
}

interface AppInitialBindings {
  $sn(): void;
  Jat: unknown;
  Xat(): void;
  Ysn: ScopedQueryFamily<
    Record<string, unknown>,
    { hostId: string },
    HostRequirementsResponse
  >;
  lcn: ScopedQueryFamily<
    Record<string, unknown>,
    string,
    LocalConfigResponse
  >;
}

const {
  BX: useSignalFamilyValue,
  FX: initializeSignalRuntime,
  I3: jsxRuntimeExport,
  K2: initializeSharedComponents,
  LX: useSignalScope,
  QI: initializeSharedRuntime,
  Qh: LoadingSpinner,
  Y2: FormattedMessage,
  Yh: Button,
  ZI: applicationScope,
  Zh: initializeButton,
  g4: initializeDialogComponents,
  n4: useIntl,
  rZ: createDerivedFamily,
} = appSharedChunk;
const {
  $sn: initializeHostRequirements,
  Jat: Input,
  Xat: initializeInput,
  Ysn: hostRequirementsQuery,
  lcn: localConfigQuery,
} = appInitialChunk as unknown as AppInitialBindings;

let jsx: JsxRuntime;
let loginMethodsSignal: ScopedDerivedFamily<
  Record<string, unknown>,
  string,
  LoginMethodState
>;
let stateInitialized = false;
let contentInitialized = false;

function isAllowedLoginMethods(value: unknown): value is {
  allowedLoginMethods?: Array<"api" | "chatgpt"> | null;
} {
  if (value == null || typeof value !== "object") return false;
  const methods = (value as { allowedLoginMethods?: unknown })
    .allowedLoginMethods;
  return (
    methods == null ||
    (Array.isArray(methods) &&
      methods.every((method) => method === "api" || method === "chatgpt"))
  );
}

function resolveLoginMethods(
  hostId: string,
  get: LoginMethodReader["get"],
): LoginMethodState {
  const requirementsQuery = get(hostRequirementsQuery, { hostId });
  if (requirementsQuery.isPending) return { status: "loading" };
  if (
    requirementsQuery.isError ||
    requirementsQuery.data?.requirements === undefined
  ) {
    return { status: "error" };
  }
  const requirements = requirementsQuery.data.requirements;
  if (requirements == null) {
    const configQuery = get(localConfigQuery, hostId);
    if (configQuery.isPending) return { status: "loading" };
    if (configQuery.isError || !configQuery.data?.configReadSucceeded) {
      return { status: "error" };
    }
    const forcedMethod = configQuery.data.config.forced_login_method;
    return {
      status: "ready",
      api: forcedMethod == null || forcedMethod === "api",
      chatgpt: forcedMethod == null || forcedMethod === "chatgpt",
    };
  }
  if (typeof requirements !== "object") return { status: "error" };
  if (!("allowedLoginMethods" in requirements)) {
    return { status: "unsupported" };
  }
  if (!isAllowedLoginMethods(requirements)) return { status: "error" };
  const allowed = requirements.allowedLoginMethods;
  return {
    status: "ready",
    api: allowed == null || allowed.includes("api"),
    chatgpt: allowed == null || allowed.includes("chatgpt"),
  };
}

function initializeLoginMethodState(): void {
  if (stateInitialized) return;
  stateInitialized = true;
  initializeSignalRuntime();
  initializeDialogComponents();
  initializeHostRequirements();
  initializeSharedRuntime();
  loginMethodsSignal = createDerivedFamily(
    applicationScope,
    (
      hostId: string,
      { get }: DerivedScopedSignalContext<Record<string, unknown>>,
    ) => resolveLoginMethods(hostId, get as LoginMethodReader["get"]),
  );
}

function LoginMethodsUnavailable({ hostId }: { hostId: string }): unknown {
  initializeLoginMethodsUnavailable();
  const scope = useSignalScope(applicationScope);
  const state = useSignalFamilyValue(loginMethodsSignal, hostId);
  if (state.status === "loading") {
    return jsx.jsx("div", {
      className:
        "flex h-full w-full flex-col items-center justify-center gap-3 text-codex-description select-none",
      children: jsx.jsxs("div", {
        role: "status",
        children: [
          jsx.jsx(LoadingSpinner, { className: "h-4 w-4 text-default" }),
          jsx.jsx(FormattedMessage, {
            id: "electron.loginMethods.loading",
            defaultMessage: "Loading sign-in requirements…",
            description:
              "Loading message while reading managed sign-in requirements from the machine being authenticated",
          }),
        ],
      }),
    });
  }
  const message =
    state.status === "unsupported"
      ? {
          id: "electron.loginMethods.unsupported",
          defaultMessage:
            "Update Codex on this machine to read its managed sign-in requirements",
          description:
            "An older app-server cannot expose configured managed login restrictions, so sign-in options are hidden",
        }
      : state.status === "ready"
        ? {
            id: "electron.loginMethods.noneAllowed",
            defaultMessage:
              "Your administrator has disabled all available sign-in methods",
            description:
              "No Desktop login method is permitted by managed requirements",
          }
        : {
            id: "electron.loginMethods.error",
            defaultMessage: "Unable to load sign-in requirements",
            description:
              "Managed sign-in requirements could not be read; sign-in options remain hidden until retry succeeds",
          };
  return jsx.jsxs("div", {
    className:
      "flex h-full w-full flex-col items-center justify-center gap-3 text-codex-description select-none",
    children: [
      jsx.jsx("div", {
        role: "alert",
        children: jsx.jsx(FormattedMessage, message),
      }),
      jsx.jsx(Button, {
        color: "secondary",
        onClick: () => {
          scope.get(hostRequirementsQuery, { hostId }).refetch();
          scope.get(localConfigQuery, hostId).refetch();
        },
        children: jsx.jsx(FormattedMessage, {
          id: "electron.loginMethods.retry",
          defaultMessage: "Retry",
          description: "Retry reading managed sign-in requirements",
        }),
      }),
    ],
  });
}

function initializeLoginMethodsUnavailable(): void {
  initializeLoginMethodState();
  initializeLoginContent();
}

function LoginActions(props: {
  allowApiKey: boolean;
  allowChatGpt: boolean;
  apiKeyValue: string;
  isApiKeyEntryVisible: boolean;
  isApiKeySignInPending: boolean;
  isChatGptSignInPending: boolean;
  onApiKeySecondaryAction(): void;
  onApiKeySubmit(): void;
  onApiKeyValueChange(value: string): void;
  onChatGptSignIn(): void;
  onShowApiKeyEntry(): void;
  apiKeySecondaryActionLabel: unknown;
}): unknown {
  initializeLoginActions();
  const intl = useIntl();
  if (props.allowApiKey && props.isApiKeyEntryVisible) {
    const placeholder =
      intl.formatMessage({
        id: "electron.onboarding.login.apikey.placeholder",
        defaultMessage: "sk-…",
        description: "Placeholder for API key input on desktop onboarding",
      });
    return jsx.jsxs("div", {
      className: "flex w-full flex-col gap-3",
      children: [
        jsx.jsxs("label", {
          className: "flex flex-col gap-2 text-base font-medium text-default",
          children: [
            jsx.jsx(FormattedMessage, {
              id: "electron.onboarding.login.apikey.label",
              defaultMessage: "OpenAI API key",
              description: "Label for API key input on desktop onboarding",
            }),
            jsx.jsx(Input, {
              autoFocus: true,
              placeholder,
              value: props.apiKeyValue,
              onChange: (event: { target: { value: string } }) =>
                props.onApiKeyValueChange(event.target.value),
            }),
          ],
        }),
        jsx.jsxs("div", {
          className: "flex items-center gap-2",
          children: [
            jsx.jsx(Button, {
              className: "flex-1 justify-center",
              color: "secondary",
              size: "large",
              onClick: props.onApiKeySecondaryAction,
              children: props.apiKeySecondaryActionLabel,
            }),
            jsx.jsx(Button, {
              className: "flex-1 justify-center",
              onClick: props.onApiKeySubmit,
              disabled:
                props.apiKeyValue.trim().length === 0 ||
                props.isApiKeySignInPending,
              loading: props.isApiKeySignInPending,
              size: "large",
              children: jsx.jsx(FormattedMessage, {
                id: "electron.onboarding.login.apikey.continue",
                defaultMessage: "Continue",
                description:
                  "Continue button label for API key sign-in on desktop onboarding",
              }),
            }),
          ],
        }),
      ],
    });
  }
  return jsx.jsxs("div", {
    className: "flex w-full max-w-[200px] flex-col gap-3",
    children: [
      props.allowChatGpt
        ? jsx.jsx(Button, {
            color: "primary",
            className: "w-full justify-center py-2.5",
            onClick: props.onChatGptSignIn,
            children: jsx.jsx(FormattedMessage, {
              id: props.isChatGptSignInPending
                ? "electron.onboarding.login.chatgpt.cancel"
                : "electron.onboarding.login.chatgpt.continue",
              defaultMessage: props.isChatGptSignInPending
                ? "Cancel sign-in"
                : "Continue with ChatGPT",
              description: props.isChatGptSignInPending
                ? "Cancel button label while ChatGPT sign-in is in progress on desktop onboarding"
                : "Button label to sign in with ChatGPT on desktop onboarding",
            }),
          })
        : null,
      props.allowApiKey && !props.isChatGptSignInPending
        ? jsx.jsx(Button, {
            color: "outline",
            className: "w-full justify-center py-2.5",
            onClick: props.onShowApiKeyEntry,
            children: jsx.jsx(FormattedMessage, {
              id: "electron.onboarding.login.apikey.open",
              defaultMessage: "Enter API key",
              description:
                "Button label to open API key entry on desktop onboarding",
            }),
          })
        : null,
    ],
  });
}

function initializeLoginActions(): void {
  initializeLoginContent();
  initializeInput();
}

function initializeLoginContent(): void {
  if (contentInitialized) return;
  contentInitialized = true;
  initializeSharedComponents();
  initializeButton();
  jsx = resolveRuntime<JsxRuntime>(jsxRuntimeExport);
}

function resolveRuntime<T>(value: unknown): T {
  return (typeof value === "function" ? value() : value) as T;
}

initializeLoginMethodState();

export {
  initializeLoginMethodState as a,
  initializeLoginMethodsUnavailable as i,
  initializeLoginActions as n,
  loginMethodsSignal as o,
  LoginMethodsUnavailable as r,
  LoginActions as t,
};
