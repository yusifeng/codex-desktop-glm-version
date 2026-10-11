type AnnotationSelectorGeneratorDependencies = {
  getTagName: (element: any) => string;
  getId: (element: any) => string | null;
  getClassNames: (element: any) => Iterable<string>;
  getParentElement: (element: any) => any;
  getChildren: (element: any) => Iterable<any>;
  isElement: (value: any) => boolean;
  escapeToken: (value: string) => string;
  isUnique: (element: any, selector: string) => boolean;
};

function generateAnnotationSelector(element: any, options: { requireUnique?: boolean } = {}, deps: AnnotationSelectorGeneratorDependencies) {
  const requireUnique = options.requireUnique ?? false;
  const parts: string[] = [];
  let current = element;
  let depth = 0;
  while (current != null && (requireUnique || depth < 4)) {
    const tagName = deps.getTagName(current).toLowerCase();
    const originalTagName = deps.getTagName(current);
    let part = tagName;
    const id = deps.getId(current);
    if (id) {
      part += `#${deps.escapeToken(id)}`;
      const idSelector = [part, ...parts].join(` > `);
      if (!requireUnique || deps.isUnique(element, idSelector)) return idSelector;
    }
    const classes = Array.from(deps.getClassNames(current)).filter((value) => /^[a-zA-Z0-9_-]+$/.test(value)).slice(0, 2);
    if (classes.length > 0) part += `.${classes.map(deps.escapeToken).join(`.`)}`;
    const parent = deps.getParentElement(current);
    if (parent != null) {
      const sameTagChildren = Array.from(deps.getChildren(parent)).filter((value) => deps.isElement(value) && deps.getTagName(value) === originalTagName);
      if (sameTagChildren.length > 1) part += `:nth-of-type(${sameTagChildren.indexOf(current) + 1})`;
    }
    parts.unshift(part);
    const selector = parts.join(` > `);
    if (requireUnique && deps.isUnique(element, selector)) return selector;
    current = parent;
    depth += 1;
  }
  return requireUnique || parts.length === 0 ? null : parts.join(` > `);
}

export { generateAnnotationSelector };
if (typeof module !== `undefined`) module.exports = { generateAnnotationSelector };
