import "@rchunk/rolldown-runtime";
import { I3 as getJsxRuntime, type JsxRuntime } from "@rchunk/app-shared";
import "@rchunk/app-initial";
import "@rchunk/billing-form-options";
import "@rchunk/billing-queries";
import "@rchunk/checkout-error";
import "@rchunk/stripe-client";
import "@rchunk/account-action-integrity";

interface NewPaymentMethod {
  billingDetails?: Record<string, unknown>;
  paymentMethodId?: string;
  token?: string;
}

interface AddPaymentMethodProps {
  accountId: string;
  error?: string | null;
  isLoading?: boolean;
  isSubmitting?: boolean;
  onClose(): void;
  onCloseAutoFocus?(): void;
  onRetry?(): void;
  onSubmit?(input: { accountId: string; billingName: string; cardComplete: boolean }): Promise<NewPaymentMethod | void> | NewPaymentMethod | void;
  onSuccess?(method?: NewPaymentMethod): void;
}

let runtime: JsxRuntime | undefined;
function jsx(): JsxRuntime { runtime ??= getJsxRuntime(); return runtime; }

function AddPaymentMethodDialog(props: AddPaymentMethodProps): unknown {
  const { accountId, error, isLoading = false, isSubmitting = false, onClose, onRetry, onSubmit, onSuccess } = props;
  const submit = async (event: { currentTarget?: { elements?: Record<string, { checked?: boolean; value?: string }> }; preventDefault(): void }) => {
    event.preventDefault();
    if (isSubmitting) return;
    const elements = event.currentTarget?.elements;
    const cardComplete = elements?.cardComplete?.checked === true;
    const billingName = elements?.billingName?.value?.trim() ?? "";
    if (!cardComplete || billingName.length === 0) return;
    const method = await onSubmit?.({ accountId, billingName, cardComplete });
    if (typeof method === "object" && method != null) onSuccess?.(method);
    else onSuccess?.();
  };
  const close = () => { if (!isSubmitting) onClose(); };
  let content: unknown;
  if (isLoading) content = jsx().jsx("div", { role: "status", children: "Preparing secure payment form…" });
  else if (error != null) content = jsx().jsxs("div", { role: "alert", children: [jsx().jsx("p", { children: error }), jsx().jsx("button", { type: "button", onClick: onRetry, children: "Retry" })] });
  else content = jsx().jsxs("form", { onSubmit: submit, children: [
    jsx().jsx("label", { children: "Name on card" }),
    jsx().jsx("input", { name: "billingName", autoComplete: "cc-name", required: true }),
    jsx().jsx("label", { children: "Card details" }),
    jsx().jsx("input", { name: "cardComplete", type: "checkbox", "aria-label": "Card details complete" }),
    jsx().jsx("p", { children: "Your payment information is encrypted and securely processed." }),
    jsx().jsx("button", { type: "submit", disabled: isSubmitting, children: isSubmitting ? "Saving…" : "Continue" }),
  ] });
  return jsx().jsxs("section", { role: "dialog", "aria-modal": true, "aria-label": "Add payment method", children: [
    jsx().jsx("h2", { children: "Add payment method" }),
    content,
    jsx().jsx("button", { type: "button", disabled: isSubmitting, onClick: close, children: "Close" }),
  ] });
}

function initialize(): void {}
export { initialize as n, AddPaymentMethodDialog as t };
