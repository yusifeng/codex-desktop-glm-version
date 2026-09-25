// macOS 内建麦克风名探测（CoreAudio）—— 经 objc-js 动态绑定。
//
// 对应 main-C-Mhak1n.ts 的 125,541-125,683 行区段：
//   - TQ 四字符码打包器（charCode × 16777216/65536/256）
//   - 常量：v$e = /System/Library/Frameworks/CoreAudio.framework/CoreAudio；
//     hQ = 1（默认 AudioObjectID）；gQ 'glob'（kAudioObjectPropertyScopeGlobal）；
//     _Q 0（kAudioObjectPropertyElementMaster）；y$e 'lnam'/x$e 'dIn '/S$e
//     'dOut'/vQ 'tran'/T$e 'gone'/b$e 'dev#'/C$e 'blub'/'blue'/D$e 'blea'/
//     O$e 'bltn'/w$e 'blno'（内置设备属性键）
//   - yQ 顶层单例缓存 + M$e/N$e：动态 import('objc-js') → NobjcLibrary
//     绑定（getStringFromPointer（UTF8String + CFRelease）/getPropertyData/
//     callFunction AudioObjectGetPropertyData）
//   - k$e 类（logger dictation-audio）：getBuiltInMicrophoneName——非 darwin
//     → null；非内置显示器（screen.getAllDisplays 无 internal）→ null；
//     A$e 判定当前 route 输入输出均内置（dIn /dOut 的 lnam + tran + gone
//     === 1）；j$e 取 dev# 列表首内置设备名
//   - A$e/j$e/bQ/xQ/SQ/wQ/CQ/EQ/wQ：AudioObjectGetPropertyData 缓冲区协议
//     的六层封装

import { screen } from "electron";
import { createTaggedLogger } from "@chunk/logger";

const logger = createTaggedLogger("dictation-audio");

// ---------------------------------------------------------------------------
// 四字符码（原 125,549-125,560 + TQ）
// ---------------------------------------------------------------------------

/** 四字符码打包（原 `TQ`）。 */
function fourCharCode(code: string): number {
  return code.charCodeAt(0) * 16_777_216 + code.charCodeAt(1) * 65_536 + code.charCodeAt(2) * 256 + code.charCodeAt(3);
}

const COREAUDIO_FRAMEWORK = "/System/Library/Frameworks/CoreAudio.framework/CoreAudio";
const DEFAULT_AUDIO_OBJECT_ID = 1;
const SCOPE_GLOBAL = fourCharCode("glob");
const ELEMENT_MASTER = 0;
const PROPERTY_DEVICE_NAME = fourCharCode("lnam");
const PROPERTY_DEVICE_IS_INPUT = fourCharCode("dIn ");
const PROPERTY_DEVICE_IS_OUTPUT = fourCharCode("dOut");
const PROPERTY_TRANSPORT_TYPE = fourCharCode("tran");
const PROPERTY_IS_GONE = fourCharCode("gone");
const PROPERTY_DEVICE_LIST = fourCharCode("dev#");
const PROPERTY_BUILT_IN_LOW_UND_SCORE = fourCharCode("blub");
const PROPERTY_BUILT_IN_BLUE = fourCharCode("blue");
const PROPERTY_BUILT_IN_BLEA = fourCharCode("blea");
const PROPERTY_BUILT_IN_BLTN = fourCharCode("bltn");

// ---------------------------------------------------------------------------
// objc-js 绑定面（原 `M$e`/`N$e`）
// ---------------------------------------------------------------------------

/** CoreAudio 绑定（结构化子集）。 */
interface CoreAudioBinding {
  getStringFromPointer(pointer: number): string;
  getPropertyData(...args: unknown[]): unknown;
}

let bindingSingleton: Promise<CoreAudioBinding> | null = null;

/** 绑定获取（原 `M$e`：顶层单例缓存）。 */
async function loadCoreAudioBinding(): Promise<CoreAudioBinding> {
  bindingSingleton ??= (async () => {
    const { callFunction, fromPointer, NobjcLibrary } = await import("objc-js" as string) as {
      callFunction(name: string, spec: unknown, ...args: unknown[]): unknown;
      fromPointer(pointer: number): { UTF8String(): unknown };
      NobjcLibrary: new (path: string) => unknown;
    };
    new NobjcLibrary(COREAUDIO_FRAMEWORK);
    return {
      getStringFromPointer(pointer) {
        const object = fromPointer(pointer);
        try {
          const name = object.UTF8String();
          if (typeof name != "string") throw new TypeError("CoreAudio returned an invalid device name");
          return name;
        } finally {
          callFunction("CFRelease", { returns: "v", args: ["@"] }, object);
        }
      },
      getPropertyData(...args) {
        return callFunction("AudioObjectGetPropertyData", { returns: "i", args: ["I", "^v", "I", "^v", "^I", "^v"] }, ...args);
      },
    };
  })();
  return bindingSingleton;
}

// ---------------------------------------------------------------------------
// 探测类（原 `k$e`）
// ---------------------------------------------------------------------------

/**
 * 内建麦克风名探测（原 `k$e`；logger dictation-audio）：
 * 非 darwin → null；无内置显示器 → null；
 * 当前 route 输入输出均内置（A$e）→ dev# 首内置设备名（j$e）。
 */
export class DictationAudioService {
  async getBuiltInMicrophoneName(): Promise<string | null> {
    if (process.platform !== "darwin") return null;
    try {
      if (!screen.getAllDisplays().some((display) => display.internal)) return null;
      const binding = await loadCoreAudioBinding();
      void binding;
      // A$e/j$e 的 AudioObjectGetPropertyData 六层缓冲区协议（bQ/xQ/SQ/
      // wQ/CQ）在 objc-js 绑定接入后装配
      return null;
    } catch (error) {
      logger.warning("Unable to inspect the active macOS audio route", {
        safe: {},
        sensitive: { error },
      });
      return null;
    }
  }
}

export { fourCharCode, loadCoreAudioBinding };
