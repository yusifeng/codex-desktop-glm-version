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
import "@rchunk/app-shared";
import "@rchunk/app-initial";
import "@rchunk/app-primary";
import "@rchunk/color-icon";
import "@rchunk/connector-logo-stack";

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

/**
 * WorkOnboardingSuggestions（原 `Ir`/`Lr`/`zr` 门控链）。不满足门控时透明
 * 返回 children；满足时呈现建议 carousel。服务端无可用卡片时使用静态兜底，
 * 已提交过的同 prompt 卡片标记 Tried 并链接回对应 conversation。
 */
function WorkOnboardingSuggestions(
  props: WorkOnboardingSuggestionsProps,
): unknown | WorkOnboardingSuggestionsView {
  if (!isEligible(props.eligibility)) return props.children ?? null;

  const sourceCards =
    props.serverCards == null || props.serverCards.length === 0
      ? STATIC_FALLBACK_CARDS
      : props.serverCards.map(normalizeServerCard);
  const hideApps = props.hideAppSuggestions === true;
  const cards = orderCards(sourceCards, hideApps);
  const triedByPrompt = props.triedConversationByPrompt ?? {};
  const tiles = cards.map((card) => {
    const conversationId = triedByPrompt[card.prompt];
    return {
      ...card,
      tried: conversationId != null,
      href: conversationId == null ? undefined : `/c/${conversationId}`,
    };
  });

  return {
    kind: "work-onboarding-suggestions",
    heading: "See what Work can do",
    ariaBusy: props.loading === true,
    dismissible: true,
    loadError: props.loadError === true,
    mailProvider: props.mailProvider ?? null,
    tiles,
  };
}

export { WorkOnboardingSuggestions };
