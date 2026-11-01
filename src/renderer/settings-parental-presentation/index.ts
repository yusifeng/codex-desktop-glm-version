import { n as onceExport } from "@rchunk/rolldown-runtime";
import {
  $O as queryDurations,
  FX as initializeQueryRuntime,
  H3 as initializeLazyRuntime,
  QI as initializeScopedRuntime,
  ZI as applicationScope,
  e6 as getReactRuntime,
  ek as initializeAccountRuntime,
  sZ as createDerivedSignal,
  type ReactRuntime,
} from "@rchunk/app-shared";
import {
  Hzt as isDialogOpen,
  Sdn as ApiResponseError,
  Sqt as initializePepperOnboarding,
  Sun as initializeFamilyRuntime,
  U6t as activeAccountId,
  Uzt as openDialog,
  Vzt as initializeDialogRuntime,
  _un as activeUserId,
  bL as parentalAccessState,
  cJt as initializeApiClient,
  fpn as initializeFamilyQueries,
  gdn as initializeFamilyNotifications,
  hdn as getSettingsLocale,
  mdn as settingsLocaleHeader,
  mun as familyAccountId,
  rJt as apiClient,
  wdn as initializeFamilySettings,
  xL as initializeAccountProvider,
  zzt as closeDialog,
} from "@rchunk/app-initial";
import type { FamilyNotification as FamilyNotificationComponent } from "@rchunk/family-notification-surface";

interface AccountIdentity {
  accountId: string;
  userId: string;
}

interface ParentalAccessState {
  accountId?: string;
  status: "allowed" | "loading" | string;
  userId?: string;
}

interface FamilyNotificationItem {
  id: string;
  reacted_to_at?: string | null;
  seen_at?: string | null;
  [key: string]: unknown;
}

interface FamilyNotificationPage {
  items: FamilyNotificationItem[];
  [key: string]: unknown;
}

interface FamilyNotification {
  item: FamilyNotificationItem;
  type: string;
  [key: string]: unknown;
}

interface QueryRecord {
  setState(state: { data: undefined; dataUpdatedAt: number }): void;
}

interface QueryCache {
  find(options: {
    exact: boolean;
    queryKey: readonly unknown[];
  }): QueryRecord | undefined;
  findAll(options: { queryKey: readonly unknown[] }): QueryRecord[];
}

interface QueryClient {
  cancelQueries(options: {
    predicate(query: QueryRecord): boolean;
    queryKey: readonly unknown[];
  }): void;
  getQueryCache(): QueryCache;
  getQueryData<Value>(key: readonly unknown[]): Value | undefined;
}

interface QueryContext {
  client: QueryClient;
  queryKey: readonly unknown[];
  signal: AbortSignal;
}

interface PresentationScope {
  readonly node: object;
  get<Value>(signal: unknown): Value;
  watch(listener: (scope: PresentationScope) => void): () => void;
}

interface DecisionState {
  account: AccountIdentity;
  decisions: Map<string, unknown>;
  stop(): void;
}

interface NotificationHistory {
  account: AccountIdentity;
  ids: Set<string>;
}

interface OpenNotificationState {
  account: AccountIdentity;
  notificationId: string;
  stop(): void;
}

type NotificationSurface = "info" | string;
type FamilyNotificationDialogProps = {
  account: AccountIdentity;
  initialSurface: NotificationSurface;
  notification: FamilyNotification;
  onClose(): void;
};

const once = onceExport as (initializer: () => void) => () => void;
let React: ReactRuntime;
const getLocale = getSettingsLocale as () => string;
const AccountProviderInitializer =
  initializeAccountProvider as unknown as () => void;
const HttpError = ApiResponseError as unknown as new (
  ...args: never[]
) => Error & { status: number };
const familyDialogIsOpen = isDialogOpen as unknown as (
  scope: PresentationScope,
  component: unknown,
) => boolean;
const showDialog = openDialog as unknown as (
  scope: PresentationScope,
  component: unknown,
  props: FamilyNotificationDialogProps,
  options: { blocksOtherModals: boolean },
) => void;
const dismissDialog = closeDialog as unknown as (
  scope: PresentationScope,
  component: unknown,
) => void;

let familyInvitePending: unknown;
let FamilyNotificationDialog: (props: FamilyNotificationDialogProps) => unknown;
const openNotifications = new WeakMap<object, OpenNotificationState>();
const notificationHistory = new WeakMap<object, NotificationHistory>();
const decisions = new WeakMap<object, DecisionState>();
const decisionSubscribers = new WeakMap<object, Set<() => void>>();

function hasParentalAccess(
  scope: PresentationScope,
  account: AccountIdentity,
): boolean {
  const access = scope.get<ParentalAccessState>(parentalAccessState);
  return (
    access.status === "allowed" &&
    access.userId === account.userId &&
    access.accountId === account.accountId
  );
}

const initializeParentalQueryDependencies = once(() => {
  AccountProviderInitializer();
});

async function invalidateUnauthorizedFamilyQueries<Value>(
  request: Promise<Value>,
  { client, queryKey, signal }: QueryContext,
  familyKey: readonly unknown[],
  amphoraId?: string,
): Promise<Value> {
  try {
    return await request;
  } catch (error) {
    if (
      !signal.aborted &&
      error instanceof HttpError &&
      [401, 403, 404].includes(error.status)
    ) {
      const invalidationKey =
        error.status === 404 &&
        amphoraId != null &&
        client.getQueryData<{ id?: string }>([...familyKey, "current"])?.id !==
          amphoraId
          ? [...familyKey, amphoraId]
          : familyKey;
      const activeQuery = client
        .getQueryCache()
        .find({ queryKey, exact: true });
      client.cancelQueries({
        queryKey: invalidationKey,
        predicate: (query) => query !== activeQuery,
      });
      for (const query of client
        .getQueryCache()
        .findAll({ queryKey: invalidationKey })) {
        query.setState({ data: undefined, dataUpdatedAt: 0 });
      }
    }
    throw error;
  }
}

function createParentalControlQueries(
  userId: string,
  accountId: string,
  locale = getLocale(),
) {
  const familyKey = ["chatgpt-parental-controls", userId, accountId] as const;
  const notificationsKey = [
    "chatgpt-family-notifications",
    userId,
    accountId,
  ] as const;
  const accountHeader = { "ChatGPT-Account-ID": accountId };
  return {
    current: {
      queryKey: [...familyKey, "current"],
      queryFn: (context: QueryContext) =>
        invalidateUnauthorizedFamilyQueries(
          apiClient.safeGet("/amphora", {
            additionalHeaders: accountHeader,
            signal: context.signal,
          }),
          context,
          familyKey,
        ),
      staleTime: queryDurations.ONE_MINUTE,
      retry: false,
    },
    notifications: (cursor?: string | null) => ({
      queryKey:
        cursor == null ? notificationsKey : [...notificationsKey, cursor],
      queryFn: async ({
        signal,
        client,
        queryKey,
      }: QueryContext): Promise<FamilyNotificationPage> => {
        const before = client.getQueryData<FamilyNotificationPage>(queryKey);
        const page = await apiClient.safeGet<FamilyNotificationPage>(
          "/amphora/notifications",
          {
            additionalHeaders: accountHeader,
            parameters: { query: { limit: 20, cursor } },
            signal,
          },
        );
        const optimistic =
          client.getQueryData<FamilyNotificationPage>(queryKey);
        return {
          ...page,
          items: [
            ...page.items.map((item) => {
              const current = optimistic?.items.find(
                ({ id }) => id === item.id,
              );
              return current == null
                ? item
                : {
                    ...item,
                    seen_at: item.seen_at ?? current.seen_at,
                    reacted_to_at: item.reacted_to_at ?? current.reacted_to_at,
                  };
            }),
            ...(optimistic?.items.filter(
              (item) =>
                !page.items.some(({ id }) => id === item.id) &&
                !before?.items.some(({ id }) => id === item.id),
            ) ?? []),
          ],
        };
      },
      staleTime: queryDurations.ONE_MINUTE,
      retry: false,
    }),
    layout: {
      queryKey: [...familyKey, "layout", locale],
      queryFn: ({ signal }: QueryContext) =>
        apiClient.safeGet("/amphora/settings_layout", {
          additionalHeaders: {
            ...accountHeader,
            [settingsLocaleHeader]: locale,
          },
          signal,
        }),
      staleTime: queryDurations.ONE_MINUTE,
      retry: false,
    },
    settings: (amphoraId: string, memberUserId: string) => ({
      queryKey: [...familyKey, amphoraId, memberUserId, "settings"],
      queryFn: ({ signal }: QueryContext) =>
        apiClient.safeGet("/amphora/{amphora_id}/members/{user_id}/settings", {
          additionalHeaders: accountHeader,
          parameters: {
            path: {
              amphora_id: encodeURIComponent(amphoraId),
              user_id: encodeURIComponent(memberUserId),
            },
          },
          signal,
        }),
      staleTime: queryDurations.ONE_MINUTE,
      retry: false,
    }),
    members: (amphoraId: string) => ({
      queryKey: [...familyKey, amphoraId, "members"],
      queryFn: (context: QueryContext) =>
        invalidateUnauthorizedFamilyQueries(
          apiClient.safeGet("/amphora/{amphora_id}/members", {
            additionalHeaders: accountHeader,
            parameters: { path: { amphora_id: encodeURIComponent(amphoraId) } },
            signal: context.signal,
          }),
          context,
          familyKey,
          amphoraId,
        ),
      staleTime: queryDurations.ONE_MINUTE,
      retry: false,
    }),
  };
}

const initializeParentalPresentationQueries = once(() => {
  initializeApiClient();
  initializeAccountRuntime();
  initializeFamilyNotifications();
  initializeFamilySettings();
});

function matchesActiveFamilyAccount(
  scope: PresentationScope,
  account: AccountIdentity,
): boolean {
  return (
    scope.get(activeUserId) === account.userId &&
    scope.get(familyAccountId) === account.accountId &&
    scope.get(activeAccountId) === account.accountId
  );
}

function isFamilyAccountLoading(
  scope: PresentationScope,
  account: AccountIdentity,
): boolean {
  return (
    scope.get<ParentalAccessState>(parentalAccessState).status === "loading" &&
    matchesActiveFamilyAccount(scope, account)
  );
}

function notifyDecisionSubscribers(scope: PresentationScope): void {
  decisionSubscribers.get(scope.node)?.forEach((listener) => listener());
}

function openFamilyNotification(
  scope: PresentationScope,
  notification: FamilyNotification,
  account: AccountIdentity,
  surface: NotificationSurface,
): boolean {
  if (
    !hasParentalAccess(scope, account) ||
    (notification.type === "family-invite" && scope.get(familyInvitePending))
  ) {
    return false;
  }
  if (familyDialogIsOpen(scope, FamilyNotificationDialog)) {
    const current = openNotifications.get(scope.node);
    if (
      surface === "info" &&
      current?.notificationId === notification.item.id &&
      current.account.userId === account.userId &&
      current.account.accountId === account.accountId
    ) {
      showFamilyNotification(scope, notification, account, "info");
      return true;
    }
  }
  openNotifications.get(scope.node)?.stop();
  openNotifications.delete(scope.node);
  const history = notificationHistory.get(scope.node);
  if (
    history?.account.userId === account.userId &&
    history.account.accountId === account.accountId
  ) {
    history.ids.add(notification.item.id);
  } else {
    notificationHistory.set(scope.node, {
      account,
      ids: new Set([notification.item.id]),
    });
  }
  showFamilyNotification(scope, notification, account, surface);
  const stop = scope.watch((nextScope) => {
    if (
      notification.type === "family-invite" &&
      nextScope.get(familyInvitePending)
    ) {
      dismissDialog(scope, FamilyNotificationDialog);
    }
    if (
      !hasParentalAccess(nextScope, account) ||
      !familyDialogIsOpen(nextScope, FamilyNotificationDialog)
    ) {
      cleanupFamilyPresentation(scope, account);
    }
  });
  openNotifications.set(scope.node, {
    account,
    notificationId: notification.item.id,
    stop,
  });
  return true;
}

function showFamilyNotification(
  scope: PresentationScope,
  notification: FamilyNotification,
  account: AccountIdentity,
  surface: NotificationSurface,
): void {
  showDialog(
    scope,
    FamilyNotificationDialog,
    {
      notification,
      account,
      initialSurface: surface,
      onClose: () => {
        const current = openNotifications.get(scope.node);
        if (
          current?.notificationId === notification.item.id &&
          current.account.userId === account.userId &&
          current.account.accountId === account.accountId
        ) {
          current.stop();
          openNotifications.delete(scope.node);
        }
      },
    },
    { blocksOtherModals: surface === "info" },
  );
}

function wasNotificationPresented(
  scope: PresentationScope,
  account: AccountIdentity,
  notificationId: string,
): boolean {
  const history = notificationHistory.get(scope.node);
  return (
    history?.account.userId === account.userId &&
    history.account.accountId === account.accountId &&
    history.ids.has(notificationId)
  );
}

function getFamilyDecision(
  scope: PresentationScope,
  account: AccountIdentity,
  key: string,
): unknown {
  const state = decisions.get(scope.node);
  return matchesActiveFamilyAccount(scope, account) &&
    state?.account.userId === account.userId &&
    state.account.accountId === account.accountId
    ? state.decisions.get(key)
    : undefined;
}

function useFamilyDecision(
  scope: PresentationScope,
  account: AccountIdentity,
  key: string,
): unknown {
  const subscribe = React.useCallback(
    (listener: () => void) => {
      let listeners = decisionSubscribers.get(scope.node);
      if (listeners == null) {
        listeners = new Set();
        decisionSubscribers.set(scope.node, listeners);
      }
      listeners.add(listener);
      return () => {
        listeners?.delete(listener);
        if (listeners?.size === 0) decisionSubscribers.delete(scope.node);
      };
    },
    [scope.node],
  );
  const snapshot = React.useCallback(
    () => getFamilyDecision(scope, account, key),
    [account.accountId, account.userId, key, scope],
  );
  return React.useSyncExternalStore(subscribe, snapshot, snapshot);
}

function setFamilyDecision(
  scope: PresentationScope,
  account: AccountIdentity,
  key: string,
  value: unknown,
): void {
  if (!matchesActiveFamilyAccount(scope, account)) return;
  const current = decisions.get(scope.node);
  if (
    current?.account.userId === account.userId &&
    current.account.accountId === account.accountId
  ) {
    current.decisions.set(key, value);
    notifyDecisionSubscribers(scope);
    return;
  }
  current?.stop();
  const state: DecisionState = {
    account,
    decisions: new Map([[key, value]]),
    stop: () => {},
  };
  decisions.set(scope.node, state);
  notifyDecisionSubscribers(scope);
  state.stop = scope.watch((nextScope) => {
    if (
      !matchesActiveFamilyAccount(nextScope, account) &&
      decisions.get(scope.node) === state
    ) {
      decisions.delete(scope.node);
      state.stop();
      notifyDecisionSubscribers(scope);
    }
  });
}

function cleanupFamilyPresentation(
  scope: PresentationScope,
  account: AccountIdentity,
): void {
  const inactive =
    !hasParentalAccess(scope, account) &&
    !isFamilyAccountLoading(scope, account);
  const decisionState = decisions.get(scope.node);
  if (
    inactive &&
    decisionState?.account.userId === account.userId &&
    decisionState.account.accountId === account.accountId
  ) {
    decisionState.stop();
    decisions.delete(scope.node);
    notifyDecisionSubscribers(scope);
  }
  const history = notificationHistory.get(scope.node);
  if (
    inactive &&
    history?.account.userId === account.userId &&
    history.account.accountId === account.accountId
  ) {
    notificationHistory.delete(scope.node);
  }
  const open = openNotifications.get(scope.node);
  if (
    open?.account.userId === account.userId &&
    open.account.accountId === account.accountId
  ) {
    if (inactive) {
      open.stop();
      openNotifications.delete(scope.node);
      dismissDialog(scope, FamilyNotificationDialog);
    } else if (!familyDialogIsOpen(scope, FamilyNotificationDialog)) {
      open.stop();
      openNotifications.delete(scope.node);
    }
  }
}

const initializeParentalPresentation = once(() => {
  initializeLazyRuntime();
  initializeQueryRuntime();
  initializeFamilyRuntime();
  initializePepperOnboarding();
  initializeDialogRuntime();
  initializeFamilyQueries();
  initializeScopedRuntime();
  initializeAccountProvider();
  initializeParentalQueryDependencies();
  React = getReactRuntime();
  familyInvitePending = createDerivedSignal(applicationScope, () => false);
  FamilyNotificationDialog = React.lazy(async () => ({
    default: (await import("@rchunk/family-notification-surface"))
      .FamilyNotification as typeof FamilyNotificationComponent,
  }));
});

export {
  initializeParentalPresentation as a,
  useFamilyDecision as c,
  createParentalControlQueries as d,
  initializeParentalQueryDependencies as f,
  getFamilyDecision as i,
  wasNotificationPresented as l,
  cleanupFamilyPresentation as n,
  openFamilyNotification as o,
  hasParentalAccess as p,
  familyInvitePending as r,
  setFamilyDecision as s,
  FamilyNotificationDialog as t,
  initializeParentalPresentationQueries as u,
};
