import "@rchunk/rolldown-runtime";
import {
  $3 as initializeCompilerRuntime,
  Ah as DialogHeader,
  Bt as azureIcon,
  C_ as initializeDialogStructure,
  Ht as initializeDialogRoot,
  I3 as initializeJsxRuntime,
  Ih as DialogRoot,
  K2 as initializeIntlRuntime,
  Lf as Switch,
  Lh as DialogSubtitle,
  Oh as DialogContent,
  Ph as initializeDialogForms,
  Qc as initializeClipboard,
  Rf as initializeCloudIcons,
  Rh as DialogTitle,
  S_ as IconAsset,
  Vt as gcpIcon,
  Xm as initializeCopyRuntime,
  Y2 as FormattedMessage,
  Yh as Button,
  Ym as copyText,
  Zc as FieldList,
  Zh as DialogPanel,
  al as initializeFormFields,
  an as awsIcon,
  e6 as ReactRuntime,
  jh as DialogBody,
  kh as DialogActions,
  n4 as useIntl,
  nf as initializeInputs,
  nl as FormField,
  on as initializeAwsIcons,
  rl as LabeledControl,
  tf as CopyButton,
  zh as initializeDialogRuntime,
  zt as initializeButtons,
} from "@rchunk/app-shared";
import {
  $W as initializeProviderAssets,
  Jat as TextInput,
  QW as SelectControl,
  Xat as TextArea,
  Yat as outboundIdentityInputSchema,
  bmt as initializeOutboundIdentitySchema,
  xmt as initializeOutboundIdentityModel,
} from "@rchunk/app-initial";
import {
  n as initializeOutboundIdentityError,
  t as OutboundIdentityError,
} from "@rchunk/outbound-identity-error";

type ProviderKind = "azure" | "aws" | "gcp";
interface ProviderTarget extends Record<string, unknown> {
  provider_kind: ProviderKind;
  tenant_id?: string;
  client_id?: string;
  role_arn?: string;
  region?: string;
  workload_identity_provider?: string;
  service_account_email?: string;
}
interface OutboundConnection extends Record<string, unknown> {
  additional_claims?: Record<string, unknown>;
  audience?: string | null;
  azure_client_id?: string;
  azure_tenant_id?: string;
  connection_id: string;
  display_name?: string;
  include_actor_email?: boolean;
  issuer?: string | null;
  provider_kind: ProviderKind;
  subject?: string | null;
  subject_template?: string;
  target?: ProviderTarget;
}
interface SubmitResult {
  data?: OutboundConnection;
  error?: string;
  ok: boolean;
  status?: number;
}
interface OutboundIdentityConnectionDialogProps extends Record<string, unknown> {
  connection?: OutboundConnection | null;
  isOpen: boolean;
  onClose(): void;
  onSubmit(input: Record<string, unknown>): Promise<SubmitResult>;
}

function ReadonlyValue({ label, value }: { label: unknown; value: string }): unknown {
  const labelId = ReactRuntime.useId();
  const intl = useIntl();
  return initializeJsxRuntime().jsx(FormField, {
    label: initializeJsxRuntime().jsx("span", { id: labelId, children: label }),
    children: initializeJsxRuntime().jsxs("div", {
      className: "flex min-w-0 items-center gap-2",
      role: "group",
      "aria-labelledby": labelId,
      children: [
        initializeJsxRuntime().jsx("code", {
          className: "min-w-0 flex-1 text-xs break-all whitespace-pre-wrap",
          children: value,
        }),
        initializeJsxRuntime().jsx(CopyButton, {
          variant: "codeBlock",
          iconOnly: true,
          ariaLabel: String(intl.formatMessage({
            id: "restricted.environmentSetup.oic.copyValue",
            defaultMessage: "Copy {value}",
          }, { value })),
          onCopy: (event: unknown) => copyText(value, event),
        }),
      ],
    }),
  });
}

function SavedConnection({ connection }: { connection: OutboundConnection }): unknown {
  const providerHelp = {
    azure: "Add a federated credential to your Entra app registration with this issuer, audience, and subject",
    aws: "Add this OIDC provider in IAM, then restrict the role’s trust policy to this audience and subject",
    gcp: "Set these values on your workload identity provider and grant the matching identity access to the service account",
  }[connection.provider_kind];
  return initializeJsxRuntime().jsxs("div", {
    className: "flex min-w-0 flex-col gap-3",
    children: [
      initializeJsxRuntime().jsx("p", { className: "text-sm text-secondary select-none", children: providerHelp }),
      initializeJsxRuntime().jsx(FieldList, {
        children: [
          initializeJsxRuntime().jsx(ReadonlyValue, { label: "Connection ID", value: connection.connection_id }),
          connection.issuer == null ? null : initializeJsxRuntime().jsx(ReadonlyValue, { label: "Issuer", value: connection.issuer }),
          connection.audience == null ? null : initializeJsxRuntime().jsx(ReadonlyValue, { label: "Audience", value: connection.audience }),
          connection.subject == null ? null : initializeJsxRuntime().jsx(ReadonlyValue, { label: "Subject", value: connection.subject }),
        ],
      }),
      connection.issuer == null || connection.audience == null
        ? initializeJsxRuntime().jsx("p", { role: "status", children: "The connection is saved, but its issuer or audience is not available yet" })
        : null,
      connection.subject == null
        ? initializeJsxRuntime().jsx("p", { children: "This subject depends on the user or environment at runtime" })
        : null,
    ],
  });
}

function ProviderFields(props: {
  onChange(target: ProviderTarget): void;
  readOnly: boolean;
  target: ProviderTarget;
}): unknown {
  const { target, onChange, readOnly } = props;
  const fields = target.provider_kind === "azure"
    ? [
        ["Directory (tenant) ID", "tenant_id", target.tenant_id ?? "", "11111111-1111-4111-8111-111111111111"],
        ["Application (client) ID", "client_id", target.client_id ?? "", "22222222-2222-4222-8222-222222222222"],
      ]
    : target.provider_kind === "aws"
      ? [
          ["IAM role ARN", "role_arn", target.role_arn ?? "", "arn:aws:iam::123456789012:role/codex-readers"],
          ["AWS region", "region", target.region ?? "", "us-east-1"],
        ]
      : [
          ["Workload identity provider", "workload_identity_provider", target.workload_identity_provider ?? "", "projects/123/locations/global/workloadIdentityPools/codex/providers/openai"],
          ["Service account email", "service_account_email", target.service_account_email ?? "", "codex-readers@my-project.iam.gserviceaccount.com"],
        ];
  return initializeJsxRuntime().jsxs("div", {
    className: "flex min-w-0 flex-col gap-3",
    children: [
      readOnly
        ? initializeJsxRuntime().jsx(FieldList, {
            children: fields.map(([label, , value, key]) => initializeJsxRuntime().jsx(ReadonlyValue, { label, value }, key)),
          })
        : fields.map(([label, field, value, placeholder]) => initializeJsxRuntime().jsx("label", {
            children: initializeJsxRuntime().jsx(TextInput, {
              autoComplete: "off",
              required: true,
              value,
              placeholder,
              onChange: (event: { target: { value: string } }) => onChange({ ...target, [field]: event.target.value }),
            }),
          }, placeholder)),
      initializeJsxRuntime().jsx("p", {
        className: "text-xs text-secondary select-none",
        children: readOnly ? "The provider and target are fixed for this connection" : "Use secretless provider identity values",
      }),
      target.provider_kind === "azure" ? null : initializeJsxRuntime().jsx("p", { children: "Configuration only for now — this provider cannot be attached to cloud environments yet" }),
    ],
  });
}

function OutboundIdentityConnectionDialog(props: OutboundIdentityConnectionDialogProps): unknown {
  const { isOpen, connection, onClose, onSubmit } = props;
  const intl = useIntl();
  const [metadata, setMetadata] = ReactRuntime.useState({
    display_name: connection?.display_name ?? "",
    subject_template: connection?.subject_template ?? "oai:v1:oic:{connection_id}",
    include_actor_email: connection?.include_actor_email ?? false,
  });
  const [target, setTarget] = ReactRuntime.useState<ProviderTarget>(connection?.target ?? {
    provider_kind: "azure",
    tenant_id: connection?.provider_kind === "azure" ? connection.azure_tenant_id : "",
    client_id: connection?.provider_kind === "azure" ? connection.azure_client_id : "",
  });
  const [additionalClaims, setAdditionalClaims] = ReactRuntime.useState(
    JSON.stringify(connection?.additional_claims ?? {}, null, 2),
  );
  const [saving, setSaving] = ReactRuntime.useState(false);
  const [saved, setSaved] = ReactRuntime.useState<OutboundConnection | null>(null);
  const [error, setError] = ReactRuntime.useState<SubmitResult | null>(null);
  const createUnconfirmed = connection == null && error != null && (
    error.error === "unavailable" || error.error === "invalid-response" ||
    error.error === "authentication" ||
    (error.error === "http" && (error.status == null || error.status === 408 || error.status >= 500))
  );
  const save = async (): Promise<void> => {
    if (!isOpen || saving || saved != null || createUnconfirmed) return;
    let input: Record<string, unknown>;
    try {
      input = outboundIdentityInputSchema.parse({
        ...metadata,
        additional_claims: JSON.parse(additionalClaims),
        ...(target.provider_kind === "azure"
          ? { azure_tenant_id: target.tenant_id, azure_client_id: target.client_id }
          : { target }),
      });
    } catch {
      setError({ ok: false, error: "invalid-request" });
      return;
    }
    setError(null);
    setSaving(true);
    try {
      const result = await onSubmit(input);
      if (result.ok && result.data?.provider_kind === target.provider_kind) setSaved(result.data);
      else setError(result.ok ? { ok: false, error: "invalid-response" } : result);
    } catch {
      setError({ ok: false, error: "unavailable" });
    }
    setSaving(false);
  };
  const handleOpenChange = (open: boolean): void => { if (!open && !saving) onClose(); };
  const title = saved != null ? "Connection saved" : connection == null ? "New identity connection" : "Edit identity connection";
  const formBody = saved != null
    ? initializeJsxRuntime().jsx(SavedConnection, { connection: saved })
    : initializeJsxRuntime().jsxs(ReactRuntime.Fragment, {
        children: [
          connection == null ? initializeJsxRuntime().jsx(SelectControl, {
            fullWidth: true,
            size: "dialog",
            ariaLabel: String(intl.formatMessage({ id: "restricted.environmentSetup.oic.provider", defaultMessage: "Cloud provider" })),
            selectedId: target.provider_kind,
            options: [
              { id: "azure", label: initializeJsxRuntime().jsx(IconAsset, { asset: azureIcon }) },
              { id: "aws", label: initializeJsxRuntime().jsx(IconAsset, { asset: awsIcon }) },
              { id: "gcp", label: initializeJsxRuntime().jsx(IconAsset, { asset: gcpIcon }) },
            ],
            onSelect: (provider: ProviderKind) => {
              setError(null);
              setTarget(provider === "azure" ? { provider_kind: "azure", tenant_id: "", client_id: "" }
                : provider === "aws" ? { provider_kind: "aws", role_arn: "", region: "us-east-1" }
                  : { provider_kind: "gcp", workload_identity_provider: "", service_account_email: "" });
            },
          }) : null,
          initializeJsxRuntime().jsx(TextInput, {
            autoFocus: true, autoComplete: "off", required: true, maxLength: 200,
            value: metadata.display_name,
            placeholder: "e.g. Analytics read-only",
            onChange: (event: { target: { value: string } }) => setMetadata({ ...metadata, display_name: event.target.value }),
          }),
          initializeJsxRuntime().jsx(ProviderFields, { target, onChange: setTarget, readOnly: connection != null }),
          initializeJsxRuntime().jsx(TextInput, {
            value: metadata.subject_template,
            onChange: (event: { target: { value: string } }) => setMetadata({ ...metadata, subject_template: event.target.value }),
          }),
          initializeJsxRuntime().jsx(TextArea, {
            rows: 4, value: additionalClaims,
            onChange: (event: { target: { value: string } }) => setAdditionalClaims(event.target.value),
          }),
          initializeJsxRuntime().jsx(LabeledControl, {
            size: "compact", label: "Include the triggering user's verified email",
            control: (controlProps: Record<string, unknown>) => initializeJsxRuntime().jsx(Switch, {
              ...controlProps, checked: metadata.include_actor_email,
              onChange: (checked: boolean) => setMetadata({ ...metadata, include_actor_email: checked }),
            }),
          }),
          connection == null ? null : initializeJsxRuntime().jsx(SavedConnection, { connection }),
        ],
      });
  const handleSubmit = (event: { preventDefault(): void; stopPropagation(): void }): void => {
    event.preventDefault(); event.stopPropagation(); void save();
  };
  return initializeJsxRuntime().jsx(DialogRoot, {
    open: isOpen,
    onOpenChange: handleOpenChange,
    children: initializeJsxRuntime().jsxs(DialogContent, {
      as: "form", size: "viewport", onSubmit: handleSubmit,
      children: [
        initializeJsxRuntime().jsx(DialogBody, { children: initializeJsxRuntime().jsx(DialogHeader, {
          title, subtitleSize: "sm", subtitle: initializeJsxRuntime().jsx(DialogSubtitle, { children: title }),
        }) }),
        initializeJsxRuntime().jsx(DialogBody, { spacing: "large", children: initializeJsxRuntime().jsxs("div", {
          children: [formBody,
            createUnconfirmed ? initializeJsxRuntime().jsx("p", { role: "alert", children: "Couldn't confirm whether this connection was created" }) : null,
            !createUnconfirmed && error != null ? initializeJsxRuntime().jsx(OutboundIdentityError, { error }) : null,
          ],
        }) }),
        initializeJsxRuntime().jsx(DialogBody, { spacing: "large", children: initializeJsxRuntime().jsx(DialogActions, {
          expandSingleButton: false,
          children: saved == null ? initializeJsxRuntime().jsxs(ReactRuntime.Fragment, { children: [
            initializeJsxRuntime().jsx(Button, { type: "button", color: "secondary", size: "dialog", disabled: saving, onClick: onClose, children: createUnconfirmed ? "Close" : "Cancel" }),
            initializeJsxRuntime().jsx(Button, { type: "submit", size: "dialog", disabled: saving || createUnconfirmed, children: saving ? "Saving…" : connection == null ? "Create connection" : "Save connection" }),
          ] }) : initializeJsxRuntime().jsx(Button, { type: "button", size: "dialog", onClick: onClose, children: "Done" }),
        }) }),
      ],
    }),
  });
}

let initialized = false;
function initializeOutboundIdentityConnectionDialog(): void {
  if (initialized) return;
  initialized = true;
  initializeCompilerRuntime(); initializeProviderAssets(); initializeDialogStructure(); initializeDialogRoot(); initializeButtons();
  initializeOutboundIdentityModel(); ReactRuntime(); initializeIntlRuntime(); initializeFormFields();
  initializeDialogRuntime(); initializeDialogForms(); initializeInputs(); initializeJsxRuntime(); initializeCloudIcons(); initializeAwsIcons();
  initializeOutboundIdentitySchema(); initializeCopyRuntime(); initializeClipboard();
  initializeOutboundIdentityError();
}

initializeOutboundIdentityConnectionDialog();

export { OutboundIdentityConnectionDialog };
