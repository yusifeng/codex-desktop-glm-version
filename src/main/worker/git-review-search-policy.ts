function findCaseInsensitiveOffsets(text: string, query: string, limit: number) {
  const lowerText = text.toLowerCase(), lowerQuery = query.toLowerCase(), offsets = [] as { start: number; end: number }[];
  let cursor = 0, totalMatches = 0, isCapped = false;
  while (cursor < lowerText.length) { const start = lowerText.indexOf(lowerQuery, cursor); if (start === -1) break; const end = start + query.length; totalMatches++; if (offsets.length < limit) offsets.push({ start, end }); else isCapped = true; cursor = end; }
  return { offsets, totalMatches, isCapped };
}
export { findCaseInsensitiveOffsets };
if (typeof module !== `undefined`) module.exports = { findCaseInsensitiveOffsets };
