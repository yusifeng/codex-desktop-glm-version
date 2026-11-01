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

The renderer build now compiles the classified conversation, settings, composer, home/onboarding, and structural roots plus
their eager dependency closure from 635 checked-in, formatted, release-derived ESM modules. It no longer copies published
JavaScript directly into the runtime output. The graph supersedes 594 semantic drafts whose cross-chunk or React component
contracts are not yet equivalent, and the build skips those drafts instead of compiling and then overwriting them. The
source-build gate verifies the dependency closure, manifest, disk inventory, actual compilation of every recovered module,
absence of release-tree build dependencies, and coverage of every known structural component draft.

This removes direct build-time copying and supplies the real React implementations while semantic recovery continues. It does
not close the semantic-decompilation gap: the 594 superseded drafts still need contract-complete readable replacements. The
consolidated E2E workflow matrix and remaining runtime-contract validation also have to pass before the project is complete.
