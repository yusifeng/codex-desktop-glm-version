# E2E / Smoke Verification

## Scope

`smoke-test.sh` is the minimum packaged-app check. It builds the current tree,
launches the isolated Electron profile, verifies the process remains alive for
the requested duration, and fails on fatal startup signatures (`fatal`, uncaught
exceptions, segmentation faults, or missing modules).

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
