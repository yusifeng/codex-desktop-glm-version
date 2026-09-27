import "@rchunk/rolldown-runtime";
import "@rchunk/app-initial";
import "@rchunk/app-shared";

interface TrustedContact { email?: string | null; name?: string | null; phone_number?: string | null; relationship?: string | null }
interface ApiClient { safeGet(path: string, options: Record<string, unknown>): Promise<Record<string, unknown>> }
function trustedContactHeaders(accountId: string): Record<string, string> { return { "ChatGPT-Account-ID": accountId, "X-OpenAI-Expected-Account-Id": accountId }; }
function normalizeTrustedContact(contact: TrustedContact, fallbackName: string): Record<string, unknown> | null { const email = contact.email?.trim(); if (!email) return null; return { name: contact.name?.trim() || fallbackName, email, phone_number: contact.phone_number ?? null, relationship: contact.relationship ?? null }; }
function trustedContactQueries(api: ApiClient, accountId: string, userId: string): Record<string, Record<string, unknown>> { const queryKey = ["trusted-contact", accountId, userId]; const additionalHeaders = trustedContactHeaders(userId); return { enabled: { queryKey: [...queryKey, "enabled"], queryFn: async ({ signal }: { signal?: AbortSignal }) => (await api.safeGet("/trusted_contact/enabled", { additionalHeaders, signal })).enabled, staleTime: 30_000, retry: false }, list: { queryKey: [...queryKey, "list"], queryFn: ({ signal }: { signal?: AbortSignal }) => api.safeGet("/trusted_contact", { additionalHeaders, signal }), staleTime: 30_000, retry: false } }; }
function initialize(): void {}
export { trustedContactQueries as i, normalizeTrustedContact as n, initialize as r, trustedContactHeaders as t };
