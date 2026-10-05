const annotationSafeTextPattern = /^[^\p{Cc}\p{Cf}\p{Cs}\u2028\u2029]*$/u;

function isSafeAnnotationText(value: string): boolean {
  return annotationSafeTextPattern.test(value);
}

export { isSafeAnnotationText };
if (typeof module !== `undefined`) module.exports = { isSafeAnnotationText };
