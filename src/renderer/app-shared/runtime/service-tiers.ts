export const PRIORITY_SERVICE_TIER = "priority";
export const FAST_SERVICE_TIER = "fast";
export const ULTRAFAST_SERVICE_TIER = "ultrafast";
export const DEFAULT_SERVICE_TIER = "default";
export const DEFAULT_SERVICE_TIER_SETTING = "default-service-tier";

export type KnownServiceTierKind = "fast" | "ultrafast";

export interface ModelServiceTier extends Record<string, unknown> {
  id: string;
  name: string;
}

export interface ServiceTierModel extends Record<string, unknown> {
  defaultServiceTier?: string | null;
  serviceTiers?: readonly ModelServiceTier[] | null;
}

/** 原 `YGe` / 压缩导出 `Az`。 */
export function classifyServiceTier(
  id: string,
  name?: string | null,
): KnownServiceTierKind | null {
  const normalizedName = name?.trim().toLowerCase();
  if (
    id === PRIORITY_SERVICE_TIER ||
    id === FAST_SERVICE_TIER ||
    normalizedName === FAST_SERVICE_TIER
  ) {
    return FAST_SERVICE_TIER;
  }
  return id === ULTRAFAST_SERVICE_TIER || normalizedName === ULTRAFAST_SERVICE_TIER
    ? ULTRAFAST_SERVICE_TIER
    : null;
}

function resolveServiceTier(
  model: ServiceTierModel | null | undefined,
  tier: string | null | undefined,
): ModelServiceTier | null {
  if (tier == null) return null;
  return tier === FAST_SERVICE_TIER
    ? findFastServiceTier(model)
    : (model?.serviceTiers?.find((candidate) => candidate.id === tier) ?? null);
}

/** 原 `ZGe` / 压缩导出 `kz`。 */
export function findFastServiceTier(
  model: ServiceTierModel | null | undefined,
): ModelServiceTier | null {
  return (
    model?.serviceTiers?.find(
      (tier) =>
        classifyServiceTier(tier.id, tier.name) === FAST_SERVICE_TIER ||
        tier.name.trim().toLowerCase() === PRIORITY_SERVICE_TIER,
    ) ?? null
  );
}

/** 原 `QGe` / 压缩导出 `Pz`。 */
export function supportsServiceTier(
  model: ServiceTierModel | null | undefined,
  tier: string | null | undefined,
): boolean {
  return resolveServiceTier(model, tier) != null;
}

/** 原 `$Ge` / 压缩导出 `jz`。 */
export function resolveServiceTierId(
  model: ServiceTierModel | null | undefined,
  tier: string | null | undefined,
): string | null {
  return resolveServiceTier(model, tier)?.id ?? null;
}

/** 原 `eKe` / 压缩导出 `Mz`。 */
export function resolveSelectedServiceTier(
  model: ServiceTierModel | null | undefined,
  selectedTier: string | null | undefined,
  enabled = true,
): string | null {
  if (!enabled) return null;
  if (selectedTier == null) {
    const defaultTier = model?.defaultServiceTier ?? null;
    return defaultTier == null ? null : resolveServiceTierId(model, defaultTier);
  }
  return selectedTier === DEFAULT_SERVICE_TIER ? null : selectedTier;
}

/** 原 `gU` / 压缩导出 `Nz`。 */
export function initializeServiceTiers(): void {}
