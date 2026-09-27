import "@rchunk/rolldown-runtime";
import { dun as createPersistedState } from "@rchunk/app-initial";

interface WritableState<Value> {
  value: Value;
}

let t: WritableState<boolean>;

function n(): void {
  t ??= createPersistedState(
    "avatar-overlay-debug-window-border-visible",
    false,
  ) as unknown as WritableState<boolean>;
}

export { n, t };
