// onboarding-route —— Health / Workspace onboarding 的身份门禁与问卷状态机。

import "@rchunk/rolldown-runtime";
import * as appSharedChunk from "@rchunk/app-shared";
import * as appInitialChunk from "@rchunk/app-initial";
import "@rchunk/app-primary";
import "@rchunk/thread-scroll-layout";
import "@rchunk/user-message";
import "@rchunk/turn-bibliography";
import "@rchunk/writing-block-directive-renderer";
import * as departmentsChunk from "@rchunk/departments";
import type { DepartmentIdentity, DepartmentScope } from "@rchunk/departments";
import type { JsxRuntime, ReactRuntime } from "@rchunk/app-shared";

type Step = "intro" | "role" | "department" | "examples" | "warning";
interface Account { id: string; name?: string | null; plan_type?: string | null }
interface AuthState { accountId: string | null; authMethod: string; isLoading: boolean; userId: string | null }
interface AccountsQuery { data?: { accounts?: Account[] }; isFetching: boolean }
interface OnboardingState { accountId?: string | null; debugOverride?: unknown; status: "allowed" | "denied" | "loading"; userId?: string | null }
interface SharedRuntime {
  $3(): void;
  HX<Value>(signal: unknown): Value;
  I3(): JsxRuntime;
  LX(scope: unknown): DepartmentScope;
  ZI: unknown;
  e6: (() => ReactRuntime) & ReactRuntime;
}
interface InitialRuntime {
  N6t(): AuthState;
  _un: unknown;
  iht(): AccountsQuery;
  mun: unknown;
  o_n(): (path: string, options?: { replace?: boolean }) => void;
  vun: unknown;
}

const { $3: initializeRuntimeLazy, HX: useSignalValue, I3: getJsxRuntime, LX: useScope, ZI: AppScope, e6: getReactRuntime } = appSharedChunk as unknown as SharedRuntime;
const { N6t: useAuthState, _un: onboardingUserIdSignal, iht: useAccountsQuery, mun: onboardingAccountIdSignal, o_n: useNavigate, vun: onboardingStateSignal } = appInitialChunk as unknown as InitialRuntime;
const { n: initializeDepartments, o: skipOnboarding, r: acknowledgeOnboarding, s: saveOnboarding, t: departmentsByRole } = departmentsChunk;

const ROLE_OPTIONS = [
  ["physician", "Physician"], ["np_pa", "Nurse practitioner / physician assistant"],
  ["registered_nurse", "Registered nurse"], ["allied_health_professional", "Allied health professional"],
  ["administrator", "Administrator"], ["student", "Student"], ["other", "Other"],
] as const;
const TOUR_EXAMPLES = [
  "Summarize a complex patient history into a concise handoff.",
  "Draft a checklist for a safe and efficient clinical workflow.",
  "Explain recent evidence in clear language for a multidisciplinary team.",
] as const;

let React: ReactRuntime;
let jsx: JsxRuntime;
let initialized = false;
function initializeOnboardingRoute(): void {
  if (initialized) return;
  initializeRuntimeLazy(); initializeDepartments();
  React = getReactRuntime(); jsx = getJsxRuntime(); initialized = true;
}

function departmentLabel(value: string): string {
  return value.split("_").map((part) => part.length === 0 ? part : part[0].toUpperCase() + part.slice(1)).join(" ");
}
function personalization(role: string, departments: string[]): Record<string, unknown> {
  const roleLabel = ROLE_OPTIONS.find(([id]) => id === role)?.[1] ?? role;
  const departmentText = departments.map(departmentLabel).join(", ");
  return {
    role_user_message: departmentText.length === 0
      ? "I belong to the following role: " + roleLabel + "."
      : "I belong to the following role: " + roleLabel + ". I work in: " + departmentText + ".",
    other_user_message: "",
  };
}

function WorkspaceOnboarding({ identity, isQuorum, onComplete, workspaceName }: { identity: DepartmentIdentity; isQuorum: boolean; onComplete(): void; workspaceName: string }): unknown {
  const scope = useScope(AppScope);
  const [step, setStep] = React.useState<Step>("intro");
  const [role, setRole] = React.useState("");
  const [departments, setDepartments] = React.useState<string[]>([]);
  const [exampleIndex, setExampleIndex] = React.useState(0);
  const [isSaving, setIsSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const options = departmentsByRole[role] ?? [];

  const complete = async (): Promise<void> => {
    setIsSaving(true); setError(null);
    try { await acknowledgeOnboarding(scope, identity); onComplete(); }
    catch (reason) { setError(reason instanceof Error ? reason.message : "We couldn't save your onboarding progress. Please try again"); }
    finally { setIsSaving(false); }
  };
  const skip = async (): Promise<void> => {
    setIsSaving(true); setError(null);
    try { await skipOnboarding(scope, identity); await complete(); }
    catch (reason) { setError(reason instanceof Error ? reason.message : "We couldn't save your onboarding progress. Please try again"); setIsSaving(false); }
  };
  const saveSurvey = async (): Promise<void> => {
    if (role.length === 0 || (options.length > 0 && departments.length === 0)) return;
    setIsSaving(true); setError(null);
    try {
      await saveOnboarding(scope, identity, { role, departments }, personalization(role, departments));
      setStep("examples");
    } catch (reason) { setError(reason instanceof Error ? reason.message : "We couldn't save your onboarding progress. Please try again"); }
    finally { setIsSaving(false); }
  };

  let content: unknown;
  if (step === "intro") content = jsx.jsxs("section", { children: [
    jsx.jsx("h1", { children: "Welcome to " + workspaceName }),
    jsx.jsx("p", { children: isQuorum ? "Personalize your workspace and review responsible use." : "Tell us how you work so ChatGPT can tailor examples for your healthcare role." }),
    jsx.jsx("button", { type: "button", onClick: () => setStep("role"), children: "Get started" }),
  ] });
  else if (step === "role") content = jsx.jsxs("section", { children: [
    jsx.jsx("h1", { children: "What's your primary role?" }),
    jsx.jsx("div", { children: ROLE_OPTIONS.map(([id, label]) => jsx.jsx("button", { type: "button", "aria-pressed": role === id, onClick: () => setRole(id), children: label }, id)) }),
    jsx.jsx("button", { type: "button", disabled: role.length === 0 || isSaving, onClick: () => options.length > 0 ? setStep("department") : void saveSurvey(), children: "Next" }),
    jsx.jsx("button", { type: "button", disabled: isSaving, onClick: () => { void skip(); }, children: "Skip" }),
  ] });
  else if (step === "department") content = jsx.jsxs("section", { children: [
    jsx.jsx("h1", { children: "Which departments apply to your work?" }),
    jsx.jsx("div", { children: options.map((id) => jsx.jsx("button", { type: "button", "aria-pressed": departments.includes(id), onClick: () => setDepartments((current) => current.includes(id) ? current.filter((value) => value !== id) : [...current, id]), children: departmentLabel(id) }, id)) }),
    jsx.jsx("button", { type: "button", disabled: departments.length === 0 || isSaving, onClick: () => { void saveSurvey(); }, children: isSaving ? "Saving…" : "Next" }),
    jsx.jsx("button", { type: "button", disabled: isSaving, onClick: () => { void skip(); }, children: "Skip" }),
  ] });
  else if (step === "examples") content = jsx.jsxs("section", { "data-tour-index": exampleIndex, children: [
    jsx.jsx("p", { children: "Here's a quick tour…" }),
    jsx.jsx("blockquote", { children: TOUR_EXAMPLES[exampleIndex] }),
    jsx.jsx("button", { type: "button", onClick: () => exampleIndex + 1 < TOUR_EXAMPLES.length ? setExampleIndex(exampleIndex + 1) : setStep("warning"), children: exampleIndex + 1 < TOUR_EXAMPLES.length ? "Next example" : "Continue" }),
    jsx.jsx("button", { type: "button", onClick: () => setStep("warning"), children: "Skip tour" }),
  ] });
  else content = jsx.jsxs("section", { children: [
    jsx.jsx("h1", { children: "Use ChatGPT as a helpful assistant, not a substitute for professional judgment" }),
    jsx.jsx("p", { children: "Review important information, protect sensitive data, and follow your organization's policies." }),
    jsx.jsx("button", { type: "button", disabled: isSaving, onClick: () => { void complete(); }, children: isSaving ? "Finishing…" : "Finish" }),
  ] });

  return jsx.jsxs("main", { "data-onboarding-step": step, children: [content, error == null ? null : jsx.jsx("p", { role: "alert", children: error })] });
}

function OnboardingRoute({ fallback }: { fallback: unknown }): unknown {
  const auth = useAuthState();
  const accounts = useAccountsQuery();
  const onboarding = useSignalValue<OnboardingState>(onboardingStateSignal);
  const persistedAccountId = useSignalValue<string | null>(onboardingAccountIdSignal);
  const persistedUserId = useSignalValue<string | null>(onboardingUserIdSignal);
  const navigate = useNavigate();
  if (auth.isLoading) return jsx.jsx("div", { role: "status", children: "Loading your workspace…" });
  if (auth.authMethod !== "chatgpt" || "debugOverride" in onboarding) return fallback;
  const account = accounts.data?.accounts?.find((candidate) => candidate.id === auth.accountId);
  if (account != null && account.plan_type !== "hc" && account.plan_type !== "quorum") return fallback;
  if (onboarding.status === "loading" || (account == null && accounts.isFetching)) return jsx.jsx("div", { role: "status", children: "Loading your workspace…" });
  if (account == null || auth.accountId == null || auth.userId == null || onboarding.status === "denied") return jsx.jsxs("main", { children: [
    jsx.jsx("h1", { children: "Unable to load your workspace" }),
    jsx.jsx("button", { type: "button", onClick: () => window.location.reload(), children: "Try again" }),
  ] });
  if (onboarding.accountId !== auth.accountId || persistedAccountId !== auth.accountId || persistedUserId !== auth.userId) return jsx.jsx("div", { role: "status", children: "Loading your workspace…" });
  return jsx.jsx(WorkspaceOnboarding, {
    identity: { accountId: auth.accountId, userId: auth.userId },
    workspaceName: account.name ?? "your workspace",
    isQuorum: account.plan_type === "quorum",
    onComplete: () => navigate("/", { replace: true }),
  });
}

initializeOnboardingRoute();
export { OnboardingRoute };
