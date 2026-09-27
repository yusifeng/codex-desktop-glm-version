// home-beacon-finance —— Finance Home Beacon 的应用安装、连接账户与开聊流程。

import * as appConnectModalChunk from "@rchunk/app-connect-modal";
import * as appInitialChunk from "@rchunk/app-initial";
import * as appPrimaryChunk from "@rchunk/app-primary";
import * as appSharedChunk from "@rchunk/app-shared";
import * as conversationChunk from "@rchunk/conversation-start";
import * as plaidLinkChunk from "@rchunk/plaid-link";
import * as runtimeChunk from "@rchunk/rolldown-runtime";

void runtimeChunk;

const {
  n: initializeAppConnectModal,
  t: AppConnectModal,
} = appConnectModalChunk;
const {
  Bfn: initializeFinanceEligibility,
  Fzt: createFinanceAppInfo,
  HW: financeCapabilitiesQuery,
  Izt: initializePluginInstaller,
  L2: initializeConversationMessages,
  Mzt: financeSystemHint,
  NOt: createUserCompletionMessages,
  POt: initializeConnectorState,
  R2: openPluginInstaller,
  Sun: initializeFinanceAppInfo,
  UW: initializeConnectorClient,
  Uzt: openManagedDialog,
  Vzt: initializeManagedDialogs,
  WW: connectorClientSignal,
  _fn: disabledFinanceFlag,
  f2t: closePluginInstallRequest,
  fW: financeConnectionEvent,
  g2t: initializePluginInstallRequest,
  hW: initializeFinanceQueries,
  hfn: enabledFinanceFlag,
  i4t: initializeConversationStart,
  jW: initializePlaidIntegration,
  jzt: financePluginId,
  ly: connectorLinksQuery,
  mfn: linkedAccountsRequiredFlag,
  mpn: intlSignal,
  mun: activeAccountIdSignal,
  n4t: listAvailableApps,
  pfn: initializeFinanceFeatureFlags,
  ppn: initializeBeaconAnalytics,
  q6t: normalizeCanonicalAppId,
  uy: initializeAppConnectFlow,
  v2t: pluginInstallRequestSignal,
  xpn: logAnalyticsEvent,
  yNt: isBannerBeacon,
  ypn: initializeAnalytics,
  zW: linkedAccountsQuery,
  zzt: closeManagedDialog,
} = appInitialChunk;
const {
  co: getMarketplacePlugin,
  lo: initializeMarketplacePlugin,
} = appPrimaryChunk;
const {
  $3: initializeJsxRuntimeLazy,
  FX: initializeSignalRuntime,
  I3: getJsxRuntime,
  K2: initializeIntl,
  LX: useSignalScope,
  QI: initializeQueryRuntime,
  ZI: applicationScope,
  lk: initializeToastUi,
  n4: useIntl,
  pk: toastManagerSignal,
  wL: initializeToastRuntime,
} = appSharedChunk;
const {
  n: startConversation,
  t: initializeConversationStartChunk,
} = conversationChunk;
const {
  n: initializePlaidLink,
  r: openPlaidLink,
} = plaidLinkChunk;

const FINANCE_CANONICAL_APP_ID = "connector_693864f100e4819093e6ed9b651239f1";
const FINANCE_FEATURE_FLAG = "4135903789";

type FinanceScope = import("@rchunk/app-shared").MaitaiScopeApi<
  Record<string, unknown>
> & {
  get<Value>(signal: unknown, ...parameters: unknown[]): Value;
  set(signal: unknown, value: unknown): void;
  query: {
    getOrFetch<Value>(query: unknown, ...parameters: unknown[]): Promise<Value>;
    invalidate?(query: unknown, ...parameters: unknown[]): void;
  };
};

interface FinanceApp {
  canonicalAppId?: string | null;
  plugin?: {
    availability?: string;
    disabledReason?: string;
    enabled?: boolean;
    installPolicy?: string;
  };
}

interface MarketplacePlugin {
  displayName: string;
  pluginId: string;
}

interface PluginInstallRequest {
  kind: string;
  requestId?: string;
}

let jsx: import("@rchunk/app-shared").JsxRuntime;
let initialized = false;

function PersonalFinanceConnectorConsentDialog({
  onConnected,
  onClose,
}: {
  onConnected(): void;
  onClose(): void;
}): unknown {
  initializeHomeBeaconFinance();
  const scope = useSignalScope(applicationScope) as unknown as FinanceScope;
  const intl = useIntl();
  const app = createFinanceAppInfo?.(
    String(
      intl?.formatMessage?.({
        id: "personalFinance.accounts.connectorName",
        defaultMessage: "ChatGPT Personal Finance",
        description:
          "Display name of the first-party ChatGPT Personal Finance app shown in the existing Codex connector consent and privacy-disclosure dialog",
      }) ?? "ChatGPT Personal Finance",
    ),
  );
  const connectApp = ({
    app: selectedApp,
  }: {
    app: { id: string; name: string };
  }) =>
    scope
      .get<{
        createConnectorLink(
          appId: string,
          appName: string,
          source: "CONNECTOR_SETTING",
        ): unknown;
      }>(connectorClientSignal)
      ?.createConnectorLink?.(
        selectedApp.id,
        selectedApp.name,
        "CONNECTOR_SETTING",
      );
  const connected = () => {
    scope.query.invalidate?.(
      connectorLinksQuery,
      scope.get(activeAccountIdSignal),
    );
    onConnected();
  };
  const openChanged = (open: boolean) => {
    if (!open) onClose();
  };
  return jsx.jsx(AppConnectModal, {
    app,
    authTypeOverride: "NONE",
    connectApp,
    postConnectSource: null,
    showResultToasts: false,
    onConnected: connected,
    onOpenChange: openChanged,
  });
}

function accountStillActive(
  scope: { get(signal: unknown): unknown },
  accountId: string,
  signal: AbortSignal,
): boolean {
  return !signal.aborted && scope.get(activeAccountIdSignal) === accountId;
}

function pluginUnavailable(app: FinanceApp | null | undefined): boolean {
  return (
    app?.plugin?.availability === "DISABLED_BY_ADMIN" ||
    app?.plugin?.installPolicy === "NOT_AVAILABLE" ||
    app?.plugin?.disabledReason === "plan_not_eligible"
  );
}

async function waitForPluginInstall(
  scope: FinanceScope,
  marketplacePlugin: MarketplacePlugin,
  signal: AbortSignal,
): Promise<boolean> {
  return new Promise((resolve) => {
    const opened = openPluginInstaller?.(
      scope,
      {
        displayName: marketplacePlugin.displayName,
        remotePluginId: marketplacePlugin.pluginId,
        remoteMarketplaceName: "chatgpt-workspace",
      },
      {
        hostId: "local",
        onSuccess: () => resolve(true),
        onCancel: () => resolve(false),
        onError: () => resolve(false),
      },
    );
    if (!opened) {
      resolve(false);
      return;
    }
    const request = scope.get<PluginInstallRequest>(pluginInstallRequestSignal);
    signal.addEventListener(
      "abort",
      () => {
        const current = scope.get<PluginInstallRequest>(
          pluginInstallRequestSignal,
        );
        if (
          current.kind !== "closed" &&
          request.kind !== "closed" &&
          current.requestId === request.requestId
        ) {
          scope.set(
            pluginInstallRequestSignal,
            closePluginInstallRequest(current),
          );
        }
        resolve(false);
      },
      { once: true },
    );
  });
}

async function waitForConnectorConsent(
  scope: FinanceScope,
  signal: AbortSignal,
): Promise<boolean> {
  const connected = await new Promise<boolean>((resolve) => {
    openManagedDialog?.(scope, PersonalFinanceConnectorConsentDialog, {
      onConnected: () => resolve(true),
      onClose: () => resolve(false),
    });
    signal.addEventListener(
      "abort",
      () => {
        closeManagedDialog?.(scope, PersonalFinanceConnectorConsentDialog);
        resolve(false);
      },
      { once: true },
    );
  });
  closeManagedDialog?.(scope, PersonalFinanceConnectorConsentDialog);
  return connected;
}

async function connectPersonalFinanceFromHomeBeacon(
  scope: FinanceScope,
  {
    accountId,
    beacon,
    onConversationStarted,
    signal,
    suppressAnalytics,
  }: {
    accountId: string;
    beacon: unknown;
    onConversationStarted(conversation: unknown): void;
    signal: AbortSignal;
    suppressAnalytics?: boolean;
  },
): Promise<boolean> {
  initializeHomeBeaconFinance();
  const intl = scope.get<import("@rchunk/app-shared").IntlShape>(intlSignal);
  const isActive = () => accountStillActive(scope, accountId, signal);
  try {
    const capabilities = await scope.query.getOrFetch<{ finances?: boolean }>(
      financeCapabilitiesQuery,
      accountId,
    );
    if (
      !isActive() ||
      capabilities?.finances !== true ||
      scope.get<boolean>(disabledFinanceFlag, FINANCE_FEATURE_FLAG) ||
      !scope.get<boolean>(enabledFinanceFlag, FINANCE_FEATURE_FLAG)
    ) {
      return false;
    }

    if (scope.get<boolean>(linkedAccountsRequiredFlag, FINANCE_FEATURE_FLAG)) {
      const linkedAccounts = await scope.query.getOrFetch<{ links: unknown[] }>(
        linkedAccountsQuery,
        accountId,
      );
      if (!isActive() || linkedAccounts.links.length === 0) return false;
    }

    const apps = await listAvailableApps?.(scope, {
      productContext: "chatgpt",
      signal,
    });
    if (!isActive()) return false;
    const financeApp = apps?.find(
      (app: FinanceApp) =>
        app.canonicalAppId != null &&
        normalizeCanonicalAppId?.(app.canonicalAppId) ===
          FINANCE_CANONICAL_APP_ID,
    );
    if (pluginUnavailable(financeApp)) {
      throw new Error("Finances is unavailable for this account");
    }

    if (!financeApp?.plugin?.enabled) {
      const marketplacePlugin = await getMarketplacePlugin?.(
        scope,
        financePluginId,
      );
      if (
        !isActive() ||
        marketplacePlugin == null ||
        !(await waitForPluginInstall(scope, marketplacePlugin, signal)) ||
        !isActive()
      ) {
        return false;
      }
    }

    const connector = scope.get<{
      getConnectorLink(
        pluginId: string,
        source: "CONNECTOR_SETTING",
      ): Promise<{ link?: { auth_status?: string } }>;
    }>(connectorClientSignal);
    const { link } = await connector.getConnectorLink(
      financePluginId,
      "CONNECTOR_SETTING",
    );
    if (!isActive()) return false;
    if (
      link?.auth_status !== "ACTIVE" &&
      (!(await waitForConnectorConsent(scope, signal)) || !isActive())
    ) {
      return false;
    }

    if (!(await openPlaidLink?.(scope, { accountId, signal })) || !isActive()) {
      return false;
    }

    const prompt = String(
      intl.formatMessage({
        id: "personalFinance.homeBeacon.onboardingPrompt",
        defaultMessage:
          "What can I do with my newly connected accounts once they finish syncing?",
        description:
          "User message submitted after connecting bank accounts from a Finance homepage banner or modal, asking ChatGPT to explain how the connected accounts can be used",
      }),
    );
    const startedConversation = await startConversation?.(scope, {
      accountId,
      forceOnboarding: true,
      prompt,
      requireServerConversation: true,
      signal,
      userCompletionMessages: createUserCompletionMessages?.({
        prompt,
        systemHints: [financeSystemHint],
        messageMetadata: {
          starter_prompt_id: "finance-onboarding-connect-ledger",
          suggestion_type: "starter",
        },
      }),
    });
    if (startedConversation == null || !isActive()) return false;

    if (!suppressAnalytics) {
      logAnalyticsEvent?.(scope, financeConnectionEvent, {
        surfaceName: "home",
        entrypoint: isBannerBeacon?.(beacon)
          ? "homepage_banner"
          : "homepage_modal",
        step: "account_linking",
        provider: "plaid",
        result: "success",
      });
    }
    onConversationStarted(startedConversation);
    return true;
  } catch {
    if (isActive()) {
      scope.get<import("@rchunk/app-shared").ToastManager>(toastManagerSignal).danger(
        String(intl.formatMessage({
          id: "personalFinance.homeBeacon.connectionError",
          defaultMessage:
            "Couldn’t finish setting up Finances. Please try again.",
          description:
            "Error toast when connecting accounts or starting the Finance onboarding conversation from a homepage banner or modal fails",
        })),
        {
          errorAnalytics: {
            toastId: "personalFinance.homeBeacon.connectionError",
          },
        },
      );
    }
    return false;
  }
}

function initializeHomeBeaconFinance(): void {
  if (initialized) return;
  initialized = true;
  initializeJsxRuntimeLazy?.();
  initializeSignalRuntime?.();
  initializeIntl?.();
  initializeFinanceAppInfo?.();
  initializeQueryRuntime?.();
  initializeAppConnectModal?.();
  initializeAppConnectFlow?.();
  initializeConnectorClient?.();
  initializePluginInstaller?.();
  initializeFinanceQueries?.();
  initializeToastRuntime?.();
  initializeConnectorState?.();
  initializeManagedDialogs?.();
  initializeToastUi?.();
  initializeBeaconAnalytics?.();
  initializePluginInstallRequest?.();
  initializeMarketplacePlugin?.();
  initializeConversationMessages?.();
  initializeConversationStart?.();
  initializeAnalytics?.();
  initializeFinanceEligibility?.();
  initializeFinanceFeatureFlags?.();
  initializeConversationStartChunk?.();
  initializePlaidLink?.();
  initializePlaidIntegration?.();
  jsx = typeof getJsxRuntime === "function" ? getJsxRuntime() : getJsxRuntime;
}

initializeHomeBeaconFinance();

export { connectPersonalFinanceFromHomeBeacon };
