function projectAnnotationElementLabel(element: { tagName: string; innerText?: string | null; textContent?: string | null }, isRoot: (value: unknown) => boolean, maximumLength = 80): string | null {
  if (isRoot(element)) return element.tagName.toLowerCase();
  const text = (element.innerText || element.textContent || ``).replace(/\s+/g, ` `).trim();
  return text.length === 0 ? null : text.slice(0, maximumLength);
}
export { projectAnnotationElementLabel };
if (typeof module !== `undefined`) module.exports = { projectAnnotationElementLabel };
