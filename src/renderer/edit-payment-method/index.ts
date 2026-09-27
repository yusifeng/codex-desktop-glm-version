import "@rchunk/rolldown-runtime";
import { I3 as getJsxRuntime, type JsxRuntime } from "@rchunk/app-shared";
import "@rchunk/app-initial";
import "@rchunk/billing-form-options";
import "@rchunk/billing-queries";
import "@rchunk/checkout-error";
import "@rchunk/stripe-client";

interface EditablePaymentMethod {
  billing_details?: { address?: Record<string, unknown>; name?: string | null };
  card?: { brand?: string; exp_month?: number; exp_year?: number; last4?: string };
  id: string;
}

interface EditPaymentMethodProps {
  accountId: string;
  error?: string | null;
  isLoading?: boolean;
  isSubmitting?: boolean;
  method?: EditablePaymentMethod | null;
  methodId: string;
  now?: Date;
  onClose(): void;
  onCloseAutoFocus?(): void;
  onRetry?(): void;
  onSave?(input: { accountId: string; billingName: string; expMonth: number; expYear: number; methodId: string }): Promise<void> | void;
}

let runtime: JsxRuntime | undefined;
function jsx(): JsxRuntime { runtime ??= getJsxRuntime(); return runtime; }
function isValidExpiration(month: number, year: number, now = new Date()): boolean { return Number.isInteger(month) && month >= 1 && month <= 12 && Number.isInteger(year) && year >= 2000 && (year > now.getFullYear() || (year === now.getFullYear() && month >= now.getMonth() + 1)); }

function EditPaymentMethodDialog(props: EditPaymentMethodProps): unknown {
  const { accountId, error, isLoading = false, isSubmitting = false, method, methodId, now = new Date(), onClose, onRetry, onSave } = props;
  const submit = async (event: { currentTarget?: { elements?: Record<string, { value?: string }> }; preventDefault(): void }) => {
    event.preventDefault();
    if (isSubmitting || method == null) return;
    const elements = event.currentTarget?.elements;
    const expMonth = Number(elements?.expMonth?.value ?? method.card?.exp_month);
    const expYear = Number(elements?.expYear?.value ?? method.card?.exp_year);
    const billingName = elements?.billingName?.value?.trim() ?? method.billing_details?.name?.trim() ?? "";
    if (!isValidExpiration(expMonth, expYear, now) || billingName.length === 0) return;
    await onSave?.({ accountId, methodId, billingName, expMonth, expYear });
    onClose();
  };
  const close = () => { if (!isSubmitting) onClose(); };
  let content: unknown;
  if (isLoading) content = jsx().jsx("div", { role: "status", children: "Loading payment method…" });
  else if (error != null || method == null) content = jsx().jsxs("div", { role: "alert", children: [jsx().jsx("p", { children: error ?? "Payment method unavailable" }), jsx().jsx("button", { type: "button", onClick: onRetry, children: "Retry" })] });
  else content = jsx().jsxs("form", { onSubmit: submit, children: [
    jsx().jsx("p", { children: `${method.card?.brand ?? "Card"} •••• ${method.card?.last4 ?? ""}`.trim() }),
    jsx().jsx("label", { children: "Expiration month" }),
    jsx().jsx("input", { name: "expMonth", inputMode: "numeric", defaultValue: String(method.card?.exp_month ?? ""), required: true }),
    jsx().jsx("label", { children: "Expiration year" }),
    jsx().jsx("input", { name: "expYear", inputMode: "numeric", defaultValue: String(method.card?.exp_year ?? ""), required: true }),
    jsx().jsx("label", { children: "Billing name" }),
    jsx().jsx("input", { name: "billingName", defaultValue: method.billing_details?.name ?? "", required: true }),
    jsx().jsx("button", { type: "submit", disabled: isSubmitting, children: isSubmitting ? "Saving…" : "Save" }),
  ] });
  return jsx().jsxs("section", { role: "dialog", "aria-modal": true, "aria-label": "Edit payment method", children: [
    jsx().jsx("h2", { children: "Edit payment method" }),
    content,
    jsx().jsx("button", { type: "button", disabled: isSubmitting, onClick: close, children: "Close" }),
  ] });
}

function initialize(): void {}
export { initialize as n, EditPaymentMethodDialog as t };
