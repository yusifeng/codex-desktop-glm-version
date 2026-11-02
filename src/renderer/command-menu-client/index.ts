import "@rchunk/rolldown-runtime";
import { cJt as initializeApiClient, rJt as apiClient } from "@rchunk/app-initial";
import { vW as expectedAccountHeader, wL as initializeHeadersRuntime } from "@rchunk/app-shared";

interface TrustedContact { email?: string | null; name?: string | null; phone_number?: string | null; relationship?: string | null }
interface ApiClient { safeGet(path: string, options: Record<string, unknown>): Promise<Record<string, unknown>> }
function trustedContactHeaders(accountId: string): Record<string, string> { return { "ChatGPT-Account-ID": accountId, [expectedAccountHeader]: accountId }; }
function normalizeTrustedContact(contact: TrustedContact, fallbackName: string): Record<string, unknown> | null { const email = contact.email?.trim(); if (!email) return null; return { name: contact.name?.trim() || fallbackName, email, phone_number: contact.phone_number ?? null, relationship: contact.relationship ?? null }; }
function trustedContactQueries(userId: string, accountId: string): Record<string, Record<string, unknown>> { const queryKey = ["trusted-contact", userId, accountId]; const additionalHeaders = trustedContactHeaders(accountId); const client = apiClient as ApiClient; return { enabled: { queryKey: [...queryKey, "enabled"], queryFn: async ({ signal }: { signal?: AbortSignal }) => (await client.safeGet("/trusted_contact/enabled", { additionalHeaders, signal })).enabled, staleTime: 30_000, retry: false }, list: { queryKey: [...queryKey, "list"], queryFn: ({ signal }: { signal?: AbortSignal }) => client.safeGet("/trusted_contact", { additionalHeaders, signal }), staleTime: 30_000, retry: false } }; }
let initialized = false;
function initialize(): void { if (initialized) return; initializeHeadersRuntime(); initializeApiClient(); initialized = true; }
initialize();
export { trustedContactQueries as i, normalizeTrustedContact as n, initialize as r, trustedContactHeaders as t };
