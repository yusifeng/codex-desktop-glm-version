import "@rchunk/rolldown-runtime";
import {
  $3 as initializeCompilerRuntime,
  I3 as getJsxRuntime,
  _L as useQuery,
  dg as initializeThemeSubscription,
  e6 as getReactRuntime,
  fg as useIsDarkTheme,
  gL as initializeQueryRuntime,
  vW as expectedAccountIdHeader,
  wL as initializeSharedRuntime,
  type JsxRuntime,
  type ReactRuntime,
} from "@rchunk/app-shared";
import {
  M6t as initializeAuthentication,
  N6t as useAuthentication,
  Qgn as initializeRouter,
  Ygn as Navigate,
  cJt as initializeApiClient,
  i_n as useLocation,
  ifn as initializeAccountQueries,
  lfn as useStatsig,
  rJt as apiClient,
  rfn as getExperiment,
} from "@rchunk/app-initial";
// @ts-expect-error The release route helper is not declared semantically yet.
import { _0 as buildPricingLocation } from "@rchunk/app-initial";
// @ts-expect-error The release absolute-route helper is not declared semantically yet.
import { r_n as toAbsoluteRoute } from "@rchunk/app-initial";
// @ts-expect-error The release experiment initializer is not declared semantically yet.
import { v0 as initializeExperiments } from "@rchunk/app-initial";
import {
  a as selectEligiblePromotion,
  f as initializePricingPromotions,
  type PromotionMetadata,
} from "@rchunk/pricing-promotions";
import {
  S as initializeCheckoutPolicy,
  _ as buildPayPalCheckoutRequest,
} from "@rchunk/checkout-policy";
import {
  m as initializeCheckoutPreparation,
  p as CheckoutPreparation,
} from "@rchunk/checkout-confirm-latency";
import {
  n as HostedCheckoutPage,
  r as initializeCheckoutPage,
} from "@rchunk/checkout-page-core";
// @ts-expect-error The release create-session chunk has not received a declaration yet.
import { n as initSession, t as createSession } from "@rchunk/create-session";

interface CheckoutAccount {
  account: { plan_type: string };
  eligible_promo_campaigns?: { plus?: PromotionMetadata | null };
  entitlement: { has_active_subscription: boolean };
}

interface AccountsCheckResponse {
  accounts: Record<string, CheckoutAccount | undefined>;
}

interface CouponCheckResponse {
  coupon?: string;
  state?: string;
}

interface CustomCheckoutSession {
  checkout_session_id: string;
  processor_entity: string;
  tag: "custom_checkout_session";
}

interface HostedCheckoutSession {
  url?: string | null;
}

type CheckoutSession = CustomCheckoutSession | HostedCheckoutSession;
type CheckoutRequest = Record<string, unknown>;
type PayPalCheckoutResult =
  | { search: string; type: "pricing" }
  | { inferredCampaign?: string; type: "purchase" }
  | {
      request: CheckoutRequest;
      session: CheckoutSession;
      type: "checkout";
    };

let React: ReactRuntime;
let jsx: JsxRuntime;

function PayPalCheckoutPage(): unknown {
  const { accountId, userId } = useAuthentication();
  const location = useLocation();
  if (accountId == null || userId == null)
    return jsx.jsx(CheckoutPreparation, { loading: true, onRetry: noop });

  return jsx.jsx(
    AuthenticatedPayPalCheckoutPage,
    { accountId, userId },
    `${accountId}:${userId}:${location.key}`,
  );
}

function noop(): void {}

function AuthenticatedPayPalCheckoutPage({
  accountId,
  userId,
}: {
  accountId: string;
  userId: string;
}): unknown {
  const location = useLocation();
  const statsig = useStatsig();
  const isDark = useIsDarkTheme();
  const [attemptId] = React.useState(createAttemptId);
  const parameters = new URLSearchParams(location.search);
  parameters.delete("login_hint");
  const cleanSearch = parameters.size === 0 ? "" : `?${parameters}`;
  const pricingLocation = buildPricingLocation({ search: cleanSearch });
  const cancelRoute = toAbsoluteRoute(pricingLocation);

  const query = useQuery<PayPalCheckoutResult>({
    queryKey: [
      "paypal-promotion-checkout",
      accountId,
      userId,
      attemptId,
      cleanSearch,
    ],
    queryFn: async ({ signal }) => {
      const additionalHeaders = {
        "ChatGPT-Account-ID": accountId,
        [expectedAccountIdHeader]: accountId,
      };
      const accountResponse = await apiClient.safeGet<AccountsCheckResponse>(
        "/accounts/check/{version}",
        {
          additionalHeaders,
          parameters: { path: { version: "v4-2023-04-27" } },
          signal,
        },
      );
      signal.throwIfAborted();
      const checkoutAccount = accountResponse.accounts[accountId];
      if (checkoutAccount == null)
        throw new Error("Checkout account unavailable");

      if (checkoutAccount.entitlement.has_active_subscription) {
        const pricingParameters = new URLSearchParams(cleanSearch);
        pricingParameters.set("plan", "plus");
        return { type: "pricing", search: `?${pricingParameters}` };
      }

      const requestedCampaign =
        parameters.get("promo_campaign")?.trim() || undefined;
      const campaignId =
        requestedCampaign ??
        selectEligiblePromotion(
          "plus",
          checkoutAccount.account.plan_type,
          checkoutAccount.eligible_promo_campaigns?.plus,
        )?.id;
      const couponResponse =
        campaignId == null
          ? null
          : await apiClient.safeGet<CouponCheckResponse>(
              "/promo_campaign/check_coupon",
              {
                additionalHeaders,
                parameters: {
                  query: {
                    coupon: campaignId,
                    is_coupon_from_query_param: requestedCampaign != null,
                  },
                },
                signal,
              },
            );
      signal.throwIfAborted();
      const eligibleCampaign =
        couponResponse?.state === "eligible"
          ? couponResponse.coupon
          : undefined;

      const payPalCheckoutEnabled = getExperiment(statsig, "662604060").get(
        "paypal_promo_checkout_enabled",
        false,
      );
      if (!payPalCheckoutEnabled)
        return {
          type: "purchase",
          inferredCampaign:
            requestedCampaign == null ? eligibleCampaign : undefined,
        };

      const request = buildPayPalCheckoutRequest({
        promoCode: parameters.get("promoCode") ?? undefined,
        eligibleCampaign,
        isCampaignFromQuery: requestedCampaign != null,
      }) as CheckoutRequest;
      const session = (await createSession({
        accountId,
        request,
        statsig,
        isDark: Boolean(isDark),
        attemptId,
        signal,
        cancelUrl: new URL(cancelRoute, window.location.origin).href,
      })) as CheckoutSession;
      return { type: "checkout", request, session };
    },
    staleTime: Infinity,
    gcTime: 0,
    retry: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });

  if (query.data?.type === "pricing")
    return jsx.jsx(Navigate, {
      to: buildPricingLocation({ search: query.data.search }),
      replace: true,
    });

  if (query.data?.type === "purchase")
    return jsx.jsx(Navigate, {
      to: {
        pathname: "/purchase/plus",
        search: cleanSearch,
        hash: location.hash,
      },
      state: {
        "account-payment-modal-promo-campaign-handoff":
          query.data.inferredCampaign,
      },
      replace: true,
    });

  if (query.data?.type === "checkout") {
    const { session } = query.data;
    if ("tag" in session && session.tag === "custom_checkout_session")
      return jsx.jsx(Navigate, {
        to: {
          pathname: `/checkout/${session.processor_entity}/${session.checkout_session_id}`,
          search: cleanSearch,
        },
        state: { checkoutRequest: query.data.request },
        replace: true,
      });
    if ("url" in session && session.url != null)
      return jsx.jsx(HostedCheckoutPage, { url: session.url });
  }

  return jsx.jsx(CheckoutPreparation, {
    loading: query.isPending,
    error: query.error,
    onRetry: () => {
      query.refetch();
    },
  });
}

function createAttemptId(): string {
  return crypto.randomUUID();
}

initializeCompilerRuntime();
initializeCheckoutPolicy();
initializePricingPromotions();
initializeQueryRuntime();
initializeSharedRuntime();
React = getReactRuntime();
initializeRouter();
initializeAuthentication();
initializeApiClient();
initializeExperiments();
initializeAccountQueries();
initializeThemeSubscription();
initializeCheckoutPage();
initSession();
initializeCheckoutPreparation();
jsx = getJsxRuntime();

export { PayPalCheckoutPage };
