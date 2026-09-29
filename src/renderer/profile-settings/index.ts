import "@rchunk/rolldown-runtime";
import * as appSharedChunk from "@rchunk/app-shared";
import * as appInitialChunk from "@rchunk/app-initial";
import * as cmeStateChunk from "@rchunk/cme-state";

const {
  $3: initializeRuntimeLazy,
  BX: useSignalFamilyValue,
  HX: useSignalValue,
  I3: getJsxRuntime,
  LX: useScope,
  ZI: AppScope,
  e6: getReactRuntime,
  iL: useMutation,
  n4: useIntl,
  pk: toastManagerSignal,
} = appSharedChunk;
const { Xl: initializeSettingsPage, su: initializeSettingsRuntime } = appInitialChunk;

interface CmeIdentity {
  accountId: string;
  userId: string;
}

interface CmeProfile {
  degree?: string | null;
  is_npi_editable?: boolean;
  medical_license_number?: string | null;
  medical_license_state?: string | null;
  npi?: string | null;
  physician_eligible_for_cme?: boolean | null;
}

interface CmeProfileForm {
  degree: string;
  medical_license_number: string;
  medical_license_state: string;
  npi: string;
  physician_eligible_for_cme: boolean;
}

type ProfileField = Exclude<keyof CmeProfileForm, "physician_eligible_for_cme">;
type ValidationErrors = Record<keyof CmeProfileForm, boolean>;

interface ProfileQueryResult {
  data?: CmeProfile;
  isError: boolean;
  isPending: boolean;
  refetch(): Promise<unknown> | unknown;
}

const cmeRuntime = cmeStateChunk as unknown as {
  i: import("@rchunk/app-shared").ReadableSignal<CmeIdentity | null>;
  l: (scope: unknown, identity: CmeIdentity, profile: CmeProfileForm) => Promise<unknown>;
  o: () => void;
  t: import("@rchunk/app-shared").SignalFamily<CmeIdentity, ProfileQueryResult>;
};
const {
  i: identitySignal,
  l: saveCmeProfile,
  o: initializeCmeState,
  t: cmeProfileQuery,
} = cmeRuntime;

const PROFILE_FIELDS: readonly {
  error: string;
  field: ProfileField;
  label: string;
  maxLength?: number;
  placeholder: string;
}[] = [
  { field: "npi", label: "National Provider Identifier (NPI)", placeholder: "Enter your 10-digit NPI", error: "NPI must be 10 digits", maxLength: 20 },
  { field: "degree", label: "Degree", placeholder: "Enter your degree (e.g. MD)", error: "Degree is required" },
  { field: "medical_license_state", label: "Medical license state", placeholder: "Enter a 2-letter state (e.g. DE)", error: "Medical license state must be 2 letters", maxLength: 2 },
  { field: "medical_license_number", label: "Medical license number", placeholder: "Enter your medical license number", error: "Medical license number is required" },
] as const;

let React: import("@rchunk/app-shared").ReactRuntime;
let jsx: import("@rchunk/app-shared").JsxRuntime;

function normalizeProfile(profile: CmeProfileForm): CmeProfileForm {
  return {
    npi: profile.npi.replace(/\D/g, ""),
    degree: profile.degree.trim(),
    medical_license_state: profile.medical_license_state.trim().toUpperCase(),
    medical_license_number: profile.medical_license_number.trim(),
    physician_eligible_for_cme: profile.physician_eligible_for_cme,
  };
}

function validationErrors(profile: CmeProfileForm): ValidationErrors {
  return {
    npi: profile.npi.length !== 10,
    degree: profile.degree.length === 0,
    medical_license_state: !/^[A-Z]{2}$/.test(profile.medical_license_state),
    medical_license_number: profile.medical_license_number.length === 0,
    physician_eligible_for_cme: !profile.physician_eligible_for_cme,
  };
}

function sameProfile(left: CmeProfileForm, right: CmeProfileForm): boolean {
  return PROFILE_FIELDS.every(({ field }) => left[field] === right[field])
    && left.physician_eligible_for_cme === right.physician_eligible_for_cme;
}

function initialProfile(profile?: CmeProfile): CmeProfileForm {
  return {
    npi: profile?.npi ?? "",
    degree: profile?.degree ?? "",
    medical_license_state: profile?.medical_license_state ?? "",
    medical_license_number: profile?.medical_license_number ?? "",
    physician_eligible_for_cme: profile?.physician_eligible_for_cme ?? false,
  };
}

function FieldRow({ description, label, control }: { control: unknown; description?: string | null; label: string }): unknown {
  return jsx.jsxs("label", {
    className: "grid gap-2 border-b border-token-border-light px-4 py-3 last:border-b-0",
    children: [
      jsx.jsx("span", { className: "text-sm font-medium", children: label }),
      control,
      description == null ? null : jsx.jsx("span", { className: "text-sm text-danger", role: "alert", children: description }),
    ],
  });
}

function CmeProfileFormView({ identity }: { identity: CmeIdentity }): unknown {
  const scope = useScope(AppScope);
  const intl = useIntl();
  const query = useSignalFamilyValue(cmeProfileQuery, identity) as ProfileQueryResult;
  const serverProfile = initialProfile(query.data);
  const [draft, setDraft] = React.useState<CmeProfileForm | null>(null);
  const visibleProfile = draft ?? serverProfile;
  const normalized = normalizeProfile(visibleProfile);
  const errors = validationErrors(normalized);
  const edited = draft != null;

  const mutation = useMutation<unknown, Error, void>({
    mutationFn: () => saveCmeProfile(scope, identity, normalized),
    onSuccess: () => {
      setDraft(null);
      scope.get(toastManagerSignal).success(String(intl.formatMessage({ id: "cme.profile.saved", defaultMessage: "Medical credentials saved" })));
    },
    onError: () => {
      const currentIdentity = scope.get(identitySignal) as CmeIdentity | null;
      if (currentIdentity?.accountId !== identity.accountId || currentIdentity.userId !== identity.userId) return;
      scope.get(toastManagerSignal).danger(
        String(intl.formatMessage({ id: "cme.profile.saveFailed", defaultMessage: "Unable to save medical credentials. Please try again." })),
        { errorAnalytics: { toastId: "cme.profile.saveFailed" } },
      );
    },
  });

  const canSave = query.data != null
    && !Object.values(errors).some(Boolean)
    && !sameProfile(normalized, serverProfile)
    && !mutation.isPending;
  const updateField = (field: ProfileField, value: string): void => setDraft({ ...visibleProfile, [field]: value });
  const submit = (event: { preventDefault(): void }): void => {
    event.preventDefault();
    if (canSave) mutation.mutate();
  };
  const header = jsx.jsxs("header", {
    className: "border-b border-token-border-light px-4 py-4",
    children: [
      jsx.jsx("h2", { className: "font-semibold", children: "Medical credentials" }),
      jsx.jsx("p", { className: "mt-1 text-sm text-secondary", children: "Used for CME credits and other clinician features. Confirm physician eligibility to claim CME credits." }),
    ],
  });

  if (query.isPending) {
    return jsx.jsxs("section", { className: "rounded-xl border border-token-border-light", children: [header, jsx.jsx("div", { className: "px-4 py-4 text-sm text-secondary", role: "status", children: "Loading medical credentials…" })] });
  }
  if (query.isError && query.data == null) {
    return jsx.jsxs("section", {
      className: "rounded-xl border border-token-border-light",
      children: [header, jsx.jsxs("div", {
        className: "flex items-center justify-between gap-4 px-4 py-4",
        role: "alert",
        children: [jsx.jsx("span", { children: "Unable to load medical credentials" }), jsx.jsx("button", { type: "button", onClick: () => void query.refetch(), children: "Try again" })],
      })],
    });
  }
  if (query.data == null) return null;

  return jsx.jsx("form", {
    onSubmit: submit,
    children: jsx.jsxs("section", {
      className: "rounded-xl border border-token-border-light",
      children: [
        header,
        jsx.jsxs("div", {
          children: [
            ...PROFILE_FIELDS.map(({ error, field, label, maxLength, placeholder }) => jsx.jsx(FieldRow, {
              label,
              description: edited && errors[field] ? error : null,
              control: jsx.jsx("input", {
                "aria-invalid": edited && errors[field],
                disabled: mutation.isPending || (field === "npi" && query.data?.is_npi_editable === false),
                inputMode: field === "npi" ? "numeric" : undefined,
                maxLength,
                placeholder,
                value: visibleProfile[field],
                onChange: (event: { currentTarget: { value: string } }) => updateField(field, event.currentTarget.value),
              }),
            }, field)),
            jsx.jsx(FieldRow, {
              label: "I am a physician eligible for CME credits",
              description: edited && errors.physician_eligible_for_cme ? "Physician eligibility confirmation is required" : null,
              control: jsx.jsx("input", {
                type: "checkbox",
                checked: visibleProfile.physician_eligible_for_cme,
                disabled: mutation.isPending,
                onChange: (event: { currentTarget: { checked: boolean } }) => setDraft({ ...visibleProfile, physician_eligible_for_cme: event.currentTarget.checked }),
              }),
            }),
          ],
        }),
        jsx.jsx("footer", {
          className: "flex justify-end border-t border-token-border-light px-4 py-3",
          children: jsx.jsx("button", { type: "submit", disabled: !canSave, "aria-busy": mutation.isPending, children: mutation.isPending ? "Saving…" : "Save" }),
        }),
      ],
    }),
  });
}

function CmeProfileSettings(): unknown {
  const identity = useSignalValue(identitySignal);
  return identity == null ? null : jsx.jsx(CmeProfileFormView, { identity }, identity.accountId + ":" + identity.userId);
}

function CmeAccountSettings(): unknown {
  return jsx.jsxs("div", {
    className: "flex h-full min-h-0 flex-col",
    children: [
      jsx.jsx("header", { className: "border-b border-token-border-light px-5 py-4", children: jsx.jsx("h1", { className: "text-lg font-semibold", children: "Account" }) }),
      jsx.jsx("main", { className: "flex-1 overflow-auto p-5", children: jsx.jsx("div", { className: "mx-auto max-w-3xl", children: jsx.jsx(CmeProfileSettings, {}) }) }),
    ],
  });
}

let initialized = false;
function initializeProfileSettings(): void {
  if (initialized) return;
  initializeRuntimeLazy();
  initializeSettingsPage();
  initializeSettingsRuntime();
  initializeCmeState();
  React = getReactRuntime();
  jsx = getJsxRuntime();
  initialized = true;
}

initializeProfileSettings();
export { CmeAccountSettings, CmeProfileSettings };
