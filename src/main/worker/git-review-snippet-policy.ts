function buildSearchSnippet(text: string, start: number, end: number, context = 30) { return { before: text.slice(Math.max(0, start - context), start), match: text.slice(start, end), after: text.slice(end, Math.min(text.length, end + context)) }; }
export { buildSearchSnippet };
if (typeof module !== `undefined`) module.exports = { buildSearchSnippet };
