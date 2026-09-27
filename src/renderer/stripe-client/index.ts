import "@rchunk/rolldown-runtime";
import "@rchunk/app-shared";
import { rJt as apiClient } from "@rchunk/app-initial";
import "@rchunk/stripe-pure";
interface StripeApi { safeGet<Response>(path: string, options: Record<string, unknown>): Promise<Response> }
const client = apiClient as unknown as StripeApi;
function stripeAppearance(dark: boolean): Record<string, unknown> { const style = typeof document === "undefined" ? null : getComputedStyle(document.body); const value = (name: string) => style?.getPropertyValue(name).trim() || undefined; return { theme: dark ? "night" : "stripe", labels: "floating", variables: { colorPrimary: value("--color-text"), colorText: style?.color || undefined, colorTextPlaceholder: value("--color-text-tertiary"), colorBackground: value("--color-background-primary-soft"), colorDanger: value("--color-text-danger"), fontFamily: style?.fontFamily || undefined, fontSizeBase: value("--text-sm"), borderRadius: value("--radius-md"), spacingUnit: value("--spacing") } }; }
function stripeClientQuery(accountId: string) { return { queryKey: ["consumer-billing-setup", accountId, "stripe-client"], queryFn: async ({ signal }: { signal?: AbortSignal }) => { const response = await client.safeGet<{ publishable_key: string; currency: string }>("/payments/stripe_client_bootstrap", { parameters: { query: { account_id: accountId } }, signal }); return { stripe: response.publishable_key, currency: response.currency }; }, staleTime: Infinity, retry: false }; }
function initializeStripeClient(): void {}
export { initializeStripeClient as n, stripeClientQuery as r, stripeAppearance as t };
