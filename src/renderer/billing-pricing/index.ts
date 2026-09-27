import "@rchunk/rolldown-runtime";
import "@rchunk/app-shared";
import { rJt as apiClient } from "@rchunk/app-initial";
interface PricingConfig { country_code: string; currency_config: { symbol_code?: string | null; pricing_rollout_gate?: string | null; [key: string]: unknown } }
interface PricingApi { safeGet<Response>(path: string, options: Record<string, unknown>): Promise<Response> }
const client = apiClient as unknown as PricingApi;
const EU_COUNTRIES = new Set("AD AT AX BE BG CH CY CZ DE DK EE ES FI FR GB GF GP GR HR HU IE IS IT LI LT LU LV MC ME MF MQ MT NL NO PF PL PT RE RO RS SE SI SK SM VA XK YT".split(" "));
async function fetchPricingConfig(code: string, signal?: AbortSignal): Promise<PricingConfig> { return client.safeGet("/checkout_pricing_config/configs/{country_code}", { parameters: { path: { country_code: code } }, signal }); }
async function resolvePricingConfig({ country, currency, isPricingEnabled, signal }: { country?: string; currency?: string; isPricingEnabled(gate: string): boolean; signal?: AbortSignal }): Promise<PricingConfig> { const countryCode = country?.trim().toUpperCase(); const currencyCode = currency?.trim().toUpperCase(); const fallback = countryCode && EU_COUNTRIES.has(countryCode) ? "EU" : "US"; let config: PricingConfig | null = null; if (countryCode) { try { config = await fetchPricingConfig(countryCode, signal); } catch { config = null; } } if (currencyCode && config?.currency_config.symbol_code !== currencyCode) config = await fetchPricingConfig(currencyCode, signal); if (config == null) return fetchPricingConfig(fallback, signal); const gate = config.currency_config.pricing_rollout_gate; return gate && !isPricingEnabled(gate) ? fetchPricingConfig(fallback, signal) : config; }
function initializeBillingPricing(): void {}
export { initializeBillingPricing as n, resolvePricingConfig as t };
