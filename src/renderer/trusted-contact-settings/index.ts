import "@rchunk/rolldown-runtime";
import * as appSharedChunk from "@rchunk/app-shared";
import * as appInitialChunk from "@rchunk/app-initial";
import * as clientChunk from "@rchunk/client";
import * as phoneNumberInputChunk from "@rchunk/phone-number-input";
import * as trustedContactHeroChunk from "@rchunk/trusted-contact-hero";

interface TrustedContact {
  email?: string | null;
  name?: string | null;
  phone_number?: string | null;
  relationship?: string | null;
  status: "active" | "pending";
  trusted_contact_id: string;
}

interface TrustedContactList { contacts: TrustedContact[] }
interface TrustedContactAccess {
  accountId?: string;
  status: "allowed" | "denied" | "error" | "loading";
  userId?: string;
}
interface QueryResult<T> {
  data?: T;
  isError: boolean;
  isPending: boolean;
  refetch(): Promise<unknown> | unknown;
}
interface QueryClient {
  invalidateQueries(options: { queryKey: readonly unknown[] }): Promise<unknown> | unknown;
  setQueryData<T>(queryKey: readonly unknown[], value: T): void;
}
interface ToastManager {
  danger(message: string, options?: { errorAnalytics?: { toastId: string } }): void;
  success(message: string): void;
}
interface ApiClient {
  safeDelete(path: string, options: Record<string, unknown>): Promise<unknown>;
  safePost(path: string, options: Record<string, unknown>): Promise<TrustedContact>;
  safePut(path: string, options: Record<string, unknown>): Promise<unknown>;
}
interface TrustedContactQueries {
  enabled: Record<string, unknown> & { queryKey: readonly unknown[] };
  list: Record<string, unknown> & { queryKey: readonly unknown[] };
}
interface InvitePayload {
  email: string;
  name: string;
  phone_number: string | null;
  relationship: null;
}

const appSharedRuntime = appSharedChunk as unknown as {
  $3(): void;
  CL(): QueryClient;
  FX(): void;
  HX<T>(signal: import("@rchunk/app-shared").ReadableSignal<T>): T;
  I3(): import("@rchunk/app-shared").JsxRuntime;
  LX(scope: unknown): { get(signal: unknown): unknown };
  ZI: unknown;
  _L<T>(options: Record<string, unknown>): QueryResult<T>;
  e6(): import("@rchunk/app-shared").ReactRuntime;
  gL(): void;
  n4(): import("@rchunk/app-shared").IntlShape;
  pk: unknown;
  rL(): void;
};
const {
  $3: initializeRuntimeLazy,
  CL: useQueryClient,
  FX: initializeScopeRuntime,
  HX: useSignalValue,
  I3: getJsxRuntime,
  LX: useScope,
  ZI: AppScope,
  _L: useQuery,
  e6: getReactRuntime,
  gL: initializeQueryRuntime,
  n4: useIntl,
  pk: toastManagerSignal,
  rL: initializeMutationRuntime,
} = appSharedRuntime;

const appInitialRuntime = appInitialChunk as unknown as {
  Xl(): void;
  bL: import("@rchunk/app-shared").ReadableSignal<TrustedContactAccess>;
  cJt(): void;
  cfn(): { client: { getContext(): { user?: { country?: string | null } } } };
  ifn(): void;
  rJt: ApiClient;
  su(): void;
};
const {
  Xl: initializeSettingsPage,
  bL: trustedContactAccessSignal,
  cJt: initializeApiClient,
  cfn: useClient,
  ifn: initializeClientContext,
  rJt: apiClient,
  su: initializeSettingsRuntime,
} = appInitialRuntime;

const clientRuntime = clientChunk as unknown as {
  i(userId: string, accountId: string): TrustedContactQueries;
  n(contact: TrustedContact, fallbackName: string): InvitePayload | null;
  r(): void;
  t(accountId: string): Record<string, string>;
};
const {
  i: createTrustedContactQueries,
  n: createResendPayload,
  r: initializeTrustedContactClient,
  t: createAccountHeaders,
} = clientRuntime;

const phoneRuntime = phoneNumberInputChunk as unknown as {
  n(): void;
  t(props: Record<string, unknown>): unknown;
};
const { n: initializePhoneNumberInput, t: PhoneNumberInput } = phoneRuntime;
const heroRuntime = trustedContactHeroChunk as unknown as {
  n(): void;
  t(props: Record<string, unknown>): unknown;
};
const { n: initializeTrustedContactHero, t: TrustedContactHero } = heroRuntime;

type DialogKind = "intro" | "invite" | "remove" | "success" | "unavailable" | null;
type InitialDialog = "intro" | "invite" | null;

interface EnrollmentProps {
  entryPoint?: string;
  initialDialog?: InitialDialog;
  onClose?(): void;
  onSuccess?(): void;
}

let React: import("@rchunk/app-shared").ReactRuntime;
let jsx: import("@rchunk/app-shared").JsxRuntime;

function isBlockedContactError(error: unknown): boolean {
  if (typeof error !== "object" || error == null) return false;
  const value = error as { errorCode?: unknown; status?: unknown };
  return value.status === 400
    && (value.errorCode === "trusted-contacts-blocked-email" || value.errorCode === "trusted-contacts-blocked-phone-number");
}

function contactName(contact: TrustedContact | null, fallback: string): string {
  return contact?.name?.trim() || fallback;
}

function emailIsValid(value: string): boolean {
  return /^[a-zA-Z0-9.!#$%&'*+/=?^_\x60{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/.test(value.trim());
}

function ActionButton({
  children,
  danger = false,
  disabled = false,
  onClick,
  testId,
  type = "button",
}: {
  children: unknown;
  danger?: boolean;
  disabled?: boolean;
  onClick?(): void;
  testId?: string;
  type?: "button" | "submit";
}): unknown {
  return jsx.jsx("button", {
    type,
    disabled,
    onClick,
    "data-testid": testId,
    className: danger ? "rounded-full bg-danger px-4 py-2 text-white" : "rounded-full border px-4 py-2",
    children,
  });
}

function Dialog({ children, onClose, title }: { children: unknown; onClose(): void; title: string }): unknown {
  return jsx.jsx("div", {
    role: "dialog",
    "aria-label": title,
    className: "fixed inset-0 z-50 grid place-items-center bg-black/20 p-4",
    children: jsx.jsxs("section", {
      className: "w-full max-w-lg rounded-2xl bg-surface-primary p-6 shadow-xl",
      children: [
        jsx.jsxs("header", {
          className: "mb-5 flex items-start justify-between gap-4",
          children: [jsx.jsx("h2", { className: "text-lg font-semibold", children: title }), jsx.jsx("button", { type: "button", "aria-label": "Close", onClick: onClose, children: "×" })],
        }),
        children,
      ],
    }),
  });
}

function TrustedContactController({
  entryPoint = "settings",
  initialDialog = null,
  onClose,
  onSuccess,
  accountId,
  userId,
}: EnrollmentProps & { accountId: string; userId: string }): unknown {
  const intl = useIntl();
  const queryClient = useQueryClient();
  const scope = useScope(AppScope);
  const toast = scope.get(toastManagerSignal) as ToastManager;
  const { client } = useClient();
  const country = client.getContext().user?.country?.trim().toUpperCase() || "US";
  const korea = country === "KR";
  const queries = createTrustedContactQueries(userId, accountId);
  const enabledQuery = useQuery<boolean>({ ...queries.enabled, staleTime: 30_000 });
  const listQuery = useQuery<TrustedContactList>({ ...queries.list, staleTime: 30_000, enabled: enabledQuery.data === true });
  const [dialog, setDialog] = React.useState<DialogKind>(initialDialog);
  const [name, setName] = React.useState("");
  const [phone, setPhone] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [consent, setConsent] = React.useState(false);
  const [emailError, setEmailError] = React.useState(false);
  const [pendingAction, setPendingAction] = React.useState<"add" | "remove" | "resend" | null>(null);
  const [lastInvite, setLastInvite] = React.useState<{ email: string; name: string } | null>(null);
  const contact = listQuery.data?.contacts[0] ?? null;
  const fallbackName = String(intl.formatMessage({ id: "settingsModal.trustedContacts.trustedContactFallbackName", defaultMessage: "Trusted contact" }));
  const headers = createAccountHeaders(accountId);
  const loadError = enabledQuery.isError || (enabledQuery.data === true && listQuery.isError);
  const loading = enabledQuery.isPending || (enabledQuery.data === true && listQuery.isPending);

  const closeEnrollment = (): void => {
    setDialog(null);
    onClose?.();
  };
  const retry = (): void => {
    void (enabledQuery.isError ? enabledQuery.refetch() : listQuery.refetch());
  };
  const submitInvite = async (event: { preventDefault(): void }): Promise<void> => {
    event.preventDefault();
    const normalizedName = name.trim();
    const normalizedEmail = email.trim();
    const validEmail = emailIsValid(normalizedEmail);
    setEmailError(!validEmail);
    if (!normalizedName || !validEmail || !consent || pendingAction != null) return;
    const payload: InvitePayload = { name: normalizedName, email: normalizedEmail, phone_number: phone.trim() || null, relationship: null };
    setPendingAction("add");
    try {
      const created = await apiClient.safePost("/trusted_contact", { requestBody: payload, additionalHeaders: headers });
      queryClient.setQueryData(queries.list.queryKey, { contacts: [created] });
      await queryClient.invalidateQueries({ queryKey: queries.list.queryKey });
      setLastInvite({ name: created.name?.trim() || normalizedName, email: created.email?.trim() || normalizedEmail });
      setDialog("success");
      onSuccess?.();
    } catch (error) {
      if (isBlockedContactError(error)) {
        setLastInvite({ name: normalizedName, email: normalizedEmail });
        setDialog("unavailable");
      } else {
        toast.danger("Unable to save trusted contact. Please try again.", { errorAnalytics: { toastId: "trustedContactSettings.onError.saveError" } });
      }
    } finally {
      setPendingAction(null);
    }
  };
  const resend = async (): Promise<void> => {
    if (contact == null || pendingAction != null) return;
    const payload = createResendPayload(contact, fallbackName);
    if (payload == null) return;
    setPendingAction("resend");
    try {
      await apiClient.safePut("/trusted_contact/{trusted_contact_id}", {
        additionalHeaders: headers,
        parameters: { path: { trusted_contact_id: contact.trusted_contact_id } },
        requestBody: payload,
      });
      toast.success("Invitation resent.");
      await queryClient.invalidateQueries({ queryKey: queries.list.queryKey });
    } catch {
      toast.danger("Unable to save trusted contact. Please try again.", { errorAnalytics: { toastId: "trustedContactSettings.onError.saveError" } });
    } finally {
      setPendingAction(null);
    }
  };
  const remove = async (): Promise<void> => {
    if (contact == null || pendingAction != null) return;
    setPendingAction("remove");
    try {
      await apiClient.safeDelete("/trusted_contact/{trusted_contact_id}", {
        additionalHeaders: headers,
        parameters: { path: { trusted_contact_id: contact.trusted_contact_id } },
      });
      queryClient.setQueryData(queries.list.queryKey, { contacts: [] });
      await queryClient.invalidateQueries({ queryKey: queries.list.queryKey });
      toast.success("Trusted contact removed");
      setDialog(null);
    } catch {
      toast.danger("Unable to remove trusted contact. Please try again.", { errorAnalytics: { toastId: "trustedContactSettings.onError.removeError" } });
    } finally {
      setPendingAction(null);
    }
  };
  const openPersonalNote = (): void => {
    if (lastInvite?.email == null) return;
    const subject = encodeURIComponent("Could we find time to chat?");
    const body = encodeURIComponent("Hi there,\n\nI’ve been thinking about ways to make sure I have support when I’m going through a tough time. Could we find a time to talk?");
    if (typeof window !== "undefined") window.location.assign("mailto:" + encodeURIComponent(lastInvite.email) + "?subject=" + subject + "&body=" + body);
  };

  const settingsPanel = onClose == null ? jsx.jsxs("section", {
    className: "rounded-xl border border-token-border-light p-5 text-sm",
    "data-entry-point": entryPoint,
    children: [
      jsx.jsx("h1", { className: "text-lg font-semibold", children: "Trusted contact" }),
      jsx.jsx("p", { className: "mt-3", children: "Having a trusted contact can make it easier to get support from someone who knows you well." }),
      jsx.jsx("p", { className: "mt-2 text-secondary", children: korea ? "You and your trusted contact must be 19+ to participate." : "Your trusted contact must be 18+ to participate." }),
      loading ? jsx.jsx("p", { className: "mt-5 text-secondary", role: "status", children: "Loading trusted contact..." }) : null,
      loadError ? jsx.jsxs("div", { className: "mt-5", role: "alert", children: [jsx.jsx("p", { children: "Couldn't load trusted contact. Please try again." }), jsx.jsx(ActionButton, { onClick: retry, children: "Retry" })] }) : null,
      !loading && !loadError && enabledQuery.data === false ? jsx.jsx("p", { className: "mt-5 text-secondary", children: "Trusted contacts aren't available for this account." }) : null,
      !loading && !loadError && enabledQuery.data === true && contact == null ? jsx.jsx("div", { className: "mt-5", children: jsx.jsx(ActionButton, { testId: "add-trusted-contact-button", onClick: () => setDialog("intro"), children: "Add contact" }) }) : null,
      !loading && !loadError && contact != null ? jsx.jsxs("div", {
        className: "mt-5 space-y-4",
        children: [
          jsx.jsxs("div", { className: "rounded-lg border p-4", children: [jsx.jsx("p", { className: "font-medium", children: contactName(contact, fallbackName) }), contact.email ? jsx.jsx("p", { className: "text-secondary", children: contact.email }) : null, contact.phone_number ? jsx.jsx("p", { className: "text-secondary", children: contact.phone_number }) : null, jsx.jsx("span", { className: "mt-2 inline-block rounded-full border px-2 py-0.5", children: contact.status === "pending" ? "Pending" : "Active" })] }),
          jsx.jsxs("div", { className: "flex gap-3", children: [contact.status === "pending" ? jsx.jsx(ActionButton, { disabled: pendingAction != null, testId: "resend-trusted-contact-button", onClick: () => { void resend(); }, children: "Resend invitation" }) : null, jsx.jsx(ActionButton, { danger: true, disabled: pendingAction != null, testId: contact.status === "pending" ? "cancel-trusted-contact-button" : "remove-trusted-contact-button", onClick: () => setDialog("remove"), children: contact.status === "pending" ? "Cancel invitation" : "Remove contact" })] }),
        ],
      }) : null,
    ],
  }) : null;

  const introDialog = dialog === "intro" ? jsx.jsx(Dialog, {
    title: "Adding a trusted contact",
    onClose: closeEnrollment,
    children: jsx.jsxs("div", { className: "space-y-4 text-sm", children: [jsx.jsx(TrustedContactHero, {}), jsx.jsx("p", { children: "Choose a trusted adult who knows you well and can check in if you may need support." }), jsx.jsx("p", { className: "text-secondary", children: "Chat details and transcripts aren't shared." }), jsx.jsxs("div", { className: "flex justify-end gap-3", children: [jsx.jsx(ActionButton, { onClick: closeEnrollment, children: "Close" }), jsx.jsx(ActionButton, { testId: "trusted-contact-intro-continue", onClick: () => setDialog("invite"), children: "Continue" })] })] }),
  }) : null;
  const inviteDialog = dialog === "invite" ? jsx.jsx(Dialog, {
    title: "Invite a trusted contact",
    onClose: closeEnrollment,
    children: jsx.jsxs("form", {
      noValidate: true,
      onSubmit: (event: { preventDefault(): void }) => { void submitInvite(event); },
      className: "space-y-4",
      children: [
        jsx.jsxs("label", { className: "block text-sm", children: [jsx.jsx("span", { children: "Name" }), jsx.jsx("input", { id: "trusted-contact-name", value: name, autoComplete: "name", "data-testid": "trusted-contact-name-input", onChange: (event: { target: { value: string } }) => setName(event.target.value) })] }),
        jsx.jsxs("label", { className: "block text-sm", children: [jsx.jsx("span", { children: "Phone number (optional)" }), jsx.jsx(PhoneNumberInput, { id: "trusted-contact-phone", value: phone, defaultCountry: country, "data-testid": "trusted-contact-phone-input", onChange: (value: string) => setPhone(value) })] }),
        jsx.jsxs("label", { className: "block text-sm", children: [jsx.jsx("span", { children: "Email" }), jsx.jsx("input", { id: "trusted-contact-email", type: "email", value: email, autoComplete: "email", "aria-invalid": emailError, "data-testid": "trusted-contact-email-input", onChange: (event: { target: { value: string } }) => { setEmail(event.target.value); setEmailError(false); } }), emailError ? jsx.jsx("span", { role: "alert", children: "Enter a valid email address" }) : null] }),
        jsx.jsxs("label", { className: "flex gap-3 text-sm", children: [jsx.jsx("input", { id: "trusted-contact-consent-checkbox", type: "checkbox", checked: consent, onChange: (event: { target: { checked: boolean } }) => setConsent(event.target.checked) }), jsx.jsx("span", { children: korea ? "I confirm this person is at least 19 and agreed to receive an invitation." : "I confirm this person is at least 18 and agreed to receive an invitation." })] }),
        jsx.jsx(ActionButton, { type: "submit", testId: "trusted-contact-save-button", disabled: !name.trim() || !email.trim() || !consent || pendingAction != null, children: pendingAction === "add" ? "Sending..." : "Send invitation" }),
      ],
    }),
  }) : null;
  const successDialog = dialog === "success" ? jsx.jsx(Dialog, {
    title: "Invitation sent",
    onClose: closeEnrollment,
    children: jsx.jsxs("div", { className: "space-y-4 text-sm text-center", children: [jsx.jsx("p", { className: "font-medium", children: lastInvite == null ? fallbackName : lastInvite.name + " (" + lastInvite.email + ")" }), jsx.jsx("p", { className: "text-secondary", children: "They can choose whether to participate. You can manage the invitation in settings." }), jsx.jsx(ActionButton, { testId: "trusted-contact-invite-success-personal-note", onClick: openPersonalNote, children: "Send a personal note" }), jsx.jsx(ActionButton, { testId: "trusted-contact-invite-success-close", onClick: closeEnrollment, children: "Close" })] }),
  }) : null;
  const unavailableDialog = dialog === "unavailable" ? jsx.jsx(Dialog, {
    title: "Couldn’t add trusted contact",
    onClose: closeEnrollment,
    children: jsx.jsxs("div", { className: "space-y-4 text-sm text-center", children: [jsx.jsx("p", { className: "font-medium", children: lastInvite == null ? "This person" : lastInvite.name + " (" + lastInvite.email + ")" }), jsx.jsx("p", { className: "text-secondary", children: "This can happen for different reasons — for example, they may not be eligible." }), jsx.jsx(ActionButton, { testId: "trusted-contact-unavailable-add-someone-else", onClick: () => setDialog("invite"), children: "Add someone else" }), jsx.jsx(ActionButton, { testId: "trusted-contact-unavailable-close", onClick: closeEnrollment, children: "Close" })] }),
  }) : null;
  const removeDialog = dialog === "remove" ? jsx.jsx(Dialog, {
    title: "Are you sure?",
    onClose: () => setDialog(null),
    children: jsx.jsxs("div", { className: "space-y-4 text-sm text-center", children: [jsx.jsx("p", { children: "You’re about to remove " + contactName(contact, fallbackName) + " as your trusted contact." }), jsx.jsx(ActionButton, { danger: true, disabled: pendingAction != null, testId: "trusted-contact-remove-confirm-button", onClick: () => { void remove(); }, children: pendingAction === "remove" ? "Removing..." : "Remove contact" }), jsx.jsx(ActionButton, { disabled: pendingAction != null, testId: "trusted-contact-remove-cancel-button", onClick: () => setDialog(null), children: "Go back" })] }),
  }) : null;

  return jsx.jsxs(jsx.Fragment, { children: [settingsPanel, introDialog, inviteDialog, successDialog, unavailableDialog, removeDialog] });
}

function AccessError(): unknown {
  const queryClient = useQueryClient();
  return jsx.jsxs("section", { role: "alert", className: "rounded-xl border p-5", children: [jsx.jsx("h1", { className: "text-lg font-semibold", children: "Trusted contact" }), jsx.jsx("p", { className: "mt-3", children: "Couldn't load trusted contact. Please try again." }), jsx.jsx(ActionButton, { onClick: () => { void queryClient.invalidateQueries({ queryKey: ["accounts", "check"] }); }, children: "Retry" })] });
}

function ChatGptTrustedContactSettings(): unknown {
  initializeTrustedContactSettings();
  const access = useSignalValue(trustedContactAccessSignal);
  if (access.status === "error") return jsx.jsx(AccessError, {});
  if (access.status !== "allowed" || access.userId == null || access.accountId == null) return null;
  return jsx.jsx(TrustedContactController, { userId: access.userId, accountId: access.accountId });
}

function TrustedContactEnrollment(props: EnrollmentProps): unknown {
  initializeTrustedContactSettings();
  const access = useSignalValue(trustedContactAccessSignal);
  if (access.status !== "allowed" || access.userId == null || access.accountId == null) return null;
  return jsx.jsx(TrustedContactController, { ...props, userId: access.userId, accountId: access.accountId });
}

let initialized = false;
function initializeTrustedContactSettings(): void {
  if (initialized) return;
  initializeRuntimeLazy();
  initializeScopeRuntime();
  initializeQueryRuntime();
  initializeMutationRuntime();
  initializeSettingsRuntime();
  initializeSettingsPage();
  initializeApiClient();
  initializeClientContext();
  initializeTrustedContactClient();
  initializePhoneNumberInput();
  initializeTrustedContactHero();
  React = getReactRuntime();
  jsx = getJsxRuntime();
  initialized = true;
}

initializeTrustedContactSettings();
export { ChatGptTrustedContactSettings, TrustedContactEnrollment };
