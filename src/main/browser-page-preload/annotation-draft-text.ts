type DraftTextChange = { text?: { value: string; previousValue?: string } };

/** Selects the latest draft text change whose value differs from its previous value. */
function findLatestDraftTextChange(changes: DraftTextChange[]): DraftTextChange["text"] | null {
  for (let index = changes.length - 1; index >= 0; --index) {
    const text = changes[index]?.text;
    if (text != null && text.value !== text.previousValue) return text;
  }
  return null;
}

export { findLatestDraftTextChange };
if (typeof module !== `undefined`) module.exports = { findLatestDraftTextChange };
