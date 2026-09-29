import "@rchunk/rolldown-runtime";
import * as appSharedChunk from "@rchunk/app-shared";
import {
  n as initializeTerminalThumbnail,
  t as TerminalThumbnail,
  type TerminalOutputSpan,
} from "@rchunk/terminal-thumbnail";

const {
  $3: initializeRuntimeLazy,
  I3: getJsxRuntime,
  e6: getReactRuntime,
} = appSharedChunk;

export interface BackgroundTerminalReadState {
  readOutput?: () => readonly TerminalOutputSpan[] | null;
}

export interface BackgroundTerminalThumbnailProps {
  readState?: () => BackgroundTerminalReadState | null | undefined;
  title: string;
}

let React: import("@rchunk/app-shared").ReactRuntime;
let jsx: import("@rchunk/app-shared").JsxRuntime;

function BackgroundTerminalThumbnail({
  title,
  readState,
}: BackgroundTerminalThumbnailProps): unknown {
  initializeBackgroundTerminalThumbnail();
  const [outputTail] = React.useState(
    () => readState?.()?.readOutput?.() ?? null,
  );
  return jsx.jsx(TerminalThumbnail, { title, outputTail });
}

let initialized = false;
function initializeBackgroundTerminalThumbnail(): void {
  if (initialized) return;
  initializeRuntimeLazy();
  React = getReactRuntime();
  initializeTerminalThumbnail();
  jsx = getJsxRuntime();
  initialized = true;
}

initializeBackgroundTerminalThumbnail();
export { BackgroundTerminalThumbnail };
