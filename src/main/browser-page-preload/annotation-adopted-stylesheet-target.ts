function canUseAnnotationAdoptedStyleSheets(target: any): boolean { return `adoptedStyleSheets` in target && (target.nodeType === 9 || (target.nodeType === 11 && `host` in target)); }
export { canUseAnnotationAdoptedStyleSheets };
if (typeof module !== `undefined`) module.exports = { canUseAnnotationAdoptedStyleSheets };
