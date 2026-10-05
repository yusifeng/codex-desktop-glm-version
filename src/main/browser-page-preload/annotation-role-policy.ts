function isSafeAnnotationRole(value: string, maxLength: number, pattern: string): boolean {
  return value.length <= maxLength && new RegExp(pattern).test(value);
}

export { isSafeAnnotationRole };
if (typeof module !== `undefined`) module.exports = { isSafeAnnotationRole };
