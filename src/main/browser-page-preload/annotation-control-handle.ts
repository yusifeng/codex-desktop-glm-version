/** Creates the page-facing lifecycle handle for one annotation controls payload. */
function createAnnotationControlHandle(
  id: string,
  serialize: (value: unknown) => string,
  normalizeTargets: (value: unknown) => unknown[],
  emit: (type: `update` | `dispose`, detail: Record<string, unknown>) => boolean,
): Readonly<{ update(value: { targets?: unknown }): void; dispose(): void }> {
  let disposed = false;
  return Object.freeze({
    update(value: { targets?: unknown }) {
      if (disposed) throw new TypeError(`Annotation controls have been disposed`);
      const payload = serialize(value);
      const targets = value.targets === undefined ? undefined : normalizeTargets(value.targets);
      if (!emit(`update`, { id, payload, targets })) throw new TypeError(`Invalid annotation controls update`);
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      emit(`dispose`, { id });
    },
  });
}

export { createAnnotationControlHandle };
if (typeof module !== `undefined`) module.exports = { createAnnotationControlHandle };
