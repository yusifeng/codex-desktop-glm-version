// onboarding-mail-provider —— onboarding 邮箱供应商识别与插件映射。

import * as appInitialChunk from "@rchunk/app-initial";
import * as appSharedChunk from "@rchunk/app-shared";
import * as runtimeChunk from "@rchunk/rolldown-runtime";

void runtimeChunk;

const {
  Rln: initializeAccountPlanHelpers,
  Wln: isMicrosoftMailPlan,
  eun: createMailProviderQueryFamily,
  nun: initializeMailProviderQuery,
} = appInitialChunk;
const {
  $O: queryStaleTimes,
  QI: initializeQueryRuntime,
  ZI: applicationScope,
  ek: initializeQueryOptions,
} = appSharedChunk;

export type MailProvider = "google" | "microsoft" | "other";

let pluginIdMap: Record<string, string> = {};
let mailProviderQueryFamily: unknown = Symbol("email-domain-mail-provider");
let initialized = false;

function emailDomain(email: string | null | undefined): string | null {
  if (email == null) return null;
  const separator = email.lastIndexOf("@");
  if (separator <= 0) return null;
  const domain = email
    .slice(separator + 1)
    .trim()
    .toLowerCase();
  return domain.length === 0 ? null : domain;
}

function resolveDetectedProvider({
  debugOverride,
  detectedProvider,
  emailDomain: domain,
  isError,
}: {
  debugOverride?: MailProvider | null;
  detectedProvider?: MailProvider | null;
  emailDomain?: string | null;
  isError?: boolean;
}): MailProvider | null {
  return (
    debugOverride ??
    detectedProvider ??
    (domain == null || isError ? "other" : null)
  );
}

function providerForPlan(provider: MailProvider, plan: unknown): MailProvider {
  if (provider !== "other") return provider;
  return isMicrosoftMailPlan?.(plan) ? "microsoft" : "google";
}

function pluginIdForProvider(pluginId: string, provider: MailProvider): string {
  return provider === "microsoft"
    ? (pluginIdMap[pluginId] ?? pluginId)
    : pluginId;
}

function initializeOnboardingMailProvider(): void {
  if (initialized) return;
  initialized = true;
  initializeQueryRuntime?.();
  initializeQueryOptions?.();
  initializeAccountPlanHelpers?.();
  initializeMailProviderQuery?.();
  pluginIdMap = {
    gmail: "outlook-email",
    "google-calendar": "outlook-calendar",
    "google-drive": "sharepoint",
    slack: "teams",
  };
  if (typeof createMailProviderQueryFamily === "function") {
    mailProviderQueryFamily = createMailProviderQueryFamily(
      applicationScope,
      "email-domain-mail-provider",
      (domain: string | null) => ({
        enabled: domain != null,
        params: domain == null ? undefined : { domain },
        retry: 2,
        staleTime: queryStaleTimes.FIVE_MINUTES,
      }),
    );
  }
}

export {
  providerForPlan as a,
  pluginIdForProvider as i,
  emailDomain as n,
  initializeOnboardingMailProvider as o,
  resolveDetectedProvider as r,
  mailProviderQueryFamily as t,
};
