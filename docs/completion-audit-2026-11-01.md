# Semantic classification audit — 2026-11-01

> Historical scope note: this audit established classification coverage, not a fully runnable decompilation. It must not be
> cited as evidence that reconstruction was complete. Subsequent real E2E testing found startup/runtime contract failures,
> structural renderer placeholders, and build-time release-asset fallback. Those findings supersede the former completion
> wording.

The repository met the semantic-classification criteria used at the time: every reviewed first-party owner was assigned to a
typed semantic module or an explicitly retained boundary. Classification did not prove that every retained composition root
was source-backed, that all dependency-injection contracts worked at runtime, or that key user workflows passed E2E.

## Coverage evidence

- All 10 original main-process source chunks parse with Acorn. The cross-chunk reference gate reports no top-level
  zero-consumer definitions outside six reviewed main-chunk vendor initializer expressions.
- The main-process unwired-owner gate passes 1,250 assertions. Shared raw-consumer audit reports `TOTAL: 0`.
- All 336 consumed app-shared exports have semantic declarations, with zero missing, `any`, or direct namespace consumers.
- Renderer hub manifest covers 12,306 exports with `UNREVIEWED: 0`; strict hub classification also reports zero unreviewed
  exports for app-shared, app-initial, and app-primary.
- Renderer tail coverage reports 1,874 rewritten, 426 preserved, 12 incremental hubs, and zero pending semantic tail modules.
- Renderer app coverage reports 2,247/2,247 classified chunks and zero pending chunks in every priority group.
- Worker A1 owner review has no remaining separable manager/watch/session lifecycle. Retained worker boundaries are the
  host/composition root, transport, query/fsmonitor caches, command/filesystem I/O, and computer-use service dispatcher.

## Validation recorded by the classification audit

- Relevant worker and preload focused suites passed, including 37 original-source integrity assertions and the 1,250-assertion
  unwired-owner gate.
- `npm run typecheck` passed.
- Test index audit passed for 1,857 uniquely indexed scripts.
- Main chunk verification passed 11/11 rewritten chunks.
- Renderer verification passed 1,874/1,874 chunks with zero failures.
- Full build check passed 12,448/12,448 transform-only files and bundled 11/11 rewritten chunks.
- The final convergence commits are `a0843088` (worker runtime residues) and `a5ae149d` (cross-original preload/source audit).

## Boundaries retained by that audit

The preserved code was supported by line-level manifests and owner audits, but several retained renderer and process roots
later proved to contain runtime-critical behavior and placeholders. They are therefore reconstruction work, even when their
exports were previously classified. Current completion requires source-backed builds plus a passing E2E workflow matrix.

## Current runtime-source recovery status

The renderer build now builds all 1,875 registered rewritten chunks. Forty large settings, composer, onboarding, activity, and
supporting React modules have release-faithful source owners under their semantic `src/renderer/<name>/` directories. Their
checked-in `exact.js` files are generated from the published ESM with only cross-chunk import specifiers rewritten; a parity
gate regenerates all forty from the release input and requires exact source equality. The build therefore no longer substitutes
the earlier partial view-model approximations for these production components.

The remaining route compatibility closure contains 39 checked-in ESM modules, down from 77 before the exact-owner promotion.
The build compiles those modules as source and has zero skipped semantic drafts. Dependency-owner checks ensure every exact
owner import is supplied by a semantic owner, transform-only owner, reconstructed core, or the checked-in compatibility graph;
renderer verification passes 1,875/1,875 outputs.

This is substantial runtime-source recovery, not proof that the entire project is complete. The 39 compatibility modules still
need semantic ownership where they are first-party, the exact owners still retain release-local identifiers that can be renamed
for readability, preserved main/renderer boundaries remain, and the consolidated E2E workflow matrix has not yet passed.
