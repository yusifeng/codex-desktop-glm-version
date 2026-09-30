// Subscription payment recovery announcements. Release chunk: announcement-1bd76f90c419.js.
import "@rchunk/rolldown-runtime";
import * as appSharedChunk from "@rchunk/app-shared";
import * as appInitialChunk from "@rchunk/app-initial";
import * as appPrimaryChunk from "@rchunk/app-primary";
import * as renewalStateChunk from "@rchunk/workspace-renewal-state";
import * as announcementSlotChunk from "@rchunk/home-announcement-slot";
import * as subscriptionQueriesChunk from "@rchunk/subscription-queries";
import * as recoveryEventsChunk from "@rchunk/subscription-recovery-events";

interface Candidate {
  content: unknown;
  isEligible: boolean;
  isLoading: boolean;
}
interface Props {
  entries?: Candidate[];
  renderSlot?(entries: Candidate[]): unknown;
  trackVisibility?: boolean;
}
interface Account {
  account_id: string;
  structure: string;
  role?: string;
  plan_type?: string;
}
interface SharedRuntime {
  I3(): { jsx(type: unknown, props: Record<string, unknown>): unknown };
  BX(query: unknown, input: unknown): { data?: unknown; isPending?: boolean };
  Y2: unknown;
  Yh: unknown;
  [key: string]: unknown;
}
interface InitialRuntime {
  uht(): Account | null;
  n7: unknown;
  O0(plan: string): { displayPlan?: string } | null;
  Hln(plan?: string): boolean;
  [key: string]: unknown;
}
const shared = appSharedChunk as unknown as SharedRuntime;
const initial = appInitialChunk as unknown as InitialRuntime;
const primary = appPrimaryChunk as Record<string, unknown>;
const renewal = renewalStateChunk as Record<string, unknown>;
const slot = announcementSlotChunk as Record<string, unknown>;
const queries = subscriptionQueriesChunk as Record<string, unknown>;
const events = recoveryEventsChunk as Record<string, unknown>;
const jsx = shared.I3();
const loadRecoveryDialog = () => import("@rchunk/subscription-recovery-dialog");
function renderEntries(props: Props, candidate: Candidate): unknown {
  const entries = [candidate, ...(props.entries ?? [])];
  if (props.renderSlot) return props.renderSlot(entries);
  const Slot = (slot.t ?? slot.default) as unknown;
  return jsx.jsx(Slot, { entries, trackVisibility: props.trackVisibility });
}
function WorkspaceAnnouncement(props: Props, account: Account): unknown {
  void primary;
  const result = shared.BX(renewal.r, account.account_id);
  const candidate: Candidate = {
    isLoading: Boolean(result.isPending),
    isEligible:
      account.role === "account-owner" &&
      initial.Hln(account.plan_type) &&
      result.data != null,
    content: jsx.jsx(initial.n7, {
      variant: "warning",
      title: jsx.jsx(shared.Y2, {
        id: "subscription.paymentRecovery.workspace.title",
        defaultMessage: "Update your payment method",
      }),
      content: jsx.jsx(shared.Y2, {
        id: "subscription.paymentRecovery.workspace.description",
        defaultMessage:
          "Your workspace subscription needs a valid payment method.",
      }),
    }),
  };
  return renderEntries(props, candidate);
}
function PersonalAnnouncement(props: Props, account: Account): unknown {
  const subscription = shared.BX(queries.n, account.account_id);
  const assignment = shared.BX(queries.r, account.account_id);
  const data = subscription.data as
    | {
        plan_type?: string;
        payment_processor?: string;
        is_delinquent?: boolean;
        grace_period_end?: string;
      }
    | undefined;
  const grace =
    data?.grace_period_end == null
      ? Number.NaN
      : Date.parse(data.grace_period_end);
  const eligible =
    data?.payment_processor === "stripe" &&
    data.is_delinquent === true &&
    Number.isFinite(grace) &&
    grace > Date.now() &&
    (assignment.data as { recovery_surface?: string } | undefined)
      ?.recovery_surface === "payment_recovery_banner";
  const planName = initial.O0(data?.plan_type ?? "pro")?.displayPlan ?? "pro";
  const open = async () => {
    const module = await loadRecoveryDialog();
    const log = events.n;
    if (typeof log === "function")
      (log as (event: string) => void)("payment_recovery_banner_clicked");
    return module.RecoveryDialog({
      accountId: account.account_id,
      planName,
      onClose() {},
      onComplete() {},
    });
  };
  const candidate: Candidate = {
    isLoading: Boolean(subscription.isPending || assignment.isPending),
    isEligible: eligible,
    content: jsx.jsx(initial.n7, {
      variant: "warning",
      title: jsx.jsx(shared.Y2, {
        id: "subscription.paymentRecovery.personal.title",
        defaultMessage: `Review your ${planName} payment`,
      }),
      content: jsx.jsx(shared.Yh, {
        onClick: open,
        children: "Review payment",
      }),
    }),
  };
  return renderEntries(props, candidate);
}
export function SubscriptionPaymentAnnouncement(props: Props): unknown {
  const account = initial.uht();
  if (account == null)
    return props.renderSlot ? props.renderSlot(props.entries ?? []) : null;
  return account.structure === "personal"
    ? PersonalAnnouncement(props, account)
    : WorkspaceAnnouncement(props, account);
}
