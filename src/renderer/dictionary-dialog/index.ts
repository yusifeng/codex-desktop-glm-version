import "@rchunk/rolldown-runtime";
import "@rchunk/app-initial";
import { I3 as getJsxRuntime, type JsxRuntime } from "@rchunk/app-shared";

interface DictionaryWord { id: string; text: string }
interface DictionaryDialogProps {
  accountId: string;
  error?: string | null;
  isLoading?: boolean;
  maxWords?: number;
  onAdd?(text: string): Promise<void> | void;
  onClose(): void;
  onDelete?(word: DictionaryWord): Promise<void> | void;
  onImport?(words: string[]): Promise<void> | void;
  onRetry?(): void;
  userId: string;
  words?: DictionaryWord[];
}
let runtime: JsxRuntime | undefined;
function jsx(): JsxRuntime { runtime ??= getJsxRuntime(); return runtime; }
function DictionaryDialog({ error, isLoading = false, maxWords = 200, onAdd, onClose, onDelete, onImport, onRetry, words = [] }: DictionaryDialogProps): unknown {
  let value = "", importing = false;
  const atLimit = words.length >= Math.min(maxWords, 200);
  return jsx().jsxs("dialog", { open: true, children: [
    jsx().jsxs("header", { children: [jsx().jsx("h2", { children: "Dictionary" }), jsx().jsx("button", { type: "button", "aria-label": "Close dictionary", onClick: onClose, children: "Close" })] }),
    jsx().jsx("p", { children: `${words.length} of ${Math.min(maxWords, 200)} words` }),
    isLoading ? jsx().jsx("p", { role: "status", children: "Loading dictionary" }) : error != null ? jsx().jsxs("div", { role: "alert", children: [error, jsx().jsx("button", { type: "button", onClick: onRetry, children: "Try again" })] }) : jsx().jsx("ul", { children: words.map(word => jsx().jsxs("li", { children: [word.text, jsx().jsx("button", { type: "button", "aria-label": `Delete ${word.text}`, onClick: () => void onDelete?.(word), children: "Delete" })] }, word.id)) }),
    jsx().jsxs("form", { onSubmit: (event: { preventDefault(): void }) => { event.preventDefault(); const text = value.trim(); if (text.length > 0 && !atLimit) void onAdd?.(text); }, children: [jsx().jsx("input", { name: "word", disabled: atLimit, placeholder: "Add a word", onChange: (event: { currentTarget: { value: string } }) => { value = event.currentTarget.value; } }), jsx().jsx("button", { type: "submit", disabled: atLimit, children: "Add" })] }),
    jsx().jsxs("section", { children: [jsx().jsx("textarea", { "aria-label": "Import words", disabled: atLimit, onChange: (event: { currentTarget: { value: string } }) => { value = event.currentTarget.value; importing = true; } }), jsx().jsx("button", { type: "button", disabled: atLimit, onClick: () => { if (importing) void onImport?.(value.split(/[\n,]/).map(word => word.trim()).filter(Boolean)); }, children: "Import" })] }),
    atLimit ? jsx().jsx("p", { role: "alert", children: "Dictionary limit reached" }) : null,
  ] });
}
export { DictionaryDialog, type DictionaryDialogProps, type DictionaryWord };
