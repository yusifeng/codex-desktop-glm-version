import "@rchunk/rolldown-runtime";
import { I3 as getJsxRuntime } from "@rchunk/app-shared";
import "@rchunk/diff-comment-card";
const jsx = getJsxRuntime();
interface ReviewRowProps { authorAvatar?: unknown; children?: unknown; disabled?: boolean; loading?: boolean; layout?: "inline" | "card"; showSubmit?: boolean; submitLabel?: string; submitType?: "button" | "submit"; onSubmit?(): void }
function ReviewRow({ authorAvatar, children, disabled, loading = false, layout = "inline", showSubmit = true, submitLabel, submitType = "button", onSubmit }: ReviewRowProps): unknown { const action = showSubmit ? jsx.jsx("button", { type: submitType, "aria-label": submitLabel, disabled, "aria-busy": loading, onClick: onSubmit, children: loading ? null : "Send" }) : jsx.jsx("span", { "aria-hidden": true }); if (layout === "card") return jsx.jsxs("article", { children: [children, action] }); return jsx.jsxs("div", { className: "review-row", children: [authorAvatar ? jsx.jsx("div", { children: authorAvatar }) : null, jsx.jsx("div", { children }), action] }); }
function initializeReviewRow(): void {}
export { initializeReviewRow as n, ReviewRow as t };
