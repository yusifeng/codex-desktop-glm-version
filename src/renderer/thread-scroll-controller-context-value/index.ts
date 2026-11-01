import "@rchunk/rolldown-runtime";
import { e6 as getReactRuntime } from "@rchunk/app-shared";

interface ReactRuntime {
  createContext<T>(value: T): unknown;
  use<T>(context: unknown): T;
}

let React: ReactRuntime;
let threadScrollControllerContext: unknown;
let initialized = false;

function initializeThreadScrollControllerContext(): void {
  if (initialized) return;
  initialized = true;
  React = getReactRuntime() as unknown as ReactRuntime;
  threadScrollControllerContext = React.createContext(null);
}

function useThreadScrollController(): unknown {
  initializeThreadScrollControllerContext();
  const value = React.use(threadScrollControllerContext);
  if (value == null) {
    throw new Error("useThreadScrollController must be used within ThreadScrollLayout");
  }
  return value;
}

export {
  initializeThreadScrollControllerContext as n,
  useThreadScrollController as r,
  threadScrollControllerContext as t,
};
