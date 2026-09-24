// Linux 包管理器更新器 + 全文件使用的 deepEqual（lodash isEqual 内嵌副本）。
//
// 对应 bootstrap-C4dRql4x.ts 19554-19633 行：
//   - `XC`（e.a(n.Ld())，shared chunk 里 vendored 的 lodash.isequal，`s_`/`o_`
//     模块）——重写为下方 vendored lodash isEqual 的忠实移植，导出
//     `deepEqual`。SparkleManager / SettingsStore / GlobalState 等也在用；
//     集成时可把它提升到 `util/deep-equal.ts`（本文件再 re-export）。
//   - `ZC`（linux-package-metadata.json 文件名）、`QC`（轮询间隔 15 分钟）、
//     `$C`（元数据 schema）、`ew` class（LinuxPackageUpdater）、
//     `tw`（平台门控）、`nw`（读安装的元数据）、`rw`（semver 比较）。
//
// 语义（Linux 专属，macOS 上静态重写）：Linux 版把更新交给系统包管理器；
// 本更新器只周期性读取可执行文件旁 resources/linux-package-metadata.json，
// 检测「已安装版本 > 正在运行版本」（说明包管理器已装了新包，等重启），
// 置 isUpdateReady 并 relaunch。

import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { app } from "electron";
import {
  Of as ofStringSchema,
  Uu as parseSemanticVersion,
  Ru as formatSemanticVersion,
  bf as literalSchema,
  wf as objectSchema,
} from "@chunk/shared";
import { BuildFlavor } from "../build-info/build-flavor";

// @chunk/shared 尚未重写，zod 构造器的链式方法（trim/min 等）类型不完整——
// 字符串构造器按 any 使用，其余构造器保持声明类型。
const stringSchema = ofStringSchema as any;

// ---------------------------------------------------------------------------
// deepEqual（原 `XC`，vendored lodash 4.x isEqual 的忠实移植）
// ---------------------------------------------------------------------------

/** typeof e === "object" && !!e（lodash isObjectLike，原 Pg）。 */
function isObjectLike(value: unknown): boolean {
  return typeof value === "object" && !!value;
}

/** Object.prototype.toString（原 Xh 的取 tag 部分）。 */
function objectToString(value: object): string {
  return Object.prototype.toString.call(value);
}

/**
 * typeof input === "object" && input !== null 且非函数的兜底取 tag（原 Xh）。
 * Node 环境里 baseGetTag 的 Symbol.toStringTag 分支照搬。
 */
function baseGetTag(value: unknown): string {
  if (value == null) return value === undefined ? "[object Undefined]" : "[object Null]";
  const result = objectToString(value as object);
  if (!(Symbol.toStringTag in Object(value))) return result;
  const tag = (value as { [Symbol.toStringTag]?: unknown })[Symbol.toStringTag];
  const descriptor = Object.getOwnPropertyDescriptor(value as object, Symbol.toStringTag);
  if (descriptor?.get != null && typeof descriptor.get === "function") {
    try {
      const dynamic = descriptor.get.call(value as object);
      return `[object ${String(dynamic)}]`;
    } catch {
      return result;
    }
  }
  return typeof tag === "string" ? `[object ${tag}]` : result;
}

/** Map/Set 的 entries/值数组（原 Fte/Eg 的消费形态）。 */
function setToArray(set: Set<unknown>): unknown[] {
  const array: unknown[] = [];
  set.forEach((value) => array.push(value));
  return array;
}

function mapToArray(map: Map<unknown, unknown>): [unknown, unknown][] {
  const array: [unknown, unknown][] = [];
  map.forEach((value, key) => array.push([key, value]));
  return array;
}

/** Node Buffer（原 Tg：Kh().Uint8Array；Node 环境即全局 Uint8Array）。 */
const Uint8ArrayRef = globalThis.Uint8Array;

/** isTypedArray 的 node util.binding 兜底（原 Ug+Wg 的 Node 路径）。 */
const typedArrayCheck: ((value: unknown) => boolean) | undefined = (() => {
  try {
    // Node 环境下 process.binding('util') 仍可解析（Electron 主进程同）。
    const nodeUtil = (process as unknown as { binding?: (n: string) => any }).binding?.("util");
    return typeof nodeUtil?.isTypedArray === "function" ? nodeUtil.isTypedArray : undefined;
  } catch {
    return undefined;
  }
})();

const typedArrayTagPattern =
  /^\[object (?:Float32|Float64|Int8|Int16|Int32|Uint8|Uint8Clamped|Uint16|Uint32)Array\]$/;

function isTypedArrayLike(value: unknown): boolean {
  if (typedArrayCheck) return typedArrayCheck(value);
  return (
    isObjectLike(value) &&
    Number.isInteger((value as { length?: unknown }).length) &&
    typedArrayTagPattern.test(baseGetTag(value))
  );
}

/** Buffer 判定（原 Rg：Node Buffer.isBuffer 优先，isLength 兜底）。 */
function isBufferLike(value: unknown): boolean {
  if (typeof Buffer !== "undefined" && typeof Buffer.isBuffer === "function")
    return Buffer.isBuffer(value as unknown as Buffer);
  return (
    value != null &&
    (value as { constructor?: unknown }).constructor != null &&
    typeof (value as { constructor: { isBuffer?: unknown } }).constructor.isBuffer === "function" &&
    (value as { constructor: { isBuffer: (v: unknown) => boolean } }).constructor.isBuffer(value)
  );
}

/** 自定义比较栈（原 xg；纯 Map 即可覆盖对象/数组键的缓存需求）。 */
class EqualStack {
  private __data__ = new Map<unknown, unknown>();
  get size(): number {
    return this.__data__.size;
  }
  set(key: unknown, value: unknown): this {
    this.__data__.set(key, value);
    return this;
  }
  get(key: unknown): unknown {
    return this.__data__.get(key);
  }
  has(key: unknown): boolean {
    return this.__data__.has(key);
  }
  delete(key: unknown): boolean {
    return this.__data__.delete(key);
  }
}

/** 自定义比较器（lodash customizer 位；本项目内恒为 undefined）。 */
type EqualCustomizer = (
  a: unknown,
  b: unknown,
  key: unknown,
  aObj: unknown,
  bObj: unknown,
  stack: EqualStack,
) => unknown;

/** 递归相等判定（原 o_ 的第 5 参形状）。 */
type EqualFunc = (
  a: unknown,
  b: unknown,
  bitmask: number,
  customizer: EqualCustomizer | undefined,
  stack: EqualStack,
) => boolean;

const COMPARE_PARTIAL_FLAG = 1;
const COMPARE_UNORDERED_FLAG = 2;

/**
 * 数组相等（原 wg equalArrays）：partial unwrap 时允许 b 更长，否则长度必须
 * 相等；Set（unwrapped ordering 检测）路径 + 循环引用缓存。
 */
function equalArrays(
  a: unknown[],
  b: unknown[],
  bitmask: number,
  customizer: EqualCustomizer | undefined,
  equalFunc: EqualFunc,
  stack: EqualStack,
): boolean {
  const isPartial = (bitmask & COMPARE_PARTIAL_FLAG) !== 0;
  const arrLength = a.length;
  const othLength = b.length;
  if (arrLength !== othLength && !(isPartial && othLength > arrLength)) return false;

  const stackedA = stack.get(a);
  const stackedB = stack.get(b);
  if (stackedA && stackedB) return stackedA === b && stackedB === a;

  let index = -1;
  let result = true;
  const seen = (bitmask & COMPARE_UNORDERED_FLAG) !== 0 ? new Set<number>() : undefined;
  stack.set(a, b);
  stack.set(b, a);
  while (++index < arrLength) {
    const aValue = a[index];
    const bValue = b[index];
    let compared: unknown;
    if (customizer)
      compared = isPartial
        ? customizer(bValue, aValue, index, b, a, stack)
        : customizer(aValue, bValue, index, a, b, stack);
    if (compared !== undefined) {
      if (compared) continue;
      result = false;
      break;
    }
    if (seen) {
      if (
        !b.some((bItem, othIndex) => {
          if (!seen.has(othIndex) && (aValue === bItem || equalFunc(aValue, bItem, bitmask, customizer, stack)))
            return seen.add(othIndex);
        })
      ) {
        result = false;
        break;
      }
    } else if (!(aValue === bValue || equalFunc(aValue, bValue, bitmask, customizer, stack))) {
      result = false;
      break;
    }
  }
  stack.delete(a);
  stack.delete(b);
  return result;
}

/**
 * 非数组 tagged 值相等（原 Ite equalByTag：
 * Date/Error/RegExp/Map/Set/Symbol/ArrayBuffer/DataView）。
 */
function equalByTag(
  obj: any,
  other: any,
  tag: string,
  bitmask: number,
  customizer: EqualCustomizer | undefined,
  equalFunc: EqualFunc,
  stack: EqualStack,
): boolean {
  switch (tag) {
    case "[object DataView]":
      if (obj.byteLength !== other.byteLength || obj.byteOffset !== other.byteOffset) return false;
      obj = obj.buffer;
      other = other.buffer;
    // falls through
    case "[object ArrayBuffer]": {
      if (
        obj.byteLength !== other.byteLength ||
        !equalFunc(new Uint8ArrayRef(obj), new Uint8ArrayRef(other), bitmask, customizer, stack)
      )
        return false;
      return true;
    }
    case "[object Boolean]":
    case "[object Date]":
    case "[object Number]":
      // 强制 NaN === NaN。
      return +obj === +other;
    case "[object Error]":
      return obj.name === other.name && obj.message === other.message;
    case "[object RegExp]":
    case "[object String]":
      // 原实现为松散相等（e == t + ''）：对象侧经 toString 强制转换后比较。
      return obj == other + "";
    case "[object Map]":
      return equalByTagMapSet(mapToArray);
    case "[object Set]":
      return equalByTagMapSet(setToArray);
  }
  return false;

  function equalByTagMapSet(convert: (m: unknown) => unknown[]): boolean {
    const isPartial = (bitmask & COMPARE_PARTIAL_FLAG) !== 0;
    const objConverted = convert(obj);
    const othConverted = convert(other);
    if (objConverted.length !== othConverted.length && !isPartial) return false;
    // 与原实现一致：entries 顺序无关（|= COMPARE_UNORDERED_FLAG）。
    const combinedBitmask = bitmask | COMPARE_UNORDERED_FLAG;
    const stacked = stack.get(obj);
    if (stacked) return stacked === other;
    stack.set(obj, other);
    const result = equalArrays(objConverted, othConverted, combinedBitmask, customizer, equalFunc, stack);
    stack.delete(obj);
    return result;
  }
}

/** 对象自身可枚举键（原 Gg~Zg keys 的合并形态）。 */
function keysOf(value: unknown): (string | symbol)[] {
  const keys: (string | symbol)[] = [];
  for (const key of Reflect.ownKeys(value as object)) {
    const descriptor = Object.getOwnPropertyDescriptor(value as object, key);
    if (descriptor?.enumerable) keys.push(key);
  }
  return keys;
}

/** 对象相等（原 $g equalObjects）。 */
function equalObjects(
  object: Record<PropertyKey, unknown>,
  other: Record<PropertyKey, unknown>,
  bitmask: number,
  customizer: EqualCustomizer | undefined,
  equalFunc: EqualFunc,
  stack: EqualStack,
): boolean {
  const isPartial = (bitmask & COMPARE_PARTIAL_FLAG) !== 0;
  const objProps = keysOf(object);
  const objLength = objProps.length;
  const othProps = keysOf(other);
  if (objLength !== othProps.length && !isPartial) return false;

  let index = objLength;
  while (index--) {
    const key = objProps[index];
    if (!(isPartial ? key in other : Object.prototype.hasOwnProperty.call(other, key))) return false;
  }

  const stackedObject = stack.get(object);
  const stackedOther = stack.get(other);
  if (stackedObject && stackedOther) return stackedObject === other && stackedOther === object;

  let result = true;
  stack.set(object, other);
  stack.set(other, object);
  let skipCtor = isPartial;
  index = -1;
  while (++index < objLength) {
    const key = objProps[index];
    const objValue = object[key];
    const othValue = other[key];
    let compared: unknown;
    if (customizer)
      compared = isPartial
        ? customizer(othValue, objValue, key, other, object, stack)
        : customizer(objValue, othValue, key, object, other, stack);
    if (
      !(
        compared === undefined
          ? objValue === othValue || equalFunc(objValue, othValue, bitmask, customizer, stack)
          : compared
      )
    ) {
      result = false;
      break;
    }
    skipCtor ||= key === "constructor";
  }

  if (result && !skipCtor) {
    const objCtor = object.constructor;
    const othCtor = other.constructor;
    if (
      objCtor !== othCtor &&
      "constructor" in object &&
      "constructor" in other &&
      !(
        typeof objCtor === "function" &&
        objCtor instanceof objCtor &&
        typeof othCtor === "function" &&
        othCtor instanceof othCtor
      )
    )
      result = false;
  }
  stack.delete(object);
  stack.delete(other);
  return result;
}

/**
 * 深比较分派（原 a_ baseIsEqualDeep）。
 * Array/Arguments → Object 归一；Buffer 视作数组；数组/typed array →
 * equalArrays，其他同 tag 值 → equalByTag；纯对象 → equalObjects。
 * `__wrapped__`（lodash wrapper）按原实现解包后用 equalFunc 直比。
 */
function baseIsEqualDeep(
  obj: any,
  other: any,
  bitmask: number,
  customizer: EqualCustomizer | undefined,
  equalFunc: EqualFunc,
  stack: EqualStack,
): boolean {
  let objIsArr = Array.isArray(obj);
  const otherIsArr = Array.isArray(other);
  let objTag = objIsArr ? "[object Array]" : baseGetTag(obj);
  let otherTag = otherIsArr ? "[object Array]" : baseGetTag(other);
  objTag = objTag === "[object Arguments]" ? "[object Object]" : objTag;
  otherTag = otherTag === "[object Arguments]" ? "[object Object]" : otherTag;

  let objIsObj = objTag === "[object Object]";
  const otherIsObj = otherTag === "[object Object]";
  const isSameTag = objTag === otherTag;

  if (isSameTag && isBufferLike(obj)) {
    if (!isBufferLike(other)) return false;
    // Buffer 按数组比较（原实现把 objIsArr 置 true / objIsObj 置 false）。
    objIsArr = true;
    objIsObj = false;
  }
  if (isSameTag && !objIsObj) {
    // 数组或 typed array → equalArrays；其余同 tag 值 → equalByTag。
    return (objIsArr || isTypedArrayLike(obj))
      ? equalArrays(obj, other, bitmask, customizer, equalFunc, stack)
      : equalByTag(obj, other, objTag, bitmask, customizer, equalFunc, stack);
  }
  if ((bitmask & COMPARE_PARTIAL_FLAG) === 0) {
    // lodash wrapper 对象：解包后直比（原 `__wrapped__` 检查）。
    const objIsWrapped = objIsObj && Object.prototype.hasOwnProperty.call(obj, "__wrapped__");
    const othIsWrapped = otherIsObj && Object.prototype.hasOwnProperty.call(other, "__wrapped__");
    if (objIsWrapped || othIsWrapped) {
      const objUnwrapped = objIsWrapped ? obj.value() : obj;
      const othUnwrapped = othIsWrapped ? other.value() : other;
      return equalFunc(objUnwrapped, othUnwrapped, bitmask, customizer, stack);
    }
  }
  return isSameTag ? equalObjects(obj, other, bitmask, customizer, equalFunc, stack) : false;
}

/**
 * 深比较（原 `XC.default` = vendored lodash isEqual）。
 * 忠实复刻 o_/a_ 两层：非对象走 `e !== e && t !== t`（NaN 相等）。
 */
export function deepEqual(value: unknown, other: unknown): boolean {
  if (value === other) return true;
  if (value == null || other == null || (!isObjectLike(value) && !isObjectLike(other)))
    return value !== value && other !== other;
  return baseIsEqualDeep(value, other, 0, undefined, deepEqualInternal, new EqualStack());

  function deepEqualInternal(a: unknown, b: unknown, _bitmask: number, _customizer: EqualCustomizer | undefined, stack: EqualStack): boolean {
    // lodash 的 equalFunc 即 baseIsEqual 本身：每层递归都重走 null/NaN 判定。
    if (a === b) return true;
    if (a == null || b == null || (!isObjectLike(a) && !isObjectLike(b))) return a !== a && b !== b;
    return baseIsEqualDeep(a, b, 0, undefined, deepEqualInternal, stack);
  }
}

// ---------------------------------------------------------------------------
// Linux 包更新器（原 19555-19633 行 ZC/QC/$C/ew/tw/nw/rw）
// ---------------------------------------------------------------------------

/** linux 包元数据文件名（原 `ZC`）。 */
export const LINUX_PACKAGE_METADATA_FILENAME = "linux-package-metadata.json";

/** 检查间隔（原 `QC`，15 分钟）。 */
const CHECK_INTERVAL_MS = 900_000;

/** 安装的包元数据 schema（原 `$C`；codexAppBrand 必须为 "chatgpt"）。 */
const linuxPackageMetadataSchema: any = objectSchema({
  codexAppBrand: stringSchema().trim().pipe(literalSchema("chatgpt")),
  codexBuildFlavor: stringSchema(),
  version: stringSchema().trim().min(1),
});

/** LinuxPackageUpdater 构造选项（SparkleManager 的 initializeLinuxPackageUpdater 传入）。 */
export interface LinuxPackageUpdaterOptions {
  buildFlavor: string;
  executablePath: string;
  isPackaged: boolean;
  /** 当前运行中的 app 版本（app.getVersion()）。 */
  runningVersion: string;
  onInstallUpdatesRequested?(): void;
  onUpdateReadyChanged(isReady: boolean): void;
}

/**
 * Linux 包管理器更新器（原 `ew`）。
 * 只读安装元数据判断「包管理器已装新包等重启」，安装动作 = relaunch。
 */
export class LinuxPackageUpdater {
  private options: LinuxPackageUpdaterOptions;
  isUpdateReady = false;

  constructor(options: LinuxPackageUpdaterOptions) {
    this.options = options;
  }

  initialize(): void {
    if (!this.hasUpdater()) return;
    void this.checkForUpdates();
    setInterval(() => {
      void this.checkForUpdates();
    }, CHECK_INTERVAL_MS).unref();
  }

  hasUpdater(): boolean {
    return isLinuxPackageUpdaterSupported(this.options);
  }

  getIsUpdateReady(): boolean {
    return this.isUpdateReady;
  }

  getUnavailableReason(): string | null {
    return this.hasUpdater() ? null : "unsupported Linux package runtime";
  }

  checkForUpdates = async (): Promise<void> => {
    if (!this.hasUpdater() || this.isUpdateReady) return;
    const installedVersion = readInstalledLinuxPackageVersion({
      buildFlavor: this.options.buildFlavor,
      executablePath: this.options.executablePath,
    });
    if (
      installedVersion != null &&
      isSemverGreaterThan(installedVersion, this.options.runningVersion)
    ) {
      this.isUpdateReady = true;
      this.options.onUpdateReadyChanged(true);
    }
  };

  async checkForUpdateInformation(): Promise<
    { status: "restart_required" } | { status: "unavailable"; reason: string }
  > {
    await this.checkForUpdates();
    return this.isUpdateReady
      ? { status: "restart_required" }
      : {
          status: "unavailable",
          reason:
            "Linux updates are managed by the package manager. No installed update requiring restart was detected; remote release availability was not checked.",
        };
  }

  async installUpdatesIfAvailable(): Promise<void> {
    if (!this.isUpdateReady) return;
    app.relaunch();
    this.options.onInstallUpdatesRequested?.();
  }
}

/** 平台门控（原 `tw`）：linux + 打包 + flavor 允许 Linux 包更新器。 */
function isLinuxPackageUpdaterSupported({
  buildFlavor,
  isPackaged,
}: {
  buildFlavor: string;
  isPackaged: boolean;
}): boolean {
  return (
    process.platform === "linux" &&
    isPackaged &&
    BuildFlavor.shouldIncludeLinuxPackageUpdater(buildFlavor, process.platform)
  );
}

/**
 * 读取已安装包的版本（原 `nw`）：可执行文件旁 resources/linux-package-metadata.json，
 * flavor 匹配才返回版本；读/解析失败返回 null。
 */
function readInstalledLinuxPackageVersion({
  buildFlavor,
  executablePath,
}: {
  buildFlavor: string;
  executablePath: string;
}): string | null {
  const metadataPath = join(
    dirname(executablePath),
    "resources",
    LINUX_PACKAGE_METADATA_FILENAME,
  );
  try {
    const parsed = linuxPackageMetadataSchema.safeParse(
      JSON.parse(readFileSync(metadataPath, "utf8")),
    );
    if (!parsed.success || BuildFlavor.parse(parsed.data.codexBuildFlavor) !== buildFlavor)
      return null;
    return parsed.data.version;
  } catch {
    return null;
  }
}

/** 安装版本是否严格大于运行版本（原 `rw`：round-trip 校验后逐段比较）。 */
function isSemverGreaterThan(installedVersion: string, runningVersion: string): boolean {
  let installed: { major: number; minor: number; patch: number };
  let running: { major: number; minor: number; patch: number };
  try {
    installed = parseSemanticVersion(installedVersion);
    running = parseSemanticVersion(runningVersion);
  } catch {
    return false;
  }
  // 版本串必须能无损 round-trip（防止畸形版本参与比较）。
  if (formatSemanticVersion(installed) !== installedVersion) return false;
  if (formatSemanticVersion(running) !== runningVersion) return false;
  for (const part of ["major", "minor", "patch"] as const) {
    if (installed[part] !== running[part]) return installed[part] > running[part];
  }
  return false;
}
