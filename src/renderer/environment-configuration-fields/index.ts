import { I3 as getJsxRuntime, type JsxRuntime } from "@rchunk/app-shared";
import {
  t as AllowedDomainsInput,
  r as EnvironmentIssueDetail,
} from "@rchunk/allowed-domains-input";
import "@rchunk/app-initial";
import "@rchunk/code-editor-runtime";
import "@rchunk/codex-diff-css";
import "@rchunk/diff-file-view";
import "@rchunk/environment-batch-secrets-dialog";
import "@rchunk/environment-variables-batch-dialog";
import "@rchunk/file-diff-alt";
import "@rchunk/outbound-identity-connection-dialog";
import "@rchunk/outbound-identity-error";
import "@rchunk/register-pierre-themes";
import "@rchunk/result-values";
import "@rchunk/rolldown-runtime";

export interface EnvironmentIssue {
  code: string;
  field?: string;
  message?: string;
  valuesSaved?: boolean;
}

export interface EnvironmentVariable {
  name: string;
  value: string;
  optional?: boolean;
}

export interface EnvironmentSecret {
  id: string | number;
  name: string;
  value: string;
  source?: "environment" | "user_provided";
  serverId?: string | null;
  isMissing?: boolean;
  injectionTarget?: { type: string; name?: string; domain?: string | null };
}

export interface EnvironmentDraft {
  access?: "organization" | "private";
  maintenanceSetupScript?: string;
  networkDomains?: string[];
  networkEnabled?: boolean;
  networkHttpsMethods?: string[];
  networkPreset?: "all" | "none" | "package_managers";
  outboundIdentityRequirements?: unknown[];
  repositories?: string[];
  setupScript?: string;
  startSkill?: string | null;
  [key: string]: unknown;
}

export type EnvironmentSection =
  | "connections"
  | "network"
  | "privacy"
  | "repositories"
  | "scripts"
  | "secrets"
  | "variables";

export interface EnvironmentConfigurationFieldsProps {
  configuration?: {
    accountId: string;
    userId: string;
    configId: string;
  } | null;
  draft: EnvironmentDraft;
  scriptBaseline?: EnvironmentDraft | null;
  isReadOnly?: boolean;
  onDraftChange(change: Partial<EnvironmentDraft>): void;
  onDraftSaved?(): void;
  onVpnPendingChange?(pending: boolean): void;
  vpnRef?: unknown;
  panelState?: unknown;
  secrets: EnvironmentSecret[];
  config?: unknown;
  serverNetworkPolicy?: unknown;
  setSecrets(secrets: EnvironmentSecret[]): void;
  issues?: EnvironmentIssue[];
  environmentVariables?: EnvironmentVariable[];
  setEnvironmentVariables?(variables: EnvironmentVariable[]): void;
  revealConnections?: boolean;
  section?: EnvironmentSection;
}

export interface AllowedDomainFieldProps {
  disabled?: boolean;
  domains: string[];
  onChange(domains: string[]): void;
  issues?: EnvironmentIssue[];
}

let jsx: JsxRuntime;

function AllowedDomainField(props: AllowedDomainFieldProps): unknown {
  const runtime = ensureJsx();
  let value = "";
  const issues = props.issues ?? [];
  return runtime.jsxs("section", {
    "data-environment-invalid": issues.length > 0,
    children: [
      runtime.jsx("h3", { children: "Additional allowed domains" }),
      runtime.jsx(AllowedDomainsInput, {
        disabled: props.disabled,
        domains: props.domains,
        value,
        showErrors: issues.length > 0,
        onChange: props.onChange,
        onInputChange: (next: string) => {
          value = next;
        },
      }),
      ...issues.map((issue, index) =>
        runtime.jsx(
          EnvironmentIssueDetail,
          { issue },
          `${issue.field ?? issue.code}-${index}`,
        ),
      ),
    ],
  });
}

function sectionVisible(
  requested: EnvironmentSection | undefined,
  section: EnvironmentSection,
): boolean {
  return requested == null || requested === section;
}

function updateItem<T>(items: readonly T[], index: number, value: T): T[] {
  return items.map((item, itemIndex) => (itemIndex === index ? value : item));
}

function EnvironmentConfigurationFields(
  props: EnvironmentConfigurationFieldsProps,
): unknown {
  const runtime = ensureJsx();
  const issues = props.issues ?? [];
  const variables = props.environmentVariables ?? [];
  const disabled = props.isReadOnly === true;
  const issueList = (prefix: string) =>
    issues
      .filter((issue) => issue.field?.startsWith(prefix))
      .map((issue, index) =>
        runtime.jsx(EnvironmentIssueDetail, { issue }, `${prefix}-${index}`),
      );

  const repositories = sectionVisible(props.section, "repositories")
    ? runtime.jsxs("section", {
        "data-environment-section": "repositories",
        children: [
          runtime.jsx("h3", { children: "Repositories" }),
          runtime.jsx("input", {
            "aria-label": "Repository",
            disabled,
            value: props.draft.repositories?.[0] ?? "",
            onChange: (event: { currentTarget: { value: string } }) =>
              props.onDraftChange({
                repositories: event.currentTarget.value
                  ? [event.currentTarget.value]
                  : [],
              }),
          }),
          ...issueList("repository"),
        ],
      })
    : null;

  const scripts = sectionVisible(props.section, "scripts")
    ? runtime.jsxs("section", {
        "data-environment-section": "scripts",
        children: [
          runtime.jsx("h3", { children: "Scripts" }),
          runtime.jsx("textarea", {
            "aria-label": "Setup script",
            disabled,
            value: props.draft.setupScript ?? "",
            onChange: (event: { currentTarget: { value: string } }) =>
              props.onDraftChange({ setupScript: event.currentTarget.value }),
          }),
          runtime.jsx("textarea", {
            "aria-label": "Maintenance script",
            disabled,
            value: props.draft.maintenanceSetupScript ?? "",
            onChange: (event: { currentTarget: { value: string } }) =>
              props.onDraftChange({
                maintenanceSetupScript: event.currentTarget.value,
              }),
          }),
          ...issueList("script"),
        ],
      })
    : null;

  const network =
    sectionVisible(props.section, "network") ||
    sectionVisible(props.section, "secrets")
      ? runtime.jsxs("section", {
          "data-environment-section": "network",
          children: [
            sectionVisible(props.section, "network")
              ? runtime.jsxs("div", {
                  children: [
                    runtime.jsx("h3", { children: "Internet access" }),
                    runtime.jsx("input", {
                      type: "checkbox",
                      "aria-label": "Allow Codex to access internet",
                      disabled,
                      checked: props.draft.networkEnabled === true,
                      onChange: (event: {
                        currentTarget: { checked: boolean };
                      }) =>
                        props.onDraftChange({
                          networkEnabled: event.currentTarget.checked,
                          networkPreset:
                            props.draft.networkPreset ?? "package_managers",
                        }),
                    }),
                    props.draft.networkEnabled === true
                      ? runtime.jsx("select", {
                          "aria-label": "Internet access preset",
                          disabled,
                          value:
                            props.draft.networkPreset ?? "package_managers",
                          onChange: (event: {
                            currentTarget: { value: string };
                          }) =>
                            props.onDraftChange({
                              networkPreset: event.currentTarget
                                .value as EnvironmentDraft["networkPreset"],
                            }),
                          children: [
                            runtime.jsx("option", {
                              value: "all",
                              children: "All (unrestricted)",
                            }),
                            runtime.jsx("option", {
                              value: "package_managers",
                              children: "Package managers",
                            }),
                            runtime.jsx("option", {
                              value: "none",
                              children: "Custom domains only",
                            }),
                          ],
                        })
                      : null,
                    props.draft.networkEnabled === true &&
                    props.draft.networkPreset !== "all"
                      ? runtime.jsx(AllowedDomainField, {
                          disabled,
                          domains: props.draft.networkDomains ?? [],
                          issues: issues.filter((issue) =>
                            issue.field?.startsWith("network-"),
                          ),
                          onChange: (domains: string[]) =>
                            props.onDraftChange({ networkDomains: domains }),
                        })
                      : null,
                  ],
                })
              : null,
            sectionVisible(props.section, "secrets")
              ? runtime.jsxs("div", {
                  children: [
                    runtime.jsx("h3", { children: "Network secrets" }),
                    ...props.secrets.map((secret, index) =>
                      runtime.jsxs(
                        "div",
                        {
                          children: [
                            runtime.jsx("span", {
                              children:
                                secret.injectionTarget?.name ?? secret.name,
                            }),
                            runtime.jsx("span", {
                              children: secret.isMissing
                                ? "Missing"
                                : secret.source === "user_provided"
                                  ? "User-provided"
                                  : "••••••••",
                            }),
                            runtime.jsx("button", {
                              type: "button",
                              disabled,
                              onClick: () =>
                                props.setSecrets(
                                  props.secrets.filter(
                                    (_, itemIndex) => itemIndex !== index,
                                  ),
                                ),
                              children: "Remove",
                            }),
                          ],
                        },
                        secret.id,
                      ),
                    ),
                    ...issueList("secret-"),
                  ],
                })
              : null,
          ],
        })
      : null;

  const variableSection = sectionVisible(props.section, "variables")
    ? runtime.jsxs("section", {
        "data-environment-section": "variables",
        children: [
          runtime.jsx("h3", { children: "Environment variables" }),
          ...variables.map((variable, index) =>
            runtime.jsxs(
              "div",
              {
                children: [
                  runtime.jsx("input", {
                    "aria-label": "Variable key",
                    disabled,
                    value: variable.name,
                    onChange: (event: { currentTarget: { value: string } }) =>
                      props.setEnvironmentVariables?.(
                        updateItem(variables, index, {
                          ...variable,
                          name: event.currentTarget.value,
                        }),
                      ),
                  }),
                  runtime.jsx("input", {
                    "aria-label": "Variable value",
                    disabled,
                    value: variable.value,
                    onChange: (event: { currentTarget: { value: string } }) =>
                      props.setEnvironmentVariables?.(
                        updateItem(variables, index, {
                          ...variable,
                          value: event.currentTarget.value,
                        }),
                      ),
                  }),
                ],
              },
              `${variable.name}-${index}`,
            ),
          ),
          ...issueList("variable"),
        ],
      })
    : null;

  const privacy = sectionVisible(props.section, "privacy")
    ? runtime.jsxs("section", {
        "data-environment-section": "privacy",
        children: [
          runtime.jsx("h3", { children: "Privacy" }),
          runtime.jsx("select", {
            "aria-label": "Who can use",
            disabled,
            value: props.draft.access ?? "private",
            onChange: (event: { currentTarget: { value: string } }) =>
              props.onDraftChange({
                access: event.currentTarget.value as EnvironmentDraft["access"],
              }),
            children: [
              runtime.jsx("option", { value: "private", children: "Only me" }),
              runtime.jsx("option", {
                value: "organization",
                children: "Organization",
              }),
            ],
          }),
        ],
      })
    : null;

  const connections = sectionVisible(props.section, "connections")
    ? runtime.jsxs("section", {
        "data-environment-section": "connections",
        children: [
          runtime.jsx("h3", { children: "Outbound identity connections" }),
          runtime.jsx("p", {
            children: `${props.draft.outboundIdentityRequirements?.length ?? 0} connections`,
          }),
          ...issueList("connection-"),
        ],
      })
    : null;

  return runtime.jsxs(runtime.Fragment, {
    children: [
      repositories,
      scripts,
      network,
      variableSection,
      privacy,
      connections,
    ],
  });
}

function initializeAllowedDomainField(): void {
  jsx = getJsxRuntime();
}
function initializeEnvironmentConfigurationFields(): void {
  jsx = getJsxRuntime();
}
function ensureJsx(): JsxRuntime {
  if (jsx == null) jsx = getJsxRuntime();
  return jsx;
}

export {
  initializeAllowedDomainField as i,
  initializeEnvironmentConfigurationFields as n,
  AllowedDomainField as r,
  EnvironmentConfigurationFields as t,
};
