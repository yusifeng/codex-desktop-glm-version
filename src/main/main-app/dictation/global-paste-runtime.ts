// @ts-nocheck

const APP_KIT_PATH = `/System/Library/Frameworks/AppKit.framework/AppKit`;
const IGNORED_AX_ERRORS = new Set([-25204, -25205]);
const MAX_MENU_ITEMS = 1000;
const PRE_PASTE_DELAY_MS = 150;
const POST_PASTE_DELAY_MS = 700;

function readAxAttribute(context: Record<string, any>, element: unknown, attribute: string) {
  const output = Buffer.alloc(8);
  if (
    context.callFunction(
      `AXUIElementCopyAttributeValue`,
      { returns: `i`, args: [`@`, `@`, `^v`] },
      element,
      context.nativeString(attribute),
      output,
    ) !== 0 ||
    output.readBigUInt64LE(0) === 0n
  ) {
    return undefined;
  }
  const value = context.fromPointer(output);
  context.callFunction(`CFRelease`, { returns: `v`, args: [`@`] }, value);
  return value;
}

function readAxString(context: Record<string, any>, element: unknown, attribute: string) {
  return readAxAttribute(context, element, attribute)?.UTF8String();
}

function findPasteMenuItem(context: Record<string, any>, menuBar: unknown) {
  const pending = [menuBar];
  let inspected = 0;
  let commandKeyCandidate;
  let hasAmbiguousCommandKeyCandidate = false;
  while (pending.length > 0) {
    const element = pending.pop();
    if (element == null) continue;
    inspected += 1;
    if (inspected > MAX_MENU_ITEMS) {
      throw Error(`The foreground application menu is too large to search.`);
    }
    if (readAxString(context, element, `AXRole`) === `AXMenuItem`) {
      if (!readAxAttribute(context, element, `AXEnabled`)?.boolValue()) continue;
      const identifier = readAxString(context, element, `AXIdentifier`);
      if (identifier != null && /(?:^|[./_-])paste:?$/iu.test(identifier)) return element;
      const title = readAxString(context, element, `AXTitle`);
      if (title === `Paste` || title === context.localizedPasteTitle) return element;
      const commandCharacter = readAxString(context, element, `AXMenuItemCmdChar`);
      const commandModifiers = readAxAttribute(context, element, `AXMenuItemCmdModifiers`);
      if (commandCharacter?.toLowerCase() === `v` && commandModifiers?.intValue() === 0) {
        if (commandKeyCandidate == null) commandKeyCandidate = element;
        else hasAmbiguousCommandKeyCandidate = true;
      }
    }
    const children = readAxAttribute(context, element, `AXChildren`);
    if (children == null) continue;
    for (let index = children.count() - 1; index >= 0; index -= 1) {
      pending.push(children.objectAtIndex$(index));
    }
  }
  return hasAmbiguousCommandKeyCandidate ? undefined : commandKeyCandidate;
}

async function activateMacPasteCommand(signal: Record<string, any> | undefined, loadObjc: Function) {
  const { callFunction, fromPointer, NobjcLibrary } = await loadObjc();
  signal?.throwIfAborted();
  const library = new NobjcLibrary(APP_KIT_PATH);
  const NSString = library.NSString;
  const nativeStrings = new Map();
  const nativeString = (value: string) => {
    const existing = nativeStrings.get(value);
    if (existing != null) return existing;
    const created = NSString.stringWithUTF8String$(value);
    nativeStrings.set(value, created);
    return created;
  };
  const appKitBundle = library.NSBundle.bundleWithIdentifier$(nativeString(`com.apple.AppKit`));
  let localizedPasteTitle = `Paste`;
  if (appKitBundle != null) {
    localizedPasteTitle = appKitBundle
      .localizedStringForKey$value$table$(
        nativeString(`Paste`),
        nativeString(`Paste`),
        nativeString(`MenuCommands`),
      )
      .UTF8String();
  }
  const context = { callFunction, fromPointer, localizedPasteTitle, nativeString };
  const systemWide = callFunction(`AXUIElementCreateSystemWide`, { returns: `@`, args: [] });
  if (systemWide == null) throw Error(`Unable to access the macOS accessibility system.`);
  callFunction(`CFRelease`, { returns: `v`, args: [`@`] }, systemWide);
  const focusedApplication = readAxAttribute(context, systemWide, `AXFocusedApplication`);
  const menuBar =
    focusedApplication == null
      ? undefined
      : readAxAttribute(context, focusedApplication, `AXMenuBar`);
  if (menuBar == null) {
    throw Error(`The foreground application does not expose an accessible menu bar.`);
  }
  const pasteMenuItem = findPasteMenuItem(context, menuBar);
  if (pasteMenuItem == null) {
    throw Error(`The foreground application does not expose an enabled Paste command.`);
  }
  signal?.throwIfAborted();
  const result = callFunction(
    `AXUIElementPerformAction`,
    { returns: `i`, args: [`@`, `@`] },
    pasteMenuItem,
    nativeString(`AXPress`),
  );
  if (result !== 0 && !IGNORED_AX_ERRORS.has(result)) {
    throw Error(
      `Unable to activate the foreground application's Paste command (accessibility error ${result}).`,
      { cause: result },
    );
  }
}

export function createGlobalPasteRuntime(options: Record<string, any>) {
  const {
    platform,
    clipboard,
    isAccessibilityTrusted,
    createHash,
    delay,
    execFile,
    logger,
    now = Date.now,
    loadObjc = () => import(`objc-js`),
    activateMacPaste = (signal: unknown) => activateMacPasteCommand(signal, loadObjc),
  } = options;

  function getClipboardFingerprint() {
    const hash = createHash(`sha256`);
    hash.update(clipboard.readText());
    for (const format of clipboard.availableFormats().sort()) {
      hash.update(format);
      hash.update(clipboard.readBuffer(format));
    }
    return hash.digest(`hex`);
  }

  function snapshotClipboard() {
    return {
      data: {
        text: clipboard.readText(),
        html: clipboard.readHTML(),
        rtf: clipboard.readRTF(),
        image: clipboard.readImage(),
        bookmark: clipboard.readBookmark().title,
      },
      formats: clipboard
        .availableFormats()
        .map((format: string) => ({ format, data: clipboard.readBuffer(format) })),
    };
  }

  function restoreClipboard(snapshot: Record<string, any>) {
    clipboard.write(snapshot.data);
    const restoredFormats = new Set(clipboard.availableFormats());
    for (const { format, data } of snapshot.formats) {
      if (!restoredFormats.has(format)) clipboard.writeBuffer(format, data);
    }
  }

  function restoreClipboardIfUnchanged(snapshot: Record<string, any>, pastedText: string) {
    if (clipboard.readText() !== pastedText) return false;
    restoreClipboard(snapshot);
    return true;
  }

  async function performSystemPaste(signal: Record<string, any> | undefined) {
    signal?.throwIfAborted();
    switch (platform) {
      case `darwin`:
        if (!isAccessibilityTrusted()) {
          throw Error(`Accessibility permission is required to paste global dictation.`);
        }
        try {
          await activateMacPaste(signal);
        } catch {
          signal?.throwIfAborted();
          await execFile(
            `/usr/bin/osascript`,
            [`-e`, `tell application "System Events" to keystroke "v" using command down`],
            { signal },
          );
        }
        return;
      case `win32`:
        await execFile(
          `powershell.exe`,
          [
            `-STA`,
            `-NoProfile`,
            `-NonInteractive`,
            `-ExecutionPolicy`,
            `Bypass`,
            `-Command`,
            `Add-Type -AssemblyName System.Windows.Forms; [System.Windows.Forms.SendKeys]::SendWait('^v')`,
          ],
          { signal },
        );
        return;
      default:
        throw Error(`Global dictation paste is not supported on this OS.`);
    }
  }

  async function pasteGlobalDictation(
    text: string,
    stoppedAtMs: number | undefined,
    expectedClipboardFingerprint: string | undefined,
    signal: Record<string, any> | undefined,
  ) {
    if (signal?.aborted) return null;
    const lacksAccessibility = platform === `darwin` && !isAccessibilityTrusted();
    if (
      expectedClipboardFingerprint != null &&
      getClipboardFingerprint() !== expectedClipboardFingerprint
    ) {
      return {
        text,
        copied: false,
        reason: lacksAccessibility ? `accessibility` : `clipboard-changed`,
      };
    }

    const originalClipboard = snapshotClipboard();
    clipboard.writeText(text);
    const pastedClipboardFingerprint = getClipboardFingerprint();
    if (lacksAccessibility) return { text, copied: true, reason: `accessibility` };

    let pasteStarted = false;
    try {
      const elapsedMs =
        stoppedAtMs != null && Number.isFinite(stoppedAtMs)
          ? Math.max(0, now() - stoppedAtMs)
          : 0;
      await delay(Math.max(0, PRE_PASTE_DELAY_MS - elapsedMs));
      signal?.throwIfAborted();
      if (getClipboardFingerprint() !== pastedClipboardFingerprint) {
        return { text, copied: false, reason: `clipboard-changed` };
      }
      pasteStarted = true;
      await performSystemPaste(signal);
      await delay(POST_PASTE_DELAY_MS);
    } catch (error) {
      if (signal?.aborted) {
        if (pasteStarted) await delay(POST_PASTE_DELAY_MS);
        if (getClipboardFingerprint() === pastedClipboardFingerprint) {
          restoreClipboardIfUnchanged(originalClipboard, text);
        }
        return null;
      }
      logger.warning(`Global dictation paste failed`, { safe: {}, sensitive: { error } });
      return {
        text,
        copied: getClipboardFingerprint() === pastedClipboardFingerprint,
        reason:
          platform === `darwin` && !isAccessibilityTrusted() ? `accessibility` : `paste`,
      };
    }

    if (getClipboardFingerprint() === pastedClipboardFingerprint) {
      restoreClipboardIfUnchanged(originalClipboard, text);
    }
    return null;
  }

  return { getClipboardFingerprint, pasteGlobalDictation, performSystemPaste };
}

if (typeof module !== "undefined") {
  module.exports = { createGlobalPasteRuntime };
}
