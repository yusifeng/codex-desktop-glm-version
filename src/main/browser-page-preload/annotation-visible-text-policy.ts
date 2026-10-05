/** Appends one normalized visible-text fragment with the configured length cap. */
function appendAnnotationVisibleText(current: string, value: string, maximumLength: number) {
  const next = current.length === 0 ? value : `${current} ${value}`;
  return { text: next, complete: next.length >= maximumLength };
}
export { appendAnnotationVisibleText };
if (typeof module !== `undefined`) module.exports = { appendAnnotationVisibleText };
