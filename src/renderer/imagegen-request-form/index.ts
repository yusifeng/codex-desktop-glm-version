import * as RuntimeChunk from "@rchunk/rolldown-runtime";
import * as SharedChunk from "@rchunk/app-shared";
import * as InitialChunk from "@rchunk/app-initial";
import * as PrimaryChunk from "@rchunk/app-primary";
import * as RecentUploadsChunk from "@rchunk/recent-uploads";

interface JsxRuntime { jsx(type: unknown, props: Record<string, unknown>): unknown; jsxs(type: unknown, props: Record<string, unknown>): unknown }
interface Question { id?: string; inputKind?: "free_text" | "text" | "upload" | "visual"; options?: readonly { id?: string; label?: string }[]; prompt?: string; type?: "free_text" | "multi_select" | "single_select" }
interface RequestModel { messageId: string; questions: readonly Question[] }
interface Answer { customText: string; files: readonly unknown[]; selectedOptions: readonly string[] }
interface Props { request: RequestModel; conversationId: string; fileUploadLimitsQueryKey?: readonly unknown[]; isTemporaryChat?: boolean; uploadDisabled?: boolean; onSubmit(answers: readonly Answer[]): Promise<unknown> | unknown; onDismiss?(): void }

const jsx = (SharedChunk as unknown as { I3(): JsxRuntime }).I3();
void RuntimeChunk; void InitialChunk; void PrimaryChunk; void RecentUploadsChunk;
async function loadUploadReminder(): Promise<unknown> { return import("@rchunk/chatgpt-image-upload-reminder-dialog-entry"); }
async function loadLibraryPicker(): Promise<unknown> { return import("@rchunk/library-file-picker-dialog"); }
function blankAnswer(): Answer { return { customText: "", files: [], selectedOptions: [] }; }

function ImagegenRequestForm({ request, conversationId, uploadDisabled = false, onSubmit, onDismiss }: Props): unknown {
  const answers = request.questions.map(blankAnswer);
  const submit = async (event?: { preventDefault(): void }): Promise<void> => { event?.preventDefault(); await onSubmit(answers); };
  const questions = request.questions.map((question, index) => jsx.jsxs("fieldset", { "data-input-kind": question.inputKind ?? question.type ?? "text", children: [jsx.jsx("legend", { children: question.prompt ?? `Question ${index + 1}` }), jsx.jsx("input", { disabled: uploadDisabled, name: question.id ?? String(index), onChange: (event: { target?: { value?: string } }) => { answers[index] = { ...answers[index], customText: event.target?.value ?? "" }; } })] }));
  return jsx.jsxs("form", { "data-conversation-id": conversationId, "data-message-id": request.messageId, onSubmit: submit, children: [questions, jsx.jsx("button", { type: "submit", children: "Submit" }), onDismiss == null ? null : jsx.jsx("button", { type: "button", onClick: onDismiss, children: "Dismiss" }), jsx.jsx("span", { hidden: true, loadUploadReminder, loadLibraryPicker })] });
}

export { ImagegenRequestForm };
