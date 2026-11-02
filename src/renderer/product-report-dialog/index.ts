import "@rchunk/rolldown-runtime";
import "@rchunk/app-initial";
import "@rchunk/report-dialog-core";
import { I3 as getJsxRuntime, e6 as ReactRuntime, type JsxRuntime } from "@rchunk/app-shared";
interface Seller { key: string; name: string; shopId?: string; url: string }
interface Product { id?: string | null; offers?: Array<{ seller?: Seller; url?: string }>; sellers?: Seller[]; title: string; url?: string | null }
interface ReportReason { id: string; label: string }
interface ProductReportDialogProps { initialTarget?: "issue" | "product-report" | "seller-report"; onClose(): void; onSubmit?(report: { details: string; product: Product; reason: ReportReason; seller?: Seller }): Promise<void> | void; product: Product; reasons?: ReportReason[] }
let runtime: JsxRuntime | undefined;
function jsx(): JsxRuntime { runtime ??= getJsxRuntime(); return runtime; }
function ProductReportDialog({ initialTarget = "issue", onClose, onSubmit, product, reasons = [{ id: "scam", label: "Scam, fraud, or suspicious activity" }, { id: "order", label: "Problem with an order or service" }, { id: "other", label: "Something else" }] }: ProductReportDialogProps): unknown {
  const [target, setTarget] = ReactRuntime.useState(initialTarget);
  const seller = product.sellers?.[0] ?? product.offers?.find(offer => offer.seller != null)?.seller;
  const [reason, setReason] = ReactRuntime.useState<ReportReason | undefined>(undefined);
  const [details, setDetails] = ReactRuntime.useState("");
  const [pending, setPending] = ReactRuntime.useState(false);
  const [submitted, setSubmitted] = ReactRuntime.useState(false);
  const [error, setError] = ReactRuntime.useState(false);
  const title = target === "product-report" ? `Report ${product.title.length <= 30 ? product.title : `${product.title.slice(0, 27)}…`}` : target === "seller-report" && seller != null ? `Report ${seller.name}` : "Report";
  const submit = async (event: { preventDefault(): void }) => { event.preventDefault(); if (reason == null || pending) return; setPending(true); setError(false); try { await onSubmit?.({ product, reason, details: details.trim(), seller: target === "seller-report" ? seller : undefined }); setSubmitted(true); } catch { setError(true); } finally { setPending(false); } };
  return jsx().jsxs("dialog", { open: true, "aria-busy": pending, children: [jsx().jsxs("header", { children: [jsx().jsx("h2", { children: title }), jsx().jsx("button", { type: "button", "aria-label": "Close", disabled: pending, onClick: onClose, children: "Close" })] }), submitted ? jsx().jsxs("section", { children: [jsx().jsx("h3", { children: "Thanks for reporting" }), jsx().jsx("p", { children: "Our team will review the content to determine if it violates our policies." }), jsx().jsx("button", { type: "button", onClick: onClose, children: "Done" })] }) : target === "issue" ? jsx().jsxs("section", { children: [jsx().jsx("p", { children: "What would you like to report?" }), jsx().jsx("button", { type: "button", onClick: () => setTarget("product-report"), children: "Report product" }), seller == null ? null : jsx().jsx("button", { type: "button", onClick: () => setTarget("seller-report"), children: "Report seller" })] }) : jsx().jsxs("form", { onSubmit: submit, children: [jsx().jsx("p", { children: "Please tell us why you are reporting" }), jsx().jsx("select", { "aria-label": "Report reason", value: reason?.id ?? "", disabled: pending, onChange: (event: { currentTarget: { value: string } }) => setReason(reasons.find(item => item.id === event.currentTarget.value)), children: [jsx().jsx("option", { value: "", disabled: true, children: "Choose a reason" }), ...reasons.map(item => jsx().jsx("option", { value: item.id, children: item.label }, item.id))] }), jsx().jsx("textarea", { "aria-label": "Additional details", value: details, disabled: pending, onChange: (event: { currentTarget: { value: string } }) => setDetails(event.currentTarget.value) }), error ? jsx().jsx("p", { role: "alert", children: "Couldn’t submit this report. Try again." }) : null, jsx().jsx("button", { type: "button", disabled: pending, onClick: () => { setTarget("issue"); setError(false); }, children: "Back" }), jsx().jsx("button", { type: "submit", disabled: pending || reason == null, children: pending ? "Submitting…" : "Submit report" })] })] });
}
export { ProductReportDialog, type ProductReportDialogProps };
