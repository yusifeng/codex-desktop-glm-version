function normalizeAnnotationText(value: unknown, maxLength = 2e3): string | null {
  const text = String(value ?? ``).replace(/\s+/g, ` `).trim();
  return text.length === 0 ? null : text.slice(0, maxLength);
}
export { normalizeAnnotationText };
if (typeof module !== `undefined`) module.exports = { normalizeAnnotationText };
