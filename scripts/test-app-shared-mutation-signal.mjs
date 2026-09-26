import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const result = await esbuild.build({
  entryPoints: [
    path.join(ROOT, "src/renderer/app-shared/runtime/atom-signal.ts"),
  ],
  bundle: true,
  format: "esm",
  platform: "node",
  target: "node22",
  external: ["react"],
  write: false,
  logLevel: "silent",
});
const signals = await import(
  `data:text/javascript;base64,${Buffer.from(result.outputFiles[0].text).toString("base64")}`
);

let assertions = 0;
function check(value, message) {
  assert.ok(value, message);
  assertions += 1;
}

function deferred() {
  let resolve;
  let reject;
  const promise = new Promise((resolvePromise, rejectPromise) => {
    resolve = resolvePromise;
    reject = rejectPromise;
  });
  return { promise, reject, resolve };
}

const scope = signals.createScope("MutationWorkspace");
const queryClient = { name: "workspace-query-client" };
const state = signals.createScopeState(
  scope,
  { workspaceId: "workspace-1" },
  { queryClient },
);
const suffixSignal = signals.createScopedSignal(scope, "saved");
const events = [];
const saveMutation = signals.createMutationSignal(
  scope,
  ({ get, queryClient: activeClient, scope: activeScope }) => ({
    meta: { source: "composer" },
    mutationKey: ["save", activeScope.value.workspaceId, get(suffixSignal)],
    async mutationFn(variables, mutation) {
      events.push(["mutation", variables.title]);
      check(mutation.client === activeClient, "passes the owning query client to mutationFn");
      return { id: `${activeScope.value.workspaceId}:${variables.title}` };
    },
    async onMutate(variables, mutation) {
      events.push(["mutate", variables.title]);
      return { previousTitle: variables.previousTitle, key: mutation.mutationKey };
    },
    async onSuccess(data, variables, context, mutation) {
      events.push(["success", data.id]);
      check(context.previousTitle === variables.previousTitle, "passes onMutate context to onSuccess");
      check(mutation.meta.source === "composer", "passes mutation metadata to callbacks");
    },
    async onSettled(data, error, variables, context) {
      events.push(["settled", data?.id, error]);
      check(context.previousTitle === variables.previousTitle, "passes context to onSettled");
    },
  }),
);

check(saveMutation.cache === "cached", "marks mutation signals as cached bindings");
const first = signals.resolveScopedMutationSignal(saveMutation, state);
const firstAgain = signals.resolveScopedMutationSignal(saveMutation, state);
check(first.atom === firstAgain.atom, "reuses one mutation atom per scope instance");

const initial = first.store.get(first.atom);
check(initial.isIdle && initial.status === "idle", "starts in the idle state");
check(!initial.isPending && !initial.isSuccess && !initial.isError, "derives idle status flags");

const callEvents = [];
const savePromise = initial.mutateAsync(
  { previousTitle: "Draft", title: "Final" },
  {
    onSuccess(data, variables, context, mutation) {
      callEvents.push(["success", data.id, variables.title, context.previousTitle]);
      check(mutation.mutationKey.at(-1) === "saved", "resolves scoped options at mutation time");
    },
    onSettled(data, error) {
      callEvents.push(["settled", data.id, error]);
    },
  },
);
const pending = first.store.get(first.atom);
check(pending.isPending && pending.status === "pending", "publishes pending state immediately");
check(pending.variables.title === "Final", "stores variables while pending");
check(pending.data === undefined && pending.error === null, "clears prior result while pending");
const saved = await savePromise;
check(saved.id === "workspace-1:Final", "returns mutation data from mutateAsync");
const success = first.store.get(first.atom);
check(success.isSuccess && success.status === "success", "publishes successful state");
check(success.data === saved && success.error === null, "stores successful mutation data");
check(
  events.map(([name]) => name).join(",") === "mutate,mutation,success,settled",
  "runs option callbacks in mutation lifecycle order",
);
check(
  callEvents.map(([name]) => name).join(",") === "success,settled",
  "runs call-level success callbacks after option callbacks",
);

const failure = new Error("save failed");
const failureEvents = [];
const failingMutation = signals.createMutationSignal(scope, () => ({
  async mutationFn(variables) {
    throw variables.error;
  },
  async onMutate() {
    return { optimistic: true };
  },
  async onError(error, variables, context) {
    failureEvents.push(["error", error, variables.error, context.optimistic]);
  },
  async onSettled(data, error) {
    failureEvents.push(["settled", data, error]);
  },
}));
const failing = signals.resolveScopedMutationSignal(failingMutation, state);
const callFailureEvents = [];
await assert.rejects(
  failing.store.get(failing.atom).mutateAsync(
    { error: failure },
    {
      onError(error) {
        callFailureEvents.push(["error", error]);
      },
      onSettled(data, error) {
        callFailureEvents.push(["settled", data, error]);
      },
    },
  ),
  (error) => error === failure,
);
assertions += 1;
const failed = failing.store.get(failing.atom);
check(failed.isError && failed.error === failure, "publishes the original mutation error");
check(failed.data === undefined, "clears mutation data after failure");
check(
  failureEvents.map(([name]) => name).join(",") === "error,settled",
  "runs option error callbacks in lifecycle order",
);
check(
  callFailureEvents.map(([name]) => name).join(",") === "error,settled",
  "runs call-level error callbacks",
);

failing.store.get(failing.atom).mutate({ error: failure });
await new Promise((resolve) => setTimeout(resolve, 0));
check(failing.store.get(failing.atom).isError, "mutate swallows rejection and retains error state");

const slow = deferred();
const fast = deferred();
const concurrentMutation = signals.createMutationSignal(scope, () => ({
  mutationFn(variables) {
    return variables === "slow" ? slow.promise : fast.promise;
  },
}));
const concurrent = signals.resolveScopedMutationSignal(concurrentMutation, state);
const slowPromise = concurrent.store.get(concurrent.atom).mutateAsync("slow");
const fastPromise = concurrent.store.get(concurrent.atom).mutateAsync("fast");
fast.resolve("fast-result");
await fastPromise;
check(concurrent.store.get(concurrent.atom).data === "fast-result", "latest mutation wins shared state");
slow.resolve("slow-result");
check((await slowPromise) === "slow-result", "older mutation still resolves to its own caller");
check(
  concurrent.store.get(concurrent.atom).data === "fast-result",
  "older completion does not overwrite latest state",
);

const callbackError = new Error("success callback failed");
const callbackMutation = signals.createMutationSignal(scope, () => ({
  mutationFn: () => "stored",
  onSuccess() {
    throw callbackError;
  },
}));
const callbackBinding = signals.resolveScopedMutationSignal(callbackMutation, state);
await assert.rejects(
  callbackBinding.store.get(callbackBinding.atom).mutateAsync(undefined),
  (error) => error === callbackError,
);
assertions += 1;
check(
  callbackBinding.store.get(callbackBinding.atom).isSuccess,
  "does not rewrite successful state when a success callback throws",
);

const secondState = signals.createScopeState(
  scope,
  { workspaceId: "workspace-2" },
  { queryClient: { name: "second-client" } },
);
const second = signals.resolveScopedMutationSignal(saveMutation, secondState);
check(second.atom !== first.atom, "isolates mutation atoms across scope instances");
check(second.store.get(second.atom).isIdle, "isolated scope starts with fresh mutation state");

const noClientState = signals.createScopeState(scope, { workspaceId: "missing" });
assert.throws(
  () => signals.resolveScopedMutationSignal(saveMutation, noClientState),
  /mutationSignal requires a QueryClient on Scope/,
);
assertions += 1;

console.log(
  `app-shared mutation signal behavior: ${assertions}/${assertions} assertions passed`,
);
