function projectAnnotationElementPath(element: { tagName: string }, getParent: (value: any) => any, maximumDepth = 4): string { const path: string[] = []; let current: any = element; let depth = 0; while (current != null && depth < maximumDepth) { const tag = current.tagName.toLowerCase(); if (tag === `html` || tag === `body`) { if (path.length === 0) path.unshift(tag); break; } path.unshift(tag); current = getParent(current); depth += 1; } return path.join(` > `); }
export { projectAnnotationElementPath };
if (typeof module !== `undefined`) module.exports = { projectAnnotationElementPath };
