const singleEmoji = RegExp(`^(?:\\p{RGI_Emoji})$`, `v`);

function validateThreadMetadataUpdate(value: { threadId: string; emoji?: string | null; labelColor?: string | null }): void {
  if (value.threadId.length === 0) throw Error(`Thread id must not be empty.`);
  if (value.emoji != null && !singleEmoji.test(value.emoji))
    throw Error(`Thread emoji must be exactly one emoji sequence.`);
}

function updateThreadMetadata(
  current: Record<string, { emoji?: string; labelColor?: string }> | undefined,
  update: { threadId: string; emoji?: string | null; labelColor?: string | null },
): Record<string, { emoji?: string; labelColor?: string }> | undefined {
  if (update.emoji === undefined && update.labelColor === undefined) return current;
  const previous = current?.[update.threadId] ?? {};
  const emoji = update.emoji === undefined ? previous.emoji : update.emoji ?? undefined;
  const labelColor = update.labelColor === undefined ? previous.labelColor : update.labelColor ?? undefined;
  if (emoji === previous.emoji && labelColor === previous.labelColor) return current;
  const nextEntry: { emoji?: string; labelColor?: string } = { ...previous };
  if (update.emoji !== undefined) {
    if (update.emoji == null) delete nextEntry.emoji;
    else nextEntry.emoji = update.emoji;
  }
  if (update.labelColor !== undefined) {
    if (update.labelColor == null) delete nextEntry.labelColor;
    else nextEntry.labelColor = update.labelColor;
  }
  const next = { ...(current ?? {}) };
  if (Object.keys(nextEntry).length === 0) delete next[update.threadId];
  else next[update.threadId] = nextEntry;
  return Object.keys(next).length === 0 ? undefined : next;
}

export { validateThreadMetadataUpdate, updateThreadMetadata };

if (typeof module !== `undefined`) {
  module.exports = { validateThreadMetadataUpdate, updateThreadMetadata };
}
