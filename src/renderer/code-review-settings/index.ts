import "@rchunk/rolldown-runtime";
import * as appSharedChunk from "@rchunk/app-shared";
import * as appInitialChunk from "@rchunk/app-initial";
import {
  a as useCloudUserPreferences,
  o as useUpdateCloudUserPreferences,
  r as initializeCloudPreferences,
} from "@rchunk/cloud-preferences";

const {
  $3: initializeRuntimeLazy,
  I3: getJsxRuntime,
  LX: useScope,
  ZI: AppScope,
  n4: useIntl,
  pk: toastManagerSignal,
} = appSharedChunk;

type ReviewPreference = "always" | "repo_default";
type ReviewTrigger = "pr_open" | "every_push" | "smart_detect";
type SecurityTrigger = ReviewTrigger | "code_review";
type Severity = "critical" | "high" | "medium" | "low";

interface SecurityReviewPreferences {
  manual_severity_threshold?: Severity | null;
  preference?: ReviewPreference | null;
  severity_threshold?: Severity | null;
  trigger_policy?: SecurityTrigger | null;
}

interface CodeReviewPreferences {
  allow_credits_for_code_reviews: boolean;
  code_review_preference?: ReviewPreference | null;
  code_review_trigger_policy?: ReviewTrigger | null;
  exhaustive_code_review: boolean;
  security_review?: SecurityReviewPreferences | null;
}

type PreferencesUpdate = Partial<CodeReviewPreferences> & {
  security_review?: Partial<SecurityReviewPreferences>;
};

interface PreferencesQuery {
  data: CodeReviewPreferences | null | undefined;
  isError: boolean;
  refetch(): void;
}

interface PreferencesMutation {
  isPending: boolean;
  mutate(update: PreferencesUpdate, callbacks: { onError(): void }): void;
}

interface ToastManager {
  danger(message: string, options: { errorAnalytics: { toastId: string } }): void;
}

const codeReviewRuntime = appInitialChunk as unknown as {
  dS: () => { canManageCreditSettings: boolean };
  ofn: (gateId: string) => boolean;
};
const {
  dS: useCreditSettingsAvailability,
  ofn: useFeatureGate,
} = codeReviewRuntime;

const PERSONAL_TRIGGERS: readonly ReviewTrigger[] = ["pr_open", "every_push", "smart_detect"];
const SECURITY_TRIGGERS: readonly SecurityTrigger[] = ["pr_open", "every_push", "smart_detect", "code_review"];
const SEVERITIES: readonly Severity[] = ["critical", "high", "medium", "low"];

let jsx: import("@rchunk/app-shared").JsxRuntime;

function SettingRow({
  control,
  description,
  label,
}: {
  control: unknown;
  description?: string;
  label: string;
}): unknown {
  return jsx.jsxs("div", {
    className: "flex min-h-14 items-center justify-between gap-4 px-4 py-3",
    children: [
      jsx.jsxs("div", {
        className: "min-w-0",
        children: [
          jsx.jsx("div", { className: "font-medium", children: label }),
          description == null ? null : jsx.jsx("div", { className: "mt-0.5 text-sm text-secondary", children: description }),
        ],
      }),
      jsx.jsx("div", { className: "shrink-0", children: control }),
    ],
  });
}

function Section({
  children,
  subtitle,
  title,
}: {
  children: unknown;
  subtitle?: string;
  title: string;
}): unknown {
  return jsx.jsxs("section", {
    className: "overflow-hidden rounded-xl border border-token-border-light bg-surface-primary",
    children: [
      jsx.jsxs("header", {
        className: "border-b border-token-border-light px-4 py-3",
        children: [
          jsx.jsx("h2", { className: "font-semibold", children: title }),
          subtitle == null ? null : jsx.jsx("p", { className: "mt-0.5 text-sm text-secondary", children: subtitle }),
        ],
      }),
      jsx.jsx("div", { className: "divide-y divide-token-border-light", children }),
    ],
  });
}

function Toggle({
  ariaLabel,
  checked,
  disabled,
  onChange,
}: {
  ariaLabel: string;
  checked: boolean;
  disabled: boolean;
  onChange(value: boolean): void;
}): unknown {
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

function Select<Value extends string>({
  ariaLabel,
  disabled,
  labels,
  onChange,
  options,
  value,
}: {
  ariaLabel: string;
  disabled: boolean;
  labels: Record<Value, string>;
  onChange(value: Value): void;
  options: readonly Value[];
  value: Value;
}): unknown {
  return jsx.jsx("select", {
    "aria-label": ariaLabel,
    disabled,
    value,
    onChange: (event: { currentTarget: { value: string } }) => onChange(event.currentTarget.value as Value),
    children: options.map((option) => jsx.jsx("option", { value: option, children: labels[option] }, option)),
  });
}

const REVIEW_TRIGGER_LABELS: Record<ReviewTrigger, string> = {
  every_push: "On every push",
  pr_open: "On PR open",
  smart_detect: "Smart trigger",
};

const SECURITY_TRIGGER_LABELS: Record<SecurityTrigger, string> = {
  code_review: "Whenever code review runs",
  every_push: "On every push",
  pr_open: "On PR open",
  smart_detect: "Smart detect (Experimental)",
};

const SEVERITY_LABELS: Record<Severity, string> = {
  critical: "Critical",
  high: "High",
  low: "Low",
  medium: "Medium",
};

function PersonalPreferences({
  disabled,
  onUpdate,
  preferences,
  showCreditPreference,
}: {
  disabled: boolean;
  onUpdate(update: PreferencesUpdate): void;
  preferences: CodeReviewPreferences;
  showCreditPreference: boolean;
}): unknown {
  const trigger = preferences.code_review_trigger_policy ?? "pr_open";
  return jsx.jsx(Section, {
    title: "Personal preferences",
    children: [
      jsx.jsx(SettingRow, {
        label: "Automatic review",
        description: "Automatically review pull requests in repositories with code review enabled",
        control: jsx.jsx(Toggle, {
          ariaLabel: "Enable automatic code review",
          checked: preferences.code_review_preference === "always",
          disabled,
          onChange: (enabled) => onUpdate({ code_review_preference: enabled ? "always" : "repo_default" }),
        }),
      }, "automatic"),
      jsx.jsx(SettingRow, {
        label: "Review trigger",
        description: "Choose when ChatGPT should review your pull requests",
        control: jsx.jsx(Select<ReviewTrigger>, {
          ariaLabel: "Review trigger",
          disabled,
          labels: REVIEW_TRIGGER_LABELS,
          options: PERSONAL_TRIGGERS,
          value: trigger,
          onChange: (value) => onUpdate({ code_review_trigger_policy: value }),
        }),
      }, "trigger"),
      jsx.jsx(SettingRow, {
        label: "Exhaustive code review",
        description: "Keep looking for findings until ChatGPT stops finding new issues",
        control: jsx.jsx(Toggle, {
          ariaLabel: "Enable exhaustive code review",
          checked: preferences.exhaustive_code_review,
          disabled,
          onChange: (enabled) => onUpdate({ exhaustive_code_review: enabled }),
        }),
      }, "exhaustive"),
      showCreditPreference ? jsx.jsx(SettingRow, {
        label: "Use credits for reviews",
        description: "Allow credits to be consumed for reviews after rate limits",
        control: jsx.jsx(Toggle, {
          ariaLabel: "Allow credits for code reviews",
          checked: preferences.allow_credits_for_code_reviews,
          disabled,
          onChange: (enabled) => onUpdate({ allow_credits_for_code_reviews: enabled }),
        }),
      }, "credits") : null,
    ],
  });
}

function SecurityPreferences({
  disabled,
  onUpdate,
  preferences,
}: {
  disabled: boolean;
  onUpdate(update: PreferencesUpdate): void;
  preferences: SecurityReviewPreferences;
}): unknown {
  const smartDetectEnabled = useFeatureGate("579168209");
  const trigger = preferences.trigger_policy ?? "code_review";
  const triggerOptions = SECURITY_TRIGGERS.filter((option) => option !== "smart_detect" || smartDetectEnabled || trigger === "smart_detect");
  return jsx.jsx(Section, {
    title: "Personal security review preferences",
    subtitle: "Control how Codex reviews your pull requests for security by default",
    children: [
      jsx.jsx(SettingRow, {
        label: "Automatic security review",
        description: "Automatically review your pull requests in enabled repositories for security",
        control: jsx.jsx(Toggle, {
          ariaLabel: "Enable automatic security review",
          checked: preferences.preference === "always",
          disabled,
          onChange: (enabled) => onUpdate({ security_review: { preference: enabled ? "always" : "repo_default" } }),
        }),
      }, "security-automatic"),
      jsx.jsx(SettingRow, {
        label: "Security review trigger",
        description: "Choose when Codex should review your pull requests for security",
        control: jsx.jsx(Select<SecurityTrigger>, {
          ariaLabel: "Security review trigger",
          disabled,
          labels: SECURITY_TRIGGER_LABELS,
          options: triggerOptions,
          value: trigger,
          onChange: (value) => onUpdate({ security_review: { trigger_policy: value } }),
        }),
      }, "security-trigger"),
      jsx.jsx(SettingRow, {
        label: "Minimum automatic review reporting severity",
        description: "Choose the lowest severity reported for automated reviews",
        control: jsx.jsx(Select<Severity>, {
          ariaLabel: "Minimum automatic review reporting severity",
          disabled,
          labels: SEVERITY_LABELS,
          options: SEVERITIES,
          value: preferences.severity_threshold ?? "high",
          onChange: (value) => onUpdate({ security_review: { severity_threshold: value } }),
        }),
      }, "automatic-severity"),
      jsx.jsx(SettingRow, {
        label: "Minimum manual review reporting severity",
        description: "Choose the lowest severity reported for reviews requested with @codex",
        control: jsx.jsx(Select<Severity>, {
          ariaLabel: "Minimum manual review reporting severity",
          disabled,
          labels: SEVERITY_LABELS,
          options: SEVERITIES,
          value: preferences.manual_severity_threshold ?? "medium",
          onChange: (value) => onUpdate({ security_review: { manual_severity_threshold: value } }),
        }),
      }, "manual-severity"),
    ],
  });
}

function CodeReviewContent(): unknown {
  const scope = useScope(AppScope);
  const intl = useIntl();
  const preferencesQuery = useCloudUserPreferences() as PreferencesQuery;
  const mutation = useUpdateCloudUserPreferences() as PreferencesMutation;
  const { canManageCreditSettings } = useCreditSettingsAvailability();
  const save = (update: PreferencesUpdate) => mutation.mutate(update, {
    onError: () => {
      const toast = scope.get(toastManagerSignal) as unknown as ToastManager;
      toast.danger(String(intl.formatMessage({
        id: "settings.codeReview.save.error",
        defaultMessage: "Unable to save code review settings",
      })), { errorAnalytics: { toastId: "settings.codeReview.save.error" } });
    },
  });

  if (preferencesQuery.data == null) {
    if (preferencesQuery.isError) {
      return jsx.jsx(Section, {
        title: "Code review settings",
        children: jsx.jsx(SettingRow, {
          label: "Unable to load code review settings",
          control: jsx.jsx("button", {
            type: "button",
            className: "rounded-md border px-3 py-1.5 text-sm",
            onClick: () => preferencesQuery.refetch(),
            children: "Retry",
          }),
        }),
      });
    }
    return jsx.jsx("div", {
      role: "status",
      className: "py-8 text-center text-secondary",
      children: "Loading code review settings…",
    });
  }

  return jsx.jsxs("div", {
    className: "flex flex-col gap-5",
    children: [
      jsx.jsx(PersonalPreferences, {
        disabled: mutation.isPending,
        onUpdate: save,
        preferences: preferencesQuery.data,
        showCreditPreference: canManageCreditSettings,
      }),
      preferencesQuery.data.security_review == null ? null : jsx.jsx(SecurityPreferences, {
        disabled: mutation.isPending,
        onUpdate: save,
        preferences: preferencesQuery.data.security_review,
      }),
    ],
  });
}

function CodeReviewSettings(): unknown {
  initializeCodeReviewSettings();
  return jsx.jsxs("div", {
    className: "flex h-full min-h-0 flex-col",
    children: [
      jsx.jsxs("header", {
        className: "border-b border-token-border-light px-5 py-4",
        children: [
          jsx.jsx("h1", { className: "text-lg font-semibold", children: "Code review" }),
          jsx.jsx("p", { className: "mt-1 text-sm text-secondary", children: "Set up ChatGPT to automatically review pull requests" }),
        ],
      }),
      jsx.jsx("main", {
        className: "flex-1 overflow-auto p-5",
        children: jsx.jsx("div", { className: "mx-auto max-w-3xl", children: jsx.jsx(CodeReviewContent, {}) }),
      }),
    ],
  });
}

let initialized = false;
function initializeCodeReviewSettings(): void {
  if (initialized) return;
  initializeRuntimeLazy();
  initializeCloudPreferences();
  jsx = getJsxRuntime();
  initialized = true;
}

initializeCodeReviewSettings();
export { CodeReviewSettings };
