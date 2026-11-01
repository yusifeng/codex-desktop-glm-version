# Recovered process roots

This directory contains the checked-in exact source recovery for the main process, worker, and preload composition roots. The application build compiles these files directly. Files under `.reference/originals/main` are comparison baselines for audits and are not build inputs.

Typed semantic owners under `src/main/` are imported by these composition roots and remain the preferred location for newly recovered behavior.

`scripts/chunk-manifest.mjs` records `main`, `git-worker`, and `browser-page-preload` as exact process roots. The build rejects any file in this directory that is not owned by that exact-root inventory or the audited vendor/generated inventory, and `restore-ts` will not overwrite exact roots.
