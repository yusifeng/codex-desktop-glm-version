import "@rchunk/rolldown-runtime";
import "@rchunk/app-shared";
import { rJt as apiClient } from "@rchunk/app-initial";

interface BillingApi { safeGet<Response>(path: string, options: Record<string, unknown>): Promise<Response> }
interface QueryClient { invalidateQueries(input: { queryKey: unknown[] }): Promise<unknown> | unknown }
const client = apiClient as unknown as BillingApi;
function billingInfoQuery(accountId: string) { return { queryKey: ["consumer-billing", accountId, "billing-info"], queryFn: ({ signal }: { signal?: AbortSignal }) => client.safeGet("/payments/billing_info", { parameters: { query: { account_id: accountId } }, signal }), staleTime: 0, retry: false }; }
function paymentMethodsQuery(accountId: string) { return { queryKey: ["consumer-billing", accountId, "payment-methods"], queryFn: ({ signal }: { signal?: AbortSignal }) => client.safeGet("/payments/payment_methods", { parameters: { query: { account_id: accountId } }, signal }), staleTime: 0, retry: false }; }
async function invalidateBillingQueries(context: { queryClient: QueryClient }, accountId: string): Promise<void> { await Promise.all([["consumer-billing", accountId], ["accounts"], ["usage-settings"]].map(queryKey => context.queryClient.invalidateQueries({ queryKey }))); }
function initializeBillingQueries(): void {}
export { invalidateBillingQueries as i, initializeBillingQueries as n, paymentMethodsQuery as r, billingInfoQuery as t };
