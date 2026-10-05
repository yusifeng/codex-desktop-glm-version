function isTopLevelAnnotationRoot(anchor: { kind: string; framePath: readonly unknown[]; elementPath: string }): boolean { return anchor.kind === `element` && anchor.framePath.length === 0 && (anchor.elementPath === `html` || anchor.elementPath === `body`); }
export { isTopLevelAnnotationRoot };
if (typeof module !== `undefined`) module.exports = { isTopLevelAnnotationRoot };
