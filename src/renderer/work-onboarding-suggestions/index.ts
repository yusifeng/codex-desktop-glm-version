// work-onboarding-suggestions —— ChatGPT Work 首次使用任务建议。
//
// 原版：app/webview/assets/suggestions-92e2efd3926f.js（99.7KB / 3,253 行）。
//
// 唯一导出：WorkOnboardingSuggestions（原 `Ir`）。该边界负责：
//   1. 资格门控（Work 身份、套餐、feature flag、空白 composer、公告状态）；
//   2. temporal/legacy 两种个性化任务数据源与四张静态兜底卡；
//   3. 三卡 carousel、可见性 impression、Try/Tried 状态与恢复链接；
//   4. 创建任务、关联 conversation、dismiss/retry 和六类 analytics 事件。

import "@rchunk/rolldown-runtime";
import * as appSharedChunk from "@rchunk/app-shared";
import * as appInitialChunk from "@rchunk/app-initial";
import "@rchunk/app-primary";
import "@rchunk/color-icon";
import "@rchunk/connector-logo-stack";
import type { JsxRuntime, ReactRuntime } from "@rchunk/app-shared";

export type WorkSuggestionCategory =
  | "artifact"
  | "apps"
  | "automation"
  | "browser"
  | "email"
  | "messaging"
  | "other"
  | "skill"
  | "website";

export type WorkSuggestionInstructionProfile =
  | "app_connection"
  | "artifact"
  | "base"
  | "browser"
  | "email_messaging"
  | "skill"
  | "website";

export interface WorkSuggestionCard {
  id: string;
  category: WorkSuggestionCategory;
  source: "server" | "static";
  label: string;
  description?: string;
  prompt: string;
  instructionProfile: WorkSuggestionInstructionProfile;
  thinkingEffort: "min" | "xhigh";
  developerInstructions?: string;
  taskKey?: string;
}

export interface ServerWorkSuggestion {
  category: WorkSuggestionCategory;
  short_prompt: string;
  long_prompt: string;
  description?: string;
}

export interface WorkOnboardingEligibility {
  hasIdentity: boolean;
  announcementEligible: boolean;
  announcementCompleted: boolean;
  composerEmpty: boolean;
  featureEnabled: boolean;
  isWorkPlan: boolean;
  hasExistingConversations: boolean;
}

export interface WorkOnboardingSuggestionsProps {
  children?: unknown;
  /** 语义重写层的显式状态输入；真实组件从 app stores/query 中读取。 */
  eligibility?: WorkOnboardingEligibility;
  serverCards?: ServerWorkSuggestion[] | null;
  loading?: boolean;
  loadError?: boolean;
  mailProvider?: "google" | "microsoft" | string | null;
  hideAppSuggestions?: boolean;
  triedConversationByPrompt?: Readonly<Record<string, string>>;
}

export interface WorkOnboardingTile extends WorkSuggestionCard {
  href?: string;
  tried: boolean;
}

export interface WorkOnboardingSuggestionsView {
  kind: "work-onboarding-suggestions";
  heading: "See what Work can do";
  ariaBusy: boolean;
  dismissible: boolean;
  loadError: boolean;
  mailProvider: string | null;
  tiles: WorkOnboardingTile[];
}

interface Scope {
  get<Value>(signal: unknown, parameter?: unknown): Value;
  set(signal: unknown, parameter: unknown, value?: unknown): void;
}
interface SharedBindings {
  BX<Value>(family: unknown, parameter: unknown): Value;
  HX<Value>(signal: unknown): Value;
  I3: JsxRuntime | (() => JsxRuntime);
  LX(scope: unknown): Scope;
  QX?(scope: unknown, factory: (parameter: { accountId: string; locale: string; source: "legacy" | "temporal" }) => Record<string, unknown>): unknown;
  ZI: unknown;
  e6: ReactRuntime | (() => ReactRuntime);
  n4?(): { locale?: string };
  pk?: unknown;
}
interface InitialBindings {
  HZ?(): { hasText(): boolean };
  N6t?(): { accountId?: string | null; isLoading?: boolean; userId?: string | null };
  ROt?(scope: Scope, input: Record<string, unknown>): Promise<{ serverConversationId?: string } | null>;
  bqt?: unknown;
  cfn?(): { getExperiment(id: string): { get(key: string, fallback: boolean): boolean } };
  gln?(conversation: unknown): string;
  kht?: unknown;
  o_n?(): (destination: string) => void | Promise<void>;
  rJt?: {
    safeGet(path: string, options: Record<string, unknown>): Promise<Record<string, unknown>>;
    safePost(path: string, options: Record<string, unknown>): Promise<Record<string, unknown>>;
  };
  rqt?(): string;
  vun?: unknown;
  xpn?(scope: Scope, event: unknown, payload: Record<string, unknown>): void;
}
interface AnnouncementsState {
  eligibleAnnouncements?: string[];
  seenAnnouncements?: Record<string, unknown>;
}
interface QueryState<Value> { data?: Value; isError?: boolean; isFetching?: boolean; isPending?: boolean; refetch?(): Promise<unknown> | unknown }

const shared = appSharedChunk as unknown as SharedBindings;
const initial = appInitialChunk as unknown as InitialBindings;
let React: ReactRuntime;
let jsx: JsxRuntime;
let suggestionsQueryFamily: unknown;
let initialized = false;
const ANNOUNCEMENT_ID = "oai/apps/hasCompletedTppOnboarding";

const INSTRUCTION_PROFILE_BY_CATEGORY: Record<WorkSuggestionCategory, WorkSuggestionInstructionProfile> = {
  apps: "app_connection",
  automation: "app_connection",
  email: "email_messaging",
  messaging: "email_messaging",
  other: "base",
  artifact: "artifact",
  browser: "browser",
  skill: "skill",
  website: "website",
};

const STATIC_FALLBACK_CARDS: readonly WorkSuggestionCard[] = [
  {
    category: "website",
    source: "static",
    id: "build-and-deploy-website",
    label: "Build a personal website",
    description: "Create a personalized website based on what you have shared",
    prompt:
      "Based on everything you know about me and what we’ve discussed in past conversations, choose the most useful subject for a personal website. If there isn’t enough context to choose honestly, ask me one focused question about what the site should be for. Then design, build, and host it for me. Make confident choices about the content, structure, and visual style you think I’ll like best, and start creating it now.",
    instructionProfile: "website",
    thinkingEffort: "xhigh",
  },
  {
    category: "email",
    source: "static",
    id: "learn-email-style",
    label: "Help manage my inbox",
    description: "Learn your writing style and help draft replies to unread emails",
    prompt:
      "Use my connected email app. If I haven’t connected one, ask which email provider I use and help me connect it before continuing. Then review the emails I’ve sent over the last three months and learn how my writing changes for different people and situations. Create a reusable email-writing skill that captures those styles, patterns, and preferences. Set up a daily automation that reviews my unread emails and drafts a response to each one in the appropriate style. Never send an email without my explicit confirmation.",
    instructionProfile: "email_messaging",
    thinkingEffort: "min",
  },
  {
    category: "skill",
    source: "static",
    taskKey: "repeatable_work",
    id: "make-work-repeatable",
    label: "Make my work repeatable",
    description: "Turn recurring tasks into skills you can run",
    prompt: "Find a workflow I repeat and turn it into a reusable skill",
    developerInstructions:
      "Look across my past conversations, including older chats, for a workflow I repeat that spans apps, websites, or files. Use only context you can actually access; never invent conversations or examples. If there is not enough evidence to identify a recurring workflow, first call `request_user_input` to ask one focused question about a workflow I repeat and a real example, then wait for my answer before proposing one. Once a workflow is supported by the available history or my answer, show a section titled ‘Workflow I found’ with a plain-language description of the workflow, real supporting examples (2–3 when available), and the background and decisions the skill would preserve. Do not create the skill, call Skill Creator, or continue to any next step in that response. After the evidence is visible, stop and call `request_user_input` to ask: ‘Is this workflow accurate, and should I turn it into a skill?’ Offer two choices: ‘Yes, create it’ and ‘No, revise it’. Do not ask for confirmation in ordinary chat text. Wait for the tool response before doing anything else.\n\nOnly after I explicitly confirm, create it as a reusable skill. Give it a descriptive lowercase kebab-case name in the `your-new-skill` format. Do not stop after saving it. In the same response, show a section titled ‘Try it next’ with a numbered list of exactly 3 concrete requests I could use the skill for in future work. Do not invoke or apply the skill yet. End by asking whether I would like to try one of those three examples, and which one.",
    instructionProfile: "skill",
    thinkingEffort: "min",
  },
  {
    category: "artifact",
    source: "static",
    id: "make-personalized-presentation",
    label: "Make a presentation for me",
    description: "Create a polished slide presentation based on your past conversations",
    prompt:
      "Review our past conversations and choose the topic that would be most useful to turn into a polished slide presentation for me right now. If there isn’t enough context to choose honestly, ask me one focused question about the subject. Then pull together the relevant context, decide on a strong story and structure, write the content, and create the complete presentation with useful visuals. Make confident choices and start creating it now. When it’s ready, give me the finished file and a brief note explaining what you chose and why.",
    instructionProfile: "artifact",
    thinkingEffort: "xhigh",
  },
] as const;

function normalizeServerCard(card: ServerWorkSuggestion, index: number): WorkSuggestionCard {
  return {
    id: `server-${index}-${card.category}`,
    category: card.category,
    source: "server",
    label: card.short_prompt,
    description: card.description,
    prompt: card.long_prompt,
    instructionProfile: INSTRUCTION_PROFILE_BY_CATEGORY[card.category],
    thinkingEffort: card.category === "artifact" || card.category === "website" ? "xhigh" : "min",
  };
}

/** 原 `wt`：可选过滤 apps，并把 artifact 卡稳定地移到末尾。 */
function orderCards(cards: readonly WorkSuggestionCard[], hideApps: boolean): WorkSuggestionCard[] {
  const visible = cards.filter((card) => !hideApps || card.category !== "apps");
  return [
    ...visible.filter((card) => card.category !== "artifact"),
    ...visible.filter((card) => card.category === "artifact"),
  ];
}

function isEligible(eligibility: WorkOnboardingEligibility | undefined): eligibility is WorkOnboardingEligibility {
  return (
    eligibility != null &&
    eligibility.hasIdentity &&
    eligibility.announcementEligible &&
    !eligibility.announcementCompleted &&
    eligibility.composerEmpty &&
    eligibility.featureEnabled &&
    eligibility.isWorkPlan &&
    !eligibility.hasExistingConversations
  );
}

function parseServerCards(response: Record<string, unknown> | undefined): ServerWorkSuggestion[] {
  const raw = response?.raw_json;
  let value: unknown = raw;
  if (typeof raw === "string") {
    try { value = JSON.parse(raw); } catch { value = undefined; }
  }
  const temporal = (response?.tasks ?? (value as { ambitious_tasks?: { tasks?: unknown[] } } | undefined)?.ambitious_tasks?.tasks) as unknown[] | undefined;
  const legacy = (response?.suggestions ?? (value as { suggestions?: unknown[] } | undefined)?.suggestions) as unknown[] | undefined;
  return (temporal ?? legacy ?? []).flatMap((item) => {
    if (item == null || typeof item !== "object") return [];
    const card = item as Record<string, unknown>;
    const category = (card.category ?? card.type) as WorkSuggestionCategory;
    const shortPrompt = (card.short_prompt ?? card.headline) as string;
    const longPrompt = (card.long_prompt ?? card.prompt) as string;
    if (!(category in INSTRUCTION_PROFILE_BY_CATEGORY) || typeof shortPrompt !== "string" || typeof longPrompt !== "string") return [];
    return [{ category, short_prompt: shortPrompt, long_prompt: longPrompt, description: typeof card.description === "string" ? card.description : undefined }];
  });
}

function initializeWorkOnboarding(): void {
  if (initialized) return;
  React = typeof shared.e6 === "function" ? shared.e6() : shared.e6;
  jsx = typeof shared.I3 === "function" ? shared.I3() : shared.I3;
  suggestionsQueryFamily = shared.QX?.(shared.ZI, ({ accountId, source }) => ({
    queryKey: ["merged-web-work-onboarding", accountId, source],
    queryFn: async ({ signal }: { signal?: AbortSignal }) => {
      const headers = { "ChatGPT-Account-ID": accountId };
      const options = { additionalHeaders: source === "temporal" ? { ...headers, "x-openai-use-sheep": "1" } : headers, signal };
      const path = source === "temporal" ? "/onboarding/recommendations" : "/tpp/onboarding/suggestions";
      const response = await initial.rJt?.safePost(path, source === "temporal" ? { ...options, requestBody: { provider_id: "work-onboarding-task-tiles" } } : options);
      return { cards: parseServerCards(response), status: response?.status ?? "ready" };
    },
    refetchInterval: (query: { state?: { data?: { cards?: unknown[]; status?: string }; error?: unknown } }) => query.state?.error == null && (query.state?.data?.status === "pending" || query.state?.data?.cards?.length === 0) ? 2_000 : false,
    refetchOnWindowFocus: false,
    retry: false,
    staleTime: 60_000,
  })) ?? { kind: "work-onboarding-suggestions" };
  initialized = true;
}

function WorkOnboardingSuggestions(props: WorkOnboardingSuggestionsProps): unknown {
  initializeWorkOnboarding();
  const scope = shared.LX(initial.kht ?? shared.ZI);
  const identity = initial.N6t?.();
  const access = initial.vun == null ? undefined : shared.HX<{ accountId?: string; plan?: string; status?: string }>(initial.vun);
  const announcements = initial.bqt == null ? undefined : shared.HX<QueryState<AnnouncementsState> | AnnouncementsState>(initial.bqt);
  const announcementData = announcements != null && "data" in announcements ? announcements.data : announcements as AnnouncementsState | undefined;
  const composer = initial.HZ?.();
  const experiments = initial.cfn?.();
  const featureEnabled = experiments?.getExperiment("131701769").get("enabled", false) ?? true;
  const derivedEligibility: WorkOnboardingEligibility | undefined = identity?.accountId == null || identity.userId == null ? undefined : {
    announcementCompleted: announcementData?.seenAnnouncements?.[ANNOUNCEMENT_ID] != null,
    announcementEligible: announcementData?.eligibleAnnouncements?.includes(ANNOUNCEMENT_ID) === true,
    composerEmpty: composer?.hasText() === false,
    featureEnabled,
    hasExistingConversations: false,
    hasIdentity: true,
    isWorkPlan: access?.status === "allowed" && access.plan != null && access.plan !== "free",
  };
  const eligibility = props.eligibility ?? derivedEligibility;
  if (!isEligible(eligibility)) return jsx.jsx(jsx.Fragment, { children: props.children });

  const source: "legacy" | "temporal" = experiments?.getExperiment("131701769").get("task_tiles_use_temporal", true) === false ? "legacy" : "temporal";
  const accountId = identity?.accountId ?? "";
  const locale = shared.n4?.().locale ?? "en";
  const query = shared.BX<QueryState<{ cards?: ServerWorkSuggestion[]; status?: string }>>(suggestionsQueryFamily, { accountId, locale, source });
  const serverCards = props.serverCards ?? query.data?.cards;
  const sourceCards = serverCards == null || serverCards.length === 0 ? STATIC_FALLBACK_CARDS : serverCards.map(normalizeServerCard);
  const cards = orderCards(sourceCards, props.hideAppSuggestions === true);
  const [triedByPrompt, setTriedByPrompt] = React.useState<Record<string, string>>(() => ({ ...props.triedConversationByPrompt }));
  const [pendingPrompt, setPendingPrompt] = React.useState<string | null>(null);
  const [dismissPending, setDismissPending] = React.useState(false);
  const [page, setPage] = React.useState(0);
  const attributionId = React.useRef(globalThis.crypto?.randomUUID?.() ?? String(Date.now()));
  const impressionIds = React.useRef(new Set<string>());
  const visible = cards.slice(page * 3, page * 3 + 3);
  React.useEffect(() => {
    visible.forEach((card, index) => {
      if (impressionIds.current.has(card.id)) return;
      impressionIds.current.add(card.id);
      initial.xpn?.(scope, "tpp_onboarding_suggestion_impression", { cardId: card.id, category: card.category, position: page * 3 + index + 1, source: card.source, sourceAttributionId: attributionId.current, surface: "onboarding" });
    });
  }, [page, scope, visible]);

  const complete = async (dismissed: boolean) => {
    if (dismissPending) return;
    setDismissPending(true);
    try {
      await initial.rJt?.safePost("/settings/announcement_viewed", { additionalHeaders: { "ChatGPT-Account-ID": accountId }, parameters: { query: { announcement_id: ANNOUNCEMENT_ID } } });
      initial.xpn?.(scope, "tpp_onboarding_completed", { onboardingPresentation: "task_tiles", skipSource: dismissed ? "dismiss_button" : undefined, source: dismissed ? "skip" : "suggestion", sourceAttributionId: attributionId.current });
    } finally { setDismissPending(false); }
  };
  const navigate = initial.o_n?.();
  const start = async (card: WorkSuggestionCard, position: number) => {
    if (pendingPrompt != null) return;
    setPendingPrompt(card.prompt);
    initial.xpn?.(scope, "tpp_onboarding_suggestion_clicked", { cardId: card.id, category: card.category, position, source: card.source, sourceAttributionId: attributionId.current, surface: "onboarding", taskKey: card.taskKey });
    try {
      const conversationId = initial.rqt?.() ?? globalThis.crypto?.randomUUID?.() ?? `onboarding-${Date.now()}`;
      const result = await initial.ROt?.(scope, {
        conversationId,
        conversationOrigin: "tpp",
        enableMessageFollowups: true,
        extraDeveloperInstructions: card.developerInstructions == null ? [] : [card.developerInstructions],
        messageMetadata: { starter_prompt_id: `tpp-onboarding-${card.id}` },
        prompt: card.prompt,
        requireDispatchAcceptance: true,
        thinkingEffort: card.thinkingEffort,
      });
      const serverConversationId = result?.serverConversationId ?? conversationId;
      setTriedByPrompt((current) => ({ ...current, [card.prompt]: serverConversationId }));
      initial.xpn?.(scope, "tpp_onboarding_task_submitted", { cardId: card.id, category: card.category, position, source: card.source, sourceAttributionId: attributionId.current, taskKey: card.taskKey });
      await navigate?.(initial.gln?.({ id: serverConversationId }) ?? `/c/${serverConversationId}`);
      if (cards.every((candidate) => candidate.prompt === card.prompt || triedByPrompt[candidate.prompt] != null)) await complete(false);
    } catch {
      scope.get<{ warning?(message: string): void } | undefined>(shared.pk)?.warning?.("Couldn't start task. Please try again");
    } finally { setPendingPrompt(null); }
  };
  const loading = props.loading === true || query.isPending === true || query.data?.status === "pending";
  const loadError = props.loadError === true || query.isError === true;
  return jsx.jsxs("section", { "aria-busy": loading, "data-work-onboarding-carousel": true, className: "flex flex-col gap-3", children: [
    jsx.jsxs("header", { className: "flex items-center justify-between", children: [jsx.jsx("h2", { children: "See what Work can do" }), jsx.jsx("button", { disabled: dismissPending, onClick: () => void complete(true), type: "button", children: "Dismiss" })] }),
    jsx.jsx("div", { className: "grid grid-cols-3 gap-3", children: visible.map((card, index) => {
      const conversationId = triedByPrompt[card.prompt];
      return jsx.jsxs("article", { className: "flex min-w-0 flex-col gap-2 rounded-2xl border p-4", children: [jsx.jsx("strong", { children: card.label }), card.description == null ? null : jsx.jsx("p", { children: card.description }), conversationId == null ? jsx.jsx("button", { disabled: pendingPrompt != null, onClick: () => void start(card, page * 3 + index + 1), type: "button", children: pendingPrompt === card.prompt ? "Starting…" : "Try" }) : jsx.jsx("a", { href: `/c/${conversationId}`, children: "Tried" })] }, card.id);
    }) }),
    cards.length > 3 ? jsx.jsxs("nav", { "aria-label": "Work onboarding tasks", children: [jsx.jsx("button", { disabled: page === 0, onClick: () => setPage((value) => Math.max(0, value - 1)), type: "button", children: "Previous" }), jsx.jsx("button", { disabled: (page + 1) * 3 >= cards.length, onClick: () => setPage((value) => value + 1), type: "button", children: "Next" })] }) : null,
    loadError ? jsx.jsxs("div", { role: "alert", children: ["Something went wrong. Please try again", jsx.jsx("button", { onClick: () => query.refetch?.(), type: "button", children: "Retry" })] }) : null,
  ] });
}

export { WorkOnboardingSuggestions };
