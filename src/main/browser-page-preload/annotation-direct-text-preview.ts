function projectAnnotationDirectTextPreview(element: { childNodes: ArrayLike<{ nodeType: number; textContent?: string | null }> }, isRoot: (value: unknown) => boolean, maximumLength = 80): string | null {
  if (isRoot(element)) return null;
  const text = Array.from(element.childNodes).filter((node) => node.nodeType === 3).map((node) => node.textContent?.replace(/\s+/g, ` `).trim() ?? ``).join(` `).replace(/\s+/g, ` `).trim();
  return text.length === 0 ? null : text.slice(0, maximumLength);
}
export { projectAnnotationDirectTextPreview };
if (typeof module !== `undefined`) module.exports = { projectAnnotationDirectTextPreview };
