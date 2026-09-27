import "@rchunk/rolldown-runtime";
import {
  $3 as initializeCompilerRuntime,
  _L as useQuery,
  gL as initializeUseQuery,
} from "@rchunk/app-shared";
import {
  Dft as initializeGiftCreditAnalytics,
  M6t as initializeAuthentication,
  N6t as useAuthentication,
  Oft as openTrackedExternalUrl,
  ifn as initializeAccountQueries,
  kft as openExternalUrl,
  pdn as initializeAccountApi,
  rht as initializeFeatureConfig,
  udn as accountApiClient,
  ufn as useFeatureConfig,
  uht as useAccount,
} from "@rchunk/app-initial";

const featureConfigId = "3116837080";
const purchaseFlowFlag = "purchase_flow_enabled";
const desktopBeaconFlag = "desktop_beacon_enabled";
let giftCreditsUrl: string;

function initializeGiftCreditsUrl(): void {
  initializeGiftCreditAnalytics();
  giftCreditsUrl = "https://chatgpt.com/gifts/credits";
}

function openGiftCredits(event?: string, entryPoint?: string): void {
  const href = entryPoint === undefined
    ? giftCreditsUrl
    : `${giftCreditsUrl}?entry_point=${entryPoint}`;
  if (event === undefined) {
    openExternalUrl({ href, initiator: "open_in_browser_bridge" });
    return;
  }
  openTrackedExternalUrl({ event, href, initiator: "open_in_browser_bridge" });
}

function useGiftCreditsQueryEnabled(enabled = true): boolean | undefined {
  const { authMethod, hasChatGptToken, isLoading: authLoading } = useAuthentication();
  const { data: account, isLoading: accountLoading } = useAccount();
  const authenticated = authMethod === "chatgpt" && hasChatGptToken === true && account != null;
  const queryEnabled = enabled && authenticated;
  const queryKey = ["gift-credits", "sender-eligibility", account?.id, account?.plan_type];
  const { data, isLoading } = useQuery({
    enabled: queryEnabled,
    queryFn: fetchGiftCreditEligibility,
    queryKey,
    retry: false,
    staleTime: 60_000,
  });
  if (!enabled) return false;
  if (!(authLoading || accountLoading || isLoading)) {
    return authenticated && (data as { eligible?: boolean } | undefined)?.eligible === true;
  }
}

function useGiftCreditPurchaseAvailable(): boolean {
  const eligible = useGiftCreditsQueryEnabled();
  const config = useFeatureConfig(featureConfigId);
  return eligible ? config.get(purchaseFlowFlag, false) : false;
}

function useGiftCreditBeaconAvailable(options?: { enabled?: boolean }): boolean | undefined {
  const enabled = options?.enabled ?? true;
  const eligible = useGiftCreditsQueryEnabled(enabled);
  const config = useFeatureConfig(featureConfigId);
  return eligible === true
    ? config.get(purchaseFlowFlag, false) && config.get(desktopBeaconFlag, false)
    : eligible;
}

function fetchGiftCreditEligibility(): Promise<unknown> {
  return accountApiClient.safeGet("/gift-credits/senders/eligibility");
}

function initializeEntryPointAvailability(): void {
  initializeCompilerRuntime();
  initializeUseQuery();
  initializeAuthentication();
  initializeFeatureConfig();
  initializeAccountQueries();
  initializeAccountApi();
}

export {
  openGiftCredits as a,
  initializeGiftCreditsUrl as i,
  useGiftCreditBeaconAvailable as n,
  useGiftCreditPurchaseAvailable as r,
  initializeEntryPointAvailability as t,
};
