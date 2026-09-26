// browser-composer-disclaimer-core —— ChatGPT browser composer 法务/隐私提示。
//
// 原版：app/webview/assets/browser-composer-disclaimer-6a73b502bd51.js
//（18.3KB / 517 行）。
//
// 两个导出：n = initializeBrowserComposerDisclaimer（原 `K`），
// t = BrowserComposerDisclaimer（原 `P`）。

import "@rchunk/app-shared";
import "@rchunk/app-initial";

export type DisclaimerPlacement = "home" | "thread" | string;
export type RegulatedConnectorKind = "finance" | "health" | string | null;

export interface PersonalAccountDisclaimerState {
  structure: "personal";
  id: string;
  showAiServiceDisclaimer?: boolean;
  browserSideChat?: boolean;
  regulatedConnectorKind?: RegulatedConnectorKind;
}

export interface WorkspaceAccountDisclaimerState {
  structure: "workspace";
  id: string;
  name?: string | null;
  planType?: string | null;
  workspaceType?: string | null;
  trainingAllowed?: boolean;
  encrypted?: boolean;
  hideStandardDisclaimer?: boolean;
  dataLoaded?: boolean;
}

export type BrowserDisclaimerAccountState =
  | PersonalAccountDisclaimerState
  | WorkspaceAccountDisclaimerState;

export interface BrowserComposerDisclaimerProps {
  conversationId?: string | null;
  hasUserMessage?: boolean;
  isTemporaryChat?: boolean;
  placement?: DisclaimerPlacement;
  regulatedConnectorKindOverride?: RegulatedConnectorKind;
  /** 语义重写层显式输入；真实组件从 account/query stores 读取。 */
  account?: BrowserDisclaimerAccountState | null;
}

export interface BrowserComposerDisclaimerView {
  kind: "browser-composer-disclaimer";
  placement: DisclaimerPlacement;
  message: string;
  messageKind:
    | "ai-service"
    | "early-access-workspace"
    | "encrypted-k12-workspace"
    | "encrypted-workspace"
    | "finance"
    | "health"
    | "k12-workspace"
    | "personal"
    | "temporary-chat"
    | "workspace"
    | "workspace-research-partner"
    | "workspace-temporary-chat";
  workspaceName?: string | null;
  learnMoreUrl?: string;
}

const MESSAGE = {
  finance: "ChatGPT can make mistakes and isn’t a licensed investment adviser or authorized to prepare tax returns.",
  health: "ChatGPT can make mistakes and isn't intended for diagnosis or treatment. Consult a doctor for medical advice.",
  aiService: "ChatGPT is AI and can make mistakes. Check important info.",
  personal: "ChatGPT can make mistakes. Check important info.",
  temporaryChat: "For safety, we may keep a copy of this chat for up to 30 days.",
  workspace: "ChatGPT can make mistakes. Workspace data isn't used to train models.",
  workspaceResearchPartner:
    "ChatGPT can make mistakes. This workspace is opted in to the ChatGPT Business Research Partner Program. Learn more",
  earlyAccessWorkspace: (name: string | null) =>
    name == null
      ? "ChatGPT can make mistakes. OpenAI uses your workspace data to train its models."
      : `ChatGPT can make mistakes. OpenAI uses ${name} workspace data to train its models.`,
  workspaceTemporaryChat:
    "Workspace data isn't used to train models by default. For safety, we may keep a copy of this chat for up to 30 days.",
  encryptedWorkspace: (name: string | null) =>
    name == null
      ? "ChatGPT can make mistakes. OpenAI doesn't use your workspace data to train its models. The content of this workspace is encrypted with your organization managed keys."
      : `ChatGPT can make mistakes. OpenAI doesn't use ${name} workspace data to train its models. The content of this workspace is encrypted with your organization managed keys.`,
  k12Workspace: (name: string | null) =>
    name == null
      ? "ChatGPT for Teachers can make mistakes. OpenAI doesn't use your workspace data to train its models."
      : `ChatGPT for Teachers can make mistakes. OpenAI doesn't use ${name} workspace data to train its models.`,
  encryptedK12Workspace: (name: string | null) =>
    name == null
      ? "ChatGPT for Teachers can make mistakes. OpenAI doesn't use your workspace data to train its models. The content of this workspace is encrypted with your organization managed keys."
      : `ChatGPT for Teachers can make mistakes. OpenAI doesn't use ${name} workspace data to train its models. The content of this workspace is encrypted with your organization managed keys.`,
} as const;

function regulatedMessage(kind: RegulatedConnectorKind): Pick<BrowserComposerDisclaimerView, "message" | "messageKind"> {
  if (kind === "finance") return { message: MESSAGE.finance, messageKind: "finance" };
  if (kind === "health") return { message: MESSAGE.health, messageKind: "health" };
  return { message: MESSAGE.personal, messageKind: "personal" };
}

function workspaceDisclaimer(
  account: WorkspaceAccountDisclaimerState,
  temporary: boolean,
  placement: DisclaimerPlacement,
): BrowserComposerDisclaimerView | null {
  if (account.dataLoaded === false) return null;
  const name = account.name ?? null;
  const base = { kind: "browser-composer-disclaimer" as const, placement, workspaceName: name };
  if (account.trainingAllowed === true) {
    return {
      ...base,
      message: MESSAGE.workspaceResearchPartner,
      messageKind: "workspace-research-partner",
      learnMoreUrl: "https://help.openai.com/articles/20001245",
    };
  }
  if (account.workspaceType === "early-access") {
    return { ...base, message: MESSAGE.earlyAccessWorkspace(name), messageKind: "early-access-workspace" };
  }
  if (temporary) {
    return { ...base, message: MESSAGE.workspaceTemporaryChat, messageKind: "workspace-temporary-chat" };
  }
  if (account.encrypted === true && account.planType === "k12") {
    return { ...base, message: MESSAGE.encryptedK12Workspace(name), messageKind: "encrypted-k12-workspace" };
  }
  if (account.encrypted === true) {
    return { ...base, message: MESSAGE.encryptedWorkspace(name), messageKind: "encrypted-workspace" };
  }
  if (account.planType === "k12") {
    return { ...base, message: MESSAGE.k12Workspace(name), messageKind: "k12-workspace" };
  }
  if (account.hideStandardDisclaimer === true) return null;
  return { ...base, message: MESSAGE.workspace, messageKind: "workspace" };
}

function initializeBrowserComposerDisclaimer(): void {}

/**
 * BrowserComposerDisclaimer（原 `P`）。临时聊天优先于其他个人提示；显式
 * regulated connector override 决定 finance/health/personal；Home 默认不展示
 * 普通 personal 文案。Workspace 依次处理 Research Partner、Early Access、
 * 临时聊天、EKM、K12 和标准隐私提示。
 */
function BrowserComposerDisclaimer(
  props: BrowserComposerDisclaimerProps,
): BrowserComposerDisclaimerView | null {
  const placement = props.placement ?? "thread";
  const account = props.account;
  if (account == null) return null;
  const temporary = props.isTemporaryChat === true && !(props.hasUserMessage ?? placement === "thread");

  if (account.structure === "workspace") return workspaceDisclaimer(account, temporary, placement);
  const base = { kind: "browser-composer-disclaimer" as const, placement };
  if (temporary) return { ...base, message: MESSAGE.temporaryChat, messageKind: "temporary-chat" };
  if (account.showAiServiceDisclaimer === true) {
    return { ...base, message: MESSAGE.aiService, messageKind: "ai-service" };
  }
  if (props.regulatedConnectorKindOverride !== undefined) {
    const regulatedKind = props.regulatedConnectorKindOverride;
    if (regulatedKind == null && (account.browserSideChat === true || placement === "home")) return null;
    return { ...base, ...regulatedMessage(regulatedKind) };
  }
  if (placement === "home") return null;
  if (account.browserSideChat === true && account.regulatedConnectorKind == null) return null;
  return { ...base, ...regulatedMessage(account.regulatedConnectorKind ?? null) };
}

export { initializeBrowserComposerDisclaimer as n, BrowserComposerDisclaimer as t };
