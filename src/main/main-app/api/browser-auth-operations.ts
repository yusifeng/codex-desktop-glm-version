// Browser sign-in recovery operation ledger (old main `iEe`). Kept separate
// from the full desktop-fetch pipeline so lightweight service assembly does not
// load the HTTP proxy and its transitive runtime at module initialization.
import {
  I as BROWSER_AUTH_OPERATIONS_KEY,
  dt as BrowserAuthOperationsStore,
} from "@chunk/bootstrap";

interface GlobalStateLike {
  updateAndPersist(key: unknown, update: (value: unknown) => unknown): Promise<void>;
}

export function createBrowserAuthOperations(globalState: GlobalStateLike) {
  return new BrowserAuthOperationsStore(async (update: (value: unknown) => { value: unknown; result: unknown }) => {
    let committed: { value: unknown; result: unknown } | undefined;
    await globalState.updateAndPersist(BROWSER_AUTH_OPERATIONS_KEY, (value) => {
      const result = update(value);
      committed = result;
      return result.value;
    });
    if (committed == null) throw new Error("Browser sign-in recovery was not committed");
    return committed.result;
  });
}
