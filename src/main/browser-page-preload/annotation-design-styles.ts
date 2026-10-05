export type AnnotationStyleDeclaration = {
  property: string;
  value?: string;
  previousValue?: string;
};
type AnnotationDesignStyle = { draftAttribute: string; declarations: readonly AnnotationStyleDeclaration[] };
function escapeAnnotationDesignSelector(value: string): string { return value.replace(/\\/g, `\\\\`).replace(/"/g, `\\"`); }
function buildAnnotationDesignStyleRule(style: AnnotationDesignStyle, attribute = `data-codex-browser-design-group`): string[] {
  const changed = style.declarations.filter((declaration) => (declaration.value ?? ``).trim() !== (declaration.previousValue ?? ``).trim());
  if (changed.length === 0) return [];
  return [[`[${attribute}~="${escapeAnnotationDesignSelector(style.draftAttribute)}"] {`, ...changed.map((declaration) => `  ${declaration.property}: ${declaration.value} !important;`), `}`].join(`\n`)];
}
function buildAnnotationDesignStyles(styles: readonly AnnotationDesignStyle[], attribute = `data-codex-browser-design-group`): string { return styles.flatMap((style) => buildAnnotationDesignStyleRule(style, attribute)).join(`\n\n`); }

function collectAnnotationStyleDeclarations(
  computedStyle: { getPropertyValue(property: string): string },
  properties: readonly string[],
): AnnotationStyleDeclaration[] {
  return properties.map((property) => {
    const value = computedStyle.getPropertyValue(property).trim();
    return { property, value, previousValue: value };
  });
}

function mergeAnnotationStyleDeclarations(
  styles: readonly AnnotationStyleDeclaration[],
  declarations: readonly AnnotationStyleDeclaration[],
): AnnotationStyleDeclaration[] {
  const byProperty = new Map(declarations.map((declaration) => [declaration.property, declaration]));
  return styles.map((style) => {
    const declaration = byProperty.get(style.property);
    return declaration == null
      ? style
      : { ...style, previousValue: declaration.previousValue, value: declaration.value };
  });
}

function readAnnotationDirectText(element: {
  childNodes: ArrayLike<{ nodeType: number; textContent?: string | null }>;
  children: ArrayLike<{ textContent?: string | null }>;
}): string | null {
  const text = Array.from(element.childNodes)
    .filter((node) => node.nodeType === 3)
    .map((node) => node.textContent?.replace(/\s+/g, " ").trim() ?? "")
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();
  return text.length === 0 || Array.from(element.children).some((child) => (child.textContent?.replace(/\s+/g, " ").trim().length ?? 0) > 0)
    ? null
    : text;
}

function createAnnotationTextDraft(element: Parameters<typeof readAnnotationDirectText>[0]): { value: string; previousValue: string } | undefined {
  const value = readAnnotationDirectText(element);
  return value == null ? undefined : { value, previousValue: value };
}

function projectAnnotationStyleProvenance(styles: readonly AnnotationStyleDeclaration[]): Array<{ property: string }> {
  return styles.map(({ property }) => ({ property }));
}

function isAnnotationInteractionTargetMatch(
  left: { mode: "create" | "edit" | "design"; commentId?: string; groupId?: string },
  right: { mode: "create" | "edit" | "design"; commentId?: string; groupId?: string },
): boolean {
  switch (left.mode) {
    case "create": return right.mode === "create";
    case "edit": return right.mode === "edit" && left.commentId === right.commentId;
    case "design": return right.mode === "design" && left.groupId === right.groupId;
  }
}

export { collectAnnotationStyleDeclarations, mergeAnnotationStyleDeclarations, readAnnotationDirectText, createAnnotationTextDraft, projectAnnotationStyleProvenance, isAnnotationInteractionTargetMatch, escapeAnnotationDesignSelector, buildAnnotationDesignStyleRule, buildAnnotationDesignStyles };
if (typeof module !== "undefined") module.exports = { collectAnnotationStyleDeclarations, mergeAnnotationStyleDeclarations, readAnnotationDirectText, createAnnotationTextDraft, projectAnnotationStyleProvenance, isAnnotationInteractionTargetMatch, escapeAnnotationDesignSelector, buildAnnotationDesignStyleRule, buildAnnotationDesignStyles };
