import "@rchunk/rolldown-runtime";

let keyboardShortcutsFeatureId: string | undefined;
let initialized = false;
function initializeKeyboardShortcutsGate(): void {
  if (initialized) return;
  initialized = true;
  keyboardShortcutsFeatureId = "1932174607";
}

export { initializeKeyboardShortcutsGate as n, keyboardShortcutsFeatureId as t };
