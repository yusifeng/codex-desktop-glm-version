/** Parses URL-like annotation page identities without throwing. */
function parseAnnotationUrl(value: unknown): URL | null {
  if (typeof value !== `string`) return null;
  try { return new URL(value); } catch { return null; }
}
export { parseAnnotationUrl };
if (typeof module !== `undefined`) module.exports = { parseAnnotationUrl };
