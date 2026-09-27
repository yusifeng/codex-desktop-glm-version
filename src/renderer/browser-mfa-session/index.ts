import "@rchunk/rolldown-runtime";
import {
  H4 as objectSchema,
  V4 as numberSchema,
  g4 as initializeValidationRuntime,
  q4 as stringSchema,
} from "@rchunk/app-shared";
import {
  Ix as initializeReauthentication,
  Run as initializeAuthUrl,
  Rx as createReauthenticationUrl,
  Sdn as ApiError,
  Vun as getAccessToken,
  bfn as initializeAuthenticationState,
  pdn as initializeApiHeaders,
  udn as apiClient,
  wdn as initializeApiClient,
  yfn as getAuthenticationState,
} from "@rchunk/app-initial";
import {
  n as decodeJwt,
  t as initializeJwtDecoder,
} from "@rchunk/browser-mfa-jwt";

interface AccessTokenClaims extends Record<string, unknown> {
  pwd_auth_time?: number;
  "https://api.openai.com/mfa"?: { required?: string };
}

let accessTokenSchema: ReturnType<typeof objectSchema>;
let initialized = false;
function initializeBrowserMfaSession(): void {
  if (initialized) return;
  initialized = true;
  initializeJwtDecoder();
  initializeValidationRuntime();
  initializeAuthUrl();
  initializeAuthenticationState();
  initializeApiHeaders();
  initializeApiClient();
  initializeReauthentication();
  accessTokenSchema = objectSchema({
    pwd_auth_time: numberSchema().optional(),
    "https://api.openai.com/mfa": objectSchema({
      required: stringSchema(),
    }).optional(),
  });
}

async function needsRecentAuthentication(ignoreMfaRequirement?: boolean): Promise<boolean> {
  const accessToken = await getAccessToken();
  if (!accessToken) return true;
  try {
    const claims = accessTokenSchema.parse(
      decodeJwt(accessToken.accessToken),
    ) as AccessTokenClaims;
    return !claims.pwd_auth_time ||
      Date.now() - claims.pwd_auth_time > 240_000 ||
      (ignoreMfaRequirement === true && claims["https://api.openai.com/mfa"]?.required !== "yes");
  } catch {
    return true;
  }
}

async function startReauthentication(
  url: string,
  signal?: AbortSignal,
): Promise<boolean> {
  const result = await createReauthenticationUrl(
    url,
    getAuthenticationState().auth.reauthenticationParams,
    signal,
  );
  if (!result.ok || signal?.aborted) return false;
  window.location.assign(result.url);
  return true;
}

function isReauthenticationError(error: unknown): boolean {
  return error instanceof ApiError && (
    error.status === 401 ||
    error.errorCode === "recent_auth_required" ||
    error.errorCode === "reauth_required"
  );
}

function getMfaInfoQueryOptions(accountId: string): {
  gcTime: 0;
  queryFn(context: { signal: AbortSignal }): Promise<unknown>;
  queryKey: [string, string];
  refetchOnWindowFocus: false;
  retry: false;
  staleTime: 0;
} {
  return {
    queryKey: ["browser-mfa-info", accountId],
    queryFn: ({ signal }) => apiClient.safeGet("/accounts/mfa_info", { signal }),
    staleTime: 0,
    gcTime: 0,
    retry: false,
    refetchOnWindowFocus: false,
  };
}

export {
  startReauthentication as a,
  needsRecentAuthentication as i,
  initializeBrowserMfaSession as n,
  isReauthenticationError as r,
  getMfaInfoQueryOptions as t,
};
