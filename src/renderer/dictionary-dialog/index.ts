import "@rchunk/rolldown-runtime";
import "@rchunk/app-initial";
import { I3 as getJsxRuntime, e6 as ReactRuntime, type JsxRuntime } from "@rchunk/app-shared";

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
  const [word, setWord] = ReactRuntime.useState("");
  const [importValue, setImportValue] = ReactRuntime.useState("");
  const [pending, setPending] = ReactRuntime.useState<"add" | "import" | null>(null);
  const [mutationError, setMutationError] = ReactRuntime.useState(false);
  const atLimit = words.length >= Math.min(maxWords, 200);
  const add = async (event: { preventDefault(): void }) => { event.preventDefault(); const text = word.trim(); if (pending != null || text.length === 0 || atLimit) return; setPending("add"); setMutationError(false); try { await onAdd?.(text); setWord(""); } catch { setMutationError(true); } finally { setPending(null); } };
  const importWords = async () => { const next = importValue.split(/[\n,]/).map(value => value.trim()).filter(Boolean); if (pending != null || next.length === 0 || atLimit) return; setPending("import"); setMutationError(false); try { await onImport?.(next); setImportValue(""); } catch { setMutationError(true); } finally { setPending(null); } };
  return jsx().jsxs("dialog", { open: true, "aria-busy": pending != null, children: [
    jsx().jsxs("header", { children: [jsx().jsx("h2", { children: "Dictionary" }), jsx().jsx("button", { type: "button", "aria-label": "Close dictionary", onClick: onClose, children: "Close" })] }),
    jsx().jsx("p", { children: `${words.length} of ${Math.min(maxWords, 200)} words` }),
    isLoading ? jsx().jsx("p", { role: "status", children: "Loading dictionary" }) : error != null ? jsx().jsxs("div", { role: "alert", children: [error, jsx().jsx("button", { type: "button", onClick: onRetry, children: "Try again" })] }) : jsx().jsx("ul", { children: words.map(word => jsx().jsxs("li", { children: [word.text, jsx().jsx("button", { type: "button", "aria-label": `Delete ${word.text}`, onClick: () => void onDelete?.(word), children: "Delete" })] }, word.id)) }),
    jsx().jsxs("form", { onSubmit: add, children: [jsx().jsx("input", { name: "word", value: word, disabled: atLimit || pending != null, placeholder: "Add a word", onChange: (event: { currentTarget: { value: string } }) => setWord(event.currentTarget.value) }), jsx().jsx("button", { type: "submit", disabled: atLimit || pending != null || word.trim().length === 0, children: pending === "add" ? "Adding…" : "Add" })] }),
    jsx().jsxs("section", { children: [jsx().jsx("textarea", { "aria-label": "Import words", value: importValue, disabled: atLimit || pending != null, onChange: (event: { currentTarget: { value: string } }) => setImportValue(event.currentTarget.value) }), jsx().jsx("button", { type: "button", disabled: atLimit || pending != null || importValue.trim().length === 0, onClick: () => void importWords(), children: pending === "import" ? "Importing…" : "Import" })] }),
    mutationError ? jsx().jsx("p", { role: "alert", children: "Couldn’t update the dictionary. Try again." }) : null,
    atLimit ? jsx().jsx("p", { role: "alert", children: "Dictionary limit reached" }) : null,
  ] });
}
export { DictionaryDialog, type DictionaryDialogProps, type DictionaryWord };
