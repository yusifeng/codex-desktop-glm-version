import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import fs from "node:fs";
import { createGlobalPasteRuntime } from "../src/main/main-app/dictation/global-paste-runtime.ts";

let assertions = 0;
const equal = (actual, expected) => {
  assert.deepEqual(actual, expected);
  assertions += 1;
};

function createClipboard() {
  let data = {
    text: "original",
    html: "<b>original</b>",
    rtf: "{original}",
    image: { id: "image" },
    bookmark: "bookmark",
  };
  const formats = new Map([
    ["text/plain", Buffer.from("original")],
    ["custom/type", Buffer.from("custom")],
  ]);
  return {
    readText: () => data.text,
    readHTML: () => data.html,
    readRTF: () => data.rtf,
    readImage: () => data.image,
    readBookmark: () => ({ title: data.bookmark }),
    availableFormats: () => [...formats.keys()],
    readBuffer: (format) => formats.get(format) ?? Buffer.alloc(0),
    writeText: (text) => {
      data = { text, html: "", rtf: "", image: null, bookmark: "" };
      formats.clear();
      formats.set("text/plain", Buffer.from(text));
    },
    write: (next) => {
      data = { ...next };
      formats.clear();
      formats.set("text/plain", Buffer.from(next.text));
    },
    writeBuffer: (format, value) => formats.set(format, value),
    state: () => ({ data, formats: new Map(formats) }),
  };
}

function createHarness(overrides = {}) {
  const clipboard = overrides.clipboard ?? createClipboard();
  const delays = [];
  const commands = [];
  const logs = [];
  const options = {
    platform: "win32",
    clipboard,
    isAccessibilityTrusted: () => true,
    createHash,
    delay: async (milliseconds) => { delays.push(milliseconds); },
    execFile: async (...args) => { commands.push(args); },
    logger: { warning: (...args) => logs.push(args) },
    now: () => 1_000,
    ...overrides,
    clipboard,
  };
  return { ...createGlobalPasteRuntime(options), clipboard, commands, delays, logs };
}

{
  const harness = createHarness();
  const first = harness.getClipboardFingerprint();
  equal(first.length, 64);
  harness.clipboard.writeBuffer("another/type", Buffer.from("value"));
  equal(harness.getClipboardFingerprint() === first, false);
}

{
  const harness = createHarness();
  equal(await harness.pasteGlobalDictation("dictation", undefined, "wrong", undefined), {
    text: "dictation",
    copied: false,
    reason: "clipboard-changed",
  });
  equal(harness.clipboard.readText(), "original");
}

{
  const harness = createHarness({ platform: "darwin", isAccessibilityTrusted: () => false });
  equal(await harness.pasteGlobalDictation("dictation", undefined, "wrong", undefined), {
    text: "dictation",
    copied: false,
    reason: "accessibility",
  });
  equal(await harness.pasteGlobalDictation("dictation", undefined, undefined, undefined), {
    text: "dictation",
    copied: true,
    reason: "accessibility",
  });
  equal(harness.clipboard.readText(), "dictation");
}

{
  const harness = createHarness();
  equal(await harness.pasteGlobalDictation("dictation", 900, undefined, undefined), null);
  equal(harness.delays, [50, 700]);
  equal(harness.commands[0][0], "powershell.exe");
  equal(harness.commands[0][1].at(-1).includes("SendWait('^v')"), true);
  equal(harness.clipboard.readText(), "original");
  equal(harness.clipboard.state().formats.get("custom/type").toString(), "custom");
}

{
  const clipboard = createClipboard();
  let delayCount = 0;
  const harness = createHarness({
    clipboard,
    delay: async () => {
      delayCount += 1;
      if (delayCount === 1) clipboard.writeText("user changed");
    },
  });
  equal(await harness.pasteGlobalDictation("dictation", undefined, undefined, undefined), {
    text: "dictation",
    copied: false,
    reason: "clipboard-changed",
  });
  equal(harness.commands, []);
  equal(clipboard.readText(), "user changed");
}

{
  const failure = new Error("paste failed");
  const harness = createHarness({ execFile: async () => { throw failure; } });
  equal(await harness.pasteGlobalDictation("dictation", undefined, undefined, undefined), {
    text: "dictation",
    copied: true,
    reason: "paste",
  });
  equal(harness.logs, [[
    "Global dictation paste failed",
    { safe: {}, sensitive: { error: failure } },
  ]]);
  equal(harness.clipboard.readText(), "dictation");
}

{
  const signal = { aborted: true, throwIfAborted: () => { throw new Error("aborted"); } };
  const harness = createHarness();
  equal(await harness.pasteGlobalDictation("dictation", undefined, undefined, signal), null);
  equal(harness.clipboard.readText(), "original");
}

{
  const fallbackFailure = new Error("native failed");
  const harness = createHarness({
    platform: "darwin",
    activateMacPaste: async () => { throw fallbackFailure; },
  });
  await harness.performSystemPaste(undefined);
  equal(harness.commands, [[
    "/usr/bin/osascript",
    ["-e", "tell application \"System Events\" to keystroke \"v\" using command down"],
    { signal: undefined },
  ]]);
}

{
  const harness = createHarness({ platform: "linux" });
  await assert.rejects(() => harness.performSystemPaste(undefined), /not supported/);
  assertions += 1;
}

const main = fs.readFileSync(
  new URL("../.reference/originals/main/main-C-Mhak1n.ts", import.meta.url),
  "utf8",
);
equal(main.includes("createGlobalPasteRuntime"), true);
equal(main.includes("pasteGlobalDictation: nat"), true);
equal(main.includes("async function nat("), false);
equal(main.includes("async function $it("), false);
equal(main.includes("function B7("), false);
equal(main.includes("function aat("), false);

console.log(`${assertions} main global-paste runtime assertions passed`);
