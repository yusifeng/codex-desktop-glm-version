/** Escapes an identifier before it is embedded in an annotation CSS selector. */
function escapeAnnotationSelectorToken(value: unknown, cssEscape?: (value: string) => string): string {
  const text = String(value);
  if (typeof cssEscape === `function`) return cssEscape(text);
  return text.replace(/[^a-zA-Z0-9_-]/g, `\\$&`);
}

export { escapeAnnotationSelectorToken };
if (typeof module !== `undefined`) module.exports = { escapeAnnotationSelectorToken };
