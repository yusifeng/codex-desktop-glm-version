import "@rchunk/rolldown-runtime";
import { $O as timeConstants, ek as initializeHttpRuntime } from "@rchunk/app-shared";
import {
  cJt as initializeApiClient,
  ddn as ApiClient,
  oJt as getAdditionalHeaders,
  pdn as initializeApiRoutes,
} from "@rchunk/app-initial";

interface QueryContext {
  signal?: AbortSignal;
}

interface SecurityQuery {
  queryFn(context: QueryContext): Promise<unknown>;
  queryKey: string[];
  refetchOnWindowFocus?: "always";
  retry: false;
  staleTime: number;
}

export interface SecurityQueries {
  addPassword: SecurityQuery;
  changePassword: SecurityQuery;
  cyber: SecurityQuery;
  linkedApps: SecurityQuery;
  mfa: SecurityQuery;
  protection: SecurityQuery;
  sessions: SecurityQuery;
}

interface SecurityApiClient {
  safeGet(path: string, options: Record<string, unknown>): Promise<unknown>;
}

let securityApiClient: SecurityApiClient;

function createSecurityQueries(accountId: string): SecurityQueries {
  const additionalHeaders = { "ChatGPT-Account-ID": accountId };
  const createQuery = (name: string, path: string): SecurityQuery => ({
    queryKey: ["chatgpt-security", accountId, name],
    queryFn: ({ signal }) => securityApiClient.safeGet(path, { additionalHeaders, signal }),
    staleTime: timeConstants.ONE_MINUTE,
    retry: false,
  });
  return {
    addPassword: createQuery("add-password-eligibility", "/accounts/add_password/eligibility"),
    changePassword: createQuery("change-password-eligibility", "/accounts/change_password/eligibility"),
    mfa: createQuery("mfa", "/accounts/mfa_info"),
    sessions: createQuery("sessions", "/accounts/sessions"),
    linkedApps: createQuery("linked-apps", "/client_applications"),
    cyber: createQuery("cyber", "/cyber_verification/status"),
    protection: {
      ...createQuery("protection", "/accounts/security_settings/info"),
      refetchOnWindowFocus: "always",
    },
  };
}

function initializeSecurityClient(): void {
  initializeApiClient();
  initializeHttpRuntime();
  initializeApiRoutes();
  securityApiClient = new ApiClient({ getAdditionalHeaders }) as SecurityApiClient;
}

export {
  createSecurityQueries as n,
  securityApiClient as r,
  initializeSecurityClient as t,
};
