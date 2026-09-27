import "@rchunk/rolldown-runtime";
import "@rchunk/app-initial";
import "@rchunk/text-file-editor-tab-content";
import "@rchunk/compact-empty-state";
import "@rchunk/review-file-tree-side-pane";
import { I3 as getJsxRuntime, type JsxRuntime } from "@rchunk/app-shared";
import { t as ReviewFileSource, type ReviewFileSourceProps } from "@rchunk/review-file-source-item";

interface EditableProps extends Omit<ReviewFileSourceProps, "onOpenLocation" | "onSelectFile"> { environmentId?: string | null; onOpenLocation?(scope: unknown, location: unknown): void; onSelectFile?(scope: unknown, path: string, options?: { preview?: boolean }): void; refresh?(): void; scope?: unknown; tabId?: string }
let runtime: JsxRuntime | undefined;
function jsx(): JsxRuntime { runtime ??= getJsxRuntime(); return runtime; }
function EditableReviewFileSourceTabContent({ environmentId, onOpenLocation, onSelectFile, refresh, scope, ...props }: EditableProps): unknown { if (environmentId == null && props.workspaceRoot == null && props.cwd == null) return jsx().jsxs("section", { children: [jsx().jsx("h2", { children: "Files unavailable" }), jsx().jsx("p", { children: "Files will be available when the task has an environment" }), refresh == null ? null : jsx().jsx("button", { type: "button", onClick: refresh, children: "Refresh" })] }); return jsx().jsx(ReviewFileSource, { ...props, onOpenLocation: location => onOpenLocation?.(scope, location), onSelectFile: (path, options) => onSelectFile?.(scope, path, options), headerActions: refresh == null ? props.headerActions : jsx().jsx("button", { type: "button", onClick: refresh, children: "Refresh" }) }); }
export { EditableReviewFileSourceTabContent };
