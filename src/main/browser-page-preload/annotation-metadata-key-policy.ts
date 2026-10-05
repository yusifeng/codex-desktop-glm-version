const annotationMetadataKeyPattern = /^[A-Za-z][A-Za-z0-9_-]*(?: [A-Za-z0-9_-]+)*$/;

function isSafeAnnotationMetadataKey(value: string): boolean {
  return annotationMetadataKeyPattern.test(value);
}

export { isSafeAnnotationMetadataKey };
if (typeof module !== `undefined`) module.exports = { isSafeAnnotationMetadataKey };
