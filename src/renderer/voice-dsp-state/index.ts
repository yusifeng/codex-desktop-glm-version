import * as RuntimeChunk from "@rchunk/rolldown-runtime";
import * as SharedChunk from "@rchunk/app-shared";

interface WritableState<T> { get?(): T; set?(value: T): void }
interface SharedApi { FX?(): void; QI?(): void; ZI: unknown; pZ?<T>(store: unknown, factory: () => T): WritableState<T> }

const shared = SharedChunk as unknown as SharedApi;
let initialized = false;
let inputDeviceState: WritableState<unknown>;
let outputDeviceState: WritableState<unknown>;
let microphoneState: WritableState<unknown>;
let speakerState: WritableState<unknown>;
void RuntimeChunk;

function createState(): WritableState<unknown> {
  return shared.pZ?.(shared.ZI, () => null) ?? { get: () => null, set: () => undefined };
}

function initializeVoiceDspState(): void {
  if (initialized) return;
  shared.FX?.();
  shared.QI?.();
  shared.pZ?.(shared.ZI, () => null);
  inputDeviceState = createState();
  outputDeviceState = createState();
  microphoneState = createState();
  speakerState = createState();
  initialized = true;
}

initializeVoiceDspState();

export { microphoneState as a, initializeVoiceDspState as i, outputDeviceState as n, speakerState as r, inputDeviceState as t };
