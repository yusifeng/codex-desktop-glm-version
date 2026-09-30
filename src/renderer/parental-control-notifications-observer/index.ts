// Account-scoped parental-control notification observer. Release chunk: notifications-3700d6e3cd47.js.
import * as SharedChunk from "@rchunk/app-shared";
import * as InitialChunk from "@rchunk/app-initial";

interface AccountAccess { accountId: string; status: string; userId: string }
interface Getter { (signal: unknown): unknown }
interface WatchScope { watch(factory: (context: { get: Getter }) => void | (() => void)): () => void }
interface SharedRuntime {
  FX(): void;
  H3(): void;
  Q3: { warning(message: string): void };
  QI(): void;
  Z3(): void;
  ZI: unknown;
  sZ(signal: unknown, read: (context: { get: Getter }) => unknown, options?: { isEqual?(left: unknown, right: unknown): boolean }): unknown;
}
interface InitialRuntime { bL: unknown; xL(): void }

const shared = SharedChunk as unknown as SharedRuntime;
const initial = InitialChunk as unknown as InitialRuntime;
let accountSignal: unknown;
let initialized = false;

function initialize(): void {
  if (initialized) return;
  initialized = true;
  shared.FX();
  shared.QI();
  initial.xL();
  shared.Z3();
  shared.H3();
  accountSignal = shared.sZ(
    shared.ZI,
    ({ get }) => {
      const access = get(initial.bL) as AccountAccess;
      return access.status === "allowed" ? { accountId: access.accountId, userId: access.userId } : null;
    },
    {
      isEqual: (left, right) => {
        const a = left as { accountId?: string; userId?: string } | null;
        const b = right as { accountId?: string; userId?: string } | null;
        return a?.accountId === b?.accountId && a?.userId === b?.userId;
      },
    },
  );
}

function observeParentalControlNotifications(scope: WatchScope): () => void {
  initialize();
  return scope.watch(({ get }) => {
    const account = get(accountSignal) as { accountId: string; userId: string } | null;
    if (account == null) return;
    let cancelled = false;
    let stop: (() => void) | undefined;
    void import("@rchunk/parental-control-notifications-runtime")
      .then(({ listenForParentalControlNotifications }) => {
        if (!cancelled) stop = listenForParentalControlNotifications(scope, account.userId, account.accountId);
      })
      .catch(() => {
        if (!cancelled) shared.Q3.warning("chatgpt_family_notifications_initialization_failed");
      });
    return () => {
      cancelled = true;
      stop?.();
    };
  });
}

initialize();
export { observeParentalControlNotifications };
