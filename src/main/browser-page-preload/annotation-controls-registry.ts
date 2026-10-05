import {
  createAnnotationControlsRegistryState,
  type AnnotationControlsRegistryRecord as RegistryRecord,
} from "./annotation-controls-registry-state";

type RegistryDependencies = {
  documentRef: object;
  windowRef: { addEventListener(type: string, listener: (event: any) => void): void; removeEventListener(type: string, listener: (event: any) => void): void };
  registerEvent: string;
  updateEvent: string;
  disposeEvent: string;
  pagehideEvent: string;
  maxControls: number;
  maxTotalTargets: number;
  readDetail: (event: unknown) => Record<string, unknown> | undefined;
  readField: (detail: Record<string, unknown>, key: string) => unknown;
  parsePayload: (value: unknown, current?: Record<string, unknown>) => Record<string, unknown> | undefined;
  parseTargets: (value: unknown) => Set<object> | undefined;
  attachTargets: (record: RegistryRecord, targets: Set<object>, index: WeakMap<object, RegistryRecord[]>, order: number) => number;
  detachTargets: (record: RegistryRecord, index: WeakMap<object, RegistryRecord[]>) => number;
  collectTargets: (records: Iterable<RegistryRecord>, isValidTarget: (target: object) => boolean) => object[];
  getControls: (target: object, documentRef: object, index: WeakMap<object, RegistryRecord[]>) => unknown;
  isValidTarget: (target: object) => boolean;
  shouldDisposePagehide: (event: { isTrusted?: boolean; persisted?: boolean }) => boolean;
};

/** Owns the page-level annotation controls registry and its target index. */
function createAnnotationControlsRegistry(deps: RegistryDependencies): { dispose(): void; getTargets(): object[]; getControls(target: object): unknown } {
  const state = createAnnotationControlsRegistryState(deps);
  const register = (event: any) => {
    try {
      const detail = deps.readDetail(event);
      if (detail == null) return;
      const id = deps.readField(detail, `id`);
      const payload = deps.readField(detail, `payload`);
      const rawTargets = deps.readField(detail, `targets`);
      if (typeof id !== `string` || id.length === 0 || id.length > 80) return;
      const controls = deps.parsePayload(payload);
      if (controls == null) return;
      const targets = deps.parseTargets(rawTargets);
      if (targets == null || !state.register(id, controls, targets)) return;
      event.preventDefault();
    } catch {}
  };
  const update = (event: any) => {
    try {
      const detail = deps.readDetail(event);
      if (detail == null) return;
      const id = deps.readField(detail, `id`);
      const payload = deps.readField(detail, `payload`);
      const rawTargets = deps.readField(detail, `targets`);
      if (typeof id !== `string`) return;
      const record = state.get(id);
      if (record == null) return;
      const targets = rawTargets === undefined ? undefined : deps.parseTargets(rawTargets);
      if (rawTargets !== undefined && targets == null) return;
      const controls = deps.parsePayload(payload, record.controls as Record<string, unknown>);
      if (controls == null || !state.update(id, controls, targets)) return;
      event.preventDefault();
    } catch {}
  };
  const disposeRecord = (event: any) => {
    try {
      const detail = deps.readDetail(event);
      if (detail == null) return;
      const id = deps.readField(detail, `id`);
      if (typeof id !== `string`) return;
      if (!state.remove(id)) return;
      event.preventDefault();
    } catch {}
  };
  const dispose = () => {
    if (!state.dispose()) return;
    deps.windowRef.removeEventListener(deps.registerEvent, register);
    deps.windowRef.removeEventListener(deps.updateEvent, update);
    deps.windowRef.removeEventListener(deps.disposeEvent, disposeRecord);
    deps.windowRef.removeEventListener(deps.pagehideEvent, onPagehide);
  };
  const onPagehide = (event: any) => { if (deps.shouldDisposePagehide(event)) dispose(); };
  deps.windowRef.addEventListener(deps.registerEvent, register);
  deps.windowRef.addEventListener(deps.updateEvent, update);
  deps.windowRef.addEventListener(deps.disposeEvent, disposeRecord);
  deps.windowRef.addEventListener(deps.pagehideEvent, onPagehide);
  return {
    dispose,
    getTargets: () => deps.collectTargets(state.values(), deps.isValidTarget),
    getControls: (target) => deps.getControls(target, deps.documentRef, state.targetIndex),
  };
}

export { createAnnotationControlsRegistry };
if (typeof module !== `undefined`) module.exports = { createAnnotationControlsRegistry };
