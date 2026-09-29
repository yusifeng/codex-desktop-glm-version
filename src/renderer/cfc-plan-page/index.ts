import "@rchunk/rolldown-runtime";
import {
  $3 as initializeJsxRuntime,
  I3 as getJsxRuntime,
  Qh as LoadingSpinner,
  Yh as Button,
  _L as useQuery,
  e6 as getReactRuntime,
  gL as initializeQueryRuntime,
  type JsxRuntime,
  type ReactRuntime,
} from "@rchunk/app-shared";
import "@rchunk/datadog-rum.browser";
import {
  N6t as useAccountState,
  cJt as initializeApiClient,
  i_n as useLocation,
  iht as useWorkspaceAccounts,
  o_n as useNavigate,
  ofn as useGate,
  rJt as apiClient,
} from "@rchunk/app-initial";
import "@rchunk/app-primary";
import "@rchunk/google-logo";
import "@rchunk/messages";

interface AccountState {
  accountId?: string | null;
  authMethod?: string | null;
  email?: string | null;
  isLoading?: boolean;
  userId?: string | null;
}

interface EnrollmentResponse {
  metadata?: {
    eligibility_source?: string | null;
    verification_status?: string | null;
  } | null;
}

interface WorkspaceAccount {
  can_access_with_session?: boolean;
  id?: string;
  is_deactivated?: boolean;
  plan_type?: string;
}

interface AccountsCheckResponse {
  accounts?: Record<
    string,
    { account?: { quorum_deferred_persona_verification?: boolean } }
  >;
}

let React: ReactRuntime;
let jsx: JsxRuntime;

const EMAIL_PATTERN =
  /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;

function CfcPlanPage(): unknown {
  const account = useAccountState() as AccountState;
  const location = useLocation();
  const navigate = useNavigate();
  const workspaceAccounts = (useWorkspaceAccounts().data?.accounts ??
    []) as WorkspaceAccount[];
  const existingWorkspaceGate = useGate("2369709783");
  const callbackPath = `/cfc-verification${location.search}`;
  const [differentAccount, setDifferentAccount] = React.useState(false);
  const [email, setEmail] = React.useState("");
  const [emailError, setEmailError] = React.useState<string | null>(null);

  const enrollment = useQuery<EnrollmentResponse>({
    queryKey: ["cfc-plan-enrollment", account.accountId, account.userId],
    queryFn: ({ signal }) =>
      apiClient.safePost<EnrollmentResponse>(
        "/quorum/refresh_enrollment_status",
        { signal },
      ),
    staleTime: Infinity,
    gcTime: 0,
    retry: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });
  const metadata = enrollment.isError ? null : enrollment.data?.metadata;
  const eligible =
    metadata?.eligibility_source === "allowlist" ||
    metadata?.verification_status === "verified";
  const quorumAccounts = workspaceAccounts.filter(
    (workspace) => workspace.plan_type === "quorum",
  );
  const shouldCheckAccounts =
    eligible && !existingWorkspaceGate && quorumAccounts.length > 0;
  const accountsCheck = useQuery<AccountsCheckResponse>({
    queryKey: ["cfc-verification-accounts", account.accountId, account.userId],
    enabled: shouldCheckAccounts,
    queryFn: ({ signal }) =>
      apiClient.safeGet<AccountsCheckResponse>("/accounts/check/{version}", {
        parameters: { path: { version: "v4-2023-04-27" } },
        signal,
      }),
    staleTime: 0,
    retry: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });
  const hasDeferredVerification = quorumAccounts.some(
    (workspace) =>
      workspace.id != null &&
      workspace.can_access_with_session !== false &&
      !workspace.is_deactivated &&
      accountsCheck.data?.accounts?.[workspace.id]?.account
        ?.quorum_deferred_persona_verification === true,
  );
  const hasExistingWorkspace =
    shouldCheckAccounts &&
    accountsCheck.data != null &&
    !accountsCheck.isError &&
    !hasDeferredVerification;

  const authenticate = (connection?: string): void => {
    const parameters = new URLSearchParams({
      callback_path: callbackPath,
      screen_hint: connection == null ? "login_or_signup" : "login",
    });
    if (connection != null) parameters.set("connection", connection);
    else {
      const normalizedEmail = email.trim();
      if (!normalizedEmail) {
        setEmailError("Email is required");
        return;
      }
      if (!EMAIL_PATTERN.test(normalizedEmail)) {
        setEmailError("Email is invalid.");
        return;
      }
      setEmailError(null);
      parameters.set("login_hint", normalizedEmail);
    }
    navigate(`/auth/login_with?${parameters}`);
  };

  if (account.isLoading) return jsx.jsx(LoadingSpinner, {});

  const loggedIn = account.authMethod === "chatgpt";
  const showLogin = !loggedIn || differentAccount;
  return jsx.jsxs("div", {
    children: [
      jsx.jsxs("main", {
        children: [
          jsx.jsx("a", {
            href: "/",
            "aria-label": "Click here to go to the home page",
            children: "ChatGPT",
          }),
          jsx.jsx("h1", {
            children:
              loggedIn && !differentAccount && hasExistingWorkspace
                ? "You already have access to a ChatGPT workspace for Clinicians"
                : "Sign in to get verified for a secure ChatGPT workspace for Clinicians",
          }),
          showLogin
            ? jsx.jsxs(React.Fragment, {
                children: [
                  jsx.jsxs("form", {
                    noValidate: true,
                    onSubmit: (event: { preventDefault(): void }) => {
                      event.preventDefault();
                      authenticate();
                    },
                    children: [
                      jsx.jsx("input", {
                        name: "email",
                        type: "email",
                        autoComplete: "email",
                        value: email,
                        placeholder: "Email address",
                        "aria-label": "Email address",
                        "aria-invalid": emailError != null,
                        onChange: (event: { target: { value: string } }) =>
                          setEmail(event.target.value),
                      }),
                      emailError == null
                        ? null
                        : jsx.jsx("p", {
                            role: "alert",
                            children: emailError,
                          }),
                      jsx.jsx(Button, {
                        type: "submit",
                        children: "Continue",
                      }),
                    ],
                  }),
                  jsx.jsx("p", {
                    children: "Already have an account? Log in",
                  }),
                  jsx.jsx("p", { children: "OR" }),
                  ...[
                    ["Google", "google-oauth2"],
                    ["Microsoft", "windowslive"],
                    ["Apple", "apple"],
                  ].map(([provider, connection]) =>
                    jsx.jsx(
                      Button,
                      {
                        type: "button",
                        color: "outlineSurface",
                        onClick: () => authenticate(connection),
                        children: `Continue with ${provider}`,
                      },
                      provider,
                    ),
                  ),
                ],
              })
            : jsx.jsxs("div", {
                children: [
                  jsx.jsx("p", {
                    children: account.email
                      ? `You are currently logged in as ${account.email}`
                      : "You are currently logged in as your current account",
                  }),
                  hasExistingWorkspace
                    ? jsx.jsx(Button, {
                        type: "button",
                        onClick: () => navigate("/"),
                        children: "Open ChatGPT",
                      })
                    : jsx.jsx(Button, {
                        type: "button",
                        onClick: () => window.location.assign(callbackPath),
                        children: "Get verified",
                      }),
                  jsx.jsx("button", {
                    type: "button",
                    onClick: () => setDifferentAccount(true),
                    children: "Log in as a different account",
                  }),
                ],
              }),
        ],
      }),
      jsx.jsxs("aside", {
        children: [
          jsx.jsx("h2", { children: "ChatGPT for Clinicians" }),
          jsx.jsx("p", { children: "Free for verified clinicians" }),
          jsx.jsx("p", {
            children: "Bring trusted medical evidence into the moment of care",
          }),
          jsx.jsx("p", { children: "Reduce documentation burden" }),
          jsx.jsx("p", { children: "Earn CME credits" }),
          jsx.jsx("p", {
            children: "Your content is not used to train our models",
          }),
        ],
      }),
      jsx.jsxs("footer", {
        children: [
          jsx.jsx("a", {
            href: "https://openai.com/policies/terms-of-use",
            target: "_blank",
            rel: "noreferrer",
            children: "Terms of Use",
          }),
          jsx.jsx("a", {
            href: "https://openai.com/policies/privacy-policy",
            target: "_blank",
            rel: "noreferrer",
            children: "Privacy Policy",
          }),
        ],
      }),
    ],
  });
}

function initializeCfcPlanPage(): void {
  initializeJsxRuntime();
  initializeQueryRuntime();
  initializeApiClient();
  React = getReactRuntime();
  jsx = getJsxRuntime();
}

initializeCfcPlanPage();

export { CfcPlanPage };
