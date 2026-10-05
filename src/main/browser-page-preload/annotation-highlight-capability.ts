function supportsAnnotationCssHighlights(scope: any): boolean { return `CSS` in scope && typeof scope.CSS === `object` && scope.CSS != null && `highlights` in scope.CSS && `Highlight` in scope && typeof scope.Highlight === `function` && `CSSStyleSheet` in scope && typeof scope.CSSStyleSheet === `function` && typeof scope.CSSStyleSheet.prototype.replaceSync === `function`; }
export { supportsAnnotationCssHighlights };
if (typeof module !== `undefined`) module.exports = { supportsAnnotationCssHighlights };
