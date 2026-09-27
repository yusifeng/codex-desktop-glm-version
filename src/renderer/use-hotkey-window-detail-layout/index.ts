import * as appSharedChunk from "@rchunk/app-shared";
import "@rchunk/rolldown-runtime";
import type { ReactRuntime } from "@rchunk/app-shared";

const { e6: getReactRuntime } = appSharedChunk;
let React: ReactRuntime;
let HotkeyWindowDetailLayoutContext: unknown;

function useHotkeyWindowDetailLayout(layout: unknown): void {
  initializeHotkeyWindowDetailLayout();
  const setLayout = React.useContext(HotkeyWindowDetailLayoutContext) as
    ((value: unknown) => void) | null;
  React.useLayoutEffect(() => {
    if (setLayout == null) return undefined;
    setLayout(layout);
    return () => setLayout(null);
  }, [layout, setLayout]);
}

function initializeHotkeyWindowDetailLayout(): void {
  if (React != null) return;
  React = getReactRuntime();
  HotkeyWindowDetailLayoutContext = React.createContext(null);
}
initializeHotkeyWindowDetailLayout();
export {
  initializeHotkeyWindowDetailLayout as n,
  useHotkeyWindowDetailLayout as r,
  HotkeyWindowDetailLayoutContext as t,
};
