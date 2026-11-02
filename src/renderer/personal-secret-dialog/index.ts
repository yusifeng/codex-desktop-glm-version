import { I3 as getJsxRuntime, e6 as ReactRuntime, type JsxRuntime } from "@rchunk/app-shared";
import { pnt as desktopApi } from "@rchunk/app-initial";
import "@rchunk/entry-type";
import "@rchunk/rolldown-runtime";

export type SecretNamespace = "not_sensitive" | "sensitive";
export type SecretTarget =
  | { type: "all_environment_configs" }
  | { type: "environment_config_ids"; ids: string[] };

export interface PersonalSecret {
  id: string;
  name: string;
  env_var: string;
  target?: SecretTarget;
}

export interface PersonalSecretDialogProps {
  accountId: string;
  userId: string;
  initialNamespace: SecretNamespace;
  secret?: PersonalSecret | null;
  deleting?: boolean;
  onClose(namespace: SecretNamespace): void;
}

interface PersonalSecretsService {
  requestPersonalSecrets(input: {
    accountId: string;
    userId: string;
    method: "DELETE" | "POST";
    body:
      | { namespace: SecretNamespace; ids: string[] }
      | {
          namespace: SecretNamespace;
          secrets: Array<{
            id?: string;
            name: string;
            env_var: string;
            target: SecretTarget;
            value?: string;
          }>;
        };
  }): Promise<
    | { ok: false; error?: string; status?: number }
    | { ok: true; data: { secrets: Array<{ id?: string; error?: string }> } }
  >;
}

interface DesktopApiWithPersonalSecrets {
  environmentConfigs?: PersonalSecretsService;
}

let jsx: JsxRuntime;

function normalizeTarget(target?: SecretTarget): SecretTarget {
  return target ?? { type: "all_environment_configs" };
}

function targetIsValid(target: SecretTarget): boolean {
  return target.type === "all_environment_configs" || target.ids.length > 0;
}

function selectedTargetLabel(target: SecretTarget): string {
  return target.type === "all_environment_configs"
    ? "All environments"
    : `${target.ids.length} selected environments`;
}

function PersonalSecretDialog(props: PersonalSecretDialogProps): unknown {
  const runtime = ensureJsx();
  const [namespace, setNamespace] = ReactRuntime.useState(props.initialNamespace);
  const [key, setKey] = ReactRuntime.useState(props.secret?.env_var ?? "");
  const [target, setTarget] = ReactRuntime.useState(() => normalizeTarget(props.secret?.target));
  const [revealed, setRevealed] = ReactRuntime.useState(false);
  const [pending, setPending] = ReactRuntime.useState(false);
  const [error, setError] = ReactRuntime.useState<"delete" | "permission" | "save" | null>(null);

  const submit = async (event: {
    preventDefault(): void;
    currentTarget: {
      elements?: { namedItem(name: string): { value?: string } | null };
      reset?(): void;
    };
  }): Promise<void> => {
    event.preventDefault();
    if (pending || (!props.deleting && !targetIsValid(target))) return;
    const service = (desktopApi as DesktopApiWithPersonalSecrets)
      .environmentConfigs;
    if (!service) {
      setError("permission");
      return;
    }
    const value = event.currentTarget.elements?.namedItem("value")?.value ?? "";
    if (!props.deleting && props.secret == null && !value) return;
    const body =
      props.deleting && props.secret
        ? { namespace, ids: [props.secret.id] }
        : {
            namespace,
            secrets: [
              props.secret
                ? {
                    id: props.secret.id,
                    name: props.secret.name,
                    env_var: key,
                    target,
                    value: value || undefined,
                  }
                : { name: key, env_var: key, target, value },
            ],
          };
    setPending(true);
    setError(null);
    const result = await service
      .requestPersonalSecrets({
        accountId: props.accountId,
        userId: props.userId,
        method: props.deleting ? "DELETE" : "POST",
        body,
      })
      .catch(() => null);
    setPending(false);
    if (result?.ok && result.data.secrets.length === 1) {
      const saved = result.data.secrets[0];
      if (saved?.id != null && saved.error == null) {
        props.onClose(namespace);
        return;
      }
    }
    setError(
      result &&
      !result.ok &&
      (result.error === "authentication" || result.status === 403)
        ? "permission"
        : props.deleting
          ? "delete"
          : "save",
    );
  };

  return runtime.jsx("dialog", {
    open: true,
    children: runtime.jsxs("form", {
      onSubmit: submit,
      children: [
        runtime.jsx("h2", {
          children: props.deleting
            ? `Delete ${props.secret?.env_var ?? props.secret?.name ?? "secret"}?`
            : props.secret
              ? namespace === "not_sensitive"
                ? "Edit variable"
                : "Edit network secret"
              : "Add to personal vault",
        }),
        props.deleting
          ? null
          : runtime.jsxs("div", {
              children: [
                props.secret
                  ? null
                  : runtime.jsx("select", {
                      "aria-label": "Type",
                      value: namespace,
                      disabled: pending,
                      onChange: (event: {
                        currentTarget: { value: string };
                      }) => {
                        setNamespace(event.currentTarget.value as SecretNamespace);
                      },
                      children: [
                        runtime.jsx("option", {
                          value: "not_sensitive",
                          children: "Environment variable",
                        }),
                        runtime.jsx("option", {
                          value: "sensitive",
                          children: "Network secret",
                        }),
                      ],
                    }),
                runtime.jsx("input", {
                  id: "personal-secret-key",
                  "aria-label": "Key",
                  pattern: "[A-Za-z_][A-Za-z0-9_]*",
                  maxLength: 256,
                  required: true,
                  value: key,
                  disabled: pending,
                  onChange: (event: { currentTarget: { value: string } }) => {
                    setKey(event.currentTarget.value);
                  },
                }),
                runtime.jsx("input", {
                  id: "personal-secret-value",
                  "aria-label": "Value",
                  name: "value",
                  type: revealed ? "text" : "password",
                  disabled: pending,
                  placeholder: props.secret ? "••••••••••••" : undefined,
                  required: props.secret == null,
                }),
                runtime.jsx("button", {
                  type: "button",
                  "aria-label": revealed ? "Hide value" : "Show value",
                  onClick: () => {
                    setRevealed(value => !value);
                  },
                  children: revealed ? "Hide" : "Show",
                }),
                runtime.jsx("select", {
                  "aria-label": "Applies to",
                  value: target.type,
                  disabled: pending,
                  onChange: (event: { currentTarget: { value: string } }) => {
                    setTarget(
                      event.currentTarget.value === "all_environment_configs"
                        ? { type: "all_environment_configs" }
                        : { type: "environment_config_ids", ids: [] },
                    );
                  },
                  children: [
                    runtime.jsx("option", {
                      value: "all_environment_configs",
                      children: "All environments",
                    }),
                    runtime.jsx("option", {
                      value: "environment_config_ids",
                      children: "Selected environments",
                    }),
                  ],
                }),
                runtime.jsx("span", { children: selectedTargetLabel(target) }),
              ],
            }),
        error ? runtime.jsx("p", { role: "alert", children: error }) : null,
        runtime.jsx("button", {
          type: "button",
          disabled: pending,
          onClick: () => props.onClose(namespace),
          children: "Cancel",
        }),
        runtime.jsx("button", {
          type: "submit",
          disabled: pending || (!props.deleting && !targetIsValid(target)),
          children: props.deleting ? "Delete" : "Save",
        }),
      ],
    }),
  });
}

function ensureJsx(): JsxRuntime {
  if (jsx == null) jsx = getJsxRuntime();
  return jsx;
}

jsx = getJsxRuntime();

export { PersonalSecretDialog };

void normalizeTarget;
void selectedTargetLabel;
void targetIsValid;
