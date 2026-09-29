import "@rchunk/rolldown-runtime";
import * as appSharedChunk from "@rchunk/app-shared";
import "@rchunk/app-initial";
import {
  a as useCloudUserPreferences,
  i as useCloudPreferencesConfig,
  n as validatePathTemplate,
  o as useUpdateCloudUserPreferences,
  r as initializeCloudPreferences,
  t as previewPathTemplate,
  type PathTemplateError,
  type PathTemplateVariable,
} from "@rchunk/cloud-preferences";

const {
  $3: initializeRuntimeLazy,
  I3: getJsxRuntime,
  LX: useScope,
  ZI: AppScope,
  e6: getReactRuntime,
  n4: useIntl,
  pk: toastManagerSignal,
} = appSharedChunk;

interface CloudUserPreferences {
  branch_format: string;
  git_diff_mode: "split" | "unified";
}

interface CloudPreferencesConfig {
  branch_format_max_length: number;
  branch_format_special_values: readonly PathTemplateVariable[];
}

interface QueryResult<Value> {
  data: Value | null | undefined;
  isError: boolean;
  refetch(): void;
}

interface UpdateMutation {
  isPending: boolean;
  mutate(
    update: Partial<CloudUserPreferences>,
    callbacks: { onError(): void; onSuccess(): void },
  ): void;
}

const VALIDATION_MESSAGES: Record<PathTemplateError, string> = {
  "bracket-mismatch": "Branch format has unmatched brackets",
  "invalid-characters": "Branch format contains invalid characters",
  "invalid-pattern": "Branch format contains an unavailable placeholder",
  "leading-slash": "Branch format cannot start with '/'",
  "missing-pattern": "Branch format must contain at least one placeholder",
  "too-long": "Generated branch name exceeds the allowed length",
};

let React: import("@rchunk/app-shared").ReactRuntime;
let jsx: import("@rchunk/app-shared").JsxRuntime;

function SettingRow({
  control,
  description,
  label,
}: {
  control: unknown;
  description?: unknown;
  label: unknown;
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

function Button({
  children,
  disabled,
  onClick,
}: {
  children: unknown;
  disabled?: boolean;
  onClick(): void;
}): unknown {
  return jsx.jsx("button", {
    type: "button",
    disabled,
    className: "rounded-md border px-3 py-1.5 text-sm font-medium",
    onClick,
    children,
  });
}

function CloudPreferencesContent(): unknown {
  const scope = useScope(AppScope);
  const intl = useIntl();
  const preferencesQuery = useCloudUserPreferences() as QueryResult<CloudUserPreferences>;
  const configQuery = useCloudPreferencesConfig() as QueryResult<CloudPreferencesConfig>;
  const mutation = useUpdateCloudUserPreferences() as UpdateMutation;
  const [draft, setDraft] = React.useState<{ baseline: string; value: string } | null>(null);

  if (preferencesQuery.isError || configQuery.isError) {
    return jsx.jsx("section", {
      className: "rounded-xl border border-token-border-light p-4",
      children: jsx.jsx(SettingRow, {
        label: "Unable to load cloud preferences",
        control: jsx.jsx(Button, {
          onClick: () => { preferencesQuery.refetch(); configQuery.refetch(); },
          children: "Retry",
        }),
      }),
    });
  }
  if (preferencesQuery.data == null || configQuery.data == null) {
    return jsx.jsx("div", { role: "status", className: "py-8 text-center text-secondary", children: "Loading cloud preferences…" });
  }

  const preferences = preferencesQuery.data;
  const config = configQuery.data;
  const branchFormat = draft?.baseline === preferences.branch_format ? draft.value : preferences.branch_format;
  const validationError = validatePathTemplate(
    branchFormat,
    config.branch_format_max_length,
    config.branch_format_special_values,
  );
  const save = (update: Partial<CloudUserPreferences>, successMessage: string) => {
    mutation.mutate(update, {
      onSuccess: () => scope.get<import("@rchunk/app-shared").ToastManager>(toastManagerSignal).success(successMessage),
      onError: () => scope.get<import("@rchunk/app-shared").ToastManager>(toastManagerSignal).danger(
        String(intl.formatMessage({ id: "settings.general.cloudPreferences.save.error", defaultMessage: "Unable to save cloud preference" })),
        { errorAnalytics: { toastId: "wham_preferences_page_preferences_update_error" } },
      ),
    });
  };
  const preview = validationError == null
    ? "Example: " + previewPathTemplate(branchFormat, config.branch_format_special_values)
    : VALIDATION_MESSAGES[validationError];
  const placeholders = config.branch_format_special_values.map((variable) => variable.value).join(", ");
  const saveDisabled = branchFormat === preferences.branch_format || validationError != null || mutation.isPending;

  return jsx.jsx("section", {
    className: "rounded-xl border border-token-border-light bg-surface-primary",
    children: jsx.jsxs("div", {
      className: "divide-y divide-token-border-light",
      children: [
        jsx.jsx(SettingRow, {
          label: "Diff view",
          description: "Choose how changes are shown in cloud chats",
          control: jsx.jsxs("select", {
            "aria-label": "Diff view",
            disabled: mutation.isPending,
            value: preferences.git_diff_mode,
            onChange: (event: { currentTarget: { value: string } }) => save(
              { git_diff_mode: event.currentTarget.value === "split" ? "split" : "unified" },
              "Saved diff view",
            ),
            children: [
              jsx.jsx("option", { value: "unified", children: "Unified" }),
              jsx.jsx("option", { value: "split", children: "Split" }),
            ],
          }),
        }),
        jsx.jsx(SettingRow, {
          label: "Branch format",
          description: preview,
          control: jsx.jsx("input", {
            "aria-label": "Branch format pattern",
            disabled: mutation.isPending,
            placeholder: "codex/{feature}",
            value: branchFormat,
            onChange: (event: { currentTarget: { value: string } }) => setDraft({
              baseline: preferences.branch_format,
              value: event.currentTarget.value,
            }),
          }),
        }),
        jsx.jsx(SettingRow, {
          label: "Available placeholders",
          description: placeholders,
          control: jsx.jsx(Button, {
            disabled: saveDisabled,
            onClick: () => save({ branch_format: branchFormat }, "Saved branch format"),
            children: mutation.isPending ? "Saving…" : "Save",
          }),
        }),
      ],
    }),
  });
}

function CloudPreferencesSettings(): unknown {
  initializeCloudPreferencesSettings();
  return jsx.jsxs("div", {
    className: "flex h-full min-h-0 flex-col",
    children: [
      jsx.jsx("header", {
        className: "border-b border-token-border-light px-5 py-4",
        children: jsx.jsx("h1", { className: "text-lg font-semibold", children: "Cloud preferences" }),
      }),
      jsx.jsx("div", {
        className: "flex-1 overflow-auto p-5",
        children: jsx.jsx("div", {
          className: "mx-auto max-w-3xl",
          children: jsx.jsx(CloudPreferencesContent, {}),
        }),
      }),
    ],
  });
}

let initialized = false;
function initializeCloudPreferencesSettings(): void {
  if (initialized) return;
  initializeRuntimeLazy();
  initializeCloudPreferences();
  React = getReactRuntime();
  jsx = getJsxRuntime();
  initialized = true;
}

initializeCloudPreferencesSettings();
export { CloudPreferencesSettings };
