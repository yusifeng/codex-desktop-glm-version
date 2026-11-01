import "@rchunk/rolldown-runtime";
import {
  $3 as getCompilerRuntime,
  K3 as useHostMessageHandler,
  W3 as initializeHostMessageBridge,
} from "@rchunk/app-shared";

interface CompilerRuntime {
  c(size: number): unknown[];
}

let compilerRuntime: CompilerRuntime;

export interface ThreadPinShortcutBridgeProps {
  enabled: boolean;
  onToggle(): void;
}

function ThreadPinShortcutBridge({
  enabled,
  onToggle,
}: ThreadPinShortcutBridgeProps): null {
  const cache = compilerRuntime.c(5);
  let handler: () => void;
  if (cache[0] !== enabled || cache[1] !== onToggle) {
    handler = () => {
      if (enabled) onToggle();
    };
    cache[0] = enabled;
    cache[1] = onToggle;
    cache[2] = handler;
  } else {
    handler = cache[2] as () => void;
  }

  let dependencies: boolean[];
  if (cache[3] !== enabled) {
    dependencies = [enabled];
    cache[3] = enabled;
    cache[4] = dependencies;
  } else {
    dependencies = cache[4] as boolean[];
  }
  useHostMessageHandler("toggle-thread-pin", handler, dependencies);
  return null;
}

function initializeThreadPinShortcutBridge(): void {
  compilerRuntime = getCompilerRuntime() as unknown as CompilerRuntime;
  initializeHostMessageBridge();
}

export {
  initializeThreadPinShortcutBridge as n,
  ThreadPinShortcutBridge as t,
};
