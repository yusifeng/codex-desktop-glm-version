// Workspace trial and view-only seat banners. Release chunk: banner-235b1db18610.js.
import "@rchunk/rolldown-runtime";
import * as appSharedChunk from "@rchunk/app-shared";
import * as appInitialChunk from "@rchunk/app-initial";

interface SeatAccount {
  accountId: string;
  userId: string;
  pendingRequest?: boolean;
  seatType: "trial" | "view_only";
  trialExpiresAt?: string | null;
}
interface MutationState {
  isSuccess: boolean;
  isPending: boolean;
  isError: boolean;
  mutateAsync(): Promise<unknown>;
}
interface SharedRuntime {
  HX<T>(signal: unknown): T | undefined;
  BX(query: unknown, input: unknown): MutationState;
  LX(scope: unknown): { get(query: unknown, input: unknown): MutationState };
  ZI: unknown;
  I3(): {
    jsx(type: unknown, props: Record<string, unknown>): unknown;
    jsxs(type: unknown, props: Record<string, unknown>): unknown;
  };
  e6(): { useState<T>(initial: T | (() => T)): [T, (value: T) => void] };
  Y2: unknown;
  Yh: unknown;
  S_: unknown;
  Wu: unknown;
  [key: string]: unknown;
}
interface InitialRuntime {
  e7: unknown;
  t7: unknown;
  n7: unknown;
  afn(id: string): { get(key: string, fallback: boolean): boolean };
  Yit(callback: () => void, delay: number | null): void;
  [key: string]: unknown;
}
const shared = appSharedChunk as unknown as SharedRuntime;
const initial = appInitialChunk as unknown as InitialRuntime;
const jsx = shared.I3();
const React = shared.e6();

function message(
  id: string,
  defaultMessage: string,
  values?: Record<string, unknown>,
): unknown {
  return jsx.jsx(shared.Y2, {
    id,
    defaultMessage,
    description: defaultMessage,
    values,
  });
}
function renderSeatBanner(input: {
  placement?: "composer" | "top";
  seatType: SeatAccount["seatType"];
  daysRemaining: number | null;
  endsToday: boolean;
  requestState: "idle" | "pending" | "success" | "error";
  onRequestAccess(): void;
}): unknown {
  const {
    placement = "composer",
    seatType,
    daysRemaining,
    endsToday,
    requestState,
    onRequestAccess,
  } = input;
  if (placement === "top") {
    const action = (children: unknown) =>
      jsx.jsx(shared.Yh, {
        className: "inline-flex align-baseline underline",
        color: "ghostMuted",
        size: "inline",
        onClick: onRequestAccess,
        disabled: requestState === "pending" || requestState === "success",
        children,
      });
    const content =
      requestState === "success"
        ? message(
            "codex.workspaceSeat.strip.success",
            "We’ll let you know when your admin responds. <requestAccess>Request sent</requestAccess>",
            { requestAccess: action },
          )
        : requestState === "pending"
          ? message(
              "codex.workspaceSeat.strip.pendingRequestAccess",
              "<requestAccess>Sending request…</requestAccess> to keep using ChatGPT after your trial.",
              { requestAccess: action },
            )
          : requestState === "error"
            ? message(
                "codex.workspaceSeat.strip.error",
                "<requestAccess>Request access</requestAccess> Could not send your request. Try again.",
                { requestAccess: action },
              )
            : message(
                "codex.workspaceSeat.strip.trialDescription",
                "<requestAccess>Request access</requestAccess> to keep using ChatGPT after your trial.",
                { requestAccess: action },
              );
    const title =
      seatType === "view_only"
        ? message("codex.workspaceSeat.strip.trialEnded", "Your trial ended.")
        : daysRemaining == null
          ? message("codex.workspaceSeat.strip.trialTitle", "Trial access")
          : daysRemaining === 1
            ? message(
                endsToday
                  ? "codex.workspaceSeat.strip.trialEndsToday"
                  : "codex.workspaceSeat.strip.trialEndsTomorrow",
                endsToday
                  ? "Your trial ends today."
                  : "Your trial ends tomorrow.",
              )
            : message(
                "codex.workspaceSeat.strip.trialCountdown",
                "{days, plural, one {# day left in your trial.} other {# days left in your trial.}}",
                { days: daysRemaining },
              );
    return jsx.jsx(initial.n7, {
      variant: "strip",
      role: "status",
      icon: jsx.jsx(shared.S_, { asset: shared.Wu, className: "shrink-0" }),
      title,
      content,
    });
  }
  const content =
    requestState === "error"
      ? message(
          "codex.viewOnlySeat.banner.error",
          "Could not send your request. Try again.",
        )
      : requestState === "success"
        ? message(
            "codex.viewOnlySeat.banner.awaitingApproval",
            "You can use ChatGPT again when your admin approves your request.",
          )
        : message(
            "codex.viewOnlySeat.banner.description",
            "You can still view your chats, but you can’t send new messages.",
          );
  const label =
    requestState === "success"
      ? "Request sent"
      : requestState === "pending"
        ? "Sending request…"
        : "Request access";
  return jsx.jsx("div", {
    className: "mb-3",
    children: jsx.jsx(initial.n7, {
      role: "status",
      icon: jsx.jsx(shared.S_, { asset: shared.Wu, className: "shrink-0" }),
      stackOnNarrow: true,
      title: message(
        "codex.viewOnlySeat.banner.trialEnded",
        "Your trial has ended",
      ),
      content,
      customCtas: jsx.jsx(shared.Yh, {
        color: "primary",
        size: "composer",
        onClick: onRequestAccess,
        disabled: requestState === "pending" || requestState === "success",
        loading: requestState === "pending",
        children: label,
      }),
    }),
  });
}
function SeatBanner({
  account,
  placement = "composer",
}: {
  account: SeatAccount;
  placement?: "composer" | "top";
}): unknown {
  const store = shared.LX(shared.ZI);
  const state = shared.BX(initial.t7, {
    accountId: account.accountId,
    userId: account.userId,
  });
  const requestState =
    account.pendingRequest || state.isSuccess
      ? "success"
      : state.isPending
        ? "pending"
        : state.isError
          ? "error"
          : "idle";
  const [now, setNow] = React.useState(() => Date.now());
  initial.Yit(
    () => setNow(Date.now()),
    account.seatType === "trial" ? 60_000 : null,
  );
  const expiresAt =
    account.trialExpiresAt == null
      ? Number.NaN
      : Date.parse(account.trialExpiresAt);
  const daysRemaining =
    Number.isFinite(expiresAt) && expiresAt > now
      ? Math.ceil((expiresAt - now) / 86_400_000)
      : null;
  const endsToday =
    Number.isFinite(expiresAt) &&
    new Date(expiresAt).toDateString() === new Date(now).toDateString();
  const onRequestAccess = () => {
    const mutation = store.get(initial.t7, {
      accountId: account.accountId,
      userId: account.userId,
    });
    if (!mutation.isPending && !mutation.isSuccess)
      void mutation.mutateAsync().catch(() => undefined);
  };
  const banner = renderSeatBanner({
    placement,
    seatType: account.seatType,
    daysRemaining,
    endsToday,
    requestState,
    onRequestAccess,
  });
  return placement === "top"
    ? jsx.jsx("div", {
        className: "shrink-0",
        "data-app-shell-main-banner": "workspace-seat",
        children: banner,
      })
    : banner;
}
export function ViewOnlySeatBanner(): unknown {
  const account = shared.HX<SeatAccount>(initial.e7);
  return account?.seatType === "view_only"
    ? jsx.jsx(SeatBanner, { account })
    : null;
}
export function WorkspaceSeatTopBanner(): unknown {
  const account = shared.HX<SeatAccount>(initial.e7);
  if (account == null) return null;
  if (
    account.seatType === "trial" &&
    !initial.afn("2009341345").get("enable_banner", false)
  )
    return null;
  return jsx.jsx(SeatBanner, { account, placement: "top" });
}
