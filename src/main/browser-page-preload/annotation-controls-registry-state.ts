export type AnnotationControlsRegistryRecord = {
  controls: unknown;
  id: string;
  order: number;
  targets: WeakRef<object>[];
};

type RegistryStateDependencies = {
  maxControls: number;
  maxTotalTargets: number;
  attachTargets: (
    record: AnnotationControlsRegistryRecord,
    targets: Set<object>,
    index: WeakMap<object, AnnotationControlsRegistryRecord[]>,
    order: number,
  ) => number;
  detachTargets: (
    record: AnnotationControlsRegistryRecord,
    index: WeakMap<object, AnnotationControlsRegistryRecord[]>,
  ) => number;
};

/** Owns registry records, target accounting and the terminal disposal boundary. */
function createAnnotationControlsRegistryState(deps: RegistryStateDependencies) {
  const records = new Map<string, AnnotationControlsRegistryRecord>();
  let targetIndex = new WeakMap<object, AnnotationControlsRegistryRecord[]>();
  let totalTargets = 0;
  let order = 0;
  let disposed = false;

  const attach = (record: AnnotationControlsRegistryRecord, targets: Set<object>) => {
    totalTargets += deps.attachTargets(record, targets, targetIndex, record.order);
  };
  const detach = (record: AnnotationControlsRegistryRecord) => {
    totalTargets -= deps.detachTargets(record, targetIndex);
  };

  return {
    register(id: string, controls: unknown, targets: Set<object>) {
      if (
        disposed || records.has(id) || records.size >= deps.maxControls ||
        targets.size === 0 || totalTargets + targets.size > deps.maxTotalTargets
      ) return false;
      const record = { controls, id, order: order++, targets: [] };
      records.set(id, record);
      attach(record, targets);
      return true;
    },
    update(id: string, controls: unknown, targets?: Set<object>) {
      if (disposed) return false;
      const record = records.get(id);
      if (record == null || (targets != null && totalTargets - record.targets.length + targets.size > deps.maxTotalTargets)) return false;
      record.controls = controls;
      if (targets != null) {
        detach(record);
        attach(record, targets);
      }
      return true;
    },
    remove(id: string) {
      if (disposed) return false;
      const record = records.get(id);
      if (record == null) return false;
      records.delete(id);
      detach(record);
      return true;
    },
    get(id: string) { return disposed ? undefined : records.get(id); },
    values() { return disposed ? [] : records.values(); },
    get targetIndex() { return targetIndex; },
    dispose() {
      if (disposed) return false;
      disposed = true;
      records.clear();
      targetIndex = new WeakMap();
      totalTargets = 0;
      return true;
    },
    get disposed() { return disposed; },
  };
}

export { createAnnotationControlsRegistryState };
if (typeof module !== `undefined`) module.exports = { createAnnotationControlsRegistryState };
