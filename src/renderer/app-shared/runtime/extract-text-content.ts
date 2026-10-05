/** Extract and normalize text blocks from a heterogeneous content list. */
export function extractTextContent(items: Array<{ type?: string; text?: string }> | null | undefined, normalize: (value: string) => string = (value) => value): string | null {
  if (items == null) return null;
  return normalize(items.flatMap((item) => item.type === "text" ? [item.text ?? ""] : []).join(" "));
}
