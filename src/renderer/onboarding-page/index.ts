// onboarding-page —— 桌面端首次登录 onboarding 流程。

import * as runtimeChunk from "@rchunk/rolldown-runtime";
import * as appSharedChunk from "@rchunk/app-shared";
import * as appInitialChunk from "@rchunk/app-initial";
import * as appPrimaryChunk from "@rchunk/app-primary";
import * as onboardingMailProviderChunk from "@rchunk/onboarding-mail-provider";
import * as computerHistoryIconChunk from "@rchunk/computer-history-plugin-icon";
import * as buildingChunk from "@rchunk/building";
import * as appConnectModalChunk from "@rchunk/app-connect-modal";
import * as countryCodesChunk from "@rchunk/country-codes";
import * as useAppConnectFlowChunk from "@rchunk/use-app-connect-flow";
import * as documentSearchIconChunk from "@rchunk/document-search-icon";
import * as conversationBlocksChunk from "@rchunk/conversation-blocks";
import * as remotePipBridgeChunk from "@rchunk/remote-hosted-pip-anchor-bridge";
import * as iconChunk from "@rchunk/Icon";
import * as newsPaperChunk from "@rchunk/NewsPaper";
import * as hooksSettingsRouteChunk from "@rchunk/hooks-settings-route";
import * as firstAppConnectSuggestionsChunk from "@rchunk/first-app-connect-ambient-suggestions";
import * as computerUseApprovalCardChunk from "@rchunk/computer-use-app-approval-request-card";
import * as folderLightIconChunk from "@rchunk/folder-light-icon";
import * as permissionsVisibilityChunk from "@rchunk/permissions-mode-visibility";
import * as onboardingChecklistChunk from "@rchunk/sidebar-onboarding-checklist-task-config";
import * as externalImportActionsChunk from "@rchunk/use-external-agent-import-setup-actions";
import * as profileLockChunk from "@rchunk/profile-lock";
import * as categoryPluginsChunk from "@rchunk/category-plugins-query";
import * as importedSetupOpportunityChunk from "@rchunk/use-imported-setup-opportunity";
import * as onboardingEntrypointChunk from "@rchunk/onboarding-entrypoint";
import * as chronicleQueriesChunk from "@rchunk/chronicle-service-queries";
import * as chroniclePermissionsChunk from "@rchunk/chronicle-permissions-dialog";
import * as rosalindHelixChunk from "@rchunk/rosalind-helix";

type StateUpdater<Value> = Value | ((previous: Value) => Value);

interface ReactRuntime {
  useState<Value>(initialValue: Value | (() => Value)): [Value, (next: StateUpdater<Value>) => void];
}

interface JsxRuntime {
  Fragment: unknown;
  jsx(type: unknown, props: Record<string, unknown>, key?: string): unknown;
  jsxs(type: unknown, props: Record<string, unknown>, key?: string): unknown;
}

interface ToastManager {
  danger(message: string): void;
}

interface ApplicationScope {
  get(signal: unknown): unknown;
  set?(signal: unknown, value: unknown): void;
}

type Gate = "open" | "complete" | "locked" | "unsupported";
type ImportStatus = "available" | "error" | "loading" | "unavailable";
type Step =
  | "welcome"
  | "finance-sources"
  | "rosalind-welcome"
  | "teen-welcome"
  | "teen-interests"
  | "teen-prompts"
  | "windows-sandbox"
  | "role"
  | "agent-migration-source"
  | "agent-migration-items"
  | "setup"
  | "complete";

interface FinanceSource { connected?: boolean; description?: string; id: string; name: string }
interface TeenPrompt { description: string; id: string; prompt: string; title: string }
interface MigrationProvider { id: string; itemCount?: number; name: string }

interface OnboardingPageState {
  firstName?: string | null;
  gate?: Gate;
  importStatus?: ImportStatus;
  isError?: boolean;
  isLoading?: boolean;
  shouldShowConversationalOnboarding?: boolean;
  shouldShowFinanceWelcome?: boolean;
  shouldShowRosalindWelcome?: boolean;
  shouldShowStandardOnboarding?: boolean;
  shouldShowTeenOnboarding?: boolean;
  shouldShowWindowsSandboxSetup?: boolean;
  shouldShowAgentMigration?: boolean;
  financeSources?: FinanceSource[];
  migrationProviders?: MigrationProvider[];
  teenPromptChoices?: TeenPrompt[];
  complete?(result: OnboardingResult): Promise<void> | void;
  connectFinanceSource?(sourceId: string): Promise<void> | void;
  enableWindowsSandbox?(): Promise<void> | void;
  finishImport?(): Promise<void> | void;
  finishAgentMigration?(providerIds: string[]): Promise<void> | void;
  retry?(): Promise<void> | void;
  retryImport?(): Promise<void> | void;
  saveTeenInterests?(interests: string[]): Promise<void> | void;
  submitTeenPrompt?(prompt: TeenPrompt | null): Promise<void> | void;
}

interface OnboardingResult {
  personalizedSuggestionsEnabled: boolean;
  role: string | null;
  roleSelectionSkipped: boolean;
  setupImported: boolean;
  teenInterests?: string[];
  teenPromptId?: string | null;
  migrationProviderIds?: string[];
  windowsSandboxEnabled?: boolean;
}

interface IconProps {
  className?: string;
  title?: string;
}

type IconComponent = (props?: IconProps) => unknown;

const {
  $3: initializeSharedRuntime,
  I3: getJsxRuntime,
  LX: useApplicationScope,
  ZI: applicationScope,
  e6: getReactRuntime,
  pk: toastSignal,
} = appSharedChunk as unknown as {
  $3?: () => void;
  I3: () => JsxRuntime;
  LX: (scope: unknown) => ApplicationScope;
  ZI: unknown;
  e6: () => ReactRuntime;
  pk: unknown;
};
const {
  Kcn: useOnboardingPageState,
  Ucn: writeSetting,
  e8t: useNavigate,
} = appInitialChunk as unknown as {
  Kcn?: (key: string) => OnboardingPageState | null | undefined;
  Ucn?: (scope: unknown, setting: { key: string }, value: unknown) => Promise<void> | void;
  e8t?: () => (path: string) => void;
};
const { Ah: initializePrimaryRuntime } = appPrimaryChunk as unknown as { Ah?: () => void };
const { o: initializeMailProvider } = onboardingMailProviderChunk as unknown as { o?: () => void };
const { n: initializeComputerHistoryIcon, t: ComputerHistoryIcon } = computerHistoryIconChunk as unknown as { n?: () => void; t?: IconComponent };
const { n: initializeBuildingIcon, t: BuildingIcon } = buildingChunk as unknown as { n?: () => void; t?: IconComponent };
const { n: initializeAppConnectModal } = appConnectModalChunk as unknown as { n?: () => void };
const { n: initializeCountryCodes } = countryCodesChunk as unknown as { n?: () => void };
const { t: initializeAppConnectFlow } = useAppConnectFlowChunk as unknown as { t?: () => void };
const { n: initializeDocumentSearchIcon, t: DocumentSearchIcon } = documentSearchIconChunk as unknown as { n?: () => void; t?: IconComponent };
const { M: initializeConversationBlocks, N: initializeConversationBlockRuntime } = conversationBlocksChunk as unknown as { M?: () => void; N?: () => void };
const { i: initializeRemotePipState, r: initializeRemotePipBridge } = remotePipBridgeChunk as unknown as { i?: () => void; r?: () => void };
const { t: GenericIcon } = iconChunk as unknown as { t?: IconComponent };
const { t: NewsPaperIcon } = newsPaperChunk as unknown as { t?: IconComponent };
const { r: initializeHooksSettingsRoute } = hooksSettingsRouteChunk as unknown as { r?: () => void };
const { t: initializeFirstAppConnectSuggestions } = firstAppConnectSuggestionsChunk as unknown as { t?: () => void };
const { i: initializeApprovalCardState, r: initializeApprovalCardRuntime } = computerUseApprovalCardChunk as unknown as { i?: () => void; r?: () => void };
const { n: initializeFolderIcon, t: FolderIcon } = folderLightIconChunk as unknown as { n?: () => void; t?: IconComponent };
const { a: initializePermissionsVisibility } = permissionsVisibilityChunk as unknown as { a?: () => void };
const { A: initializeChecklistRuntime, B: initializeChecklistState, G: initializeChecklistWorkflow } = onboardingChecklistChunk as unknown as { A?: () => void; B?: () => void; G?: () => void };
const { t: initializeExternalImportActions } = externalImportActionsChunk as unknown as { t?: () => void };
const { n: initializeProfileLock, t: ProfileLockIcon } = profileLockChunk as unknown as { n?: () => void; t?: IconComponent };
const { n: initializeCategoryPlugins } = categoryPluginsChunk as unknown as { n?: () => void };
const { t: initializeImportedSetupOpportunity } = importedSetupOpportunityChunk as unknown as { t?: () => void };
const { n: onboardingLoginEntrypointSignal, t: initializeOnboardingEntrypoint } = onboardingEntrypointChunk as unknown as { n?: unknown; t?: () => void };
const { n: initializeChronicleQueries } = chronicleQueriesChunk as unknown as { n?: () => void };
const { n: initializeChroniclePermissions } = chroniclePermissionsChunk as unknown as { n?: () => void };
const { t: initializeRosalindHelix } = rosalindHelixChunk as unknown as { t?: () => void };

initializeSharedRuntime?.();
initializePrimaryRuntime?.();
initializeMailProvider?.();
initializeComputerHistoryIcon?.();
initializeBuildingIcon?.();
initializeAppConnectModal?.();
initializeCountryCodes?.();
initializeAppConnectFlow?.();
initializeDocumentSearchIcon?.();
initializeConversationBlocks?.();
initializeConversationBlockRuntime?.();
initializeRemotePipState?.();
initializeRemotePipBridge?.();
initializeHooksSettingsRoute?.();
initializeFirstAppConnectSuggestions?.();
initializeApprovalCardState?.();
initializeApprovalCardRuntime?.();
initializeFolderIcon?.();
initializePermissionsVisibility?.();
initializeChecklistRuntime?.();
initializeChecklistState?.();
initializeChecklistWorkflow?.();
initializeExternalImportActions?.();
initializeProfileLock?.();
initializeCategoryPlugins?.();
initializeImportedSetupOpportunity?.();
initializeOnboardingEntrypoint?.();
initializeChronicleQueries?.();
initializeChroniclePermissions?.();
initializeRosalindHelix?.();

const React = getReactRuntime();
const jsx = getJsxRuntime();

const roles = [
  "Engineering",
  "Data science",
  "Life Sciences",
  "Product",
  "Design",
  "Marketing",
  "Sales",
  "Finance",
  "Operations",
  "People and HR",
  "Legal",
  "Student",
  "Other",
] as const;

const teenInterests = [
  "Animals", "Fitness", "School", "Art & creativity", "Beauty & style", "Science",
  "Money", "Gaming", "Music", "Sports", "Coding", "Other",
] as const;

const defaultTeenPrompts: TeenPrompt[] = [
  { id: "dodging-game", title: "Build a dodging game", description: "Create a small game and make it your own.", prompt: "Build me a colorful browser game where I dodge obstacles and track my high score." },
  { id: "study-web-app", title: "Make a study app", description: "Turn a subject into flashcards and quizzes.", prompt: "Create a study web app with flashcards, a quiz, and progress tracking." },
  { id: "outfit-picker", title: "Design an outfit picker", description: "Mix and match looks for different occasions.", prompt: "Create an outfit picker that suggests looks for weather, mood, and occasion." },
  { id: "pet-care-tracker", title: "Track pet care", description: "Plan feeding, walks, medicine, and appointments.", prompt: "Create a pet care tracker with feeding, walks, medication, and vet reminders." },
];

const defaultPageState: OnboardingPageState = { gate: "open", importStatus: "unavailable", shouldShowStandardOnboarding: true };

function pageIcon(step: Step): unknown {
  const Component = step === "role" ? BuildingIcon : step === "setup" ? FolderIcon ?? DocumentSearchIcon : step === "complete" ? NewsPaperIcon ?? ComputerHistoryIcon : GenericIcon;
  return Component == null ? null : jsx.jsx(Component, { className: "size-6", title: "ChatGPT onboarding" });
}

function button(label: string, options: { disabled?: boolean; onClick(): Promise<void> | void; secondary?: boolean }): unknown {
  return jsx.jsx("button", { type: "button", disabled: options.disabled === true, "data-variant": options.secondary === true ? "secondary" : "primary", onClick: options.onClick, children: label });
}

function OnboardingPage(): unknown {
  const scope = useApplicationScope(applicationScope);
  const navigate = useNavigate?.() ?? (() => undefined);
  const pageState = useOnboardingPageState?.("onboarding-page") ?? defaultPageState;
  const [step, setStep] = React.useState<Step>("welcome");
  const [role, setRole] = React.useState<string | null>(null);
  const [roleSelectionSkipped, setRoleSelectionSkipped] = React.useState(false);
  const [personalizedSuggestionsEnabled, setPersonalizedSuggestionsEnabled] = React.useState(true);
  const [setupImported, setSetupImported] = React.useState(false);
  const [selectedTeenInterests, setSelectedTeenInterests] = React.useState<string[]>([]);
  const [selectedTeenPrompt, setSelectedTeenPrompt] = React.useState<TeenPrompt | null>(null);
  const [migrationProviderIds, setMigrationProviderIds] = React.useState<string[]>([]);
  const [windowsSandboxEnabled, setWindowsSandboxEnabled] = React.useState(false);
  const [isCompleting, setIsCompleting] = React.useState(false);
  const [completionError, setCompletionError] = React.useState<string | null>(null);

  if (pageState.isLoading === true) return jsx.jsx("main", { role: "status", children: "Loading onboarding…" });
  if (pageState.isError === true) return jsx.jsxs("main", { role: "alert", children: ["Onboarding could not be loaded.", button("Retry", { onClick: () => pageState.retry?.() })] });
  if (pageState.gate === "complete") return null;
  if (pageState.gate === "locked") return jsx.jsxs("main", { role: "alert", children: [ProfileLockIcon == null ? null : jsx.jsx(ProfileLockIcon, { title: "Profile locked" }), jsx.jsx("h1", { children: "Onboarding is unavailable for this profile" })] });
  if (pageState.gate === "unsupported") return jsx.jsx("main", { role: "alert", children: "Onboarding is unavailable on this device." });

  const complete = async (): Promise<void> => {
    if (isCompleting) return;
    setIsCompleting(true);
    setCompletionError(null);
    const result: OnboardingResult = {
      personalizedSuggestionsEnabled,
      role,
      roleSelectionSkipped,
      setupImported,
      teenInterests: selectedTeenInterests,
      teenPromptId: selectedTeenPrompt?.id ?? null,
      migrationProviderIds,
      windowsSandboxEnabled,
    };
    try {
      if (setupImported) await pageState.finishImport?.();
      if (migrationProviderIds.length > 0) await pageState.finishAgentMigration?.(migrationProviderIds);
      if (selectedTeenInterests.length > 0) await pageState.saveTeenInterests?.(selectedTeenInterests);
      if (pageState.shouldShowTeenOnboarding === true) await pageState.submitTeenPrompt?.(selectedTeenPrompt);
      await pageState.complete?.(result);
      await writeSetting?.(scope, { key: "onboarding.completed" }, result);
      if (onboardingLoginEntrypointSignal != null) scope.set?.(onboardingLoginEntrypointSignal, undefined);
      navigate("/");
    } catch {
      const message = "Couldn't finish setup — try again";
      setCompletionError(message);
      (scope.get(toastSignal) as ToastManager | undefined)?.danger(message);
    } finally {
      setIsCompleting(false);
    }
  };

  const firstStepAfterWelcome = (): Step => {
    if (pageState.shouldShowFinanceWelcome === true) return "finance-sources";
    if (pageState.shouldShowRosalindWelcome === true) return "rosalind-welcome";
    if (pageState.shouldShowTeenOnboarding === true) return "teen-welcome";
    if (pageState.shouldShowWindowsSandboxSetup === true) return "windows-sandbox";
    return "role";
  };

  const stepAfterRole = (): Step => pageState.shouldShowAgentMigration === true
    ? "agent-migration-source"
    : "setup";

  let content: unknown;
  if (step === "welcome") {
    const name = pageState.firstName?.trim();
    const title = pageState.shouldShowRosalindWelcome === true
      ? "Welcome to ChatGPT for Life Sciences"
      : pageState.shouldShowFinanceWelcome === true
        ? "Welcome to ChatGPT for Finance"
        : name == null || name.length === 0 ? "Hey!" : `Hey, ${name}!`;
    content = jsx.jsxs(jsx.Fragment, { children: [jsx.jsx("h1", { children: title }), jsx.jsx("p", { children: "Welcome to the ChatGPT desktop app. I’m going to ask you a few quick questions to help me tailor things for how you work." }), button("Continue", { onClick: () => setStep(firstStepAfterWelcome()) })] });
  } else if (step === "finance-sources") {
    const sources = pageState.financeSources ?? [];
    content = jsx.jsxs(jsx.Fragment, { children: [
      jsx.jsx("h1", { children: "Connect your financial data sources" }),
      jsx.jsx("p", { children: "Bring company filings, investor reports, earnings calls, and market research into ChatGPT for Finance." }),
      sources.length === 0
        ? jsx.jsx("p", { children: "No additional data sources are available for this account." })
        : jsx.jsx("ul", { children: sources.map((source) => jsx.jsxs("li", { children: [
          jsx.jsxs("span", { children: [source.name, source.description == null ? null : ` — ${source.description}`] }),
          source.connected === true ? jsx.jsx("span", { children: "Connected" }) : button(`Connect ${source.name}`, { onClick: () => pageState.connectFinanceSource?.(source.id) }),
        ] }, source.id)) }),
      jsx.jsxs("footer", { children: [button("Back", { secondary: true, onClick: () => setStep("welcome") }), button("Skip", { secondary: true, onClick: () => setStep("role") }), button("Continue", { onClick: () => setStep("role") })] }),
    ] });
  } else if (step === "rosalind-welcome") {
    content = jsx.jsxs(jsx.Fragment, { children: [
      jsx.jsx("h1", { children: "Rosalind" }),
      jsx.jsx("p", { children: "ChatGPT Rosalind adds scientific reasoning, connected research tools, and evidence evaluation for life sciences work." }),
      jsx.jsx("ul", { children: ["Reason across complex scientific questions", "Work with connected scientific sources", "Evaluate evidence and supporting research"].map((item) => jsx.jsx("li", { children: item }, item)) }),
      jsx.jsxs("footer", { children: [button("Back", { secondary: true, onClick: () => setStep("welcome") }), button("I'm not a scientist", { secondary: true, onClick: () => { setRole(null); setRoleSelectionSkipped(true); setStep("role"); } }), button("Continue", { onClick: () => { setRole("Life Sciences"); setStep("role"); } })] }),
    ] });
  } else if (step === "teen-welcome") {
    content = jsx.jsxs(jsx.Fragment, { children: [
      jsx.jsx("h1", { children: "Welcome to ChatGPT" }),
      jsx.jsx("p", { children: "ChatGPT can help you learn, create, and turn your ideas into projects. Keep personal information private and check important answers." }),
      jsx.jsxs("footer", { children: [button("Back", { secondary: true, onClick: () => setStep("welcome") }), button("Continue", { onClick: () => setStep("teen-interests") })] }),
    ] });
  } else if (step === "teen-interests") {
    const toggleInterest = (interest: string): void => setSelectedTeenInterests((current) => current.includes(interest) ? current.filter((value) => value !== interest) : [...current, interest]);
    content = jsx.jsxs(jsx.Fragment, { children: [
      jsx.jsx("h1", { children: "What are you interested in?" }),
      jsx.jsx("p", { children: "Pick the topics you like. We'll use them to suggest a first project." }),
      jsx.jsx("div", { role: "group", "aria-label": "Interests", children: teenInterests.map((interest) => jsx.jsxs("label", { children: [jsx.jsx("input", { type: "checkbox", value: interest, checked: selectedTeenInterests.includes(interest), onChange: () => toggleInterest(interest) }), interest] }, interest)) }),
      jsx.jsxs("footer", { children: [button("Back", { secondary: true, onClick: () => setStep("teen-welcome") }), button("Next", { disabled: selectedTeenInterests.length === 0, onClick: () => setStep("teen-prompts") })] }),
    ] });
  } else if (step === "teen-prompts") {
    const prompts = pageState.teenPromptChoices ?? defaultTeenPrompts;
    content = jsx.jsxs(jsx.Fragment, { children: [
      jsx.jsx("h1", { children: "Choose something to make" }),
      jsx.jsx("p", { children: "Start with one of these ideas, or write your own prompt after setup." }),
      jsx.jsx("div", { children: prompts.map((prompt) => jsx.jsx("button", { type: "button", "aria-pressed": selectedTeenPrompt?.id === prompt.id, onClick: () => setSelectedTeenPrompt(prompt), children: jsx.jsxs("span", { children: [jsx.jsx("strong", { children: prompt.title }), jsx.jsx("span", { children: prompt.description })] }) }, prompt.id)) }),
      jsx.jsxs("footer", { children: [button("Back", { secondary: true, onClick: () => setStep("teen-interests") }), button("Write my own", { secondary: true, onClick: () => { setSelectedTeenPrompt(null); setStep("complete"); } }), button("Use prompt", { disabled: selectedTeenPrompt == null, onClick: () => setStep("complete") })] }),
    ] });
  } else if (step === "windows-sandbox") {
    content = jsx.jsxs(jsx.Fragment, { children: [
      jsx.jsx("h1", { children: "Set up the Windows sandbox" }),
      jsx.jsx("p", { children: "Allow ChatGPT to run code in an isolated sandbox. Windows may show a User Account Control prompt." }),
      jsx.jsxs("footer", { children: [button("Back", { secondary: true, onClick: () => setStep("welcome") }), button("Not now", { secondary: true, onClick: () => setStep("role") }), button("Set up sandbox", { onClick: async () => { await pageState.enableWindowsSandbox?.(); setWindowsSandboxEnabled(true); setStep("role"); } })] }),
    ] });
  } else if (step === "role") {
    content = jsx.jsxs(jsx.Fragment, { children: [jsx.jsx("h1", { children: "Which best describes your work?" }), jsx.jsx("div", { role: "radiogroup", children: roles.map((option) => jsx.jsxs("label", { children: [jsx.jsx("input", { type: "radio", name: "role", value: option, checked: role === option, onChange: () => { setRole(option); setRoleSelectionSkipped(false); } }), option] }, option)) }), jsx.jsxs("footer", { children: [button("Back", { secondary: true, onClick: () => setStep("welcome") }), button("Skip", { secondary: true, onClick: () => { setRole(null); setRoleSelectionSkipped(true); setStep(stepAfterRole()); } }), button("Continue", { disabled: role == null, onClick: () => setStep(stepAfterRole()) })] })] });
  } else if (step === "agent-migration-source") {
    const providers = pageState.migrationProviders ?? [];
    const toggleProvider = (providerId: string): void => setMigrationProviderIds((current) => current.includes(providerId) ? current.filter((value) => value !== providerId) : [...current, providerId]);
    content = jsx.jsxs(jsx.Fragment, { children: [
      jsx.jsx("h1", { children: "Import your agent setup" }),
      jsx.jsx("p", { children: "Choose assistants to bring over. You can review individual apps, MCP servers, and instructions next." }),
      providers.length === 0 ? jsx.jsx("p", { children: "No supported assistant setup was found." }) : jsx.jsx("div", { role: "group", "aria-label": "Assistant providers", children: providers.map((provider) => jsx.jsxs("label", { children: [jsx.jsx("input", { type: "checkbox", value: provider.id, checked: migrationProviderIds.includes(provider.id), onChange: () => toggleProvider(provider.id) }), `${provider.name}${provider.itemCount == null ? "" : ` (${provider.itemCount})`}`] }, provider.id)) }),
      jsx.jsxs("footer", { children: [button("Back", { secondary: true, onClick: () => setStep("role") }), button("Skip", { secondary: true, onClick: () => setStep("setup") }), button("Continue", { disabled: migrationProviderIds.length === 0, onClick: () => setStep("agent-migration-items") })] }),
    ] });
  } else if (step === "agent-migration-items") {
    const selected = (pageState.migrationProviders ?? []).filter((provider) => migrationProviderIds.includes(provider.id));
    content = jsx.jsxs(jsx.Fragment, { children: [
      jsx.jsx("h1", { children: "Review imported setup" }),
      jsx.jsx("ul", { children: selected.map((provider) => jsx.jsx("li", { children: `${provider.name}${provider.itemCount == null ? "" : ` — ${provider.itemCount} items`}` }, provider.id)) }),
      jsx.jsxs("footer", { children: [button("Back", { secondary: true, onClick: () => setStep("agent-migration-source") }), button("Import and continue", { onClick: () => { setSetupImported(true); setStep("setup"); } })] }),
    ] });
  } else if (step === "setup") {
    const importStatus = pageState.importStatus ?? "unavailable";
    const importContent = importStatus === "loading"
      ? jsx.jsx("p", { role: "status", children: "Checking for setup to import…" })
      : importStatus === "error"
        ? jsx.jsxs("div", { role: "alert", children: ["Couldn't load imported setup.", button("Retry", { onClick: () => pageState.retryImport?.() })] })
        : importStatus === "available"
          ? jsx.jsxs("label", { children: [jsx.jsx("input", { type: "checkbox", "aria-label": "Import setup from another assistant", checked: setupImported, onChange: (event: { currentTarget: { checked: boolean } }) => setSetupImported(event.currentTarget.checked) }), "Import setup from another assistant"] })
          : null;
    content = jsx.jsxs(jsx.Fragment, { children: [jsx.jsx("h1", { children: pageState.shouldShowConversationalOnboarding === true ? "Continue Setup" : "Suggest personalized tasks" }), jsx.jsx("p", { children: "Choose whether ChatGPT should suggest tasks based on your role and connected apps." }), importContent, jsx.jsxs("label", { children: [jsx.jsx("input", { type: "checkbox", "aria-label": "Suggest personalized tasks", checked: personalizedSuggestionsEnabled, onChange: (event: { currentTarget: { checked: boolean } }) => setPersonalizedSuggestionsEnabled(event.currentTarget.checked) }), "Suggest personalized tasks"] }), jsx.jsxs("footer", { children: [button("Back", { secondary: true, onClick: () => setStep("role") }), button("Skip", { secondary: true, onClick: () => { setSetupImported(false); setPersonalizedSuggestionsEnabled(false); setStep("complete"); } }), button("Continue", { disabled: importStatus === "loading", onClick: () => setStep("complete") })] })] });
  } else {
    content = jsx.jsxs(jsx.Fragment, { children: [jsx.jsx("h1", { children: "You're all set" }), jsx.jsx("p", { children: "ChatGPT is ready to help with the way you work." }), completionError == null ? null : jsx.jsx("p", { role: "alert", children: completionError }), jsx.jsxs("footer", { children: [button("Back", { secondary: true, onClick: () => setStep("setup") }), button("Get Started", { disabled: isCompleting, onClick: complete })] })] });
  }

  return jsx.jsx("main", { "data-onboarding-step": step, children: jsx.jsxs("section", { children: [pageIcon(step), content] }) });
}

void runtimeChunk;

export { OnboardingPage };
