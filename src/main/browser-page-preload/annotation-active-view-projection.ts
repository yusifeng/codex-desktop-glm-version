/** Project the active comment/design view consumed by the annotation renderer. */
function projectAnnotationActiveView(selectedId: string | null | undefined, comments: any[], designs: any[]) {
  const comment = selectedId == null ? null : comments.find((annotation) => annotation.id === selectedId) ?? null;
  const design = selectedId == null ? null : designs.find((annotation) => annotation.id === selectedId) ?? null;
  const active =
    comment == null
      ? design == null
        ? null
        : { kind: `design`, annotation: design }
      : { kind: `comment`, annotation: comment };
  return {
    active,
    activeId: active?.annotation.id ?? null,
    displayAnnotations: active?.kind === `comment` ? [active.annotation] : comments,
    hasActiveSelection: active != null && selectedId != null,
  };
}

export { projectAnnotationActiveView };
if (typeof module !== `undefined`) module.exports = { projectAnnotationActiveView };
