// ChatGPT header upgrade action. Release chunk: chatgpt-header-upgrade-b1c003dededb.js.
import "@rchunk/rolldown-runtime";
import * as appSharedChunk from "@rchunk/app-shared";
import * as appInitialChunk from "@rchunk/app-initial";

interface Props {
  conversationId?: string | null;
  isHomepage: boolean;
  bannerInfo?: { accountId?: string; action?: string } | null;
  inlineBannerInfo?: { accountId?: string; action?: string } | null;
}
interface Account {
  account_id: string;
  plan_type?: string;
}
interface SharedRuntime {
  I3(): {
    jsx(type: unknown, props: Record<string, unknown>): unknown;
    jsxs(type: unknown, props: Record<string, unknown>): unknown;
  };
  LX(scope: unknown): unknown;
  ZI: unknown;
  Yh: unknown;
  Nb: unknown;
  tC: unknown;
  [key: string]: unknown;
}
interface InitialRuntime {
  N6t(): string;
  he(input?: unknown, options?: unknown): { data?: Account };
  V(): Account[];
  f7: { HeaderAction: unknown };
  U(): (input: Record<string, unknown>) => void;
  O0(plan?: string): { pricePlan?: unknown } | null;
  le(id: string): boolean;
  [key: string]: unknown;
}
const shared = appSharedChunk as unknown as SharedRuntime;
const initial = appInitialChunk as unknown as InitialRuntime;
const jsx = shared.I3();
function actionRequestsUpgrade(info: Props["bannerInfo"]): boolean {
  return (
    info?.action == null ||
    info.action === "upgrade" ||
    info.action === "open_upgrade"
  );
}
export function ChatGptHeaderUpgrade(props: Props): unknown {
  const authMethod = initial.N6t();
  const current = initial.he(undefined, { preview: false }).data;
  const accounts = initial.V();
  if (
    !initial.le("3656984380") ||
    current == null ||
    !actionRequestsUpgrade(props.bannerInfo) ||
    !actionRequestsUpgrade(props.inlineBannerInfo)
  )
    return null;
  const requestedAccount =
    props.bannerInfo?.accountId ?? props.inlineBannerInfo?.accountId;
  if (requestedAccount != null && requestedAccount !== current.account_id)
    return null;
  const store = shared.LX(shared.ZI);
  const openUpgrade = initial.U();
  const targetPlan = "pro";
  const specialOffer = false;
  const label = specialOffer ? "Claim offer" : "Upgrade";
  const onClick = () =>
    openUpgrade({
      scope: store,
      currentPlan: initial.O0(current.plan_type)?.pricePlan ?? null,
      event: "chatgpt_header_upgrade_clicked",
      source: "chatgpt_header_upgrade",
      chatGptContext: {
        openModalLocation: props.isHomepage
          ? "homepage_header"
          : "conversation_header",
        promoCampaignId: null,
        targetPlan,
      },
      authMethod,
      accounts,
      conversationId: props.conversationId,
    });
  const button = jsx.jsx(shared.Yh, {
    color: "ghost",
    size: "small",
    onClick,
    children: jsx.jsxs("span", {
      children: [jsx.jsx(specialOffer ? shared.Nb : shared.tC, {}), label],
    }),
  });
  return jsx.jsx(initial.f7.HeaderAction, {
    actionId: "chatgpt-header-upgrade",
    order: 30,
    children: button,
  });
}
