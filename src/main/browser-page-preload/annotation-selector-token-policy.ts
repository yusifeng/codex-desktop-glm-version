function escapeAnnotationSelectorTokenForPage(value: unknown, deps: { getCssEscape: () => ((value: string) => string) | undefined; escape: (value: unknown, cssEscape?: (value: string) => string) => string }): string {
  return deps.escape(value, deps.getCssEscape());
}

export { escapeAnnotationSelectorTokenForPage };
if (typeof module !== `undefined`) module.exports = { escapeAnnotationSelectorTokenForPage };
