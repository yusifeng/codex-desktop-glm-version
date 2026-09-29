import "@rchunk/rolldown-runtime";
import {
  $3 as initializeJsxRuntime,
  BX as useSignalFamilyValue,
  FX as initializeScopedRuntime,
  I3 as getJsxRuntime,
  LX as getScope,
  QI as initializeScopeRuntime,
  Qh as LoadingSpinner,
  Y2 as FormattedMessage,
  Yh as Button,
  Ym as copyText,
  ZI as appScope,
  Zh as initializeButton,
  e6 as getReactRuntime,
  fI as initializeIntlRuntime,
  n4 as useIntl,
  pk as toastManagerSignal,
  wL as initializeCapabilityRuntime,
} from "@rchunk/app-shared";
import {
  M6t as initializeAccountRuntime,
  Qgn as initializeHostRuntime,
  Sdn as ApiError,
  Ugn as getHostClient,
  d_n as useSearchParams,
  kft as openExternalLink,
  o_n as useNavigate,
  pnt as appServices,
  ugn as desktopHostId,
  xpn as trackAnalyticsEvent,
  ypn as initializeAnalyticsRuntime,
} from "@rchunk/app-initial";
import "@rchunk/app-primary";
import {
  n as initializeGoogleLogo,
  t as GoogleLogo,
} from "@rchunk/google-logo";
import {
  n as initializePageLayout,
  t as PageLayout,
} from "@rchunk/page-layout";
import "@rchunk/browser-session-queries";
import {
  a as startChatGptLogin,
  i as initializeDesktopAuthSession,
  n as getCodexAppVersion,
  r as initializeDesktopAuthUrl,
  t as buildDesktopAuthUrl,
} from "@rchunk/chatgpt-desktop-auth-url";
import "@rchunk/browser-login-handoff-page-core";
import "@rchunk/ascii-engine";
import { t as initializeOnboardingEntrypoint } from "@rchunk/onboarding-entrypoint";
import {
  a as initializeOnboardingLoginMessages,
  i as initializeOnboardingLoginState,
  n as initializeOnboardingLoginContent,
  o as loginMethodState,
  r as LoginMethodUnavailable,
  t as LoginContent,
} from "@rchunk/onboarding-login-content";

initializeJsxRuntime();
initializeScopedRuntime();
initializeScopeRuntime();
initializeButton();
initializeIntlRuntime();
initializeCapabilityRuntime();
initializeAccountRuntime();
initializeHostRuntime();
initializeAnalyticsRuntime();
initializeGoogleLogo();
initializePageLayout();
initializeDesktopAuthSession();
initializeDesktopAuthUrl();
initializeOnboardingEntrypoint();
initializeOnboardingLoginMessages();
initializeOnboardingLoginState();
initializeOnboardingLoginContent();

const React = getReactRuntime();
const jsx = getJsxRuntime();

type LoginIntent =
  "signin" | "signup" | "google" | "microsoft" | "other-account";
type LoginErrorKind = "abort" | "auth" | "network" | "unknown";

interface BrowserProfile {
  avatarUrl?: string | null;
  email: string;
  name?: string | null;
}

interface LoginCompletion {
  error?: unknown;
  onboardingEntrypoint?: string;
  success: boolean;
}

interface LoginStartResult {
  authUrl?: string;
  completion: Promise<unknown>;
}

interface ApiKeyClient {
  loginWithApiKey?(apiKey: string): Promise<unknown>;
  sendRequest?(method: string, parameters: unknown): Promise<unknown>;
}

interface BrowserSessionService {
  cancelProbe(probeId: string): void;
  getLookupEligibility(): Promise<{ eligible?: boolean } | null>;
  probe(
    probeId: string,
    desktopSessionUrl: string,
    securityLevel: string,
  ): Promise<unknown>;
}

interface BrowserAuthState {
  browserUrl: string | null;
  controller: AbortController;
}

const networkCodes = new Set([
  "EAI_AGAIN",
  "ECONNREFUSED",
  "ECONNRESET",
  "ENOTFOUND",
  "ETIMEDOUT",
  "ERR_CONNECTION_RESET",
  "ERR_NETWORK_CHANGED",
  "ERR_TIMED_OUT",
]);
const authCodes = new Set([
  "authentication_error",
  "forbidden",
  "invalid_api_key",
  "token_invalidated",
  "unauthorized",
]);
const networkMessages = new Set([
  "failed to fetch",
  "fetch failed",
  "load failed",
  "network request failed",
  "networkerror when attempting to fetch resource.",
  "request timed out",
]);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function addLoginIntent(authUrl: string, intent: LoginIntent): string {
  if (intent === "signin") return authUrl;
  try {
    const url = new URL(authUrl);
    if (intent === "signup") url.searchParams.set("screen_hint", "signup");
    if (intent === "google") {
      url.searchParams.set("screen_hint", "login_or_signup");
      url.searchParams.set("connection", "google-oauth2");
    }
    if (intent === "microsoft") {
      url.searchParams.set("screen_hint", "login_or_signup");
      url.searchParams.set("connection", "windowslive");
    }
    if (intent === "other-account")
      url.searchParams.set("prompt", "select_account");
    return url.toString();
  } catch {
    return authUrl;
  }
}

function classifyLoginError(error: unknown): LoginErrorKind {
  if (error instanceof Error && error.name === "AbortError") return "abort";
  if (error instanceof Error && error.name === "TimeoutError") return "network";
  if (error instanceof ApiError) {
    if (error.status === 401 || error.status === 403) return "auth";
    if (error.status === 0 || error.status === 408 || error.status === 504)
      return "network";
    if (error.errorCode != null && networkCodes.has(error.errorCode))
      return "network";
    if (error.errorCode != null && authCodes.has(error.errorCode))
      return "auth";
  }
  if (
    isRecord(error) &&
    typeof error.code === "string" &&
    networkCodes.has(error.code)
  )
    return "network";
  const message = (
    typeof error === "string"
      ? error
      : error instanceof Error
        ? error.message
        : ""
  )
    .trim()
    .toLowerCase();
  if (networkMessages.has(message)) return "network";
  if (
    authCodes.has(message) ||
    message === "auth failed" ||
    message === "invalid api key"
  )
    return "auth";
  return "unknown";
}

function normalizeStartResult(value: unknown): LoginStartResult | null {
  if (!isRecord(value) || !(value.completion instanceof Promise)) return null;
  return {
    authUrl: typeof value.authUrl === "string" ? value.authUrl : undefined,
    completion: value.completion,
  };
}

function normalizeCompletion(value: unknown): LoginCompletion {
  if (!isRecord(value)) return { success: false, error: value };
  return {
    error: value.error,
    onboardingEntrypoint:
      typeof value.onboardingEntrypoint === "string"
        ? value.onboardingEntrypoint
        : undefined,
    success: value.success === true,
  };
}

function normalizeBrowserProfile(value: unknown): BrowserProfile | null {
  if (
    !isRecord(value) ||
    typeof value.email !== "string" ||
    value.email.trim() === ""
  )
    return null;
  return {
    avatarUrl: typeof value.avatarUrl === "string" ? value.avatarUrl : null,
    email: value.email,
    name: typeof value.name === "string" ? value.name : null,
  };
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error
    ? error.message
    : typeof error === "string"
      ? error
      : "Unknown error";
}

function providerForIntent(
  intent: LoginIntent,
): "chatgpt" | "google" | "microsoft" {
  if (intent === "google" || intent === "microsoft") return intent;
  return "chatgpt";
}

function initials(profile: BrowserProfile): string {
  const label = profile.name?.trim() || profile.email;
  return label
    .split(/\s+/)
    .map((part) => part[0] ?? "")
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function LoginSurface(props: {
  allowApiKey: boolean;
  allowChatGpt: boolean;
  apiKey: string;
  browserAuth: BrowserAuthState | null;
  browserProfile: BrowserProfile | null | undefined;
  browserProfileLoading: boolean;
  isApiKeyEntryVisible: boolean;
  isApiKeyPending: boolean;
  onApiKeyChange(value: string): void;
  onApiKeyReset(): void;
  onApiKeySubmit(): void;
  onChatGptSignIn(intent?: LoginIntent, loginHint?: string): void;
  onCopySignInLink(): void;
  onPlaySnake(): void;
  onShowApiKeyEntry(): void;
}): unknown {
  const intl = useIntl();
  const chatPending = props.browserAuth !== null;

  if (props.allowChatGpt && chatPending && !props.isApiKeyEntryVisible) {
    return jsx.jsx("div", {
      className:
        "flex h-full w-full items-center justify-center bg-surface text-default",
      children: jsx.jsxs("div", {
        className: "flex w-[340px] flex-col items-center gap-8",
        children: [
          jsx.jsx(LoadingSpinner, { className: "size-10" }),
          jsx.jsx("p", {
            className: "text-center text-base text-codex-description",
            children: jsx.jsx(FormattedMessage, {
              id: "electron.onboarding.login.browserPending.welcomeV2",
              defaultMessage: "Continue signing in with your browser",
            }),
          }),
          jsx.jsx(Button, {
            color: "outlineSurface",
            size: "dialog",
            onClick: () => props.onChatGptSignIn(),
            children: jsx.jsx(FormattedMessage, {
              id: "electron.onboarding.login.chatgpt.cancel.welcomeV2",
              defaultMessage: "Cancel sign-in",
            }),
          }),
          props.browserAuth?.browserUrl == null
            ? null
            : jsx.jsx(Button, {
                color: "ghost",
                size: "dialog",
                onClick: props.onCopySignInLink,
                children: jsx.jsx(FormattedMessage, {
                  id: "electron.onboarding.login.copyLink",
                  defaultMessage: "Copy sign-in link",
                }),
              }),
        ],
      }),
    });
  }

  if (
    props.allowChatGpt &&
    props.browserProfileLoading &&
    !props.isApiKeyEntryVisible
  ) {
    return jsx.jsxs("div", {
      className:
        "flex h-full items-center justify-center gap-3 text-codex-description",
      children: [
        jsx.jsx(LoadingSpinner, { className: "size-4" }),
        jsx.jsx(FormattedMessage, {
          id: "electron.onboarding.login.loading",
          defaultMessage: "Loading…",
        }),
      ],
    });
  }

  const profile = props.browserProfile ?? null;
  return jsx.jsx("div", {
    className:
      "flex h-full w-full items-center justify-center bg-surface pb-6 text-default",
    children: jsx.jsxs("div", {
      className: "flex w-[340px] flex-col items-center gap-8",
      children: [
        jsx.jsxs("div", {
          className: "flex w-full flex-col items-center gap-4",
          children: [
            jsx.jsx(Button, {
              color: "ghostMuted",
              radius: "full",
              size: "inline",
              "aria-label": intl.formatMessage({
                id: "electron.onboarding.login.snake.start",
                defaultMessage: "Play Snake",
              }),
              onClick: props.onPlaySnake,
              children: "ChatGPT",
            }),
            jsx.jsx("h1", {
              className: "text-center text-[28px] leading-9",
              children: jsx.jsx(FormattedMessage, {
                id:
                  props.allowChatGpt && profile != null
                    ? "electron.onboarding.login.browserSession.welcomeBack"
                    : props.allowChatGpt
                      ? "electron.onboarding.login.welcomeV2.title.chatgptSignIn"
                      : "electron.onboarding.login.welcomeV2.title.apiKey",
                defaultMessage:
                  props.allowChatGpt && profile != null
                    ? "Welcome back"
                    : props.allowChatGpt
                      ? "Sign in to ChatGPT"
                      : "Sign in with an API key",
              }),
            }),
          ],
        }),
        props.isApiKeyEntryVisible
          ? jsx.jsx(LoginContent, {
              allowApiKey: props.allowApiKey,
              allowChatGpt: props.allowChatGpt,
              apiKeySecondaryActionLabel: jsx.jsx(FormattedMessage, {
                id: "electron.onboarding.login.apikey.cancel",
                defaultMessage: "Cancel",
              }),
              apiKeyValue: props.apiKey,
              isApiKeyEntryVisible: true,
              isApiKeySignInPending: props.isApiKeyPending,
              isChatGptSignInPending: chatPending,
              onApiKeySecondaryAction: props.onApiKeyReset,
              onApiKeySubmit: props.onApiKeySubmit,
              onApiKeyValueChange: props.onApiKeyChange,
              onChatGptSignIn: () => props.onChatGptSignIn(),
              onShowApiKeyEntry: props.onShowApiKeyEntry,
            })
          : jsx.jsxs("div", {
              className: "flex w-full flex-col items-center gap-3",
              children: [
                props.allowChatGpt && profile != null
                  ? jsx.jsxs(jsx.Fragment, {
                      children: [
                        jsx.jsxs(Button, {
                          className: "w-full justify-start",
                          color: "outlineSurface",
                          radius: "large",
                          size: "auth",
                          onClick: () =>
                            props.onChatGptSignIn("signin", profile.email),
                          children: [
                            profile.avatarUrl == null
                              ? jsx.jsx("span", {
                                  className:
                                    "flex size-10 items-center justify-center rounded-full bg-chart-yellow/20",
                                  children: initials(profile),
                                })
                              : jsx.jsx("img", {
                                  alt: "",
                                  className: "size-10 rounded-full",
                                  src: profile.avatarUrl,
                                }),
                            jsx.jsxs("span", {
                              className: "min-w-0 flex-1 text-start",
                              children: [
                                jsx.jsx("span", {
                                  className: "block truncate font-medium",
                                  children:
                                    profile.name?.trim() || profile.email,
                                }),
                                profile.name == null
                                  ? null
                                  : jsx.jsx("span", {
                                      className:
                                        "block truncate text-codex-description",
                                      children: profile.email,
                                    }),
                              ],
                            }),
                          ],
                        }),
                        jsx.jsx(Button, {
                          className: "w-full",
                          color: "outlineSurface",
                          size: "auth",
                          onClick: () => props.onChatGptSignIn("other-account"),
                          children: jsx.jsx(FormattedMessage, {
                            id: "electron.onboarding.login.browserSession.otherAccount",
                            defaultMessage: "Use another account",
                          }),
                        }),
                      ],
                    })
                  : props.allowChatGpt
                    ? jsx.jsx(Button, {
                        className: "w-full",
                        color: "primary",
                        size: "auth",
                        onClick: () => props.onChatGptSignIn(),
                        children: jsx.jsx(FormattedMessage, {
                          id: "electron.onboarding.login.chatgpt.continueToSignIn",
                          defaultMessage: "Continue to sign in",
                        }),
                      })
                    : null,
                props.allowChatGpt
                  ? jsx.jsxs(jsx.Fragment, {
                      children: [
                        jsx.jsxs(Button, {
                          className: "w-full",
                          color: "outlineSurface",
                          size: "auth",
                          onClick: () => props.onChatGptSignIn("google"),
                          children: [
                            jsx.jsx(GoogleLogo, { className: "size-5" }),
                            "Continue with Google",
                          ],
                        }),
                        jsx.jsx(Button, {
                          className: "w-full",
                          color: "outlineSurface",
                          size: "auth",
                          onClick: () => props.onChatGptSignIn("microsoft"),
                          children: "Continue with Microsoft",
                        }),
                      ],
                    })
                  : null,
                props.allowApiKey
                  ? jsx.jsx(Button, {
                      className: "w-full",
                      color: "outlineSurface",
                      size: "auth",
                      onClick: props.onShowApiKeyEntry,
                      children: props.allowChatGpt
                        ? "Sign in another way"
                        : "Sign in with an API key",
                    })
                  : null,
                props.allowChatGpt
                  ? jsx.jsx(Button, {
                      color: "ghostMuted",
                      size: "inline",
                      onClick: () => props.onChatGptSignIn("signup"),
                      children: jsx.jsx(FormattedMessage, {
                        id: "electron.onboarding.login.signup.welcomeV2",
                        defaultMessage: "Sign up",
                      }),
                    })
                  : null,
              ],
            }),
      ],
    }),
  });
}

function SnakeGame({ onExit }: { onExit(): void }): unknown {
  return jsx.jsx("div", {
    className: "flex h-full w-full items-center justify-center bg-surface",
    onKeyDown: (event: { key?: string }) => {
      if (event.key === "Escape") onExit();
    },
    children: jsx.jsxs("div", {
      className: "flex flex-col items-center gap-4",
      children: [
        jsx.jsx("div", {
          className:
            "grid size-52 grid-cols-6 gap-1 rounded-xl border border-default p-4",
          role: "img",
          "aria-label": "Snake game",
          children: "■■■■  ●",
        }),
        jsx.jsx(Button, {
          color: "ghost",
          size: "dialog",
          onClick: onExit,
          children: "Exit game",
        }),
      ],
    }),
  });
}

function LoginRouteContent({
  workspaceRecovery,
}: {
  workspaceRecovery: boolean;
}): unknown {
  const scope = getScope(appScope);
  const navigate = useNavigate();
  const intl = useIntl();
  const methods = useSignalFamilyValue(loginMethodState, desktopHostId);
  const allowChatGpt = methods.status === "ready" && methods.chatgpt;
  const allowApiKey = methods.status === "ready" && methods.api;
  const [apiKey, setApiKey] = React.useState("");
  const [isApiKeyEntryVisible, setApiKeyEntryVisible] = React.useState(false);
  const [apiController, setApiController] =
    React.useState<AbortController | null>(null);
  const [browserAuth, setBrowserAuth] = React.useState<BrowserAuthState | null>(
    null,
  );
  const apiControllerRef = React.useRef<AbortController | null>(null);
  const browserControllerRef = React.useRef<AbortController | null>(null);
  const [browserProfile, setBrowserProfile] = React.useState<
    BrowserProfile | null | undefined
  >(undefined);
  const [browserProfileLoading, setBrowserProfileLoading] =
    React.useState(false);
  const [playingSnake, setPlayingSnake] = React.useState(false);

  React.useEffect(
    () => () => {
      apiControllerRef.current?.abort();
      browserControllerRef.current?.abort();
    },
    [],
  );

  React.useEffect(() => {
    if (!allowChatGpt) {
      setBrowserProfile(null);
      setBrowserProfileLoading(false);
      return;
    }
    const service = appServices.chatGptBrowserSession as
      BrowserSessionService | undefined;
    if (service == null) {
      setBrowserProfile(null);
      return;
    }
    const controller = new AbortController();
    const probeId = crypto.randomUUID();
    setBrowserProfileLoading(true);
    void (async () => {
      try {
        const eligibility = await service.getLookupEligibility();
        if (controller.signal.aborted || eligibility?.eligible !== true) {
          if (!controller.signal.aborted) setBrowserProfile(null);
          return;
        }
        const info = await appServices.appInfo.get();
        const origin =
          info.chatGptDesktopAuthOrigin?.trim() || "https://chatgpt.com";
        const profile = await service.probe(
          probeId,
          new URL("/codex/desktop-session", origin).toString(),
          "high",
        );
        if (!controller.signal.aborted)
          setBrowserProfile(normalizeBrowserProfile(profile));
      } catch {
        if (!controller.signal.aborted) setBrowserProfile(null);
      } finally {
        if (!controller.signal.aborted) setBrowserProfileLoading(false);
      }
    })();
    return () => {
      controller.abort();
      service.cancelProbe(probeId);
    };
  }, [allowChatGpt]);

  const showError = (error: unknown) => {
    scope.get(toastManagerSignal).danger(
      String(
        intl.formatMessage(
          {
            id: "electron.onboarding.login.error",
            defaultMessage: "Sign-in failed: {rawMessage}",
          },
          { rawMessage: getErrorMessage(error) },
        ),
      ),
    );
  };

  const finishLogin = async () => {
    if (workspaceRecovery) {
      await navigate("/", { replace: true });
      return;
    }
    navigate("/welcome", { replace: true });
  };

  const onChatGptSignIn = async (
    intent: LoginIntent = "signin",
    loginHint?: string,
  ) => {
    if (browserControllerRef.current != null) {
      browserControllerRef.current.abort();
      browserControllerRef.current = null;
      setBrowserAuth(null);
      return;
    }
    if (!allowChatGpt) return;
    const controller = new AbortController();
    browserControllerRef.current = controller;
    const provider = providerForIntent(intent);
    setBrowserAuth({ browserUrl: null, controller });
    trackAnalyticsEvent(scope, "desktop_login_started", {
      method: provider,
      workspaceRecovery,
    });
    try {
      const start = normalizeStartResult(
        await startChatGptLogin({
          hostId: desktopHostId,
          scope,
          signal: controller.signal,
          useHostedLoginSuccessPage: true,
          useStreamlinedLogin: true,
        }),
      );
      if (start == null) throw new Error("Invalid sign-in response");
      if (start.authUrl != null && !controller.signal.aborted) {
        const authUrl = addLoginIntent(start.authUrl, intent);
        const browserUrl = buildDesktopAuthUrl({
          authUrl,
          codexAppVersion: getCodexAppVersion(scope),
          includeCodexOriginStableId: true,
          loginHint,
          useDesktopAuth: !workspaceRecovery,
          useStreamlinedLoginUx: true,
        });
        setBrowserAuth((current) =>
          current?.controller === controller
            ? { browserUrl, controller }
            : current,
        );
        openExternalLink({
          href: browserUrl,
          initiator: "open_in_browser_bridge",
          openTarget: "external-browser",
        });
      }
      const completion = normalizeCompletion(await start.completion);
      if (controller.signal.aborted) return;
      if (!completion.success)
        throw completion.error ?? new Error("Unknown error");
      trackAnalyticsEvent(scope, "desktop_login_succeeded", {
        method: provider,
        onboardingEntrypoint: completion.onboardingEntrypoint,
        workspaceRecovery,
      });
      await finishLogin();
    } catch (error) {
      const errorKind = classifyLoginError(error);
      trackAnalyticsEvent(scope, "desktop_login_failed", {
        errorKind,
        method: provider,
      });
      if (errorKind !== "abort") showError(error);
    } finally {
      if (browserControllerRef.current === controller)
        browserControllerRef.current = null;
      setBrowserAuth((current) =>
        current?.controller === controller ? null : current,
      );
    }
  };

  const onApiKeySubmit = async () => {
    const value = apiKey.trim();
    if (value === "" || apiController != null || !allowApiKey) return;
    const controller = new AbortController();
    apiControllerRef.current = controller;
    setApiController(controller);
    trackAnalyticsEvent(scope, "desktop_login_started", {
      method: "apikey",
      workspaceRecovery,
    });
    try {
      const client = getHostClient(
        scope,
        desktopHostId,
      ) as unknown as ApiKeyClient;
      if (client.loginWithApiKey != null) await client.loginWithApiKey(value);
      else if (client.sendRequest != null)
        await client.sendRequest("loginWithApiKey", { apiKey: value });
      else throw new Error("API key sign-in is unavailable");
      if (controller.signal.aborted) return;
      trackAnalyticsEvent(scope, "desktop_login_succeeded", {
        method: "apikey",
        workspaceRecovery,
      });
      await finishLogin();
    } catch (error) {
      if (controller.signal.aborted) return;
      trackAnalyticsEvent(scope, "desktop_login_failed", {
        errorKind: classifyLoginError(error),
        method: "apikey",
      });
      showError(error);
    } finally {
      if (apiControllerRef.current === controller)
        apiControllerRef.current = null;
      setApiController((current) => (current === controller ? null : current));
    }
  };

  if (methods.status !== "ready" || (!methods.api && !methods.chatgpt)) {
    return jsx.jsx(PageLayout, {
      title: "",
      showFooter: false,
      children: jsx.jsx(LoginMethodUnavailable, { hostId: desktopHostId }),
    });
  }

  const content = playingSnake
    ? jsx.jsx(SnakeGame, { onExit: () => setPlayingSnake(false) })
    : jsx.jsx(LoginSurface, {
        allowApiKey,
        allowChatGpt,
        apiKey,
        browserAuth,
        browserProfile,
        browserProfileLoading,
        isApiKeyEntryVisible,
        isApiKeyPending: apiController != null,
        onApiKeyChange: setApiKey,
        onApiKeyReset: () => {
          apiControllerRef.current?.abort();
          apiControllerRef.current = null;
          setApiController(null);
          setApiKey("");
          setApiKeyEntryVisible(false);
        },
        onApiKeySubmit: () => void onApiKeySubmit(),
        onChatGptSignIn: (intent, hint) => void onChatGptSignIn(intent, hint),
        onCopySignInLink: () => {
          const browserUrl = browserAuth?.browserUrl;
          if (browserUrl == null) return;
          copyText(browserUrl);
          scope.get(toastManagerSignal).success(
            String(
              intl.formatMessage({
                id: "electron.onboarding.login.linkCopied",
                defaultMessage: "Sign-in link copied",
              }),
            ),
          );
        },
        onPlaySnake: () => setPlayingSnake(true),
        onShowApiKeyEntry: () => setApiKeyEntryVisible(true),
      });

  return jsx.jsx(PageLayout, {
    title: "",
    showFooter: false,
    children: content,
  });
}

export function LoginRoute(): unknown {
  const [searchParams] = useSearchParams();
  return jsx.jsx(LoginRouteContent, {
    workspaceRecovery: searchParams.get("workspaceRecovery") === "true",
  });
}
