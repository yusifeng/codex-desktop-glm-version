export interface StylePropertyMap {
  getPropertyValue(name: string): string;
  removeProperty(name: string): string;
  setProperty(name: string, value: string): void;
}

export interface StylePropertyTarget {
  style: StylePropertyMap;
}

export type StylePropertyValues = Record<string, string | null | undefined>;

/** 原 `wyt` / 压缩导出 `Yc`。 */
export function syncStyleProperties(
  element: StylePropertyTarget,
  properties: StylePropertyValues,
): void {
  for (const [name, value] of Object.entries(properties)) {
    if (value == null) {
      if (element.style.getPropertyValue(name).length > 0) {
        element.style.removeProperty(name);
      }
      continue;
    }
    if (element.style.getPropertyValue(name) !== value) {
      element.style.setProperty(name, value);
    }
  }
}

/** 原 `Tyt` / 压缩导出 `Xc`。 */
export function initializeStylePropertySync(): void {}

/** 原 `Eyt` / 压缩导出 `Jc`。 */
export function initializeStylePropertyRuntime(): void {}
