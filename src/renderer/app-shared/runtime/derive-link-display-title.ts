/** Use a single-line title when present, otherwise fall back to the URL. */
export function deriveLinkDisplayTitle(input: { title?: string; url?: string }): string {
  const title = (input.title ?? "").replace(/[\r\n]+/g, " ").trim();
  return title.length > 0 ? title : (input.url ?? "").replace(/[\r\n]+/g, " ").trim();
}
