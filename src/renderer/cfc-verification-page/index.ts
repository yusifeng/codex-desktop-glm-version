import "@rchunk/rolldown-runtime";
import * as appSharedChunk from "@rchunk/app-shared";
import * as appInitialChunk from "@rchunk/app-initial";
import * as messagesChunk from "@rchunk/messages";
import * as personaChunk from "@rchunk/cfc-persona-verification";

interface JsxRuntime {
  Fragment: unknown;
  jsx(type: unknown, props: Record<string, unknown>, key?: string): unknown;
  jsxs(type: unknown, props: Record<string, unknown>, key?: string): unknown;
}

interface ReactRuntime {
  useEffect(effect: () => void | (() => void), dependencies: unknown[]): void;
  useRef<Value>(value: Value): { current: Value };
  useState<Value>(value: Value | (() => Value)): [Value, (next: Value | ((value: Value) => Value)) => void];
}

interface IntlShape {
  formatMessage(
    descriptor: { defaultMessage: string; id: string },
    values?: Record<string, unknown>,
  ): string;
}

interface AuthState {
  accountId?: string | null;
  authMethod?: string | null;
  isLoading?: boolean;
  userId?: string | null;
}

interface VerificationMetadata {
  deferred_verification?: boolean;
  eligibility_source?: string;
  npi?: string | null;
  verification_status?: string;
}

interface EnrollmentResponse {
  metadata?: VerificationMetadata;
}

interface Account {
  can_access_with_session?: boolean;
  email_domain_type?: string;
  id: string;
  is_deactivated?: boolean;
  name?: string | null;
  plan_type?: string;
  structure?: string;
}

interface AccountsResponse {
  accounts?: Account[];
  email?: string | null;
  name?: string | null;
}

interface AccountCheckResponse {
  accounts?: Record<string, { account?: { quorum_deferred_persona_verification?: boolean } }>;
}

interface QueryResult<Value> {
  data?: Value;
  isError?: boolean;
  isFetching?: boolean;
  isLoading?: boolean;
  refetch(): Promise<{ data?: Value }> | { data?: Value };
}

interface QueryOptions<Value> {
  enabled?: boolean;
  queryFn(context: { signal: AbortSignal }): Promise<Value>;
  queryKey: unknown[];
  refetchInterval?: (query: { state: { data?: Value; status?: string } }) => number | false;
  retry?: boolean;
}

interface ApiClient {
  safeGet<Value>(path: string, options: Record<string, unknown>): Promise<Value>;
  safePost<Value>(path: string, options: Record<string, unknown>): Promise<Value>;
}

interface ClientRuntime {
  query?: { fetch?<Value>(key: unknown, input: Record<string, unknown>): Promise<Value> };
}

interface ApiError extends Error {
  errorCode?: string;
  status?: number;
}

interface PersonaOptions {
  accountId?: string | null;
  onCancel(): void;
  onComplete(): void;
  onError(error: Error): void;
  onLoad?(): void;
}

type PrimaryState = "continue" | "existing" | "fresh" | "loading" | "npi-accepted" | "retry" | "start" | "verified";

const sharedRuntime = appSharedChunk as unknown as {
  $3?(): void;
  Ad?: (props: Record<string, unknown>) => unknown;
  FX?(): void;
  I3(): JsxRuntime;
  K2?(): void;
  LX?<Value>(scope: unknown): Value;
  QI?(): void;
  Y2?: (props: Record<string, unknown>) => unknown;
  Yh?: (props: Record<string, unknown>) => unknown;
  ZI?: unknown;
  Zh?(): void;
  _L?<Value>(options: QueryOptions<Value>): QueryResult<Value>;
  e6(): ReactRuntime;
  n4?(): IntlShape;
};

const initialRuntime = appInitialChunk as unknown as {
  JMt?(): void;
  Let?: (props: Record<string, unknown>) => unknown;
  M6t?(): void;
  N6t?(): AuthState;
  Nx?(
    accounts: AccountsResponse,
    accountId: string,
    client: ClientRuntime,
    destination: string,
  ): Promise<void>;
  Qgn?(): void;
  Sdn?: { new (...arguments_: unknown[]): ApiError };
  cJt?(): void;
  cfn?(): { client: ClientRuntime };
  fMt?(): void;
  gC?(): void;
  iht?(): QueryResult<AccountsResponse>;
  i_n?(): { search: string };
  jx?: unknown;
  o_n?(): (destination: string) => void;
  ofn?(gate: string): boolean;
  qgn?: (props: Record<string, unknown>) => unknown;
  rJt?: ApiClient;
  r_n?(path: string): string;
  rht?(): void;
  xpn?(
    client: ClientRuntime,
    event: Record<string, unknown>,
    payload: Record<string, unknown>,
  ): void;
};

const messageRuntime = messagesChunk as unknown as {
  n?(): void;
  t?: Record<string, { defaultMessage: string; id: string }>;
};
const personaRuntime = personaChunk as unknown as {
  n(options: PersonaOptions): () => void;
  t(): void;
};

const {
  $3: initializeSharedRuntime,
  Ad: Checkbox,
  FX: initializeAnalyticsRuntime,
  I3: getJsxRuntime,
  K2: initializeSharedUi,
  LX: useScope,
  QI: initializeScopeRuntime,
  Y2: Message,
  Yh: Button,
  ZI: globalScope,
  Zh: initializeSharedMessages,
  _L: useQuery,
  e6: getReactRuntime,
  n4: useIntl,
} = sharedRuntime;
const {
  JMt: initializeVerificationRuntime,
  Let: LoadingPage,
  M6t: initializeAccountState,
  N6t: useAccountState,
  Nx: switchAccount,
  Qgn: initializeQueries,
  Sdn: ApiErrorClass,
  cJt: initializeNavigation,
  cfn: useClient,
  fMt: initializeVerificationAnalytics,
  gC: initializeAccountQueries,
  iht: useAccountsQuery,
  i_n: useLocation,
  o_n: useNavigate,
  ofn: useGate,
  qgn: Link,
  rJt: api,
  r_n: resolvePath,
  rht: initializeAuthRuntime,
  xpn: trackAnalytics,
} = initialRuntime;
const { n: initializeMessages, t: messages = {} } = messageRuntime;
const { n: openPersonaVerification, t: initializePersonaVerification } = personaRuntime;

initializeSharedRuntime?.();
initializeAnalyticsRuntime?.();
initializeSharedUi?.();
initializeScopeRuntime?.();
initializeSharedMessages?.();
initializeVerificationRuntime?.();
initializeAccountState?.();
initializeQueries?.();
initializeNavigation?.();
initializeVerificationAnalytics?.();
initializeAccountQueries?.();
initializeAuthRuntime?.();
initializeMessages?.();
initializePersonaVerification();

const React = getReactRuntime();
const jsx = getJsxRuntime();
const EMAIL_PATTERN = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

function formatMessage(key: string, fallback: string): unknown {
  const descriptor = messages[key] ?? { id: "cfc." + key, defaultMessage: fallback };
  return Message == null ? descriptor.defaultMessage : jsx.jsx(Message, descriptor);
}

function renderButton(props: Record<string, unknown>): unknown {
  return Button == null ? jsx.jsx("button", props) : jsx.jsx(Button, props);
}

function isApiError(error: unknown, status?: number, code?: string): boolean {
  if (error == null || typeof error !== "object") return false;
  const candidate = error as { errorCode?: string; status?: number };
  const matchesClass = ApiErrorClass == null || error instanceof ApiErrorClass;
  return matchesClass && (status == null || candidate.status === status) && (code == null || candidate.errorCode === code);
}

function isQuorumAccount(account: Account): boolean {
  return account.plan_type === "quorum";
}

function isAccessibleQuorumAccount(account: Account): boolean {
  return isQuorumAccount(account) && account.can_access_with_session !== false && account.is_deactivated !== true;
}

function titleCase(value: string): string | null {
  const normalized = value.replace(/[^a-zA-Z0-9]+/g, " ").trim();
  if (!normalized) return null;
  return normalized
    .split(/\s+/)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");
}

function workspaceName(
  intl: IntlShape,
  account: Account | undefined,
  user: { email?: string | null; email_domain_type?: string; name?: string | null },
): string {
  const explicitName = account?.name?.trim();
  if (explicitName) return explicitName;
  const userName = user.name?.trim();
  const email = user.email?.trim();
  if (email != null && EMAIL_PATTERN.test(email) && user.email_domain_type !== "social") {
    const domain = email.split("@")[1]?.split(".").filter(Boolean);
    const label = domain?.at(domain.length === 1 ? 0 : -2);
    const domainName = label == null ? null : titleCase(label);
    if (domainName) return domainName;
  }
  if (userName) return userName + "'s Workspace";
  return intl.formatMessage({ id: "cfc.workspace.default", defaultMessage: "Personal account" });
}

function CfcVerificationPage(): unknown {
  const auth = useAccountState?.() ?? {};
  if (auth.isLoading || auth.authMethod !== "chatgpt") {
    return LoadingPage == null
      ? jsx.jsx("main", { role: "status", children: "Loading verification…" })
      : jsx.jsx(LoadingPage, {});
  }
  return jsx.jsx(CfcVerificationController, {}, String(auth.userId) + ":" + String(auth.accountId));
}

function CfcVerificationController(): unknown {
  const auth = useAccountState?.() ?? {};
  const intl = useIntl?.() ?? { formatMessage: (descriptor: { defaultMessage: string }) => descriptor.defaultMessage };
  const location = useLocation?.() ?? { search: "" };
  const navigate = useNavigate?.() ?? (() => undefined);
  const client = useClient?.().client ?? {};
  const scope = useScope?.(globalScope) ?? null;
  const accountsQuery: QueryResult<AccountsResponse> = useAccountsQuery?.() ?? {
    refetch: () => ({}),
  };
  const deferredEnabled = useGate?.("1588629910") ?? false;
  const bypassAccountBlock = useGate?.("2369709783") ?? false;
  const [personaRequest, setPersonaRequest] = React.useState<{ isRetry: boolean } | null>(null);
  const [personaLoaded, setPersonaLoaded] = React.useState(false);
  const [verificationError, setVerificationError] = React.useState<string | null>(null);
  const [npi, setNpi] = React.useState("");
  const [acceptedNpi, setAcceptedNpi] = React.useState<string | null>(null);
  const [npiError, setNpiError] = React.useState<string | null>(null);
  const [isPreverifying, setPreverifying] = React.useState(false);
  const [licensed, setLicensed] = React.useState(false);
  const [agreedToTerms, setAgreedToTerms] = React.useState(false);
  const [isCreatingWorkspace, setCreatingWorkspace] = React.useState(false);
  const [createWorkspaceError, setCreateWorkspaceError] = React.useState<string | null>(null);
  const [createdWorkspaceId, setCreatedWorkspaceId] = React.useState<string | null>(null);
  const [existingWorkspaceBlocked, setExistingWorkspaceBlocked] = React.useState(false);
  const analyticsSeen = React.useRef(new Set<string>());
  const abortControllers = React.useRef(new Set<AbortController>());

  const accountId = auth.accountId ?? null;
  const userId = auth.userId ?? null;
  const queryKey = ["cfc-verification-enrollment", accountId, userId];
  const enrollmentQuery: QueryResult<EnrollmentResponse> = useQuery?.<EnrollmentResponse>({
    queryKey,
    queryFn: ({ signal }) => {
      if (api == null) return Promise.reject(new Error("Verification API is unavailable"));
      return api.safePost<EnrollmentResponse>("/quorum/refresh_enrollment_status", { signal });
    },
    retry: false,
    refetchInterval: (query) => {
      const metadata = query.state.data?.metadata;
      const terminal =
        query.state.status === "error" ||
        metadata?.eligibility_source === "allowlist" ||
        metadata?.verification_status === "verified" ||
        metadata?.verification_status === "failed";
      return terminal ? false : 2_000;
    },
  }) ?? { refetch: () => ({}) };
  const accountCheckQuery: QueryResult<AccountCheckResponse> = useQuery?.<AccountCheckResponse>({
    queryKey: ["cfc-verification-accounts", accountId, userId],
    enabled: !bypassAccountBlock,
    queryFn: ({ signal }) => {
      if (api == null) return Promise.reject(new Error("Account API is unavailable"));
      return api.safeGet<AccountCheckResponse>("/accounts/check/{version}", {
        parameters: { path: { version: "v4-2023-04-27" } },
        signal,
      });
    },
    retry: false,
  }) ?? { refetch: () => ({}) };

  const metadata = enrollmentQuery.isError ? undefined : enrollmentQuery.data?.metadata;
  const isVerified = metadata?.eligibility_source === "allowlist" || metadata?.verification_status === "verified";
  const isPending = metadata?.verification_status === "pending";
  const isFailed = metadata?.verification_status === "failed";
  const isUnverified = enrollmentQuery.data !== undefined && !isVerified && !isPending && !isFailed;
  const currentQuorumAccount = accountsQuery.data?.accounts?.find(isQuorumAccount);
  const accessibleQuorumAccounts = accountsQuery.data?.accounts?.filter(isAccessibleQuorumAccount) ?? [];
  const deferredAccount = accessibleQuorumAccounts.find(
    (account) => accountCheckQuery.data?.accounts?.[account.id]?.account?.quorum_deferred_persona_verification,
  );
  const deferredAccountId = deferredAccount?.id !== accountId ? deferredAccount?.id : undefined;
  const showTerms =
    !existingWorkspaceBlocked &&
    (isVerified ||
      acceptedNpi != null ||
      (deferredEnabled && isPending && metadata?.deferred_verification === true && metadata.npi != null));
  const showNpi = deferredEnabled && isUnverified && acceptedNpi == null;
  const isLoading =
    accountsQuery.isLoading ||
    enrollmentQuery.isFetching ||
    accountCheckQuery.isLoading ||
    (personaRequest != null && !personaLoaded);

  const track = (action: string, payload: Record<string, unknown> = {}) => {
    trackAnalytics?.(client, { type: "cfc." + action }, {
      source: new URLSearchParams(location.search).get("source") ?? undefined,
      beaconId: new URLSearchParams(location.search).get("beacon_id") ?? undefined,
      ...payload,
    });
  };

  React.useEffect(() => {
    if (analyticsSeen.current.has("page")) return;
    analyticsSeen.current.add("page");
    track("pageViewed");
  }, []);

  React.useEffect(() => {
    if (personaRequest == null) return;
    return openPersonaVerification({
      accountId,
      onLoad: () => {
        setPersonaLoaded(true);
        track("personaOpened", { isRetry: personaRequest.isRetry });
      },
      onComplete: () => {
        setPersonaRequest(null);
        setPersonaLoaded(false);
        track("personaCompleted", { isRetry: personaRequest.isRetry });
        void enrollmentQuery.refetch();
      },
      onCancel: () => {
        setPersonaRequest(null);
        setPersonaLoaded(false);
        track("personaCanceled", { isRetry: personaRequest.isRetry });
      },
      onError: (error) => {
        setPersonaRequest(null);
        setPersonaLoaded(false);
        track("personaStartFailed", { isRetry: personaRequest.isRetry });
        setVerificationError(
          isApiError(error, 400, "npi_verification_max_attempts_reached")
            ? "You have reached the maximum number of verification attempts."
            : "We could not start identity verification. Please try again.",
        );
      },
    });
  }, [personaRequest, accountId]);

  React.useEffect(() => {
    if (deferredAccountId == null || accountsQuery.data == null || switchAccount == null) return;
    const controller = new AbortController();
    abortControllers.current.add(controller);
    void switchAccount(accountsQuery.data, deferredAccountId, client, resolvePath?.("/onboarding") ?? "/onboarding")
      .catch(() => {
        if (!controller.signal.aborted) setCreateWorkspaceError("We could not switch to the eligible workspace.");
      })
      .finally(() => abortControllers.current.delete(controller));
    return () => controller.abort();
  }, [deferredAccountId, accountsQuery.data]);

  React.useEffect(
    () => () => {
      for (const controller of abortControllers.current) controller.abort();
      abortControllers.current.clear();
    },
    [],
  );

  const startVerification = () => {
    setVerificationError(null);
    setPersonaLoaded(false);
    const isRetry = isFailed || currentQuorumAccount != null;
    track("startVerificationClicked", { isRetry });
    setPersonaRequest({ isRetry });
  };

  const preverifyNpi = async () => {
    if (isPreverifying) return;
    const normalizedNpi = npi.trim();
    setNpiError(null);
    if (!/^[0-9]{10}$/.test(normalizedNpi)) {
      setNpiError("Enter a valid 10-digit NPI number.");
      return;
    }
    if (api == null) {
      setNpiError("NPI verification is unavailable.");
      return;
    }
    const controller = new AbortController();
    abortControllers.current.add(controller);
    setPreverifying(true);
    try {
      const response = await api.safePost<EnrollmentResponse>("/quorum/preverify_npi", {
        requestBody: { npi: normalizedNpi },
        signal: controller.signal,
      });
      const nextMetadata = response.metadata;
      if (
        nextMetadata?.verification_status === "pending" &&
        nextMetadata.deferred_verification === true &&
        nextMetadata.npi === normalizedNpi
      ) {
        setAcceptedNpi(normalizedNpi);
      } else {
        setNpiError("We could not confirm this NPI number.");
      }
    } catch (error) {
      if (!controller.signal.aborted) {
        if (isApiError(error, 409)) void enrollmentQuery.refetch();
        else setNpiError(isApiError(error, 400) ? "Enter a valid 10-digit NPI number." : "We could not confirm this NPI number.");
      }
    } finally {
      abortControllers.current.delete(controller);
      if (!controller.signal.aborted) setPreverifying(false);
    }
  };

  const createWorkspace = async () => {
    if (!licensed || !agreedToTerms || isCreatingWorkspace || api == null) return;
    const controller = new AbortController();
    abortControllers.current.add(controller);
    setCreatingWorkspace(true);
    setCreateWorkspaceError(null);
    track("postVerificationGetStartedClicked");
    try {
      let workspaceId = createdWorkspaceId;
      if (workspaceId == null) {
        track("postVerificationWorkspaceCreateStarted", {
          hasCurrentAccount: accountsQuery.data?.accounts?.some((account) => account.id === accountId) ?? false,
        });
        const name = workspaceName(intl, accountsQuery.data?.accounts?.find((account) => account.id === accountId), {
          email: accountsQuery.data?.email,
          name: accountsQuery.data?.name,
        });
        const created = await api.safePost<{ workspace_id: string }>("/accounts/create_quorum_workspace", {
          requestBody: { workspace_name: name },
          signal: controller.signal,
        });
        workspaceId = created.workspace_id;
        setCreatedWorkspaceId(workspaceId);
        track("postVerificationWorkspaceCreateSucceeded");
      }
      const refreshed = await accountsQuery.refetch();
      if (controller.signal.aborted) return;
      if (refreshed.data == null || workspaceId == null || switchAccount == null) {
        throw new Error("Workspace list unavailable");
      }
      await switchAccount(refreshed.data, workspaceId, client, resolvePath?.("/") ?? "/");
    } catch (error) {
      if (!controller.signal.aborted) {
        track("postVerificationWorkspaceCreateFailed", {
          reason: isApiError(error) ? "request_" + String((error as ApiError).status) : "unknown",
        });
        if (isApiError(error, 403) && error instanceof Error && error.message.toLowerCase().includes("already has a quorum workspace")) {
          setExistingWorkspaceBlocked(true);
        } else if (isApiError(error, 403) && !showTerms) {
          setPersonaRequest({ isRetry: true });
        } else {
          setCreateWorkspaceError("We could not create your clinical workspace. Please try again.");
        }
      }
    } finally {
      abortControllers.current.delete(controller);
      if (!controller.signal.aborted) setCreatingWorkspace(false);
    }
  };

  let primary: PrimaryState = "start";
  if (existingWorkspaceBlocked || (currentQuorumAccount != null && !bypassAccountBlock && !showTerms)) primary = "existing";
  else if (isLoading) primary = "loading";
  else if (deferredAccountId != null) primary = "continue";
  else if (showTerms && isVerified) primary = "verified";
  else if (showTerms) primary = "npi-accepted";
  else if (isFailed) primary = "retry";
  else if (currentQuorumAccount != null) primary = "fresh";

  const primaryLabel: Record<PrimaryState, string> = {
    continue: "Continue to workspace",
    existing: "Continue to ChatGPT",
    fresh: "Verify your identity",
    loading: "Loading…",
    "npi-accepted": "NPI confirmed",
    retry: "Try verification again",
    start: "Verify your identity",
    verified: "Verified",
  };
  const primaryAction = primary === "existing" ? () => navigate(resolvePath?.("/") ?? "/") : startVerification;
  const title = deferredEnabled ? "Verify your clinical credentials" : "Verify your clinician status";
  const error = createWorkspaceError ?? verificationError;

  return jsx.jsxs("main", {
    className: "cfc-verification-page",
    "data-primary-state": primary,
    "data-scope": scope == null ? "global" : "scoped",
    children: [
      jsx.jsx("nav", {
        children: Link == null
          ? jsx.jsx("a", { href: "/", children: "OpenAI" })
          : jsx.jsx(Link, { to: "/", children: "OpenAI" }),
      }),
      jsx.jsxs("section", {
        children: [
          jsx.jsx("h1", { children: title }),
          jsx.jsx("p", {
            children: deferredEnabled
              ? "Confirm your credentials to create a clinical workspace."
              : "Complete a secure identity check to continue.",
          }),
          showNpi
            ? jsx.jsxs("form", {
                "data-view": "npi",
                onSubmit: (event: { preventDefault(): void }) => {
                  event.preventDefault();
                  void preverifyNpi();
                },
                children: [
                  jsx.jsx("label", { htmlFor: "cfc-npi", children: "National Provider Identifier" }),
                  jsx.jsx("input", {
                    id: "cfc-npi",
                    inputMode: "numeric",
                    value: npi,
                    onChange: (event: { target: { value: string } }) => setNpi(event.target.value),
                  }),
                  npiError == null ? null : jsx.jsx("p", { role: "alert", children: npiError }),
                  renderButton({ type: "submit", disabled: isPreverifying, children: isPreverifying ? "Checking…" : "Continue" }),
                ],
              })
            : null,
          !showNpi && !showTerms
            ? renderButton({
                "data-action": "primary",
                disabled: isLoading,
                onClick: primaryAction,
                children: primaryLabel[primary],
              })
            : null,
          showTerms
            ? jsx.jsxs("form", {
                "data-view": "terms",
                onSubmit: (event: { preventDefault(): void }) => {
                  event.preventDefault();
                  void createWorkspace();
                },
                children: [
                  jsx.jsx("h2", { children: "Clinical workspace terms" }),
                  jsx.jsx("label", {
                    children: jsx.jsxs(jsx.Fragment, {
                      children: [
                        Checkbox == null
                          ? jsx.jsx("input", { type: "checkbox", checked: licensed, onChange: () => setLicensed(!licensed) })
                          : jsx.jsx(Checkbox, { checked: licensed, onCheckedChange: (checked: boolean) => {
                              if (checked) track("postVerificationAttest");
                              setLicensed(checked);
                            } }),
                        "I confirm that I am a licensed healthcare professional.",
                      ],
                    }),
                  }),
                  jsx.jsx("label", {
                    children: jsx.jsxs(jsx.Fragment, {
                      children: [
                        Checkbox == null
                          ? jsx.jsx("input", { type: "checkbox", checked: agreedToTerms, onChange: () => setAgreedToTerms(!agreedToTerms) })
                          : jsx.jsx(Checkbox, { checked: agreedToTerms, onCheckedChange: (checked: boolean) => {
                              if (checked) track("postVerificationAgreeTos");
                              setAgreedToTerms(checked);
                            } }),
                        "I agree to the services agreement.",
                      ],
                    }),
                  }),
                  renderButton({
                    type: "submit",
                    disabled: !licensed || !agreedToTerms || isCreatingWorkspace,
                    children: isCreatingWorkspace ? "Creating workspace…" : "Create clinical workspace",
                  }),
                ],
              })
            : null,
          error == null ? null : jsx.jsx("p", { role: "alert", children: error }),
          jsx.jsx("button", { type: "button", onClick: () => navigate(resolvePath?.("/") ?? "/"), children: "Learn more" }),
        ],
      }),
      jsx.jsx("section", {
        id: "faq",
        children: jsx.jsxs("div", {
          children: [
            jsx.jsx("h2", { children: formatMessage("verificationFaqSectionTitle", "Frequently asked questions") }),
            jsx.jsx("p", { children: formatMessage("faq1Answer", "Verification is provided through Persona.") }),
            jsx.jsx("p", { children: formatMessage("faq7Answer", "Your verification information is handled securely.") }),
          ],
        }),
      }),
    ],
  });
}

export { CfcVerificationPage };
