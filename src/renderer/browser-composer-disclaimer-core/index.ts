// browser-composer-disclaimer-core —— ChatGPT browser composer 法务/隐私提示。
//
// 原版：app/webview/assets/browser-composer-disclaimer-6a73b502bd51.js
//（18.3KB / 517 行）。
//
// 两个导出：n = initializeBrowserComposerDisclaimer（原 `K`），
// t = BrowserComposerDisclaimer（原 `P`）。

import * as sharedChunk from "@rchunk/app-shared";
import * as initialChunk from "@rchunk/app-initial";

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

const shared = sharedChunk as unknown as Record<string, any>;
const initial = initialChunk as unknown as Record<string, any>;
let jsx: any;
let initialized = false;

function call(value: unknown): void { if (typeof value === "function") value(); }
function normalizeAccount(value: any): BrowserDisclaimerAccountState | null {
  if (value == null) return null;
  if (value.structure === "personal") return {
    structure: "personal", id: value.id, showAiServiceDisclaimer: value.showAiServiceDisclaimer,
    browserSideChat: value.browserSideChat, regulatedConnectorKind: value.regulatedConnectorKind,
  };
  if (value.structure === "workspace") return {
    structure: "workspace", id: value.id, name: value.name, planType: value.planType ?? value.plan_type,
    workspaceType: value.workspaceType ?? value.workspace_type, trainingAllowed: value.trainingAllowed,
    encrypted: value.encrypted ?? value.ekm_config != null, hideStandardDisclaimer: value.hideStandardDisclaimer,
    dataLoaded: value.dataLoaded,
  };
  return null;
}

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

function initializeBrowserComposerDisclaimer(): void {
  if (initialized) return;
  initialized = true;
  for (const candidate of [shared.$3, shared.h4, shared.FX, shared.K2, initial.Qgn, initial.Oln, initial.M6t, initial.$un, initial.dqt, initial.uHt, initial.Sqt, initial.vln, initial.rht, initial.Xot, initial.ifn]) call(candidate);
  jsx = shared.I3();
}

function DisclaimerSurface({ view }: { view: BrowserComposerDisclaimerView }): unknown {
  const body = view.messageKind === "workspace-research-partner"
    ? jsx.jsxs(jsx.Fragment, { children: [view.message.replace(/ Learn more$/, " "), jsx.jsx("a", {
      className: "cursor-interaction underline underline-offset-2 hover:text-default",
      href: view.learnMoreUrl, target: "_blank", rel: "noreferrer", children: "Learn more",
    })] })
    : view.message;
  return jsx.jsx("div", {
    className: ["text-center text-xs text-pretty text-codex-description select-none", view.placement === "thread" ? "px-toolbar pb-2" : null].filter(Boolean).join(" "),
    "data-markdown-copy": "exclude", "data-disclaimer-kind": view.messageKind, children: body,
  });
}

/**
 * BrowserComposerDisclaimer（原 `P`）。临时聊天优先于其他个人提示；显式
 * regulated connector override 决定 finance/health/personal；Home 默认不展示
 * 普通 personal 文案。Workspace 依次处理 Research Partner、Early Access、
 * 临时聊天、EKM、K12 和标准隐私提示。
 */
function BrowserComposerDisclaimer(
  props: BrowserComposerDisclaimerProps,
): unknown {
  initializeBrowserComposerDisclaimer();
  const placement = props.placement ?? "thread";
  const route = typeof initial.i_n === "function" ? initial.i_n() : { search: "" };
  const accountQuery = typeof initial.uht === "function" ? initial.uht() : { data: null };
  const account = normalizeAccount(props.account ?? accountQuery?.data);
  if (account == null) return null;
  const routeTemporary = typeof initial.yln === "function" ? initial.yln(route?.search ?? "") : false;
  const temporary = (props.isTemporaryChat ?? routeTemporary) === true && !(props.hasUserMessage ?? placement === "thread");

  if (account.structure === "workspace") {
    let workspace = account;
    if (typeof shared.BX === "function") {
      const details = shared.BX(initial.Zun, account.id)?.data;
      const settings = shared.BX(initial.Dln, account.id)?.data;
      if (details == null && account.dataLoaded == null) return null;
      workspace = {
        ...account,
        dataLoaded: details != null || account.dataLoaded,
        name: details?.account?.name ?? account.name,
        workspaceType: details?.account?.workspace_type ?? account.workspaceType,
        encrypted: details?.account?.ekm_config != null || account.encrypted,
        trainingAllowed: settings?.beta_settings?.training_allowed ?? account.trainingAllowed,
      };
      if (workspace.workspaceType !== "early-access" && settings == null && account.dataLoaded == null) return null;
    }
    const view = workspaceDisclaimer(workspace, temporary, placement);
    return view == null ? null : jsx.jsx(DisclaimerSurface, { view });
  }
  const aiService = props.account == null && typeof initial.ofn === "function" ? initial.ofn("1831960162") : account.showAiServiceDisclaimer;
  const regulatedFromStore = props.regulatedConnectorKindOverride === undefined && typeof shared.BX === "function"
    ? shared.BX(initial.HVt, props.conversationId ?? null) : undefined;
  const personal = { ...account, showAiServiceDisclaimer: aiService, regulatedConnectorKind: regulatedFromStore ?? account.regulatedConnectorKind };
  const base = { kind: "browser-composer-disclaimer" as const, placement };
  let view: BrowserComposerDisclaimerView | null;
  if (temporary) view = { ...base, message: MESSAGE.temporaryChat, messageKind: "temporary-chat" };
  else if (personal.showAiServiceDisclaimer === true) view = { ...base, message: MESSAGE.aiService, messageKind: "ai-service" };
  if (props.regulatedConnectorKindOverride !== undefined) {
    const regulatedKind = props.regulatedConnectorKindOverride;
    if (regulatedKind == null && (personal.browserSideChat === true || placement === "home")) view = null;
    else view = { ...base, ...regulatedMessage(regulatedKind) };
  } else if (temporary || personal.showAiServiceDisclaimer === true) {
    // Earlier priority branches already selected the view.
  } else if (placement === "home" || (personal.browserSideChat === true && personal.regulatedConnectorKind == null)) view = null;
  else view = { ...base, ...regulatedMessage(personal.regulatedConnectorKind ?? null) };
  return view == null ? null : jsx.jsx(DisclaimerSurface, { view });
}

initializeBrowserComposerDisclaimer();

export { initializeBrowserComposerDisclaimer as n, BrowserComposerDisclaimer as t };
