import "@rchunk/rolldown-runtime";
import {
  FX as initializeSignalRuntime,
  QI as initializeQueryRuntime,
  QX as createQueryFamily,
  ZI as appScope,
  pL as queryOptions,
} from "@rchunk/app-shared";
import {
  cJt as initializeApiClient,
  cdn as accountCheckQueryKey,
  ldn as initializeAccountCheckQueries,
  rJt as apiClient,
} from "@rchunk/app-initial";

interface AccountCheckResponse {
  accounts: Record<string, unknown>;
}

interface WalletBalance {
  has_redeemed_gift_card?: boolean | null;
  [key: string]: unknown;
}

function accountCheckOptions(
  accountId: string,
): import("@rchunk/app-shared").ScopedQueryOptions<AccountCheckResponse> {
  return queryOptions({
    queryKey: accountCheckQueryKey(accountId),
    queryFn: ({ signal }) =>
      apiClient.safeGet<AccountCheckResponse>("/accounts/check/{version}", {
        parameters: { path: { version: "v4-2023-04-27" } },
        signal,
      }),
    staleTime: 0,
    refetchOnMount: "always",
    refetchOnWindowFocus: "always",
    retry: false,
    retryOnMount: false,
    select: (response: AccountCheckResponse) => response.accounts[accountId],
  });
}

function walletBalanceOptions(
  accountId: string,
): import("@rchunk/app-shared").ScopedQueryOptions<WalletBalance> {
  const key = ["consumer-billing", accountId, "wallet"];
  return queryOptions({
    queryKey: key,
    queryFn: async ({ signal, client }) => {
      const balance = await apiClient.safeGet<WalletBalance>(
        "/accounts/{account_id}/customer-balance",
        {
          parameters: {
            path: { account_id: accountId },
            query: { include_redemption_status: true },
          },
          signal,
        },
      );
      const previous = client.getQueryData<WalletBalance>(key);
      return previous?.has_redeemed_gift_card === true
        && balance.has_redeemed_gift_card == null
        ? { ...balance, has_redeemed_gift_card: true }
        : balance;
    },
    staleTime: 0,
    gcTime: 0,
    retry: false,
    retryOnMount: false,
    refetchOnMount: "always",
    refetchOnReconnect: "always",
    refetchOnWindowFocus: "always",
  });
}

let accountCheckQuery: unknown;
let walletBalanceQuery: unknown;

function initializeAccountBillingQueries(): void {
  initializeSignalRuntime();
  initializeAccountCheckQueries();
  initializeApiClient();
  initializeQueryRuntime();
  accountCheckQuery = createQueryFamily(appScope, accountCheckOptions);
  walletBalanceQuery = createQueryFamily(appScope, walletBalanceOptions);
}

export {
  initializeAccountBillingQueries as i,
  accountCheckOptions as n,
  walletBalanceQuery as r,
  accountCheckQuery as t,
};
