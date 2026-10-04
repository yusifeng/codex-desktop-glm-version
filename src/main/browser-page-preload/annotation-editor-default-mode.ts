type MetaDocument = {
  head?: { querySelectorAll(selector: string): Iterable<{ getAttribute(name: string): string | null }> } | null;
};

type ModeConfig = { name: string; values: string[] };

function readAnnotationEditorDefaultMode(documentLike: MetaDocument, config: ModeConfig) {
  const elements = documentLike.head?.querySelectorAll(`meta[name="${config.name}"]`);
  if (elements == null) return undefined;
  for (const element of elements) {
    const value = element.getAttribute(`content`);
    const match = config.values.find((candidate) => candidate === value);
    if (match != null) return match;
  }
  return undefined;
}

export { readAnnotationEditorDefaultMode };
if (typeof module !== "undefined") module.exports = { readAnnotationEditorDefaultMode };
