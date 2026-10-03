type RegistryRecord = { controls: unknown; id: string; order: number; targets: WeakRef<object>[] };

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
  const records = new Map<string, RegistryRecord>();
  let targetIndex = new WeakMap<object, RegistryRecord[]>();
  let totalTargets = 0;
  let order = 0;

  const attach = (record: RegistryRecord, targets: Set<object>) => {
    totalTargets += deps.attachTargets(record, targets, targetIndex, record.order);
  };
  const detach = (record: RegistryRecord) => {
    totalTargets -= deps.detachTargets(record, targetIndex);
  };
  const register = (event: any) => {
    try {
      const detail = deps.readDetail(event);
      if (detail == null) return;
      const id = deps.readField(detail, `id`);
      const payload = deps.readField(detail, `payload`);
      const rawTargets = deps.readField(detail, `targets`);
      if (typeof id !== `string` || id.length === 0 || id.length > 80 || records.has(id) || records.size >= deps.maxControls) return;
      const controls = deps.parsePayload(payload);
      if (controls == null) return;
      const targets = deps.parseTargets(rawTargets);
      if (targets == null || targets.size === 0 || records.has(id) || records.size >= deps.maxControls || totalTargets + targets.size > deps.maxTotalTargets) return;
      const record: RegistryRecord = { controls, id, order: order++, targets: [] };
      records.set(id, record);
      attach(record, targets);
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
      const record = records.get(id);
      if (record == null) return;
      const targets = rawTargets === undefined ? undefined : deps.parseTargets(rawTargets);
      if (rawTargets !== undefined && targets == null) return;
      const controls = deps.parsePayload(payload, record.controls as Record<string, unknown>);
      if (controls == null || (targets != null && totalTargets - record.targets.length + targets.size > deps.maxTotalTargets)) return;
      record.controls = controls;
      if (targets != null) { detach(record); attach(record, targets); }
      event.preventDefault();
    } catch {}
  };
  const disposeRecord = (event: any) => {
    try {
      const detail = deps.readDetail(event);
      if (detail == null) return;
      const id = deps.readField(detail, `id`);
      if (typeof id !== `string`) return;
      const record = records.get(id);
      if (record == null) return;
      records.delete(id);
      detach(record);
      event.preventDefault();
    } catch {}
  };
  const dispose = () => {
    records.clear();
    targetIndex = new WeakMap();
    totalTargets = 0;
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
    getTargets: () => deps.collectTargets(records.values(), deps.isValidTarget),
    getControls: (target) => deps.getControls(target, deps.documentRef, targetIndex),
  };
}

export { createAnnotationControlsRegistry };
if (typeof module !== `undefined`) module.exports = { createAnnotationControlsRegistry };
