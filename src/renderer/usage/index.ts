import "@rchunk/rolldown-runtime";
import * as appShared from "@rchunk/app-shared";
import * as appInitial from "@rchunk/app-initial";
import * as appPrimary from "@rchunk/app-primary";
import { accountSpendKey } from "../app-primary/runtime/account-spend-key";

type HostId = string;
type ModelSlug = string;

interface RateLimitUpsell {
  banner_type: string;
  blocked_model_slug?: string | null;
  dismissal_policy?: { scope: "account" | "thread" } | null;
  fallback_model_slugs?: string[];
  model_slug?: string | null;
  presentation?: "dismissible" | "inline";
  priority?: number;
}

interface RateLimitStatus {
  account_id?: string | null;
  rate_limit_upsell?: RateLimitUpsell | null;
  user_id?: string | null;
  [key: string]: unknown;
}

interface ConversationUsageState {
  dataUpdatedAt: number;
  notice?: { dismissed: boolean; key: string } | null;
  usageKey: string;
  [key: string]: unknown;
}

interface ConversationRecord { [key: string]: unknown }
interface TurnRecord {
  params: { collaborationMode?: { settings: { model?: string | null } } | null; model?: string | null; turnTrigger?: string | null };
  turnId?: string | null;
}

interface UsageBannerProps {
  canShowUsageBanners?: boolean;
  hostId?: HostId;
  imageGenerationLimit?: unknown;
  modelName?: string;
  onDismissImageGenerationLimit?(): void;
  rateLimit?: RateLimitStatus | null;
  rateLimitWarningThreshold?: number | null;
  resetAt?: string | number | Date | null;
  selectedModel?: ModelSlug | null;
  showBackendRateLimitUpsell?: boolean;
  showLunaReserveNotice?: boolean;
  showModelLimit?: boolean;
  showUpsell?: boolean;
  showWorkspaceUsageLimit?: boolean;
}

interface ScopeApi { set(signal: unknown, parameter: unknown, value: unknown): void }
interface ConversationService {
  addNotificationCallback(event: string, callback: (event: { params: { threadId: string; turn: { id?: string } } }) => void): (() => void) | void;
  getConversation(id: string): ConversationRecord | null | undefined;
}

interface UsageRuntime {
  AppScope: unknown;
  ComposerScope: unknown;
  UsageBannerPresentation: unknown;
  ModelLimitBanner: unknown;
  RateLimitBanner: unknown;
  conversationServiceSignal: unknown;
  conversationUsageFamily: unknown;
  dismissedBannerFamily: unknown;
  imageGenerationContextFamily: unknown;
  imageRateLimitQuery(input: Record<string, unknown>, options: { enabled: boolean }): { data?: RateLimitStatus };
  localHostId: string;
  modelListQuery(options: { enabled: boolean; hostId: string }): { data?: { models?: Array<{ hidden?: boolean; model: string }> } };
  modelSelectionFamily: unknown;
  usagePresentationContextSignal: unknown;
  useAuth(): { accountId?: string | null; userId?: string | null };
  useCurrentAccount(): { data?: { id?: string | null }; isError: boolean; isLoading: boolean };
  useFamilyValue<Value>(family: unknown, parameter: unknown): Value;
  useScope(scope: unknown): ScopeApi;
  useSignalValue<Value>(signal: unknown): Value;
  createDismissalKey(scope: ScopeApi, status: RateLimitStatus, context: string | null): string | null;
  dismissConversationNotice(scope: ScopeApi, conversationId: string | null, state: ConversationUsageState): void;
  getConversationId(scope: ScopeApi): string | null;
  getLatestTurn(conversation: ConversationRecord): TurnRecord | null;
  getRateLimitWarningKey(status: RateLimitStatus): string | null;
  isIdentityCurrent(input: Record<string, unknown>): boolean;
  isLunaReserveAvailable: unknown;
  markBannerShown(scope: ScopeApi, key: string | null): void;
  markWarningDismissed(scope: ScopeApi, warningKey: string, threshold: number): void;
}

const shared = appShared as unknown as {
  BX<Value>(family: unknown, parameter: unknown): Value;
  HX<Value>(signal: unknown): Value;
  I3(): appShared.JsxRuntime;
  LX(scope: unknown): ScopeApi;
  ZI: unknown;
  e6(): appShared.ReactRuntime;
};
const initial = appInitial as unknown as {
  F8(scope: ScopeApi, conversationId: string | null, state: ConversationUsageState): void;
  Fht(scope: ScopeApi): string | null;
  LN: unknown;
  Min(conversation: ConversationRecord): TurnRecord | null;
  N6t(): { accountId?: string | null; userId?: string | null };
  P8: unknown; R8: unknown; X8: unknown; Z8: unknown; g0t: unknown; kht: unknown; vZt: unknown;
  _0t(scope: ScopeApi, status: RateLimitStatus, context: string | null): string | null;
  fgn(scope: ScopeApi, percent: number, threshold: number): void;
  k5(input: Record<string, unknown>): boolean;
  u0t(input: Record<string, unknown>, options: { enabled: boolean }): { data?: RateLimitStatus };
  ugn: string;
  uht(): { data?: { id?: string | null }; isError: boolean; isLoading: boolean };
  w8(options: { enabled: boolean; hostId: string }): { data?: { models?: Array<{ hidden?: boolean; model: string }> } };
  y0t(scope: ScopeApi, key: string | null): void;
  [key: string]: unknown;
};
const primary = appPrimary as unknown as {
  Dm: unknown; Em: unknown; wm: unknown;
  Im(scope: ScopeApi, warningKey: string, threshold: number): void;
  [key: string]: unknown;
};

const runtime: UsageRuntime = {
  AppScope: shared.ZI,
  ComposerScope: initial.kht,
  UsageBannerPresentation: initial.LN,
  ModelLimitBanner: primary.Em,
  RateLimitBanner: primary.Dm,
  conversationServiceSignal: initial.vZt,
  conversationUsageFamily: initial.R8,
  dismissedBannerFamily: initial.g0t,
  imageGenerationContextFamily: initial.X8,
  imageRateLimitQuery: initial.u0t,
  localHostId: initial.ugn,
  modelListQuery: initial.w8,
  modelSelectionFamily: initial.P8,
  usagePresentationContextSignal: primary.wm,
  useAuth: initial.N6t,
  useCurrentAccount: initial.uht,
  useFamilyValue: shared.BX,
  useScope: shared.LX,
  useSignalValue: shared.HX,
  createDismissalKey: initial._0t,
  dismissConversationNotice: initial.F8,
  getConversationId: initial.Fht,
  getLatestTurn: initial.Min,
  getRateLimitWarningKey: accountSpendKey,
  isIdentityCurrent: initial.k5,
  isLunaReserveAvailable: initial.Z8,
  markBannerShown: initial.y0t,
  markWarningDismissed: primary.Im,
};

let React: appShared.ReactRuntime;
let jsx: appShared.JsxRuntime;
let initialized = false;

function initializeUsageBanner(): void {
  if (initialized) return;
  const initializers = [appShared.FX, appShared.QI, initial.M6t, initial.rht, initial.O5, initial.HZt, initial.Iin, initial.L8, initial.RN, initial.S8, initial.d0t, initial.v0t, initial.Zrn, primary.Fm, primary.Om, primary.Tm];
  for (const initialize of initializers) if (typeof initialize === "function") initialize();
  React = shared.e6();
  jsx = shared.I3();
  initialized = true;
}

function chooseBannerKind(props: UsageBannerProps): "blocking-limit" | "image-generation-limit" | "model-limit" | "warning" {
  if (props.showUpsell || props.showWorkspaceUsageLimit) return "blocking-limit";
  if (props.imageGenerationLimit != null) return "image-generation-limit";
  if (props.showModelLimit) return "model-limit";
  return "warning";
}

function isCurrentRateLimitIdentity(rateLimitStatus: RateLimitStatus | null | undefined): boolean {
  if (rateLimitStatus == null) return false;
  const { accountId, userId } = runtime.useAuth();
  const currentAccount = runtime.useCurrentAccount();
  return runtime.isIdentityCurrent({ authAccountId: accountId, authUserId: userId, currentAccountId: currentAccount.data?.id === accountId ? currentAccount.data.id : null, isCurrentAccountError: currentAccount.isError, isCurrentAccountLoading: currentAccount.isLoading, rateLimitStatus });
}

function BackendUpsellForFallbackModel(props: { banner: RateLimitUpsell; bannerKey: string | null; blockedModel: string; children: unknown; fallbackContent: unknown; hostId: string; rateLimitStatus: RateLimitStatus; selectedModel?: string | null }): unknown {
  const scope = runtime.useScope(runtime.ComposerScope);
  const conversationId = runtime.getConversationId(scope);
  const usageState = runtime.useFamilyValue<ConversationUsageState | null>(runtime.conversationUsageFamily, conversationId);
  const conversationService = runtime.useFamilyValue<ConversationService | null>(runtime.conversationServiceSignal, props.hostId);
  const selectedModel = runtime.useFamilyValue<string | null>(runtime.modelSelectionFamily, [conversationId, props.hostId]);
  const models = runtime.modelListQuery({ enabled: false, hostId: props.hostId }).data?.models;
  const canPresent = props.selectedModel != null && selectedModel === props.selectedModel && models?.some((model) => model.model === props.selectedModel && model.hidden !== true) === true;
  React.useEffect(() => {
    if (!canPresent || conversationId == null || usageState?.notice?.key !== props.bannerKey || usageState.notice.dismissed || conversationService == null) return;
    return conversationService.addNotificationCallback("turn/started", ({ params }) => {
      if (params.threadId !== conversationId) return;
      const conversation = conversationService.getConversation(conversationId);
      const turn = conversation == null ? null : runtime.getLatestTurn(conversation);
      const model = turn?.params.collaborationMode?.settings.model ?? turn?.params.model;
      if (turn?.turnId === params.turn.id && turn.params.turnTrigger === "composer" && model != null && model !== props.blockedModel) runtime.dismissConversationNotice(scope, conversationId, usageState);
    });
  }, [canPresent, conversationId, conversationService, props.bannerKey, props.blockedModel, scope, usageState]);
  if (!canPresent || usageState == null) return props.fallbackContent;
  if (props.bannerKey == null) return props.children;
  if (usageState.notice?.key === props.bannerKey && usageState.notice.dismissed) return props.fallbackContent;
  const presentationKey = `${conversationId}:${usageState.usageKey}:${usageState.dataUpdatedAt}:${props.bannerKey}`;
  return jsx.jsx(runtime.UsageBannerPresentation, { banner: props.banner, fallbackContent: props.fallbackContent, onDismiss: () => runtime.dismissConversationNotice(scope, conversationId, usageState), onShown: () => { if (usageState.notice?.key !== props.bannerKey) scope.set(runtime.conversationUsageFamily, conversationId, { ...usageState, notice: { key: props.bannerKey, dismissed: false } }); }, presentationKey, rateLimitStatus: props.rateLimitStatus });
}

function BackendRateLimitUpsell(props: { banner?: RateLimitUpsell | null; fallbackContent: unknown; hostId: string; rateLimitStatus?: RateLimitStatus | null; selectedModel?: string | null }): unknown {
  const scope = runtime.useScope(runtime.ComposerScope);
  const presentationContext = runtime.useSignalValue<unknown>(runtime.usagePresentationContextSignal);
  const dismissalKey = props.rateLimitStatus == null ? null : runtime.createDismissalKey(scope, props.rateLimitStatus, presentationContext == null ? null : JSON.stringify([props.hostId, presentationContext]));
  const dismissed = runtime.useFamilyValue<boolean>(runtime.dismissedBannerFamily, dismissalKey);
  const conversationId = runtime.getConversationId(scope);
  const usageState = runtime.useFamilyValue<ConversationUsageState | null>(runtime.conversationUsageFamily, conversationId);
  const selectedModel = runtime.useFamilyValue<string | null>(runtime.modelSelectionFamily, [conversationId, props.hostId]);
  const models = runtime.modelListQuery({ enabled: false, hostId: props.hostId }).data?.models;
  const banner = props.banner;
  const status = props.rateLimitStatus;
  if (banner == null || status == null || !isCurrentRateLimitIdentity(status) || (banner.presentation === "dismissible" && banner.dismissal_policy?.scope === "thread" && dismissalKey == null)) return props.fallbackContent;
  const presented = dismissed ? props.fallbackContent : jsx.jsx(runtime.UsageBannerPresentation, { banner, fallbackContent: props.fallbackContent, onDismiss: dismissalKey == null ? undefined : () => scope.set(runtime.dismissedBannerFamily, dismissalKey, true), onShown: () => runtime.markBannerShown(scope, dismissalKey), presentationKey: dismissalKey, rateLimitStatus: status });
  const modelMatched = banner.model_slug == null || banner.model_slug === props.selectedModel ? presented : props.fallbackContent;
  if (banner.blocked_model_slug == null) return modelMatched;
  const isFallbackModel = props.selectedModel != null && props.selectedModel !== banner.blocked_model_slug && banner.fallback_model_slugs?.includes(props.selectedModel) === true && selectedModel === props.selectedModel && models?.some((model) => model.model === props.selectedModel && model.hidden !== true) === true && usageState != null && !(dismissalKey != null && usageState.notice?.key === dismissalKey && usageState.notice.dismissed);
  return isFallbackModel ? jsx.jsx(BackendUpsellForFallbackModel, { banner, bannerKey: dismissalKey, blockedModel: banner.blocked_model_slug, fallbackContent: props.fallbackContent, hostId: props.hostId, rateLimitStatus: status, selectedModel: props.selectedModel, children: presented }) : props.fallbackContent;
}

function UsageBanner(props: UsageBannerProps): unknown {
  initializeUsageBanner();
  const hostId = props.hostId ?? runtime.localHostId;
  const scope = runtime.useScope(runtime.AppScope);
  const { accountId, userId } = runtime.useAuth();
  const imageContext = runtime.useFamilyValue<{ completedAtMs?: number; threadId?: string; turnId?: string } | null>(runtime.imageGenerationContextFamily, accountId);
  const lastImageGenerationImpressionKeyRef = React.useRef<string | null>(null);
  const imageGenerationPresentationKey = props.imageGenerationLimit != null && imageContext != null ? JSON.stringify([accountId, userId, imageContext.threadId, imageContext.turnId, imageContext.completedAtMs]) : undefined;
  const imageRateLimit = runtime.imageRateLimitQuery({ accountId, userId, selectedModel: props.selectedModel }, { enabled: props.canShowUsageBanners === true && props.imageGenerationLimit != null }).data;
  const rateLimitStatus = props.imageGenerationLimit != null && !props.showUpsell && !props.showWorkspaceUsageLimit ? (imageRateLimit ?? props.rateLimit) : props.rateLimit;
  const imageBackendUpsell = rateLimitStatus?.rate_limit_upsell?.banner_type === "image_generation_limit_reached";
  const lunaReserveAvailable = runtime.useFamilyValue<boolean>(runtime.isLunaReserveAvailable, hostId);
  const kind = chooseBannerKind(props);
  let fallbackContent: unknown = null;
  if (kind === "blocking-limit" && props.rateLimit != null) fallbackContent = jsx.jsx(runtime.RateLimitBanner, { rateLimitStatus: props.rateLimit, showWorkspaceUsageLimit: props.showWorkspaceUsageLimit });
  else if (kind === "image-generation-limit" && props.imageGenerationLimit != null) fallbackContent = jsx.jsx(runtime.RateLimitBanner, { imageGenerationLimit: props.imageGenerationLimit, imageGenerationPresentationKey, lastImageGenerationImpressionKeyRef, rateLimitStatus: props.rateLimit, onDismissImageGenerationLimit: props.onDismissImageGenerationLimit });
  else if (kind === "model-limit") fallbackContent = jsx.jsx(runtime.ModelLimitBanner, { modelName: props.modelName, resetAt: props.resetAt });
  else if (kind === "warning" && props.rateLimit != null) {
    const warningKey = runtime.getRateLimitWarningKey(props.rateLimit);
    if (props.rateLimitWarningThreshold != null && warningKey != null) fallbackContent = jsx.jsx(runtime.RateLimitBanner, { rateLimitStatus: props.rateLimit, rateLimitWarningThreshold: props.rateLimitWarningThreshold, showWorkspaceUsageLimit: props.showWorkspaceUsageLimit, onDismissWarning: () => runtime.markWarningDismissed(scope, warningKey, props.rateLimitWarningThreshold as number) }, `${warningKey}:${props.rateLimitWarningThreshold}`);
  }
  const backendUpsell = BackendRateLimitUpsell({ banner: rateLimitStatus?.rate_limit_upsell, fallbackContent, hostId, rateLimitStatus, selectedModel: props.selectedModel });
  if (!props.canShowUsageBanners) return null;
  const banner = rateLimitStatus?.rate_limit_upsell;
  if (rateLimitStatus != null && (props.showBackendRateLimitUpsell === true || (props.imageGenerationLimit != null && imageRateLimit?.rate_limit_upsell != null)) && banner != null && (!imageBackendUpsell || (props.imageGenerationLimit != null && kind !== "blocking-limit")) && (banner.banner_type !== "luna_reserve" || (props.showLunaReserveNotice !== false && lunaReserveAvailable))) {
    if ((banner.priority ?? 0) > 0 && fallbackContent != null) return fallbackContent;
    if (backendUpsell == null) return fallbackContent;
    const content = imageBackendUpsell ? jsx.jsx(runtime.UsageBannerPresentation, { banner, fallbackContent, lastImpressionKeyRef: lastImageGenerationImpressionKeyRef, onDismiss: props.onDismissImageGenerationLimit, presentationKey: imageGenerationPresentationKey, rateLimitStatus }, imageGenerationPresentationKey) : backendUpsell;
    return jsx.jsx("div", { className: "empty:hidden [[data-composer-placement=home]>&]:pb-2", children: content });
  }
  return fallbackContent;
}

export { UsageBanner as n, initializeUsageBanner as t };
