// ChatGPT ads placement and business-agent policy. Release chunk: placement-policy-c8f98920d800.js.
import "@rchunk/rolldown-runtime";
import * as appSharedChunk from "@rchunk/app-shared";
import * as appInitialChunk from "@rchunk/app-initial";
import * as holdoutChunk from "@rchunk/command-menu-holdout";

interface BusinessAgentTarget {
  business_agent_id?: string;
  business_agent_gizmo_id?: string;
  business_agent_conversation_starters?: unknown[];
}
interface AdCard {
  ad_data_token: string;
  format?: string;
  business_agent_target?: BusinessAgentTarget | null;
  [key: string]: unknown;
}
interface SingleAdvertiserUnit {
  type: "single_advertiser_ad_unit";
  carousel_cards: AdCard[];
  ad_cards?: AdCard[];
  ads: Array<{ ad_card?: AdCard; carousel_card: AdCard }>;
  [key: string]: unknown;
}
interface MultiAdvertiserUnit {
  type: "multi_advertiser_ad_unit";
  carousel_cards: AdCard[];
  ad_cards?: AdCard[];
  ads: Array<{ ad_card?: AdCard; carousel_card: AdCard }>;
  [key: string]: unknown;
}
type AdUnit = SingleAdvertiserUnit | MultiAdvertiserUnit;
interface PolicyConfig {
  imageStreamingEnabled?: boolean;
  [key: string]: unknown;
}
interface PolicyState {
  loading: boolean;
  enabled: boolean;
  optedOut: boolean;
  config?: PolicyConfig | null;
}
interface PlacementProps {
  isImageGenerationTurn: boolean;
  hasAssistantMessage: boolean;
  hasCustomAgentMessage: boolean;
  isAsyncCorrection: boolean;
  isSuppressedConversation: boolean;
}
interface PlacementInput {
  props: PlacementProps;
  hasAd: boolean;
  hasResponse: boolean;
  hasNoContentResponse: boolean;
  hasUnsupportedTarget: boolean;
  hidden: boolean;
  assistantCompleted: boolean;
  slotTimedOut: boolean;
  policy: PolicyState;
}
interface StoreLike {
  get(signal: unknown, parameter?: unknown): unknown;
}
interface AppSharedRuntime {
  FX(): void;
  QI(): void;
  ZI: unknown;
  dZ(...args: unknown[]): unknown;
  rZ(...args: unknown[]): unknown;
  sZ(...args: unknown[]): unknown;
}
interface AppInitialRuntime {
  [key: string]: unknown;
}
interface HoldoutRuntime {
  n(): void;
  t(scope: unknown): boolean;
}

const shared = appSharedChunk as unknown as AppSharedRuntime;
const initial = appInitialChunk as unknown as AppInitialRuntime;
const holdout = holdoutChunk as unknown as HoldoutRuntime;

function flattenAdCards(unit: AdUnit): AdCard[] {
  if (unit.type === "single_advertiser_ad_unit") {
    if (
      unit.ad_cards?.length &&
      !unit.ad_cards.every((card) => card.format === "image_card_v1")
    ) {
      return unit.ad_cards;
    }
    return unit.carousel_cards;
  }
  return unit.ads.map((entry) => entry.ad_card ?? entry.carousel_card);
}

function findAdCardIndex(
  unit: AdUnit,
  target: AdCard,
  fallbackIndex: number,
): number {
  const cards = flattenAdCards(unit);
  const directIndex = cards.indexOf(target);
  if (directIndex >= 0) return directIndex;
  if (cards[fallbackIndex]?.ad_data_token === target.ad_data_token)
    return fallbackIndex;
  const matches = (card: AdCard | undefined) =>
    card === target || card?.ad_data_token === target.ad_data_token;
  const cardIndex = cards.findIndex(matches);
  if (cardIndex >= 0) return cardIndex;
  if (unit.type === "multi_advertiser_ad_unit") {
    const adIndex = unit.ads.findIndex(
      (entry) => matches(entry.ad_card) || matches(entry.carousel_card),
    );
    return adIndex >= 0 ? adIndex : fallbackIndex;
  }
  const carouselIndex = unit.carousel_cards.findIndex(matches);
  if (carouselIndex >= 0) return carouselIndex;
  const imageIndex = unit.ad_cards?.findIndex(matches) ?? -1;
  return imageIndex >= 0 ? imageIndex : fallbackIndex;
}

function hasBusinessAgentTarget(unit: AdUnit): boolean {
  if (unit.type === "single_advertiser_ad_unit") {
    return [...unit.carousel_cards, ...(unit.ad_cards ?? [])].some(
      (card) => card.business_agent_target != null,
    );
  }
  return unit.ads.some(
    (entry) =>
      entry.carousel_card.business_agent_target != null ||
      entry.ad_card?.business_agent_target != null,
  );
}

function targetsConflict(
  left: BusinessAgentTarget | null | undefined,
  right: BusinessAgentTarget | null | undefined,
): boolean {
  return (
    left != null &&
    right != null &&
    (left.business_agent_id !== right.business_agent_id ||
      left.business_agent_gizmo_id !== right.business_agent_gizmo_id)
  );
}

function mergeBusinessTarget(card: AdCard, alternatives: AdCard[]): AdCard {
  const alternativeTarget = alternatives.find(
    (candidate) => candidate.ad_data_token === card.ad_data_token,
  )?.business_agent_target;
  const target = card.business_agent_target;
  if (alternativeTarget == null) return card;
  if (target == null)
    return { ...card, business_agent_target: alternativeTarget };
  if (
    target.business_agent_conversation_starters != null ||
    !alternativeTarget.business_agent_conversation_starters?.length
  ) {
    return card;
  }
  return {
    ...card,
    business_agent_target: {
      ...target,
      business_agent_conversation_starters:
        alternativeTarget.business_agent_conversation_starters,
    },
  };
}

function normalizeBusinessTargets(unit: AdUnit): AdUnit | null {
  if (!hasBusinessAgentTarget(unit)) return unit;
  if (unit.type === "single_advertiser_ad_unit") {
    const carouselCards = unit.carousel_cards;
    const adCards = unit.ad_cards;
    const targeted = [...carouselCards, ...(adCards ?? [])].filter(
      (card) => card.business_agent_target != null,
    );
    for (const card of targeted) {
      if (!card.ad_data_token.trim()) return null;
      if (!adCards?.length) continue;
      const carouselMatches = carouselCards.filter(
        (candidate) => candidate.ad_data_token === card.ad_data_token,
      );
      const adMatches = adCards.filter(
        (candidate) => candidate.ad_data_token === card.ad_data_token,
      );
      if (
        adMatches.length !== 1 ||
        (carouselCards.length > 0 && carouselMatches.length !== 1) ||
        targetsConflict(
          carouselMatches[0]?.business_agent_target,
          adMatches[0]?.business_agent_target,
        )
      ) {
        return null;
      }
    }
    if (!adCards?.length || carouselCards.length === 0) return unit;
    const normalizedCarousel = carouselCards.map((card) =>
      mergeBusinessTarget(card, adCards),
    );
    const normalizedAds = adCards.map((card) =>
      mergeBusinessTarget(card, carouselCards),
    );
    return normalizedCarousel.some(
      (card, index) => card !== carouselCards[index],
    ) || normalizedAds.some((card, index) => card !== adCards[index])
      ? { ...unit, carousel_cards: normalizedCarousel, ad_cards: normalizedAds }
      : unit;
  }

  const tokenCounts = new Map<string, number>();
  for (const entry of unit.ads) {
    for (const token of new Set([
      entry.carousel_card.ad_data_token,
      entry.ad_card?.ad_data_token,
    ])) {
      if (token?.trim())
        tokenCounts.set(token, (tokenCounts.get(token) ?? 0) + 1);
    }
  }
  for (const entry of unit.ads) {
    if (
      entry.carousel_card.business_agent_target == null &&
      entry.ad_card?.business_agent_target == null
    ) {
      continue;
    }
    const token = entry.carousel_card.ad_data_token;
    if (
      !token.trim() ||
      tokenCounts.get(token) !== 1 ||
      (entry.ad_card != null && entry.ad_card.ad_data_token !== token) ||
      targetsConflict(
        entry.carousel_card.business_agent_target,
        entry.ad_card?.business_agent_target,
      )
    ) {
      return null;
    }
  }
  const normalized = unit.ads.map((entry) => {
    if (!entry.ad_card) return entry;
    const carouselCard = mergeBusinessTarget(entry.carousel_card, [
      entry.ad_card,
    ]);
    const adCard = mergeBusinessTarget(entry.ad_card, [entry.carousel_card]);
    return carouselCard === entry.carousel_card && adCard === entry.ad_card
      ? entry
      : { ...entry, carousel_card: carouselCard, ad_card: adCard };
  });
  return normalized.some((entry, index) => entry !== unit.ads[index])
    ? { ...unit, ads: normalized }
    : unit;
}

function removeBusinessTargetedCards(unit: AdUnit): AdUnit | null {
  if (unit.type === "multi_advertiser_ad_unit") {
    const ads = unit.ads.filter(
      (entry) =>
        entry.carousel_card.business_agent_target == null &&
        entry.ad_card?.business_agent_target == null,
    );
    return ads.length > 0 ? { ...unit, ads } : null;
  }
  const targetedTokens = new Set(
    [...unit.carousel_cards, ...(unit.ad_cards ?? [])]
      .filter((card) => card.business_agent_target != null)
      .map((card) => card.ad_data_token),
  );
  const filtered: SingleAdvertiserUnit = {
    ...unit,
    carousel_cards: unit.carousel_cards.filter(
      (card) => !targetedTokens.has(card.ad_data_token),
    ),
    ad_cards: unit.ad_cards?.filter(
      (card) => !targetedTokens.has(card.ad_data_token),
    ),
  };
  return flattenAdCards(filtered).length > 0 ? filtered : null;
}

function sanitizeAdContent(scope: StoreLike, content: unknown): AdUnit | null {
  const isAdContent = initial.BKt as
    ((value: unknown) => value is AdUnit) | undefined;
  if (!isAdContent?.(content)) return null;
  if (!hasBusinessAgentTarget(content)) {
    return flattenAdCards(content).length > 0 ? content : null;
  }
  return scope.get(businessAgentExperimentSignal)
    ? normalizeBusinessTargets(content)
    : removeBusinessTargetedCards(content);
}

function isAdsPolicyEnabled(scope: StoreLike): boolean {
  const state = scope.get(adsPolicyStateSignal) as PolicyState;
  return !state.loading && state.enabled && !state.optedOut;
}

function computePlacementState(input: PlacementInput) {
  const reject = (rejectionReason: unknown) => ({
    state: "rejected",
    rejectionReason,
  });
  const { props, policy } = input;
  if (input.hidden) return { state: "hidden", rejectionReason: null };
  if (policy.loading) return { state: "policy_loading", rejectionReason: null };
  const imageStreaming =
    input.hasAd &&
    props.isImageGenerationTurn &&
    (!input.assistantCompleted || !props.hasAssistantMessage) &&
    !props.hasCustomAgentMessage &&
    !props.isAsyncCorrection &&
    !props.isSuppressedConversation &&
    policy.enabled &&
    policy.config?.imageStreamingEnabled === true &&
    !policy.optedOut;
  if (!input.assistantCompleted && !imageStreaming) {
    return { state: "streaming", rejectionReason: null };
  }
  if (input.hasNoContentResponse)
    return { state: "hidden", rejectionReason: null };
  if (!input.hasResponse) {
    return {
      state: input.slotTimedOut ? "hidden" : "waiting",
      rejectionReason: null,
    };
  }
  if (!input.hasAd) return reject("NON_DISPLAYABLE_CONTENT");
  if (props.hasCustomAgentMessage) return reject("CUSTOM_AGENT");
  if (props.isAsyncCorrection) return reject("ASYNC_CORRECTION");
  if (props.isSuppressedConversation || input.hasUnsupportedTarget) {
    return reject("UNSUPPORTED_SURFACE");
  }
  if (!policy.enabled) return reject("BAZAAR_DISABLED");
  if (!props.hasAssistantMessage && !imageStreaming)
    return reject("MISSING_ASSISTANT_MESSAGE");
  if (input.slotTimedOut) return reject("LATE_ARRIVAL");
  if (policy.optedOut) return reject("ADS_OPT_OUT");
  return { state: "render", rejectionReason: null };
}

function initializeNoop(): void {}

let responseContentSignal: unknown;
let currentAdMessageSignal: unknown;
let businessAgentExperimentSignal: unknown;
let adsPolicyStateSignal: unknown;

function initializeAdsPlacementPolicy(): void {
  const derive = shared.rZ;
  const computed = shared.sZ;
  responseContentSignal ??= derive(shared.ZI, () => null);
  currentAdMessageSignal ??= derive(shared.ZI, () => null);
  businessAgentExperimentSignal ??= computed(shared.ZI, () => false);
  adsPolicyStateSignal ??= computed(shared.ZI, () => ({
    config: null,
    loading: true,
    enabled: false,
    optedOut: false,
  }));
  holdout.n();
  shared.FX();
  shared.QI();
}

export {
  sanitizeAdContent as a,
  currentAdMessageSignal as c,
  initializeNoop as d,
  computePlacementState as i,
  flattenAdCards as l,
  businessAgentExperimentSignal as n,
  initializeAdsPlacementPolicy as o,
  responseContentSignal as r,
  isAdsPolicyEnabled as s,
  adsPolicyStateSignal as t,
  findAdCardIndex as u,
};
