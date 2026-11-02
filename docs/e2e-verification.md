# E2E / Smoke Verification

## Scope

`smoke-test.sh` is the minimum packaged-app check. It builds the current tree,
launches the isolated Electron profile, verifies the process remains alive for
the requested duration, asserts the primary window main frame load and the
app-server initialization handshake, and fails on fatal startup/renderer
signatures (`fatal`, uncaught exceptions, segmentation faults, missing modules,
or a crashed renderer).

Run it with:

```sh
./scripts/smoke-test.sh 15
```

The profile and log are kept under `CODEX_ELECTRON_USER_DATA_PATH` so a failed
run can be inspected without touching an existing Codex installation.

## Static gates

Before a smoke run, the deterministic gates are:

```sh
npm run typecheck -- --pretty false
node scripts/build.mjs --check
node scripts/verify-chunks.mjs
node scripts/verify-renderer.mjs
node scripts/audit-shared-consumption.mjs
node scripts/generate-shared-full-classification.mjs --write
```

The smoke script is intentionally not treated as a substitute for these gates:
it validates process startup and the packaged module graph, while the static
checks validate source coverage and renderer/chunk contracts.

## Signed-in renderer matrix

The packaged app can also be driven through its Electron DevTools endpoint. Start
the reconstructed package with a dedicated debug port:

```sh
CODEX_DESKTOP_STARTUP_DEBUG=1 ./scripts/run.sh --remote-debugging-port=9223
```

Then run the non-mutating matrix:

```sh
npm run e2e:readonly
```

Run the complete critical matrix, including a signed-in mutation and assistant
reply assertion, with:

```sh
npm run e2e:critical
```

The driver is state-independent: it can start on the home page, a conversation,
or an already-open settings page. It currently checks all of the following in one
run and rejects the renderer recovery boundary at every checkpoint:

- General settings and the default-permissions surface
- Git settings
- Worktrees settings
- Browser Use settings
- A hydrated historical conversation containing both a user turn and an assistant reply
- The conversation add-context menu, including the in-app browser action

`npm run e2e:inspect` records the current renderer title, body, editable controls,
conversation virtualizer nodes, and new console exceptions without changing app
state. The lower-level driver also has explicit `fill`, `send`, and `wait` modes.
Only `send` submits through the signed-in account; keep it a separate, intentional
mutation step rather than hiding it inside inspection or navigation checks.

The 2026-11-01 signed-in package run passed all six read-only checkpoints. On
2026-11-02 the mutation matrix also passed. After the renderer source-owner
convergence, the complete `e2e:critical` command was rerun against a freshly
packed application and passed with zero local `@rchunk` asset failures:

- `fill` + `send` + `wait` submitted a fresh turn through the signed-in account and
  observed the assistant response marker.
- A fresh turn invoked Browser Use, attached the reconstructed Browser webview,
  loaded `https://example.com/`, and returned `IAB_E2E_20261102_0520`.
- A direct packaged-app Git worker request traversed renderer preload, IPC,
  `WorkerBus`, and the Git worker, committed an unstaged file in an isolated
  repository, and returned a real commit SHA.
- A second packaged-app Git worker request created a real detached worktree under
  an isolated temporary root; `git worktree list` and the checked-out file verified
  the result.

The Git fixtures lived under `/private/tmp` and did not modify the recovery
repository. Together these checks cover fresh conversation mutation, IAB
attachment/navigation, Git mutation, and worktree creation rather than only
read-only rendering.
