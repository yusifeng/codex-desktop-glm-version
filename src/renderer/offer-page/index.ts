import * as appInitialChunk from "@rchunk/app-initial";
import * as appSharedChunk from "@rchunk/app-shared";
import * as offerNoticeChunk from "@rchunk/offer-notice";
import * as offerQueriesChunk from "@rchunk/offer-queries";
import "@rchunk/rolldown-runtime";

interface JsxRuntime {
  Fragment: unknown;
  jsx(type: unknown, props: Record<string, unknown>, key?: unknown): unknown;
  jsxs(type: unknown, props: Record<string, unknown>, key?: unknown): unknown;
}

interface ReactRuntime {
  useEffect(effect: () => void | (() => void), dependencies: readonly unknown[]): void;
  useRef<Value>(value: Value): { current: Value };
  useState<Value>(value: Value): [Value, (next: Value) => void];
}

interface RouterLocation {
  hash: string;
  pathname: string;
  search: string;
  state: unknown;
}

interface RouterTarget {
  hash: string;
  pathname: string;
  search: string;
}

interface OfferLocation extends RouterTarget {
  checkoutSource?: string;
  code?: string | null;
  kind?: string | null;
}

interface OfferMetadata extends Record<string, unknown> {
  plan_name?: string;
  price_period?: string;
  processor?: string;
  promotion_type?: string;
}

interface EligibilityResponse {
  ineligible_reason?: { message?: unknown; title?: unknown } | null;
  is_eligible?: boolean;
  metadata?: OfferMetadata | null;
}

interface Account {
  id: string;
  plan_type?: string;
  structure?: string;
}

interface IntlShape {
  formatMessage(descriptor: {
    defaultMessage: string;
    description?: string;
    id: string;
  }): string;
}

interface QueryOptions<Result> {
  queryFn(input: { signal: AbortSignal }): Promise<Result>;
  queryKey: readonly unknown[];
  retry: boolean;
  staleTime: number;
}

interface QueryResult<Result> {
  data?: Result;
  error?: unknown;
  isPending: boolean;
  refetch(): unknown;
}

interface AppSharedOfferApi {
  $3(): void;
  $h(): void;
  Ah: unknown;
  I3(): JsxRuntime;
  Ih: unknown;
  K2(): void;
  Lh: unknown;
  Oh: unknown;
  Ph(): void;
  Qh: unknown;
  Rh: unknown;
  Y2: unknown;
  Yh: unknown;
  Zh(): void;
  _L<Result>(options: QueryOptions<Result>): QueryResult<Result>;
  dg(): void;
  e6(): ReactRuntime;
  fg(): boolean | null;
  gL(): void;
  jh: unknown;
  kh: unknown;
  n4(): IntlShape;
  zh(): void;
}

interface AppInitialOfferApi {
  $F(location: RouterLocation): OfferLocation;
  Fx(callback: string): string;
  Ix(): void;
  M6t(): void;
  N6t(): {
    accountId?: string | null;
    authMethod?: string | null;
    isLoading?: boolean;
    userId?: string | null;
  };
  Pdn: {
    GO: string;
    PLUS: string;
    PRO: string;
    PROLITE: string;
  };
  Qgn(): void;
  Rln(): void;
  Rx(
    url: string,
    parameters: Record<string, string>,
    signal: AbortSignal,
  ): Promise<{ ok: true; url: string } | { ok: false }>;
  Ygn: unknown;
  _0(input: { search: string }): RouterTarget | string;
  aI(): void;
  cI(input: {
    promoCode: string | null;
    promoMetadata: OfferMetadata;
  }): boolean;
  i_n(): RouterLocation;
  o_n(): (
    destination: RouterTarget | string,
    options?: { replace?: boolean; state?: unknown },
  ) => void;
  r_n(location: RouterTarget): string;
  rht(): void;
  tI(metadata: OfferMetadata): string | null;
  uht(
    accountId?: string,
    options?: { preview?: boolean },
  ): { data?: Account; isLoading: boolean };
  v0(): void;
}

interface OfferNoticeApi {
  i(): void;
  t: unknown;
}

interface OfferQueriesApi {
  n(input: {
    accountId: string;
    code: string;
    kind: string;
    signal: AbortSignal;
  }): Promise<EligibilityResponse>;
  r(): void;
}

const {
  $3: initializeCompilerRuntime,
  $h: initializeResourceButtons,
  Ah: DialogHeader,
  I3: getJsxRuntime,
  Ih: Dialog,
  K2: initializeIntlRuntime,
  Lh: DialogDescription,
  Oh: DialogBody,
  Ph: initializeDialogLayout,
  Qh: LoadingSpinner,
  Rh: DialogTitle,
  Y2: FormattedMessage,
  Yh: Button,
  Zh: initializeButton,
  _L: useQuery,
  dg: initializeThemeSubscription,
  e6: getReactRuntime,
  fg: useIsDarkTheme,
  gL: initializeQueryRuntime,
  jh: DialogSection,
  kh: DialogFooter,
  n4: useIntl,
  zh: initializeDialog,
} = appSharedChunk as unknown as AppSharedOfferApi;

const {
  $F: normalizeOfferLocation,
  Fx: buildAuthenticationUrl,
  Ix: initializeRouter,
  M6t: initializeAuthentication,
  N6t: useAuthentication,
  Pdn: checkoutPlans,
  Qgn: initializeAuthenticationUrl,
  Rln: initializePlanMapping,
  Rx: beginAuthentication,
  Ygn: Navigate,
  _0: buildPersonalCheckoutLocation,
  aI: initializeOffers,
  cI: canEnterPersonalCheckout,
  i_n: useLocation,
  o_n: useNavigate,
  r_n: buildOfferCallback,
  rht: initializeOfferPageState,
  tI: getPromotionPlanName,
  uht: useAccount,
  v0: initializeRouterState,
} = appInitialChunk as unknown as AppInitialOfferApi;

const {
  i: initializeOfferNotice,
  t: OfferNotice,
} = offerNoticeChunk as unknown as OfferNoticeApi;
const {
  n: fetchPromotionEligibility,
  r: initializeOfferQueries,
} = offerQueriesChunk as unknown as OfferQueriesApi;

let React: ReactRuntime;
let jsx: JsxRuntime;
let promotionPlans: Record<string, string>;

function OfferPage(): unknown {
  const location = useLocation();
  const authentication = useAuthentication();
  const offer = normalizeOfferLocation(location);
  const canonicalTarget = {
    pathname: offer.pathname,
    search: offer.search,
    hash: offer.hash,
  };
  const callback = buildOfferCallback(canonicalTarget);

  if (
    location.pathname !== offer.pathname ||
    location.search.replace(/^\?/, "") !== offer.search
  ) {
    return jsx.jsx(Navigate, {
      to: canonicalTarget,
      state: location.state,
      replace: true,
    });
  }
  if (offer.code == null || offer.kind == null) {
    return jsx.jsx(Navigate, { to: "/", replace: true });
  }
  if (authentication.isLoading) return jsx.jsx(LoadingSpinner, {});
  if (authentication.authMethod !== "chatgpt") {
    return jsx.jsx(SignedOutOfferDialog, { callback });
  }
  if (authentication.accountId == null || authentication.userId == null) {
    return jsx.jsx(LoadingSpinner, {});
  }
  return jsx.jsx(AuthenticatedOffer, {
    accountId: authentication.accountId,
    userId: authentication.userId,
    offer,
  });
}

function AuthenticatedOffer({
  accountId,
  userId,
  offer,
}: {
  accountId: string;
  offer: OfferLocation;
  userId: string;
}): unknown {
  const navigate = useNavigate();
  const intl = useIntl();
  const darkMode = useIsDarkTheme() === true;
  const accountResult = useAccount(undefined, { preview: false });
  const eligibility = useQuery<EligibilityResponse>({
    queryKey: ["checkout-offer", accountId, userId, offer.kind, offer.code],
    queryFn: ({ signal }) =>
      fetchPromotionEligibility({
        accountId,
        code: offer.code ?? "",
        kind: offer.kind ?? "promo",
        signal,
      }),
    retry: false,
    staleTime: 0,
  });

  if (accountResult.isLoading || eligibility.isPending) {
    return jsx.jsx(LoadingSpinner, {});
  }

  const promotion = eligibility.data;
  const metadata = promotion?.metadata;
  const returnPath = [offer.pathname, "?", offer.search, offer.hash].join("");

  if (
    eligibility.error == null &&
    accountResult.data?.id === accountId &&
    promotion?.is_eligible === true &&
    offer.kind === "promo" &&
    metadata?.plan_name === "chatgptteamplan" &&
    metadata.promotion_type !== "credit_grant" &&
    metadata.promotion_type !== "cbp_credit_purchase_discount"
  ) {
    const parameters = new URLSearchParams(offer.search);
    parameters.set("offer_return_path", returnPath);
    return jsx.jsx(Navigate, {
      to: {
        pathname: "/purchase/team",
        search: parameters.toString(),
        hash: offer.hash,
      },
      replace: true,
    });
  }

  const promotionPlan =
    promotion?.is_eligible === true && metadata != null
      ? getPromotionPlanName(metadata)
      : null;
  if (
    eligibility.error == null &&
    accountResult.data?.id === accountId &&
    accountResult.data.structure === "personal" &&
    metadata != null &&
    promotionPlan != null &&
    (accountResult.data.plan_type === "free" ||
      canEnterPersonalCheckout({
        promoCode: offer.kind === "promo" ? (offer.code ?? null) : null,
        promoMetadata: metadata,
      }) ||
      (offer.kind === "promo" &&
        metadata.processor === "stripe" &&
        metadata.price_period === "recurring"))
  ) {
    const plan = promotionPlans[promotionPlan];
    const state = {
      defaultTab: "personal",
      returnPath: "/",
      source: "promotion_offer",
      offer: {
        returnPath,
        checkoutSource: offer.checkoutSource,
        metadata,
        plan,
        promoCode: offer.kind === "promo" ? (offer.code ?? null) : null,
        referralCode: offer.kind === "referral" ? (offer.code ?? null) : null,
      },
    };
    return jsx.jsx(Navigate, {
      to: buildPersonalCheckoutLocation({ search: offer.search }),
      state,
      replace: true,
    });
  }

  const title =
    promotion?.ineligible_reason?.title ??
    jsx.jsx(FormattedMessage, {
      id: "checkout.offers.unavailableTitle",
      defaultMessage: "Promotion unavailable",
      description: "Heading when a personal checkout offer cannot be used",
    });
  const message =
    promotion?.ineligible_reason?.message ??
    jsx.jsx(FormattedMessage, {
      id: "checkout.offers.unavailable",
      defaultMessage: "We couldn’t prepare this promotion",
      description: "Shown when a promotion cannot enter personal checkout",
    });
  const closeLabel = intl.formatMessage({
    id: "promoIneligibleModal.close",
    defaultMessage: "Close",
    description: "Close button for promo ineligible modal",
  });
  const retry =
    eligibility.error == null
      ? undefined
      : {
          label: jsx.jsx(FormattedMessage, {
            id: "checkout.offers.retry",
            defaultMessage: "Try again",
            description: "Retries offer eligibility without creating checkout",
          }),
          onClick: () => void eligibility.refetch(),
        };

  return jsx.jsx(OfferNotice, {
    open: true,
    isDarkMode: darkMode,
    portalClassName: "zoom-adjusted-viewport",
    onClose: () => void navigate("/", { replace: true }),
    title,
    message,
    closeLabel,
    retry,
  });
}

function SignedOutOfferDialog({ callback }: { callback: string }): unknown {
  const navigate = useNavigate();
  const controller = React.useRef<AbortController | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [failed, setFailed] = React.useState(false);

  React.useEffect(
    () => () => {
      controller.current?.abort();
    },
    [],
  );

  const authenticate = async (screenHint: "login" | "signup"): Promise<void> => {
    if (controller.current != null) return;
    const nextController = new AbortController();
    controller.current = nextController;
    setLoading(true);
    setFailed(false);
    try {
      const result = await beginAuthentication(
        buildAuthenticationUrl(callback),
        { screen_hint: screenHint },
        nextController.signal,
      );
      if (!nextController.signal.aborted && result.ok) {
        window.location.assign(result.url);
        return;
      }
    } catch {
      // Authentication failures are shown inline below.
    }
    if (!nextController.signal.aborted) {
      controller.current = null;
      setLoading(false);
      setFailed(true);
    }
  };

  const errorMessage = failed
    ? jsx.jsx("p", {
        role: "alert",
        children: jsx.jsx(FormattedMessage, {
          id: "browser.auth.login.failed",
          defaultMessage: "We couldn’t sign you in. Please try again",
          description: "Inline authentication retry message",
        }),
      })
    : null;

  return jsx.jsx(Dialog, {
    open: true,
    shouldIgnoreClickOutside: true,
    onOpenChange: (open: boolean) => {
      if (!open) navigate("/", { replace: true });
    },
    children: jsx.jsxs(DialogBody, {
      children: [
        jsx.jsx(DialogSection, {
          children: jsx.jsx(DialogHeader, {
            title: jsx.jsx(DialogTitle, {
              children: jsx.jsx(FormattedMessage, {
                id: "NoAuthPromoRedemptionModal.title",
                defaultMessage: "Log in or sign up to redeem your promotion",
                description: "Heading before a logged-out visitor returns to an offer",
              }),
            }),
          }),
        }),
        jsx.jsx(DialogSection, {
          children: jsx.jsxs(jsx.Fragment, {
            children: [
              jsx.jsx(DialogDescription, {
                asChild: true,
                children: jsx.jsx("p", {
                  children: jsx.jsx(FormattedMessage, {
                    id: "checkout.offers.signInDescription",
                    defaultMessage: "Sign in to continue to this offer",
                    description: "Description below the logged-out promotion dialog title",
                  }),
                }),
              }),
              errorMessage,
            ],
          }),
        }),
        jsx.jsx(DialogSection, {
          children: jsx.jsxs(DialogFooter, {
            children: [
              jsx.jsx(Button, {
                disabled: loading,
                onClick: () => void authenticate("signup"),
                children: jsx.jsx(FormattedMessage, {
                  id: "checkout.offers.signUp",
                  defaultMessage: "Sign up for free",
                  description: "Starts signup and returns to the offer",
                }),
              }),
              jsx.jsx(Button, {
                disabled: loading,
                onClick: () => void authenticate("login"),
                children: jsx.jsx(FormattedMessage, {
                  id: "checkout.offers.logIn",
                  defaultMessage: "Log in",
                  description: "Starts login and returns to the offer",
                }),
              }),
            ],
          }),
        }),
      ],
    }),
  });
}

function initializeOfferPage(): void {
  initializeCompilerRuntime();
  initializeOffers();
  initializeOfferNotice();
  initializeQueryRuntime();
  React = getReactRuntime();
  initializeIntlRuntime();
  initializeAuthenticationUrl();
  initializeAuthentication();
  initializeOfferPageState();
  initializeButton();
  initializeDialog();
  initializeDialogLayout();
  initializeResourceButtons();
  initializeRouterState();
  initializeRouter();
  initializePlanMapping();
  promotionPlans = {
    chatgptgoplan: checkoutPlans.GO,
    chatgptplusplan: checkoutPlans.PLUS,
    chatgptprolite: checkoutPlans.PROLITE,
    chatgptpro: checkoutPlans.PRO,
  };
  initializeThemeSubscription();
  initializeOfferQueries();
  jsx = getJsxRuntime();
}

initializeOfferPage();

export { OfferPage };
