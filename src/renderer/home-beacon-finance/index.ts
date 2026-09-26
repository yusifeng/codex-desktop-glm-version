// home-beacon-finance —— Finance Home Beacon 的应用安装、连接账户与开聊流程。

import * as appConnectModalChunk from "@rchunk/app-connect-modal";
import * as appInitialChunk from "@rchunk/app-initial";
import * as appPrimaryChunk from "@rchunk/app-primary";
import * as appSharedChunk from "@rchunk/app-shared";
import * as conversationChunk from "@rchunk/conversation-start";
import * as plaidLinkChunk from "@rchunk/plaid-link";
import * as runtimeChunk from "@rchunk/rolldown-runtime";

void runtimeChunk;

const appConnectModal = appConnectModalChunk as Record<string, any>;
const appInitial = appInitialChunk as Record<string, any>;
const appPrimary = appPrimaryChunk as Record<string, any>;
const appShared = appSharedChunk as Record<string, any>;
const conversation = conversationChunk as Record<string, any>;
const plaidLink = plaidLinkChunk as Record<string, any>;

const FINANCE_CANONICAL_APP_ID = "connector_693864f100e4819093e6ed9b651239f1";
const FINANCE_FEATURE_FLAG = "4135903789";

let jsx: any;
let initialized = false;

function PersonalFinanceConnectorConsentDialog({
  onConnected,
  onClose,
}: {
  onConnected(): void;
  onClose(): void;
}): unknown {
  initializeHomeBeaconFinance();
  const scope = appShared.LX?.(appShared.ZI);
  const intl = appShared.n4?.();
  const app = appInitial.Fzt?.(
    intl?.formatMessage?.({
      id: "personalFinance.accounts.connectorName",
      defaultMessage: "ChatGPT Personal Finance",
      description:
        "Display name of the first-party ChatGPT Personal Finance app shown in the existing Codex connector consent and privacy-disclosure dialog",
    }) ?? "ChatGPT Personal Finance",
  );
  const connectApp = ({
    app: selectedApp,
  }: {
    app: { id: string; name: string };
  }) =>
    scope
      ?.get?.(appInitial.WW)
      ?.createConnectorLink?.(
        selectedApp.id,
        selectedApp.name,
        "CONNECTOR_SETTING",
      );
  const connected = () => {
    scope?.query?.invalidate?.(appInitial.ly, scope.get(appInitial.mun));
    onConnected();
  };
  const openChanged = (open: boolean) => {
    if (!open) onClose();
  };
  const AppConnectModal = appConnectModal.t;
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
  return !signal.aborted && scope.get(appInitial.mun) === accountId;
}

function pluginUnavailable(app: any): boolean {
  return (
    app?.plugin?.availability === "DISABLED_BY_ADMIN" ||
    app?.plugin?.installPolicy === "NOT_AVAILABLE" ||
    app?.plugin?.disabledReason === "plan_not_eligible"
  );
}

async function waitForPluginInstall(
  scope: any,
  marketplacePlugin: any,
  signal: AbortSignal,
): Promise<boolean> {
  return new Promise((resolve) => {
    const opened = appInitial.R2?.(
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
    const request = scope.get(appInitial.v2t);
    signal.addEventListener(
      "abort",
      () => {
        const current = scope.get(appInitial.v2t);
        if (
          current.kind !== "closed" &&
          request.kind !== "closed" &&
          current.requestId === request.requestId
        ) {
          scope.set(appInitial.v2t, appInitial.f2t(current));
        }
        resolve(false);
      },
      { once: true },
    );
  });
}

async function waitForConnectorConsent(
  scope: any,
  signal: AbortSignal,
): Promise<boolean> {
  const connected = await new Promise<boolean>((resolve) => {
    appInitial.Uzt?.(scope, PersonalFinanceConnectorConsentDialog, {
      onConnected: () => resolve(true),
      onClose: () => resolve(false),
    });
    signal.addEventListener(
      "abort",
      () => {
        appInitial.zzt?.(scope, PersonalFinanceConnectorConsentDialog);
        resolve(false);
      },
      { once: true },
    );
  });
  appInitial.zzt?.(scope, PersonalFinanceConnectorConsentDialog);
  return connected;
}

async function connectPersonalFinanceFromHomeBeacon(
  scope: any,
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
  const intl = scope.get(appInitial.mpn);
  const isActive = () => accountStillActive(scope, accountId, signal);
  try {
    const capabilities = await scope.query.getOrFetch(appInitial.HW, accountId);
    if (
      !isActive() ||
      capabilities?.finances !== true ||
      scope.get(appInitial._fn, FINANCE_FEATURE_FLAG) ||
      !scope.get(appInitial.hfn, FINANCE_FEATURE_FLAG)
    ) {
      return false;
    }

    if (scope.get(appInitial.mfn, FINANCE_FEATURE_FLAG)) {
      const linkedAccounts = await scope.query.getOrFetch(
        appInitial.zW,
        accountId,
      );
      if (!isActive() || linkedAccounts.links.length === 0) return false;
    }

    const apps = await appInitial.n4t?.(scope, {
      productContext: "chatgpt",
      signal,
    });
    if (!isActive()) return false;
    const financeApp = apps?.find(
      (app: any) =>
        app.canonicalAppId != null &&
        appInitial.q6t?.(app.canonicalAppId) === FINANCE_CANONICAL_APP_ID,
    );
    if (pluginUnavailable(financeApp)) {
      throw new Error("Finances is unavailable for this account");
    }

    if (!financeApp?.plugin?.enabled) {
      const marketplacePlugin = await appPrimary.co?.(scope, appInitial.jzt);
      if (
        !isActive() ||
        marketplacePlugin == null ||
        !(await waitForPluginInstall(scope, marketplacePlugin, signal)) ||
        !isActive()
      ) {
        return false;
      }
    }

    const connector = scope.get(appInitial.WW);
    const { link } = await connector.getConnectorLink(
      appInitial.jzt,
      "CONNECTOR_SETTING",
    );
    if (!isActive()) return false;
    if (
      link?.auth_status !== "ACTIVE" &&
      (!(await waitForConnectorConsent(scope, signal)) || !isActive())
    ) {
      return false;
    }

    if (!(await plaidLink.r?.(scope, { accountId, signal })) || !isActive()) {
      return false;
    }

    const prompt = intl.formatMessage({
      id: "personalFinance.homeBeacon.onboardingPrompt",
      defaultMessage:
        "What can I do with my newly connected accounts once they finish syncing?",
      description:
        "User message submitted after connecting bank accounts from a Finance homepage banner or modal, asking ChatGPT to explain how the connected accounts can be used",
    });
    const startedConversation = await conversation.n?.(scope, {
      accountId,
      forceOnboarding: true,
      prompt,
      requireServerConversation: true,
      signal,
      userCompletionMessages: appInitial.NOt?.({
        prompt,
        systemHints: [appInitial.Mzt],
        messageMetadata: {
          starter_prompt_id: "finance-onboarding-connect-ledger",
          suggestion_type: "starter",
        },
      }),
    });
    if (startedConversation == null || !isActive()) return false;

    if (!suppressAnalytics) {
      appInitial.xpn?.(scope, appInitial.fW, {
        surfaceName: "home",
        entrypoint: appInitial.yNt?.(beacon)
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
      scope.get(appShared.pk).danger(
        intl.formatMessage({
          id: "personalFinance.homeBeacon.connectionError",
          defaultMessage:
            "Couldn’t finish setting up Finances. Please try again.",
          description:
            "Error toast when connecting accounts or starting the Finance onboarding conversation from a homepage banner or modal fails",
        }),
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
  appShared.FX?.();
  appShared.K2?.();
  appInitial.Sun?.();
  appShared.QI?.();
  appConnectModal.n?.();
  appInitial.uy?.();
  appInitial.UW?.();
  appInitial.Izt?.();
  appInitial.hW?.();
  appShared.wL?.();
  appInitial.POt?.();
  appInitial.Vzt?.();
  appShared.lk?.();
  appInitial.ppn?.();
  appInitial.g2t?.();
  appPrimary.lo?.();
  appInitial.L2?.();
  appInitial.i4t?.();
  appInitial.ypn?.();
  appInitial.Bfn?.();
  appInitial.pfn?.();
  conversation.t?.();
  plaidLink.n?.();
  appInitial.jW?.();
  jsx = typeof appShared.I3 === "function" ? appShared.I3() : appShared.I3;
}

initializeHomeBeaconFinance();

export { connectPersonalFinanceFromHomeBeacon };
