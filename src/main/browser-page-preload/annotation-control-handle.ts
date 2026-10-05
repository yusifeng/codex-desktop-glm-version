/** Creates the page-facing lifecycle handle for one annotation controls payload. */
function createAnnotationControlHandle(
  id: string,
  serialize: (value: unknown) => string,
  normalizeTargets: (value: unknown) => unknown[],
  emit: (type: `update` | `dispose`, detail: Record<string, unknown>) => boolean,
): Readonly<{ update(value: { targets?: unknown }): void; dispose(): void }> {
  const state = createAnnotationControlHandleState();
  return Object.freeze({
    update(value: { targets?: unknown }) {
      if (state.disposed) throw new TypeError(`Annotation controls have been disposed`);
      const payload = serialize(value);
      const targets = value.targets === undefined ? undefined : normalizeTargets(value.targets);
      if (!emit(`update`, { id, payload, targets })) throw new TypeError(`Invalid annotation controls update`);
    },
    dispose() {
      if (!state.dispose()) return;
      emit(`dispose`, { id });
    },
  });
}

export { createAnnotationControlHandle };
if (typeof module !== `undefined`) module.exports = { createAnnotationControlHandle };
import { createAnnotationControlHandleState } from "./annotation-control-handle-state";
