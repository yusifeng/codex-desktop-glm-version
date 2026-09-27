import "@rchunk/rolldown-runtime";
import {
  $3 as initializeCompilerCache,
  K3 as useHostMessageHandler,
  W3 as initializeHostMessageBridge,
} from "@rchunk/app-shared";

export interface ThreadPinShortcutBridgeProps {
  enabled: boolean;
  onToggle(): void;
}

function ThreadPinShortcutBridge({
  enabled,
  onToggle,
}: ThreadPinShortcutBridgeProps): null {
  useHostMessageHandler(
    "toggle-thread-pin",
    () => {
      if (enabled) onToggle();
    },
    [enabled],
  );
  return null;
}

function initializeThreadPinShortcutBridge(): void {
  initializeCompilerCache();
  initializeHostMessageBridge();
}

export {
  initializeThreadPinShortcutBridge as n,
  ThreadPinShortcutBridge as t,
};
