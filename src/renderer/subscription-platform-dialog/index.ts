import { I3 as getJsxRuntime, type JsxRuntime } from "@rchunk/app-shared";
import "@rchunk/app-initial";
import "@rchunk/subscription-plan-status";

export type SubscriptionManagementSource = "app_store" | "google_play_store" | "partner_managed";
export interface SubscriptionPlatformDialogProps { account: { account: { plan_type?: string | null } }; managementSource: SubscriptionManagementSource; showProLevels?: boolean; onClose(): void; onOpenStore?(url: string): void; }
let jsx: JsxRuntime;
function ensureJsx(): JsxRuntime { if (jsx == null) jsx = getJsxRuntime(); return jsx; }
function SubscriptionPlatformDialog(props: SubscriptionPlatformDialogProps): unknown {
  const runtime=ensureJsx(), partner=props.managementSource==="partner_managed", apple=props.managementSource==="app_store";
  const title=apple?"Manage your plan in the App Store":props.managementSource==="google_play_store"?"Manage your plan on Google Play":"Plan managed by an external partner";
  const provider=apple?"App Store":props.managementSource==="google_play_store"?"Google Play Store":"External partner";
  const url=apple?"https://apps.apple.com/account/subscriptions":"https://play.google.com/store/account/subscriptions";
  return runtime.jsxs("dialog",{open:true,className:"subscription-platform-dialog",children:[runtime.jsx("h1",{children:title}),runtime.jsx("p",{children:partner?"This plan can’t be managed on the web. Contact the partner you subscribed through to make changes.":`You signed up through ${provider}. Open ${provider} to make changes.`}),runtime.jsxs("dl",{children:[runtime.jsxs("div",{children:[runtime.jsx("dt",{children:"Your plan"}),runtime.jsx("dd",{"data-show-pro-levels":props.showProLevels??false,children:props.account.account.plan_type??"free"})]}),runtime.jsxs("div",{children:[runtime.jsx("dt",{children:partner?"Managed by":"Signed up through"}),runtime.jsx("dd",{children:provider})]})]}),runtime.jsxs("footer",{children:[runtime.jsx("button",{type:"button",onClick:props.onClose,children:"Close"}),partner?null:runtime.jsx("button",{type:"button",onClick:()=>props.onOpenStore?.(url),children:apple?"Open App Store":"Open Google Play"})]})]});
}
export { SubscriptionPlatformDialog };
