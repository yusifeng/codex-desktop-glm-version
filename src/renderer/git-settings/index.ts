import "@rchunk/rolldown-runtime";
import * as appSharedChunk from "@rchunk/app-shared";
import * as appInitialChunk from "@rchunk/app-initial";
import {
  n as initializePullRequestFixAutomation,
  o as refreshActivePullRequestFixAutomations,
} from "@rchunk/pull-request-fix-automation";

type GitReviewMode = "full" | "last-turn-only";
type PullRequestMergeMethod = "merge" | "squash";
type ReviewDelivery = "inline" | "detached";

interface SettingDescriptor<Value> { key: string }
interface GitSettingDescriptors {
  alwaysForcePush: SettingDescriptor<boolean>;
  branchPrefix: SettingDescriptor<string>;
  commitInstructions: SettingDescriptor<string>;
  createPullRequestAsDraft: SettingDescriptor<boolean>;
  pullRequestInstructions: SettingDescriptor<string>;
  pullRequestMergeMethod: SettingDescriptor<PullRequestMergeMethod>;
  pullRequestWatchAutoMerge: SettingDescriptor<boolean>;
  pullRequestWatchInstructions: SettingDescriptor<string>;
  reviewMode: SettingDescriptor<GitReviewMode>;
}
interface MutationResult<Value> {
  isPending: boolean;
  mutate(value: Value): void;
}
interface ToastManager {
  danger(message: string, options: { errorAnalytics: { toastId: string } }): void;
  success(message: string): void;
}

const sharedRuntime = appSharedChunk as unknown as {
  $3: () => void;
  EU: GitSettingDescriptors;
  I3: () => import("@rchunk/app-shared").JsxRuntime;
  LX: <T>(scope: T) => import("@rchunk/app-shared").MaitaiScopeApi<Record<string, unknown>>;
  ZI: unknown;
  e6: () => import("@rchunk/app-shared").ReactRuntime;
  iL: <Value, Result>(options: {
    mutationFn(value: Value): Promise<Result> | Result;
    onError(error: unknown, value: Value): void;
    onSuccess(result: Result, value: Value): void;
  }) => MutationResult<Value>;
  iz: { reviewDelivery: SettingDescriptor<ReviewDelivery> };
  n4: () => import("@rchunk/app-shared").IntlShape;
  pk: unknown;
};
const {
  $3: initializeRuntimeLazy,
  EU: gitSettings,
  I3: getJsxRuntime,
  LX: useScope,
  ZI: AppScope,
  e6: getReactRuntime,
  iL: useMutation,
  iz: generalSettings,
  n4: useIntl,
  pk: toastManagerSignal,
} = sharedRuntime;

const initialRuntime = appInitialChunk as unknown as {
  $ln: (key: string) => unknown;
  Kcn: <Value>(setting: SettingDescriptor<Value>) => Value;
  O8t: string;
  Ucn: <Value>(scope: unknown, setting: SettingDescriptor<Value>, value: Value) => Promise<void> | void;
  ofn: (gateId: string) => boolean;
  oun: (queryClient: unknown, queryKey: unknown) => Promise<void> | void;
};
const {
  $ln: automationQueryKey,
  Kcn: useSetting,
  O8t: gitReviewModeGate,
  Ucn: setSetting,
  ofn: useFeatureGate,
  oun: invalidateAutomationQuery,
} = initialRuntime;

let React: import("@rchunk/app-shared").ReactRuntime;
let jsx: import("@rchunk/app-shared").JsxRuntime;

function SettingRow({ control, description, label }: { control: unknown; description?: string; label: string }): unknown {
  return jsx.jsxs("div", {
    className: "flex min-h-14 items-center justify-between gap-4 px-4 py-3",
    children: [
      jsx.jsxs("div", { className: "min-w-0", children: [
        jsx.jsx("div", { className: "font-medium", children: label }),
        description == null ? null : jsx.jsx("div", { className: "mt-0.5 text-sm text-secondary", children: description }),
      ] }),
      jsx.jsx("div", { className: "shrink-0", children: control }),
    ],
  });
}

function Section({ actions, children, subtitle, title }: { actions?: unknown; children: unknown; subtitle?: string; title?: string }): unknown {
  return jsx.jsxs("section", {
    className: "overflow-hidden rounded-xl border border-token-border-light bg-surface-primary",
    children: [
      title == null ? null : jsx.jsxs("header", { className: "flex items-start justify-between gap-4 border-b border-token-border-light px-4 py-3", children: [
        jsx.jsxs("div", { children: [
          jsx.jsx("h2", { className: "font-semibold", children: title }),
          subtitle == null ? null : jsx.jsx("p", { className: "mt-0.5 text-sm text-secondary", children: subtitle }),
        ] }),
        actions,
      ] }),
      jsx.jsx("div", { className: "divide-y divide-token-border-light", children }),
    ],
  });
}

function Toggle({ ariaLabel, checked, disabled, onChange }: { ariaLabel: string; checked: boolean; disabled: boolean; onChange(value: boolean): void }): unknown {
  return jsx.jsx("button", {
    type: "button",
    role: "switch",
    "aria-label": ariaLabel,
    "aria-checked": checked,
    disabled,
    className: "rounded-full border px-3 py-1 text-sm",
    onClick: () => onChange(!checked),
    children: checked ? "On" : "Off",
  });
}

function useSettingMutation<Value>({
  errorMessage,
  setting,
  successMessage,
}: {
  errorMessage: string;
  setting: SettingDescriptor<Value>;
  successMessage(value: Value): string;
}): MutationResult<Value> {
  const scope = useScope(AppScope);
  const toast = scope.get(toastManagerSignal as never) as unknown as ToastManager;
  return useMutation<Value, void>({
    mutationFn: (value) => setSetting(scope, setting, value),
    onSuccess: (_result, value) => toast.success(successMessage(value)),
    onError: () => toast.danger(errorMessage, { errorAnalytics: { toastId: setting.key + ".save.error" } }),
  });
}

function TextSetting({
  ariaLabel,
  children,
  onSaved,
  placeholder,
  rows = 6,
  setting,
  subtitle,
  title,
}: {
  ariaLabel: string;
  children?: unknown;
  onSaved?(value: string): void;
  placeholder: string;
  rows?: number;
  setting: SettingDescriptor<string>;
  subtitle?: string;
  title: string;
}): unknown {
  const current = useSetting(setting);
  const [draft, setDraft] = React.useState<string | null>(null);
  const [saved, setSaved] = React.useState(false);
  const value = draft ?? current;
  const mutation = useSettingMutation({
    setting,
    errorMessage: "Failed to save instructions",
    successMessage: () => "Saved",
  });
  const dirty = draft != null && draft !== current;
  const save = () => {
    if (!dirty || mutation.isPending) return;
    mutation.mutate(value);
    setDraft(null);
    setSaved(true);
    onSaved?.(value);
  };
  React.useEffect(() => {
    if (!dirty) return;
    const timer = globalThis.setTimeout(save, 3000);
    return () => globalThis.clearTimeout(timer);
  }, [dirty, value]);
  return jsx.jsx(Section, {
    title,
    subtitle,
    actions: dirty ? jsx.jsx("button", { type: "button", disabled: mutation.isPending, onClick: save, children: mutation.isPending ? "Saving…" : "Save" })
      : saved ? jsx.jsx("span", { "aria-live": "polite", className: "text-xs text-secondary", children: "Saved" }) : null,
    children: jsx.jsxs("div", { className: "p-4", children: [
      children,
      jsx.jsx("textarea", {
        "aria-label": ariaLabel,
        disabled: mutation.isPending,
        placeholder,
        rows,
        value,
        onBlur: save,
        onChange: (event: { currentTarget: { value: string } }) => { setSaved(false); setDraft(event.currentTarget.value === current ? null : event.currentTarget.value); },
      }),
    ] }),
  });
}

function GitPreferenceRows(): unknown {
  const scope = useScope(AppScope);
  const intl = useIntl();
  const branchPrefix = useSetting(gitSettings.branchPrefix);
  const alwaysForcePush = useSetting(gitSettings.alwaysForcePush);
  const createDraft = useSetting(gitSettings.createPullRequestAsDraft);
  const mergeMethod = useSetting(gitSettings.pullRequestMergeMethod);
  const reviewMode = useSetting(gitSettings.reviewMode);
  const reviewDelivery = useSetting(generalSettings.reviewDelivery) ?? "inline";
  const [branchDraft, setBranchDraft] = React.useState<string | null>(null);
  const branchValue = branchDraft ?? branchPrefix;
  const branchMutation = useSettingMutation({ setting: gitSettings.branchPrefix, errorMessage: "Failed to save branch prefix", successMessage: () => "Saved branch prefix" });
  const forcePushMutation = useSettingMutation({ setting: gitSettings.alwaysForcePush, errorMessage: "Failed to save force push setting", successMessage: (value) => value ? "Always force push enabled" : "Always force push disabled" });
  const draftMutation = useSettingMutation({ setting: gitSettings.createPullRequestAsDraft, errorMessage: "Failed to save draft pull request setting", successMessage: (value) => value ? "Create draft pull requests enabled" : "Create draft pull requests disabled" });
  const mergeMutation = useSettingMutation({ setting: gitSettings.pullRequestMergeMethod, errorMessage: "Failed to save pull request merge method", successMessage: () => "Saved pull request merge method" });
  const reviewModeVisible = useFeatureGate(gitReviewModeGate);
  const mergeMethodVisible = useFeatureGate("2764989143");
  const saveBranch = () => {
    if (branchDraft == null || branchMutation.isPending) return;
    branchMutation.mutate(branchValue);
    setBranchDraft(null);
  };
  return jsx.jsx(Section, {
    children: [
      reviewModeVisible ? jsx.jsx(SettingRow, {
        label: "Disable Git-Based Review",
        description: "Only show Last Turn in the Review panel and disable Unstaged, Staged, and Branch",
        control: jsx.jsx(Toggle, { ariaLabel: "Disable Git-Based Review", checked: reviewMode === "last-turn-only", disabled: false, onChange: (value) => { void setSetting(scope, gitSettings.reviewMode, value ? "last-turn-only" : "full"); } }),
      }, "review-mode") : null,
      jsx.jsx(SettingRow, {
        label: "Branch prefix",
        description: "Prefix used when ChatGPT creates new branches",
        control: jsx.jsxs("div", { className: "flex gap-2", children: [
          jsx.jsx("input", { "aria-label": "Branch prefix", disabled: branchMutation.isPending, placeholder: "codex/", value: branchValue, onBlur: saveBranch, onChange: (event: { currentTarget: { value: string } }) => setBranchDraft(event.currentTarget.value === branchPrefix ? null : event.currentTarget.value) }),
          jsx.jsx("button", { type: "button", disabled: branchDraft == null || branchMutation.isPending, onClick: saveBranch, children: "Save" }),
        ] }),
      }, "branch-prefix"),
      mergeMethodVisible ? jsx.jsx(SettingRow, {
        label: "Pull request merge method",
        description: "Choose how ChatGPT merges pull requests",
        control: jsx.jsxs("select", { "aria-label": "Pull request merge method", disabled: mergeMutation.isPending, value: mergeMethod, onChange: (event: { currentTarget: { value: string } }) => mergeMutation.mutate(event.currentTarget.value === "squash" ? "squash" : "merge"), children: [
          jsx.jsx("option", { value: "merge", children: "Merge" }),
          jsx.jsx("option", { value: "squash", children: "Squash" }),
        ] }),
      }, "merge-method") : null,
      jsx.jsx(SettingRow, {
        label: "Always force push",
        description: "Use --force-with-lease when pushing from ChatGPT",
        control: jsx.jsx(Toggle, { ariaLabel: "Always force push", checked: alwaysForcePush, disabled: forcePushMutation.isPending, onChange: (value) => forcePushMutation.mutate(value) }),
      }, "force-push"),
      jsx.jsx(SettingRow, {
        label: "Create draft pull requests",
        description: "Use draft pull requests by default when creating PRs from ChatGPT",
        control: jsx.jsx(Toggle, { ariaLabel: "Create draft pull requests", checked: createDraft, disabled: draftMutation.isPending, onChange: (value) => draftMutation.mutate(value) }),
      }, "draft-pr"),
      jsx.jsx(SettingRow, {
        label: "Review delivery",
        description: "Start /review in the current chat when possible or launch a separate review chat",
        control: jsx.jsxs("select", { "aria-label": String(intl.formatMessage({ id: "settings.general.reviewDelivery.label", defaultMessage: "Review delivery" })), value: reviewDelivery, onChange: (event: { currentTarget: { value: string } }) => { void setSetting(scope, generalSettings.reviewDelivery, event.currentTarget.value === "detached" ? "detached" : "inline"); }, children: [
          jsx.jsx("option", { value: "inline", children: "Inline" }),
          jsx.jsx("option", { value: "detached", children: "Detached" }),
        ] }),
      }, "review-delivery"),
    ],
  });
}

function PullRequestWatchSettings(): unknown {
  const scope = useScope(AppScope);
  const autoMerge = useSetting(gitSettings.pullRequestWatchAutoMerge);
  const instructions = useSetting(gitSettings.pullRequestWatchInstructions);
  const toast = scope.get(toastManagerSignal as never) as unknown as ToastManager;
  const refresh = async (preferences: { autoMerge: boolean; instructions: string }) => {
    await refreshActivePullRequestFixAutomations(preferences);
    await invalidateAutomationQuery(scope.queryClient, automationQueryKey("list-automations"));
  };
  const autoMergeMutation = useMutation<boolean, void>({
    mutationFn: async (value) => {
      await setSetting(scope, gitSettings.pullRequestWatchAutoMerge, value);
      await refresh({ autoMerge: value, instructions });
    },
    onSuccess: (_result, value) => toast.success(value ? "Automatic PR merging enabled" : "Automatic PR merging disabled"),
    onError: () => toast.danger("Failed to save automatic PR merging", { errorAnalytics: { toastId: "settings.git.pullRequestWatch.autoMerge.error" } }),
  });
  return jsx.jsx(TextSetting, {
    setting: gitSettings.pullRequestWatchInstructions,
    title: "Watch and fix pull requests",
    placeholder: "For example: Comment /merge after checks pass and approve unrelated Chromatic changes…",
    ariaLabel: "Pull request watch instructions",
    rows: 5,
    onSaved: (value) => { void refresh({ autoMerge, instructions: value }).catch(() => toast.danger("Failed to update active pull request watchers", { errorAnalytics: { toastId: "settings.git.pullRequestWatch.updateActive.error" } })); },
    children: jsx.jsx(SettingRow, {
      label: "Auto-merge when ready",
      description: "Continue watching until the pull request is merged",
      control: jsx.jsx(Toggle, { ariaLabel: "Auto-merge when ready", checked: autoMerge, disabled: autoMergeMutation.isPending, onChange: (value) => autoMergeMutation.mutate(value) }),
    }),
  });
}

function GitSettings(): unknown {
  initializeGitSettings();
  return jsx.jsxs("div", {
    className: "flex h-full min-h-0 flex-col",
    children: [
      jsx.jsx("header", { className: "border-b border-token-border-light px-5 py-4", children: jsx.jsx("h1", { className: "text-lg font-semibold", children: "Git" }) }),
      jsx.jsx("main", { className: "flex-1 overflow-auto p-5", children: jsx.jsxs("div", { className: "mx-auto flex max-w-3xl flex-col gap-5", children: [
        jsx.jsx(GitPreferenceRows, {}),
        jsx.jsx(PullRequestWatchSettings, {}),
        jsx.jsx(TextSetting, { setting: gitSettings.commitInstructions, title: "Commit instructions", subtitle: "Added to commit message generation prompts", placeholder: "Add commit message guidance…", ariaLabel: "Commit instructions" }),
        jsx.jsx(TextSetting, { setting: gitSettings.pullRequestInstructions, title: "Pull request instructions", subtitle: "Added to PR title/description generation prompts", placeholder: "Add pull request guidance…", ariaLabel: "Pull request instructions" }),
      ] }) }),
    ],
  });
}

let initialized = false;
function initializeGitSettings(): void {
  if (initialized) return;
  initializeRuntimeLazy();
  initializePullRequestFixAutomation();
  React = getReactRuntime();
  jsx = getJsxRuntime();
  initialized = true;
}

initializeGitSettings();
export { GitSettings };
