function openAnnotationPopoverTarget(root: any, attribute: string, deps: { getShadowRoot: (root: any) => any; query: (shadowRoot: any, selector: string) => any; setOpen: (element: any, hideFirst: boolean) => boolean }): boolean { const shadowRoot = deps.getShadowRoot(root); const target = shadowRoot == null ? null : deps.query(shadowRoot, `[${attribute}]`); return target != null && deps.setOpen(target, true); }
export { openAnnotationPopoverTarget };
if (typeof module !== `undefined`) module.exports = { openAnnotationPopoverTarget };
