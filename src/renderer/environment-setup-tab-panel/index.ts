import {
  BX as useScopedFamilyValue,
  I3 as getJsxRuntime,
  rJ as isClientConversationId,
  type JsxRuntime,
} from "@rchunk/app-shared";
import {
  Gm as environmentDraftSaveMutation,
  Jpt as environmentDraftChanges,
  Km as environmentConfigurationQuery,
  Kpt as environmentSetupState,
  Ltn as conversationState,
  Ypt as conversationEnvironmentConfiguration,
} from "@rchunk/app-initial";
import {
  t as EnvironmentConfigurationFields,
  type EnvironmentDraft,
  type EnvironmentIssue,
  type EnvironmentSecret,
  type EnvironmentVariable,
} from "@rchunk/environment-configuration-fields";
import {
  n as pendingEnvironmentOnboarding,
  type PendingEnvironmentOnboarding,
} from "@rchunk/pending-environment-onboarding";
import { t as EnvironmentPublishActions } from "@rchunk/publish-actions";
import "@rchunk/allowed-domains-input";
import "@rchunk/environment-change-messages";
import "@rchunk/rolldown-runtime";
import "@rchunk/side-panel";
import "@rchunk/validation-message";

export interface EnvironmentSetupTabPanelProps {
  conversationId: string;
  onClose?(): void;
}

interface PendingOnboardingState extends PendingEnvironmentOnboarding {
  conversationId?: string;
  name?: string;
  draft?: EnvironmentDraft;
  secrets?: EnvironmentSecret[];
  environmentVariables?: EnvironmentVariable[];
}

interface ConversationEnvironmentConfiguration {
  accountId?: string;
  userId?: string;
  configId?: string;
  name?: string;
  [key: string]: unknown;
}

interface ConfigurationQueryResult {
  data?: {
    draft?: EnvironmentDraft;
    name?: string;
    [key: string]: unknown;
  };
  fetchStatus?: string;
  isError?: boolean;
  isPending?: boolean;
  refetch?(): void;
}

interface SaveMutation {
  error?: unknown;
  isPending?: boolean;
  mutate(
    input: Record<string, unknown>,
    options?: { onSuccess?(): void },
  ): void;
}

let jsx: JsxRuntime;

function changedSections(
  changes: Partial<EnvironmentDraft> | null | undefined,
): string[] {
  if (!changes) return [];
  const sections: string[] = [];
  if (changes.name !== undefined) sections.push("name");
  if (
    changes.setupScript !== undefined ||
    changes.startSkill !== undefined ||
    changes.maintenanceSetupScript !== undefined
  )
    sections.push("scripts");
  if (
    changes.networkEnabled !== undefined ||
    changes.networkDomains !== undefined ||
    changes.networkPreset !== undefined
  )
    sections.push("network");
  if (changes.repositories !== undefined) sections.push("repositories");
  if (changes.access !== undefined) sections.push("privacy");
  if (changes.outboundIdentityRequirements !== undefined)
    sections.push("connections");
  return sections;
}

function EnvironmentSetupTabPanel(
  props: EnvironmentSetupTabPanelProps,
): unknown {
  const runtime = ensureJsx();
  const pending = useScopedFamilyValue(
    pendingEnvironmentOnboarding,
    isClientConversationId(props.conversationId) ? props.conversationId : null,
  ) as unknown as PendingOnboardingState | null;
  const activeConversationId = pending?.conversationId ?? props.conversationId;
  const conversation = useScopedFamilyValue(
    conversationState,
    activeConversationId,
  ) as unknown as { title?: string } | null;
  const configuration = useScopedFamilyValue(
    conversationEnvironmentConfiguration,
    activeConversationId,
  ) as unknown as ConversationEnvironmentConfiguration | null;
  const query = useScopedFamilyValue(
    environmentConfigurationQuery,
    activeConversationId,
  ) as unknown as ConfigurationQueryResult | null;
  const savedChanges = useScopedFamilyValue(
    environmentDraftChanges,
    activeConversationId,
  ) as unknown as Partial<EnvironmentDraft> | null;
  const setup = useScopedFamilyValue(
    environmentSetupState,
    activeConversationId,
  ) as unknown as { phase?: string } | null;
  const saveMutation = useScopedFamilyValue(
    environmentDraftSaveMutation,
    activeConversationId,
  ) as unknown as SaveMutation | null;

  if (pending && !pending.conversationId) {
    return runtime.jsxs("aside", {
      className: "environment-setup-panel",
      children: [
        runtime.jsx("h2", { children: pending.name ?? "New environment" }),
        runtime.jsx("p", {
          role: setup?.phase === "failed" ? "alert" : "status",
          children:
            setup?.phase === "failed"
              ? "Couldn’t create the environment. Go back to try again"
              : "Creating environment configuration…",
        }),
      ],
    });
  }

  if (query?.isPending || query?.fetchStatus === "fetching") {
    return runtime.jsx("div", {
      role: "status",
      children: "Loading environment configuration…",
    });
  }
  if (query?.isError) {
    return runtime.jsxs("div", {
      role: "alert",
      children: [
        "Couldn’t load environment configuration",
        runtime.jsx("button", {
          type: "button",
          onClick: () => query.refetch?.(),
          children: "Retry",
        }),
      ],
    });
  }

  const baseDraft = pending?.draft ?? query?.data?.draft ?? {};
  let draft: EnvironmentDraft = { ...baseDraft, ...(savedChanges ?? {}) };
  let secrets = pending?.secrets ?? [];
  let variables = pending?.environmentVariables ?? [];
  let issues: EnvironmentIssue[] = [];
  const sections = changedSections(savedChanges);
  const name =
    typeof draft.name === "string"
      ? draft.name
      : (pending?.name ??
        configuration?.name ??
        query?.data?.name ??
        conversation?.title ??
        "New environment");

  const save = (): void => {
    if (!saveMutation || saveMutation.isPending) return;
    saveMutation.mutate({
      changes: draft,
      config: query?.data,
      configuration,
      secrets,
      environmentVariables: variables,
    });
  };

  return runtime.jsxs("aside", {
    className: "environment-setup-panel",
    "data-conversation-id": activeConversationId,
    children: [
      runtime.jsxs("header", {
        children: [
          runtime.jsx("input", {
            "aria-label": "Environment name",
            maxLength: 128,
            value: name,
            onChange: (event: { currentTarget: { value: string } }) => {
              draft = { ...draft, name: event.currentTarget.value };
            },
          }),
          props.onClose
            ? runtime.jsx("button", {
                type: "button",
                onClick: props.onClose,
                children: "Close",
              })
            : null,
        ],
      }),
      runtime.jsx("p", {
        role: "status",
        children:
          sections.length === 0
            ? "All changes saved"
            : `${sections.length} changes: ${sections.join(", ")}`,
      }),
      runtime.jsx(EnvironmentConfigurationFields, {
        configuration,
        draft,
        secrets,
        issues,
        environmentVariables: variables,
        isReadOnly: saveMutation?.isPending === true,
        onDraftChange: (change: Partial<EnvironmentDraft>) => {
          draft = { ...draft, ...change };
        },
        setSecrets: (next: EnvironmentSecret[]) => {
          secrets = next;
        },
        setEnvironmentVariables: (next: EnvironmentVariable[]) => {
          variables = next;
        },
      }),
      runtime.jsxs("footer", {
        children: [
          saveMutation?.error
            ? runtime.jsx("p", {
                role: "alert",
                children: "Couldn’t save environment configuration",
              })
            : null,
          runtime.jsx("button", {
            type: "button",
            disabled: saveMutation == null || saveMutation.isPending === true,
            onClick: save,
            children: saveMutation?.isPending ? "Saving…" : "Save",
          }),
          runtime.jsx(EnvironmentPublishActions, {
            conversationId: activeConversationId,
          }),
        ],
      }),
    ],
  });
}

function ensureJsx(): JsxRuntime {
  if (jsx == null) jsx = getJsxRuntime();
  return jsx;
}
jsx = getJsxRuntime();

export { EnvironmentSetupTabPanel };

void changedSections;
