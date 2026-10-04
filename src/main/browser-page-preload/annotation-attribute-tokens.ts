/** Parses the whitespace-separated annotation draft attribute token list. */
function parseAnnotationAttributeTokens(value: string | null): string[] {
  return (value ?? ``).split(/\s+/).filter((token) => token.length > 0);
}

export { parseAnnotationAttributeTokens };
if (typeof module !== `undefined`) module.exports = { parseAnnotationAttributeTokens };
