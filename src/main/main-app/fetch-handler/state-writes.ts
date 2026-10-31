// @ts-nocheck

function isJsonValue(value) {
  if (value === null || typeof value === "string" || typeof value === "boolean") return true;
  if (typeof value === "number") return Number.isFinite(value);
  if (Array.isArray(value)) return value.every(isJsonValue);
  if (typeof value !== "object" || Object.getPrototypeOf(value) !== Object.prototype) return false;
  return Object.values(value).every(isJsonValue);
}

export function applySparseStateWrite(current, options) {
  const result =
    current != null &&
    typeof current === "object" &&
    !Array.isArray(current) &&
    Object.getPrototypeOf(current) === Object.prototype &&
    Object.values(current).every(isJsonValue)
      ? current
      : {};
  for (const [key, entry] of Object.entries(options.entries)) {
    if (entry?.updateOnly) {
      if (!Object.hasOwn(result, key)) continue;
    } else delete result[key];
    if (entry != null) {
      Object.defineProperty(result, key, {
        configurable: true,
        enumerable: true,
        value: entry.value,
        writable: true,
      });
    }
  }
  if (options.maxEntries != null) {
    const keys = Object.keys(result);
    for (const key of keys.slice(0, Math.max(0, keys.length - options.maxEntries))) delete result[key];
  }
  if (options.maxBytes != null) {
    let totalBytes = 2;
    for (const [key, value] of Object.entries(result).reverse()) {
      const entryBytes = new TextEncoder().encode(JSON.stringify({ [key]: value })).byteLength - 2;
      const nextBytes = totalBytes + entryBytes + Number(totalBytes > 2 && entryBytes > 0);
      if (nextBytes > options.maxBytes) delete result[key];
      else totalBytes = nextBytes;
    }
  }
  return result;
}

export function createFetchHandlerStateRuntime({
  existsSync,
  getAppPath,
  isPackaged,
  join,
  keymapAcceleratorForCommand,
  platform,
  resourcesPath,
  validateGlobalDictationHotkey,
  validateHotkey,
}) {
  function validateGlobalHotkeySetting(commandId, value) {
    const isWindowHotkey =
      commandId === "hotkeyWindow" ||
      commandId === "openAvatarOverlay" ||
      commandId === "realtimeVoice";
    if (!isWindowHotkey && commandId !== "globalDictationHold" && commandId !== "globalDictationToggle") return;
    if (value.type === "append") throw new Error("OS-global shortcuts support one keybinding.");
    if (value.type !== "set" && value.type !== "replace") return;
    const failure = isWindowHotkey
      ? validateHotkey(value.accelerator)
      : validateGlobalDictationHotkey(value.accelerator);
    if (failure != null) throw new Error(failure);
  }

  function avatarOverlayAcceleratorFromKeymap(keymapState) {
    return keymapAcceleratorForCommand({
      commandId: "openAvatarOverlay",
      keymapState,
      isMacOS: platform === "darwin",
    });
  }

  function bundledSkillsRoot() {
    const appPath = getAppPath();
    if (isPackaged()) return join(resourcesPath, "skills");
    const assetsRoot = join(appPath, "assets", "skills");
    if (existsSync(assetsRoot)) return assetsRoot;
    const siblingAssetsRoot = join(appPath, "..", "assets", "skills");
    return existsSync(siblingAssetsRoot) ? siblingAssetsRoot : null;
  }

  return { avatarOverlayAcceleratorFromKeymap, bundledSkillsRoot, validateGlobalHotkeySetting };
}

if (typeof module !== "undefined") {
  module.exports = { applySparseStateWrite, createFetchHandlerStateRuntime };
}
