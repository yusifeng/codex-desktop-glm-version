// use-hotkey-window-dismiss-on-escape — dismiss the hotkey window on an unmodified Escape.

import "@rchunk/rolldown-runtime";
import { e6 as getReactRuntime } from "@rchunk/app-shared";
import { mnt as initializeHotkeyWindow, pnt as hotkeyWindowState } from "@rchunk/app-initial";

interface EffectReactRuntime { useEffect(effect: () => void | (() => void), dependencies: readonly unknown[]): void }
interface HotkeyWindowState { hotkeyWindowHotkeys?: { dismiss(): void } }

let React: EffectReactRuntime;
function initializeHotkeyWindowDismiss(): void {
  if (React != null) return;
  initializeHotkeyWindow();
  React = getReactRuntime() as unknown as EffectReactRuntime;
}
function handleEscape(event: KeyboardEvent): void {
  if (event.key !== "Escape" || event.defaultPrevented || event.metaKey || event.ctrlKey || event.altKey || event.shiftKey) return;
  event.preventDefault();
  event.stopPropagation();
  (hotkeyWindowState as unknown as HotkeyWindowState).hotkeyWindowHotkeys?.dismiss();
}
function subscribeToEscape(): () => void {
  window.addEventListener("keydown", handleEscape);
  return () => window.removeEventListener("keydown", handleEscape);
}
function useHotkeyWindowDismissOnEscape(): void {
  initializeHotkeyWindowDismiss();
  React.useEffect(subscribeToEscape, []);
}

export { useHotkeyWindowDismissOnEscape as n, initializeHotkeyWindowDismiss as t };
