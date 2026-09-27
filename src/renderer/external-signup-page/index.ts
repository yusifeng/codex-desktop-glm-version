// external-signup-page —— 外部注册完成后的认证刷新与目标页回跳。
import * as runtimeChunk from "@rchunk/rolldown-runtime";
import * as appSharedChunk from "@rchunk/app-shared";
import * as appInitialChunk from "@rchunk/app-initial";
import * as authHandoffChunk from "@rchunk/auth-handoff-page";
void runtimeChunk;

const {
  $3: initializeRuntimeLazy,
  H4: objectSchema,
  I3: getJsxRuntime,
  _L: useQuery,
  g4: initializeSchemaRuntime,
  gL: initializeUseQuery,
  q4: stringSchema,
} = appSharedChunk;
const {
  Fx: sanitizeAuthTarget,
  Ix: initializeAuthTarget,
  Pun: createAuthUrl,
  Qgn: initializeAccountContext,
  Run: initializeAuthUrl,
  Rx: performAuthHandoff,
  dJt: initializeAuthHandoff,
  i_n: useLocation,
  uJt: getDeviceId,
} = appInitialChunk;
const { n: initializeAuthHandoffPage, t: AuthHandoffPage } = authHandoffChunk;

interface ExternalSignupPageProps {
  refresh: boolean;
}

interface SessionResponse extends Record<string, unknown> {
  error?: string;
  user?: { id: string } | null;
}

type AuthHandoffResult = import("@rchunk/auth-handoff-page").AuthHandoffResult;
let sessionSchema: import("@rchunk/app-shared").SafeParseSchema<SessionResponse>;
let jsx: import("@rchunk/app-shared").JsxRuntime;

function BrowserExternalSignupPage({
  refresh,
}: ExternalSignupPageProps): unknown {
  const location = useLocation();
  const query = useQuery<AuthHandoffResult>({
    queryKey: ["browser-external-signup", refresh, location.search],
    queryFn: async ({ signal }) => {
      const searchParams = new URLSearchParams(location.search);
      const target = new URL(sanitizeAuthTarget(searchParams.get("next")));
      const relativeTarget = target.pathname + target.search + target.hash;
      if (!refresh) {
        const refreshUrl = new URL(
          "/auth/ext_callback_refresh",
          window.location.origin,
        );
        refreshUrl.searchParams.set("next", relativeTarget);
        return performAuthHandoff(
          refreshUrl.toString(),
          { "ext-oai-did": getDeviceId() },
          signal,
          "external-signup",
        );
      }
      try {
        const response = await fetch("/api/auth/session", {
          credentials: "same-origin",
          cache: "no-store",
          signal: AbortSignal.any([signal, AbortSignal.timeout(15_000)]),
        });
        if (!response.ok) return { ok: false };
        const session = sessionSchema.safeParse(await response.json());
        if (!session.success) return { ok: false };
        if (session.data.user && session.data.error == null)
          return { ok: true, url: target.toString() };
        const loginUrl = createAuthUrl("login");
        loginUrl.searchParams.set("next", relativeTarget);
        return { ok: true, url: loginUrl.toString() };
      } catch {
        return { ok: false };
      }
    },
    staleTime: Infinity,
    gcTime: 0,
    retry: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });
  const pending = query.isFetching || (query.data == null && !query.isError);
  return jsx.jsx(AuthHandoffPage, {
    result: query.data,
    pending,
    onRetry: () => void query.refetch({ cancelRefetch: false }),
  });
}

function initializeExternalSignupPage(): void {
  initializeRuntimeLazy();
  initializeUseQuery();
  initializeAccountContext();
  initializeSchemaRuntime();
  initializeAuthUrl();
  initializeAuthHandoff();
  initializeAuthHandoffPage();
  initializeAuthTarget();
  jsx = getJsxRuntime();
  sessionSchema = objectSchema<SessionResponse>({
    user: objectSchema<{ id: string }>({ id: stringSchema().min(1) }).nullish(),
    error: stringSchema().optional(),
  });
}

initializeExternalSignupPage();
export { BrowserExternalSignupPage };
