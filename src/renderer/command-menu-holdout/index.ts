import "@rchunk/rolldown-runtime";
import "@rchunk/app-initial";
import "@rchunk/app-shared";
interface DynamicConfig { details?: { reason?: string }; get(key: string, fallback: boolean): boolean }
function shouldSuppressAds(client: { getDynamicConfig?(id: string): DynamicConfig }): boolean { const config = client.getDynamicConfig?.("1648954249"); return config?.get("suppress_ads", false) ?? false; }
function initialize(): void {}
export { initialize as n, shouldSuppressAds as t };
