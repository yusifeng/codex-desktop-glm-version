import "@rchunk/rolldown-runtime";
import { I3 as getJsxRuntime, type JsxRuntime } from "@rchunk/app-shared";

interface DialogProps { children?: unknown; footer?: unknown; onClose(): void; pending?: boolean; title: unknown }
interface AdBrand { favicon_url?: string; name: string; url?: string }
interface AdUnit { adDataToken: string; advertiser_brand?: AdBrand; displayName?: string }
interface SelectAdStepProps { ads: AdUnit[]; onAdvance(): void; onClose(): void; primitives: Record<string, (props: Record<string, unknown>) => unknown>; selectedAdToken?: string; setSelectedAdToken(value: string): void; title: unknown }

let runtime: JsxRuntime | undefined;
function jsx(): JsxRuntime { runtime ??= getJsxRuntime(); return runtime; }
function initialize(): void {}
function getHost(url: string): string | null { try { return new URL(url).host; } catch { return null; } }
function advertiserBrands(content: { type: string; advertiser_brand?: AdBrand; ads?: Array<{ advertiser_brand: AdBrand }> }): AdBrand[] { return content.type === "multi_advertiser_ad_unit" ? (content.ads ?? []).map(item => item.advertiser_brand) : content.advertiser_brand == null ? [] : [content.advertiser_brand]; }
function customFeedbackLabels(formatter: { formatMessage(message: { defaultMessage: string; id: string }): string }): { sendLabel: string; title: string } { return { title: formatter.formatMessage({ id: "bazaar.customFeedbackModal.title", defaultMessage: "Share feedback on this ad" }), sendLabel: formatter.formatMessage({ id: "bazaar.customFeedbackModal.send", defaultMessage: "Send" }) }; }
function normalizeReason(value: string): string { return value.trim(); }
function isActionAllowed(value: unknown): boolean { return value != null; }
function noOperation(): void {}
function ControlDialog({ children, footer, onClose, pending = false, title }: DialogProps): unknown { return jsx().jsxs("dialog", { open: true, children: [jsx().jsx("h2", { children: title }), jsx().jsx("section", { children }), jsx().jsx("footer", { children: footer }), jsx().jsx("button", { type: "button", disabled: pending, "aria-label": "Close", onClick: onClose, children: "Close" })] }); }
function ActionUnavailable(): unknown { return jsx().jsx("p", { role: "alert", children: "We couldn’t complete this action. Please try again later" }); }
function LoadingState(): unknown { return jsx().jsx("p", { role: "status", children: "Loading…" }); }
function SelectAdStep({ ads, onAdvance, onClose, selectedAdToken, setSelectedAdToken, title }: SelectAdStepProps): Record<string, unknown> { return { title, body: jsx().jsx("div", { children: ads.map((ad, index) => jsx().jsx("button", { type: "button", onClick: () => setSelectedAdToken(ad.adDataToken), children: ad.displayName || `Ad ${index + 1}` }, ad.adDataToken)) }), primaryButton: jsx().jsx("button", { type: "button", disabled: !selectedAdToken, onClick: onAdvance, children: "Next" }), secondaryButton: jsx().jsx("button", { type: "button", onClick: onClose, children: "Cancel" }) }; }
function AboutAdTitle({ personalizationUnavailable, title }: { personalizationUnavailable?: boolean; title?: unknown }): unknown { return jsx().jsx("span", { children: personalizationUnavailable ? "About this ad" : (title ?? "About this ad") }); }
function GoAdFreeLabel(): unknown { return "Go ad-free"; }
function preventDefault(event: { preventDefault(): void }): void { event.preventDefault(); }
const controlDialogStyles: Record<string, string> = {};

export {
  advertiserBrands as A,
  customFeedbackLabels as C,
  initialize as D,
  getHost as E,
  AboutAdTitle as O,
  isActionAllowed as S,
  normalizeReason as T,
  noOperation as _,
  initialize as a,
  preventDefault as b,
  SelectAdStep as c,
  initialize as d,
  initialize as f,
  noOperation as g,
  noOperation as h,
  initialize as i,
  noOperation as j,
  noOperation as k,
  initialize as l,
  noOperation as m,
  ActionUnavailable as n,
  controlDialogStyles as o,
  noOperation as p,
  LoadingState as r,
  initialize as s,
  ControlDialog as t,
  noOperation as u,
  noOperation as v,
  noOperation as w,
  noOperation as x,
  GoAdFreeLabel as y,
};
