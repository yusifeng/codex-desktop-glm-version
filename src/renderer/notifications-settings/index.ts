import "@rchunk/rolldown-runtime";
import * as appShared from "@rchunk/app-shared";
import * as appInitial from "@rchunk/app-initial";
import { n as initializeSettingsLoadingRow, t as SettingsLoadingRow } from "@rchunk/settings-loading-row";

type NotificationSound = "default" | "classic" | "none" | "Basso" | "Glass" | "Ping" | "Pop" | "Purr" | "Tink" | { name: string; path?: string };
type TurnNotificationMode = "off" | "unfocused" | "always";
interface NotificationOption { channel: string; enabled: boolean; name: string }
interface NotificationSetting { category: string; description?: string; name: string; options: NotificationOption[] }
interface NotificationSettingsResponse { settings: NotificationSetting[] }
interface ContactMethods { email?: string | null; phone_number?: string | null }
interface ScopeApi { get<Value>(signal: unknown): Value; set(signal: unknown, value: unknown): void }
interface QueryClient {
  cancelQueries(input: { queryKey: unknown[] }): Promise<unknown>;
  getQueryData<Value>(queryKey: unknown[]): Value | undefined;
  invalidateQueries(input: { queryKey: unknown[]; refetchType?: string }): Promise<unknown> | void;
  setQueryData<Value>(queryKey: unknown[], update: (value: Value | undefined) => Value | undefined): void;
}
interface QueryResult<Value> { data?: Value; isError: boolean; isFetching: boolean; isPending: boolean; refetch(): Promise<unknown> | void }
interface MutationInput { accountId: string; category: string; channel: string; controller: AbortController; enabled: boolean; userId: string }
interface IntlApi { formatMessage(message: { defaultMessage?: string; id?: string }): string }

const shared = appShared as unknown as {
  $O: { ONE_MINUTE: number };
  BX<Value>(family: unknown, parameter: unknown): QueryResult<Value>;
  CL(): QueryClient;
  HX<Value>(signal: unknown): Value;
  I3(): appShared.JsxRuntime;
  LX(scope: unknown): ScopeApi;
  Lf: unknown;
  Y2: unknown;
  Yh: unknown;
  ZI: unknown;
  Zc: unknown;
  _L<Value>(options: Record<string, unknown>): QueryResult<Value>;
  bD: unknown;
  e6(): appShared.ReactRuntime;
  ek: { CheckboxItem: unknown; Item: unknown };
  iL(options: Record<string, unknown>): { mutate(input: MutationInput): void };
  jf: unknown;
  kf: unknown;
  n4(): IntlApi;
  pk: unknown;
  rL: unknown;
  [key: string]: unknown;
};
const initial = appInitial as unknown as {
  Irn: unknown;
  Kcn<Value>(signal: unknown): Value;
  Ucn(scope: ScopeApi, signal: unknown, value: unknown): Promise<unknown>;
  Yl: unknown;
  _un: unknown;
  aa: { Content: unknown; Header: unknown } & ((props: Record<string, unknown>) => unknown);
  au: unknown;
  bL: unknown;
  mun: unknown;
  mC: unknown;
  pnt: { notifications?: { importSound(input: { title: string }): Promise<{ status: "cancelled" | "error" } | { sound: NotificationSound; status: "selected" }>; previewSound(sound: NotificationSound): Promise<boolean> | boolean } };
  ql: unknown;
  rJt: { safeGet<Value>(path: string, options: Record<string, unknown>): Promise<Value>; safePatch<Value>(path: string, options: Record<string, unknown>): Promise<Value> };
  ru: unknown;
  sa: Record<string, { defaultMessage?: string; id?: string }>;
  tz: { permissionsEnabled: unknown; questionsEnabled: unknown; sound: unknown; turnMode: unknown };
  xun: unknown;
  [key: string]: unknown;
};

let React: appShared.ReactRuntime;
let jsx: appShared.JsxRuntime;
let initialized = false;
const QUERY_KEY = "chatgpt-notification-settings";

function initializeNotificationsSettings(): void {
  if (initialized) return;
  const initializers = [appShared.FX, appShared.K2, appShared.QI, appShared.Qc, appShared.Zh, appShared.lk, appShared.wL, appShared.xD, initial.cJt, initial.Sun, initial.Vcn, initial.Frn, initial.mnt, initial.iu, initial.su, initial.ca, initial.oa, initial.gC];
  for (const initialize of initializers) if (typeof initialize === "function") initialize();
  initializeSettingsLoadingRow();
  React = shared.e6();
  jsx = shared.I3();
  initialized = true;
}

function message(descriptor: { defaultMessage?: string; id?: string }): unknown {
  return jsx.jsx(shared.Y2, descriptor);
}

function LoadingRow(): unknown {
  return jsx.jsx(SettingsLoadingRow, { children: message({ id: "settings.notifications.chatGpt.loading", defaultMessage: "Loading ChatGPT notification settings" }) });
}

function RetryButton({ isFetching, onRetry }: { isFetching: boolean; onRetry(): void }): unknown {
  return jsx.jsx(shared.Yh, { color: "secondary", size: "toolbar", type: "button", loading: isFetching, onClick: onRetry, children: message({ id: "common.retry", defaultMessage: "Retry" }) });
}

function updateCachedSetting(response: NotificationSettingsResponse | undefined, input: Pick<MutationInput, "category" | "channel">, enabled: boolean): NotificationSettingsResponse | undefined {
  if (response == null) return response;
  return { ...response, settings: response.settings.map((setting) => setting.category === input.category ? { ...setting, options: setting.options.map((option) => option.channel === input.channel ? { ...option, enabled } : option) } : setting) };
}

async function patchNotificationSetting(input: MutationInput): Promise<NotificationSettingsResponse> {
  input.controller.signal.throwIfAborted();
  return initial.rJt.safePatch("/notifications/settings", { additionalHeaders: { "ChatGPT-Account-ID": input.accountId }, requestBody: { updates: { [input.category]: { [input.channel]: input.enabled } } }, signal: input.controller.signal });
}

function NotificationCategoryRow({ setting, updateSetting }: { setting: NotificationSetting; updateSetting(channel: string, enabled: boolean): void }): unknown {
  const intl = shared.n4();
  const id = React.useId();
  const enabled = setting.options.filter((option) => option.enabled);
  const summary = enabled.length === 0 ? intl.formatMessage({ id: "settings.notifications.chatGpt.off", defaultMessage: "Off" }) : enabled.map((option) => option.name).join(", ");
  const control = (triggerProps: Record<string, unknown>) => jsx.jsx(shared.kf, { align: "end", contentWidth: "menuWide", triggerButton: jsx.jsx(initial.ql, { ...triggerProps, "aria-labelledby": `${String(triggerProps["aria-labelledby"] ?? "")} ${id}`, children: jsx.jsx("span", { id, className: "truncate", children: summary }) }), children: setting.options.map((option) => jsx.jsx(shared.ek.CheckboxItem, { checked: option.enabled, onCheckedChange: (checked: boolean) => updateSetting(option.channel, checked), children: option.name }, option.channel)) });
  return jsx.jsx(shared.rL, { label: setting.name, description: setting.description, control });
}

function TeenSafetyCategoryRow({ setting, updateSetting }: { setting: NotificationSetting; updateSetting(channel: string, enabled: boolean): void }): unknown {
  const accountId = shared.HX<string | null>(initial.mun);
  const userId = shared.HX<string | null>(initial._un);
  const contacts = shared.BX<ContactMethods>(initial.mC, { accountId, userId });
  if (contacts.isPending) return jsx.jsx(shared.rL, { label: setting.name, control: jsx.jsx(initial.ru, {}) });
  if (contacts.isError || contacts.data == null) return jsx.jsx(shared.rL, { label: setting.name, description: jsx.jsx("span", { role: "alert", children: message({ id: "settings.notifications.chatGpt.contactError", defaultMessage: "Your contact methods couldn’t be loaded" }) }), control: jsx.jsx(RetryButton, { isFetching: contacts.isFetching, onRetry: () => void contacts.refetch() }) });
  const available = setting.options.filter((option) => (option.channel !== "email" || !!contacts.data?.email) && (option.channel !== "sms" || !!contacts.data?.phone_number));
  return jsx.jsx(NotificationCategoryRow, { setting: { ...setting, options: available }, updateSetting: (channel: string, enabled: boolean) => { if ((channel !== "email" || !!contacts.data?.email) && (channel !== "sms" || !!contacts.data?.phone_number)) updateSetting(channel, enabled); } });
}

function ChatGptSettingsForAccount({ accountId, userId }: { accountId: string; userId: string }): unknown {
  const scope = shared.LX(shared.ZI);
  const intl = shared.n4();
  const queryClient = shared.CL();
  const controllers = React.useRef(new Set<AbortController>());
  const queryKey = [QUERY_KEY, userId, accountId];
  const query = shared._L<NotificationSettingsResponse>({ queryKey, queryFn: ({ signal }: { signal: AbortSignal }) => initial.rJt.safeGet("/notifications/settings", { additionalHeaders: { "ChatGPT-Account-ID": accountId }, signal }), staleTime: shared.$O.ONE_MINUTE });
  const mutation = shared.iL({
    mutationFn: patchNotificationSetting,
    onMutate: async (input: MutationInput) => {
      await queryClient.cancelQueries({ queryKey });
      input.controller.signal.throwIfAborted();
      const previous = queryClient.getQueryData<NotificationSettingsResponse>(queryKey)?.settings.find((setting) => setting.category === input.category)?.options.find((option) => option.channel === input.channel)?.enabled;
      queryClient.setQueryData<NotificationSettingsResponse>(queryKey, (value) => updateCachedSetting(value, input, input.enabled));
      return { previous };
    },
    onError: (_error: unknown, input: MutationInput, context?: { previous?: boolean }) => {
      if (input.controller.signal.aborted) return;
      if (context?.previous != null) queryClient.setQueryData<NotificationSettingsResponse>(queryKey, (value) => updateCachedSetting(value, input, context.previous as boolean));
      const toast = scope.get<{ danger(message: string, options: Record<string, unknown>): void }>(shared.pk);
      toast.danger(intl.formatMessage({ id: "settings.notifications.chatGpt.updateError", defaultMessage: "Failed to update ChatGPT notification settings" }), { errorAnalytics: { toastId: "settings.notifications.chatGpt.updateError" } });
    },
    onSettled: (_data: unknown, _error: unknown, input: MutationInput) => controllers.current.delete(input.controller),
  });
  React.useEffect(() => () => { if (controllers.current.size > 0) void queryClient.invalidateQueries({ queryKey, refetchType: "none" }); for (const controller of controllers.current) controller.abort(); }, [accountId, queryClient, userId]);
  if (query.isPending) return jsx.jsx(LoadingRow, {});
  if (query.isError || query.data == null) return jsx.jsx(shared.rL, { label: jsx.jsx("span", { role: "alert", children: message({ id: "settings.notifications.chatGpt.error", defaultMessage: "ChatGPT notification settings could not be loaded" }) }), control: jsx.jsx(RetryButton, { isFetching: query.isFetching, onRetry: () => void query.refetch() }) });
  return jsx.jsx(jsx.Fragment, { children: query.data.settings.map((setting) => {
    const Component = setting.category === "teen_safety" ? TeenSafetyCategoryRow : NotificationCategoryRow;
    return jsx.jsx(Component, { setting, updateSetting: (channel: string, enabled: boolean) => {
      if (scope.get(initial.mun) !== accountId || scope.get(initial._un) !== userId) return;
      const controller = new AbortController();
      controllers.current.add(controller);
      mutation.mutate({ accountId, userId, category: setting.category, channel, controller, enabled });
    } }, setting.category);
  }) });
}

function ChatGptNotificationSettings(): unknown {
  const accountId = shared.HX<string | null>(initial.mun);
  const userId = shared.HX<string | null>(initial._un);
  if (accountId == null || userId == null) return jsx.jsx(LoadingRow, {});
  const access = shared.HX<{ status: "allowed" | "denied" | "error" | "loading" }>(initial.bL);
  if (access.status === "loading") return jsx.jsx(LoadingRow, {});
  if (access.status === "denied") return null;
  if (access.status === "error") return jsx.jsx(shared.rL, { label: jsx.jsx("span", { role: "alert", children: message({ id: "settings.notifications.chatGpt.accountError", defaultMessage: "Your account information couldn’t be loaded" }) }) });
  return jsx.jsx(ChatGptSettingsForAccount, { accountId, userId }, `${userId}:${accountId}`);
}

const SOUND_OPTIONS: Array<{ label: string; value: Exclude<NotificationSound, { name: string }> }> = ["default", "classic", "none", "Basso", "Glass", "Ping", "Pop", "Purr", "Tink"].map((value) => ({ value: value as Exclude<NotificationSound, { name: string }>, label: value[0]?.toUpperCase() + value.slice(1) }));

function NotificationSoundRow(): unknown {
  const scope = shared.LX(shared.ZI);
  const intl = shared.n4();
  const sound = initial.Kcn<NotificationSound>(initial.tz.sound);
  const platform = shared.HX<{ platform?: string } | null>(initial.Irn);
  const [saving, setSaving] = React.useState(false);
  const select = async (value: NotificationSound | "custom") => {
    if (saving) return;
    setSaving(true);
    try {
      let selected: NotificationSound;
      if (value === "custom") {
        const bridge = initial.pnt.notifications;
        if (bridge == null) return;
        const result = await bridge.importSound({ title: intl.formatMessage({ id: "notifications.sound.chooseTitle", defaultMessage: "Choose notification sound" }) });
        if (result.status !== "selected") return;
        selected = result.sound;
      } else selected = value;
      await initial.Ucn(scope, initial.tz.sound, selected);
      const played = await Promise.resolve(initial.pnt.notifications?.previewSound(selected) ?? true).catch(() => false);
      if (!played) scope.get<{ danger(message: string, options: Record<string, unknown>): void }>(shared.pk).danger(intl.formatMessage({ id: "notifications.sound.previewError", defaultMessage: "Sound saved, but the preview couldn't play" }), { errorAnalytics: { toastId: "notifications.sound.previewError" } });
    } catch {
      scope.get<{ danger(message: string, options: Record<string, unknown>): void }>(shared.pk).danger(intl.formatMessage({ id: "notifications.sound.saveError", defaultMessage: "Couldn't change the notification sound. Try again" }), { errorAnalytics: { toastId: "notifications.sound.saveError" } });
    } finally { setSaving(false); }
  };
  const options = SOUND_OPTIONS.filter((option) => platform?.platform === "darwin" || ["default", "classic", "none"].includes(option.value));
  const current = typeof sound === "object" ? sound.name : SOUND_OPTIONS.find((option) => option.value === sound)?.label;
  return jsx.jsx(shared.rL, { label: message({ id: "notifications.sound.label", defaultMessage: "Notification sound" }), description: message({ id: "notifications.sound.description", defaultMessage: "Sound for task completion, permission requests, and questions" }), control: (triggerProps: Record<string, unknown>) => jsx.jsx(shared.kf, { align: "end", contentWidth: "menuWide", triggerButton: jsx.jsx(initial.ql, { ...triggerProps, disabled: saving, children: jsx.jsx("span", { className: "truncate", children: current }) }), children: [...options.map((option) => jsx.jsx(shared.ek.Item, { disabled: saving, rightIconAsset: sound === option.value ? shared.bD : undefined, onSelect: () => void select(option.value), children: option.label }, option.value)), platform?.platform === "darwin" && initial.pnt.notifications != null ? jsx.jsx(shared.ek.Item, { disabled: saving, onSelect: () => void select("custom"), children: "Choose custom sound…" }) : null] }) });
}

function LocalNotificationSettings(): unknown {
  const scope = shared.LX(shared.ZI);
  const turnMode = initial.Kcn<TurnNotificationMode | null>(initial.tz.turnMode) ?? "unfocused";
  const permissionsEnabled = initial.Kcn<boolean | null>(initial.tz.permissionsEnabled) ?? true;
  const questionsEnabled = initial.Kcn<boolean | null>(initial.tz.questionsEnabled) ?? true;
  const modes: Array<{ id: TurnNotificationMode; label: string }> = [{ id: "off", label: "Never" }, { id: "unfocused", label: "Only when unfocused" }, { id: "always", label: "Always" }];
  const selected = modes.find((mode) => mode.id === turnMode)?.label;
  const turnRow = jsx.jsx(shared.rL, { label: "Turn completion notifications", description: "Set when ChatGPT alerts you that it's finished", control: jsx.jsx(shared.kf, { contentWidth: "menuWide", align: "end", triggerButton: jsx.jsx(initial.ql, { children: jsx.jsx("span", { className: "truncate", children: selected }) }), children: modes.map((mode) => jsx.jsx(shared.ek.Item, { rightIconAsset: mode.id === turnMode ? shared.bD : undefined, onSelect: () => void initial.Ucn(scope, initial.tz.turnMode, mode.id), children: mode.label }, mode.id)) }) });
  const permissionRow = jsx.jsx(shared.rL, { label: "Permission notifications", description: "Show alerts when notification permissions are required", control: jsx.jsx(shared.Lf, { checked: permissionsEnabled, onChange: (value: boolean) => void initial.Ucn(scope, initial.tz.permissionsEnabled, value), ariaLabel: "Permission notifications" }) });
  const questionRow = jsx.jsx(shared.rL, { label: "Question notifications", description: "Show alerts when input is needed to continue", control: jsx.jsx(shared.Lf, { checked: questionsEnabled, onChange: (value: boolean) => void initial.Ucn(scope, initial.tz.questionsEnabled, value), ariaLabel: "Question notifications" }) });
  return jsx.jsxs(jsx.Fragment, { children: [turnRow, permissionRow, questionRow, initial.pnt.notifications == null ? null : jsx.jsx(NotificationSoundRow, {})] });
}

function NotificationsSettingsPage(): unknown {
  initializeNotificationsSettings();
  const showChatGpt = shared.HX<boolean>(initial.xun);
  const title = jsx.jsx(initial.Yl, { slug: "notifications" });
  const chatGpt = showChatGpt ? jsx.jsxs(initial.aa, { children: [jsx.jsx(initial.aa.Header, { title: message({ id: "settings.notifications.chatGptGroupTitle", defaultMessage: "ChatGPT" }) }), jsx.jsx(initial.aa.Content, { children: jsx.jsx(shared.Zc, { children: jsx.jsx(ChatGptNotificationSettings, {}) }) })] }) : null;
  return jsx.jsx(initial.au, { title, children: chatGpt });
}

export { NotificationsSettingsPage as n, initializeNotificationsSettings as r, LocalNotificationSettings as t };
