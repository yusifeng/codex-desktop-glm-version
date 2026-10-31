type Constructor<T = object> = new (...args: any[]) => T;

type CoreAudioBinding = {
  getStringFromPointer(pointer: unknown): string;
  getPropertyData(...args: unknown[]): number;
  getPropertyDataSize(...args: unknown[]): number;
};

type ObjcJsModule = {
  callFunction(name: string, signature: unknown, ...args: unknown[]): unknown;
  fromPointer(pointer: unknown): { UTF8String(): unknown };
  NobjcLibrary: new (path: string) => unknown;
};

type DictationAudioDependencies = {
  RpcHandlerBase: Constructor;
  electron: { screen: { getAllDisplays(): Array<{ internal?: boolean }> } };
  createLogger(tag: string): {
    warning(message: string, fields: { safe: Record<string, unknown>; sensitive: Record<string, unknown> }): void;
  };
  loadObjcJs(): Promise<ObjcJsModule>;
};

const COREAUDIO_FRAMEWORK = "/System/Library/Frameworks/CoreAudio.framework/CoreAudio";
const DEFAULT_AUDIO_OBJECT_ID = 1;

export function fourCharCode(code: string): number {
  return (
    code.charCodeAt(0) * 16_777_216 +
    code.charCodeAt(1) * 65_536 +
    code.charCodeAt(2) * 256 +
    code.charCodeAt(3)
  );
}

const SCOPE_GLOBAL = fourCharCode("glob");
const ELEMENT_MASTER = 0;
const PROPERTY_DEVICE_NAME = fourCharCode("lnam");
const PROPERTY_DEVICE_LIST = fourCharCode("dev#");
const PROPERTY_DEFAULT_INPUT_DEVICE = fourCharCode("dIn ");
const PROPERTY_DEFAULT_OUTPUT_DEVICE = fourCharCode("dOut");
const PROPERTY_INPUT_STREAMS = fourCharCode("stm#");
const PROPERTY_TRANSPORT_TYPE = fourCharCode("tran");
const PROPERTY_IS_GONE = fourCharCode("gone");
const TRANSPORT_BUILT_IN = fourCharCode("bltn");
const TRANSPORT_BUILT_IN_LEGACY = fourCharCode("blue");
const TRANSPORT_BUILT_IN_AGGREGATE = fourCharCode("blea");

function propertyAddress(selector: number, scope: number, element: number): Buffer {
  const address = Buffer.alloc(12);
  address.writeUInt32LE(selector, 0);
  address.writeUInt32LE(scope, 4);
  address.writeUInt32LE(element, 8);
  return address;
}

function readUInt32Property(
  binding: CoreAudioBinding,
  objectId: number,
  address: { selector: number; scope: number; element: number },
): number | null {
  const addressBuffer = propertyAddress(address.selector, address.scope, address.element);
  const dataSize = Buffer.alloc(4);
  dataSize.writeUInt32LE(4, 0);
  const value = Buffer.alloc(4);
  return binding.getPropertyData(objectId, addressBuffer, 0, null, dataSize, value) !== 0 ||
    dataSize.readUInt32LE(0) !== 4
    ? null
    : value.readUInt32LE(0);
}

function readUInt32ArrayProperty(
  binding: CoreAudioBinding,
  objectId: number,
  address: { selector: number; scope: number; element: number },
): number[] | null {
  const addressBuffer = propertyAddress(address.selector, address.scope, address.element);
  const dataSize = Buffer.alloc(4);
  const status = binding.getPropertyDataSize(objectId, addressBuffer, 0, null, dataSize);
  const byteLength = dataSize.readUInt32LE(0);
  if (status !== 0 || byteLength === 0 || byteLength % 4 !== 0) return null;
  const values = Buffer.alloc(byteLength);
  if (
    binding.getPropertyData(objectId, addressBuffer, 0, null, dataSize, values) !== 0 ||
    dataSize.readUInt32LE(0) !== byteLength
  ) return null;
  return Array.from({ length: byteLength / 4 }, (_, index) => values.readUInt32LE(index * 4));
}

function readGlobalUInt32Property(binding: CoreAudioBinding, objectId: number, selector: number) {
  return readUInt32Property(binding, objectId, {
    selector,
    scope: SCOPE_GLOBAL,
    element: ELEMENT_MASTER,
  });
}

function isBuiltInTransport(transport: number | null): boolean {
  return transport === TRANSPORT_BUILT_IN_LEGACY || transport === TRANSPORT_BUILT_IN_AGGREGATE;
}

export function isBuiltInAudioRoute(binding: CoreAudioBinding): boolean {
  const inputDevice = readGlobalUInt32Property(
    binding,
    DEFAULT_AUDIO_OBJECT_ID,
    PROPERTY_DEFAULT_INPUT_DEVICE,
  );
  const outputDevice = readGlobalUInt32Property(
    binding,
    DEFAULT_AUDIO_OBJECT_ID,
    PROPERTY_DEFAULT_OUTPUT_DEVICE,
  );
  if (inputDevice == null || outputDevice == null) return false;
  return (
    isBuiltInTransport(readGlobalUInt32Property(binding, inputDevice, PROPERTY_TRANSPORT_TYPE)) &&
    isBuiltInTransport(readGlobalUInt32Property(binding, outputDevice, PROPERTY_TRANSPORT_TYPE)) &&
    readGlobalUInt32Property(binding, outputDevice, PROPERTY_IS_GONE) === 1
  );
}

export function getBuiltInMicrophoneName(binding: CoreAudioBinding): string | null {
  const inputScope = fourCharCode("inpt");
  const device = readUInt32ArrayProperty(binding, DEFAULT_AUDIO_OBJECT_ID, {
    selector: PROPERTY_DEVICE_LIST,
    scope: SCOPE_GLOBAL,
    element: ELEMENT_MASTER,
  })?.find(
    (deviceId) =>
      readGlobalUInt32Property(binding, deviceId, PROPERTY_TRANSPORT_TYPE) === TRANSPORT_BUILT_IN &&
      (readUInt32ArrayProperty(binding, deviceId, {
        selector: PROPERTY_INPUT_STREAMS,
        scope: inputScope,
        element: ELEMENT_MASTER,
      })?.length ?? 0) > 0,
  );
  if (device == null) return null;
  const address = propertyAddress(PROPERTY_DEVICE_NAME, SCOPE_GLOBAL, ELEMENT_MASTER);
  const dataSize = Buffer.alloc(4);
  dataSize.writeUInt32LE(8, 0);
  const pointer = Buffer.alloc(8);
  return binding.getPropertyData(device, address, 0, null, dataSize, pointer) === 0 &&
    dataSize.readUInt32LE(0) === 8
    ? binding.getStringFromPointer(pointer)
    : null;
}

export function createDictationAudioServiceClass(dependencies: DictationAudioDependencies) {
  const { RpcHandlerBase, electron, createLogger, loadObjcJs } = dependencies;
  const RpcHandler = RpcHandlerBase as Constructor<any>;
  const logger = createLogger("dictation-audio");
  let bindingPromise: Promise<CoreAudioBinding> | null = null;

  function loadCoreAudioBinding(): Promise<CoreAudioBinding> {
    bindingPromise ??= loadObjcJs().then(({ callFunction, fromPointer, NobjcLibrary }) => {
      new NobjcLibrary(COREAUDIO_FRAMEWORK);
      return {
        getStringFromPointer(pointer: unknown) {
          const object = fromPointer(pointer);
          try {
            const value = object.UTF8String();
            if (typeof value !== "string")
              throw new TypeError("CoreAudio returned an invalid device name");
            return value;
          } finally {
            callFunction("CFRelease", { returns: "v", args: ["@"] }, object);
          }
        },
        getPropertyData(...args: unknown[]) {
          const status = callFunction(
            "AudioObjectGetPropertyData",
            { returns: "i", args: ["I", "^v", "I", "^v", "^I", "^v"] },
            ...args,
          );
          if (typeof status !== "number")
            throw new TypeError("CoreAudio returned an invalid status");
          return status;
        },
        getPropertyDataSize(...args: unknown[]) {
          const status = callFunction(
            "AudioObjectGetPropertyDataSize",
            { returns: "i", args: ["I", "^v", "I", "^v", "^I"] },
            ...args,
          );
          if (typeof status !== "number")
            throw new TypeError("CoreAudio returned an invalid status");
          return status;
        },
      };
    });
    return bindingPromise;
  }

  return class DictationAudioService extends RpcHandler {
    async getBuiltInMicrophoneName(): Promise<string | null> {
      if (process.platform !== "darwin") return null;
      try {
        if (!electron.screen.getAllDisplays().some((display) => display.internal)) return null;
        const binding = await loadCoreAudioBinding();
        return isBuiltInAudioRoute(binding) ? getBuiltInMicrophoneName(binding) : null;
      } catch (error) {
        logger.warning("Unable to inspect the active macOS audio route", {
          safe: {},
          sensitive: { error },
        });
        return null;
      }
    }
  };
}
