function resolveAnnotationShadowSelector(root: any, selector: string, deps: { shadowPrefix: string; shadowSeparator: string; querySelector: (root: any, selector: string) => any; isElement: (value: any) => boolean; getShadowRoot: (element: any) => any }) {
  const parts = selector.startsWith(deps.shadowPrefix) ? selector.slice(deps.shadowPrefix.length).split(deps.shadowSeparator) : [selector];
  let current = root;
  for (let index = 0; index < parts.length; index += 1) { const element = deps.querySelector(current, parts[index]); if (index === parts.length - 1) return deps.isElement(element) ? element : null; if (!deps.isElement(element)) return null; current = deps.getShadowRoot(element); if (current == null) return null; }
  return null;
}
export { resolveAnnotationShadowSelector };
if (typeof module !== `undefined`) module.exports = { resolveAnnotationShadowSelector };
