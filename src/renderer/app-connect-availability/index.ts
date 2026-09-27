import "@rchunk/rolldown-runtime";
import "@rchunk/app-shared";
import "@rchunk/app-initial";
import "@rchunk/app-connect-modal";
interface Connector { id: string; [key: string]: unknown }
interface AvailabilityInput { appId: string; availableAppIds?: Iterable<string>; companionConnectorIds: string[]; connectors?: Connector[]; getLink?(id: string): Promise<unknown>; primaryLink?: unknown }
async function resolve(input: AvailabilityInput): Promise<Connector[]> { const primaryLink = input.primaryLink ?? await input.getLink?.(input.appId); if (primaryLink != null) return []; const available = new Set(input.availableAppIds ?? []), companions = new Set(input.companionConnectorIds.filter(id => available.has(id))); return (input.connectors ?? []).filter(connector => companions.has(connector.id)); }
async function i(input: AvailabilityInput): Promise<Connector[]> { return resolve(input); }
async function n(input: AvailabilityInput): Promise<Connector[]> { return resolve(input); }
function r(): void {}
function t(): void {}
export { i, n, r, t };
