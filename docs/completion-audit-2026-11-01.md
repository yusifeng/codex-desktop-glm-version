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

The renderer build now emits and verifies all 1,888 registered rewritten chunks. There are 57 remaining release-faithful source owners
under their semantic `src/renderer/<name>/` directories, including the settings/composer surfaces and the complete local
conversation dependency closure. Their checked-in `exact.js` files are generated from the published ESM with only cross-chunk
import specifiers rewritten; the source-build gate regenerates all 57 owners and requires exact source equality. The remaining
inventory contains 191,901 formatted release-derived lines. The build therefore no longer substitutes the earlier partial
view-model approximations for these production components.

The remaining route compatibility closure contains 35 checked-in ESM modules, down from 77 before the exact-owner promotion.
The generated Google logo geometry and generic Unicode bidirectional-layout engine intentionally supersede thin semantic
drafts and are guarded as reviewed boundaries. Dependency-owner checks ensure every exact owner import is supplied by a
semantic owner, transform-only owner, reconstructed core, or the checked-in compatibility graph. All 35 remaining modules are
explicitly audited as vendor or generated boundaries (Recharts/D3,
Three.js, date/phone/form runtimes, generated icons and entry shims); a gate requires that inventory to match the closure
exactly. Six former incremental hubs now also have exact source owners; only the three shared renderer hubs remain incremental.
Renderer verification passes 1,888/1,888 outputs, TypeScript typechecking passes, and the recovery gate covers 11 source-build
assertions, 35 compatibility modules, 57 exact owners, and six reviewed structural drafts. The packaged app now starts from
the reconstructed build, renders the home composer, resumes a real signed-in local conversation, hydrates its turns, and renders
the virtualized user/assistant transcript without loading original JavaScript as a runtime fallback. The build also rejects
build-only `@exact-chunk` aliases if any leak into packaged assets.

Exact owners still retain release-local identifiers that can be renamed for readability, but those identifiers no longer imply
a runtime fallback: the checked-in source owners are the build inputs. The signed-in E2E matrix now passes General settings,
Git, Worktrees, Browser Use, historical user/assistant turn rendering, and the conversation add-context menu. On 2026-11-02 a
fresh signed-in turn also completed through `fill` + `send` + `wait`. A separate turn invoked the reconstructed in-app-browser
stack, attached the Browser webview, loaded `https://example.com/`, and returned the requested marker. The same packaged app
then exercised the renderer preload, IPC router, main-process `WorkerBus`, and Git worker against an isolated repository: it
created a real commit and a real detached worktree, both verified from disk. These mutation checks supersede the earlier note
that the E2E matrix was read-only or incomplete.

The main process, Git worker, and browser-page preload are now separately registered as checked-in exact process roots rather
than being counted as preserved vendor chunks. The build rejects unowned files in `src/main-recovered`, verifies that each
exact root owns the published output filename, and `restore-ts` cannot overwrite these sources. The remaining preserved
main-process inventory is therefore seven audited vendor/generated chunks, not an application-code fallback.

The final runtime repair restored the published Browser sidebar `ensureThreadState(windowState, input, browserTabId)` contract
that had been omitted when the manager was split into semantic controllers. It preserves the original storage-id, owner-route,
tab-activity, and session-registration behavior. Browser-page preload initialization was also corrected so React-backed
annotation owners initialize lazily after their runtime bindings, WebMCP retains a real ESM named export, and every extracted
annotation controller is bound before registry construction. Focused regressions cover these ordering and ownership contracts.

The 57 exact owners are still outstanding readability and semantic-recovery work and must not be described as a completely
decompiled renderer. The current build is source-backed and runnable, but final completion additionally requires replacing
those owners with maintainable semantic TypeScript (or explicitly justified generated/vendor boundaries), keeping the
critical E2E matrix green, and eliminating the remaining stable runtime contract errors.
