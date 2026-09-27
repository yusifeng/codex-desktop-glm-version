import "@rchunk/rolldown-runtime";
import { I3 as getJsxRuntime, type JsxRuntime } from "@rchunk/app-shared";
import "@rchunk/app-initial";
import "@rchunk/app-primary";

interface UsageBannerProps { canShowUsageBanners?: boolean; imageGenerationLimit?: boolean; modelName?: string; resetAt?: string | number | Date | null; showModelLimit?: boolean; showWorkspaceUsageLimit?: boolean; showUpsell?: boolean; onDismissImageGenerationLimit?(): void }
let runtime: JsxRuntime | undefined;
function jsx(): JsxRuntime { runtime ??= getJsxRuntime(); return runtime; }
function UsageBanner(props: UsageBannerProps): unknown {
  if (props.canShowUsageBanners === false) return null;
  const kind = props.showUpsell || props.showWorkspaceUsageLimit ? "blocking-limit" : props.imageGenerationLimit ? "image-generation-limit" : props.showModelLimit ? "model-limit" : "warning";
  const message = kind === "blocking-limit" ? "You've reached your usage limit" : kind === "image-generation-limit" ? "Image generation limit reached" : kind === "model-limit" ? `${props.modelName ?? "This model"} limit reached` : "You're approaching your usage limit";
  return jsx().jsxs("aside", { role: "status", "data-usage-banner": kind, children: [jsx().jsx("strong", { children: message }), props.resetAt == null ? null : jsx().jsx("span", { children: ` Resets ${new Date(props.resetAt).toLocaleString()}` }), kind === "image-generation-limit" ? jsx().jsx("button", { type: "button", onClick: props.onDismissImageGenerationLimit, children: "Dismiss" }) : null] });
}
function initializeUsageBanner(): void { void jsx(); }
export { UsageBanner as n, initializeUsageBanner as t };
