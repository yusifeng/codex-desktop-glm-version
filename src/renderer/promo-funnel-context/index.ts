export interface PromoFunnelCheckoutContext {
  accountId?: string;
  location: string;
  organizationId?: string;
  promoCampaignId?: string;
  promoCode?: string;
  referralCode?: string;
}

interface StoredPromoFunnelCheckoutContext extends PromoFunnelCheckoutContext {
  createdAt: number;
  expiresAt: number;
}

const STORAGE_KEY = "oai/apps/promoFunnelCheckoutContext";
const OPTIONAL_STRING_FIELDS = [
  "accountId",
  "organizationId",
  "promoCampaignId",
  "promoCode",
  "referralCode",
] as const;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value != null && !Array.isArray(value);
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function nonEmptyString(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function optionalString(
  value: Record<string, unknown>,
  key: string,
): string | undefined {
  return key in value ? nonEmptyString(value[key]) ?? undefined : undefined;
}

function hasInvalidOptionalString(
  value: Record<string, unknown>,
  key: string,
): boolean {
  return key in value && nonEmptyString(value[key]) == null;
}

function parseStoredContext(value: unknown): StoredPromoFunnelCheckoutContext | null {
  if (!isRecord(value)) return null;
  const location = nonEmptyString(value.location);
  if (
    location == null ||
    !isFiniteNumber(value.createdAt) ||
    !isFiniteNumber(value.expiresAt) ||
    OPTIONAL_STRING_FIELDS.some((key) => hasInvalidOptionalString(value, key))
  ) {
    return null;
  }
  return {
    accountId: optionalString(value, "accountId"),
    createdAt: value.createdAt,
    expiresAt: value.expiresAt,
    location,
    organizationId: optionalString(value, "organizationId"),
    promoCampaignId: optionalString(value, "promoCampaignId"),
    promoCode: optionalString(value, "promoCode"),
    referralCode: optionalString(value, "referralCode"),
  };
}

function withExpiration(
  context: PromoFunnelCheckoutContext,
  now = Date.now(),
): StoredPromoFunnelCheckoutContext {
  return { ...context, createdAt: now, expiresAt: now + 86_400_000 };
}

function readUnexpiredContext(
  value: unknown,
  now = Date.now(),
): PromoFunnelCheckoutContext | null {
  const parsed = parseStoredContext(value);
  if (parsed == null || now >= parsed.expiresAt) return null;
  return {
    accountId: parsed.accountId,
    location: parsed.location,
    organizationId: parsed.organizationId,
    promoCampaignId: parsed.promoCampaignId,
    promoCode: parsed.promoCode,
    referralCode: parsed.referralCode,
  };
}

function storePromoFunnelCheckoutContext(
  context: PromoFunnelCheckoutContext,
): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(withExpiration(context)));
  } catch {}
}

function consumePromoFunnelCheckoutContext(): PromoFunnelCheckoutContext | null {
  let value: unknown = null;
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    value = stored == null ? null : JSON.parse(stored);
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {}
  return readUnexpiredContext(value);
}

function initializePromoFunnelContext(): void {}

export {
  initializePromoFunnelContext as n,
  storePromoFunnelCheckoutContext as r,
  consumePromoFunnelCheckoutContext as t,
};
