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

The renderer build now emits and verifies all 1,888 registered rewritten chunks. As of the 2026-11-02 voice batch,
`EXACT_ROUTE_SOURCE_OWNERS` is empty: the final `mark-session-create` and realtime-controls owners compile directly from
checked-in TypeScript and preserve their 69/41-symbol release ABIs. This is an exact-owner milestone, not by itself proof that
the entire project is completely decompiled.

The former route compatibility closure is also empty. Its final 35 modules (157,630 formatted lines) were split by ownership:
the locally implemented Activity/Billing/Imported-setup surfaces retain their published dependency order while those Recharts/D3
and visualization-shim edges are supplied by preserved TypeScript source; Google Logo and Unicode layout use semantic TypeScript owners; the remaining 33 reviewed vendor/generated boundaries
(Recharts/D3, Three.js, date/phone/form, QR, icons/images and entry shims) now live under
`src/renderer-preserved/route-runtime/*.ts` and are compiled explicitly. The source-build gate requires zero compatibility
modules, zero exact owners, a matching preserved manifest/disk inventory, and successful TypeScript compilation for all 33
boundaries. Renderer verification remains 1,888/1,888 and build-only `@exact-chunk` aliases are rejected if they leak into
packaged assets.

The signed-in E2E matrix has passed General settings,
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

Zero exact owners and zero route-compatibility modules must still not be described as proof that the entire project is complete.
Final completion additionally requires resolving the remaining preserved main/renderer inventory, keeping the full critical
E2E matrix green, and eliminating every known stable runtime contract error.

The 2026-11-02 hub evidence re-audit corrected a consumer-parser escaping bug and removed 838 duplicate classification
records. The current strict counts are app-shared 432/3,185, app-initial 1,621/8,204, and app-primary 214/917 consumed,
with 0 unreviewed across all 12,306 public exports. Semantic evidence is now additionally required to match the exact
public-alias/internal-symbol ABI and its recorded source range. This audit also exposed and fixed a real UsageBanner wiring
error: `app-primary.Pm` is the account/spend/reset warning key, not a numeric percent getter. These stronger gates supersede
the older consumed-export counts above; they improve evidence quality but do not reclassify the three remaining hubs as
fully migrated.

The latest semantic batch replaces the standalone visualization-document owner and parental-controls presentation owner.
The visualization owner retains the nested sandbox, inner/outer CSP split, widget-state persistence, user-activation checks,
follow-up/open-external bridge, theme synchronization, and height/scroll protocol. The parental presentation owner retains
account-isolated query keys, unauthorized-query invalidation, optimistic notification merging, modal lifecycle cleanup, and
external-store decision subscriptions. Differential suites compare both owners with the published modules before the exact
sources are removed.

The following conversation batch replaces the pull-request side-panel owner and artifact-feedback button owner. Pull-request
tabs now retain board/canonical descriptors, GitHub/GitLab resolution, status projection, durable routes, panel placement,
focus behavior, and guarded restoration. Artifact feedback now retains lazy dialog loading, app-info capture, upload
coordination, plan/correlation metadata, three button variants, error logging, and user-visible submission failure handling.
Their differential suites exercise actual open/restore and open/submit workflows rather than export-shape checks.

The next five-owner semantic batch restores the quick-chat drop-zone portal, tool-icon and memory-write content,
plugin picker, app-connect flow, and artifact Open In surface. It removes placeholder contracts that rendered ordinary
buttons or returned unrelated selection helpers in place of the published exports. The recovered implementations retain
drag selection capture and bottom-panel geometry; safe remote icon resolution and memory-management dialogs; installed,
featured, and recent-plugin state; OAuth pending/resume and connector installation behavior; and native artifact target
discovery, upload snapshots, file-manager reveal, and download actions. Focused owner tests plus the existing connector,
extension-discovery, quick-chat, and tool-result clusters cover these workflows.

The following Git and voice batch restores three additional owners: the realtime-voice optimistic launch surface,
create-pull-request modal content, and pull-request action runtime. The voice surface now reads the real launch, stage, handoff,
route, reduced-motion, native-overlay, permission, retry, feedback, and dismissal state instead of accepting a synthetic phase
prop. The create-PR surface restores existing-PR loading, new-branch blocking, default command selection, modified-click open,
GitLab labels, local-change inclusion, diff totals, and the separate create-in-browser action. Pull-request actions now create
the actual mutation families, validate PR identity and head revision around generated descriptions, use the canonical diff,
bound prompt sections, map resource-specific invalidations, and preserve abort/error reasons. Focused voice, core-dialog, Git
review, type, source-build, and semantic-override gates cover the batch.

The Google Workspace follow-up replaces the Google Drive menu owner. It restores `.docx`/`.xlsx`/`.pptx` routing, binary
workspace reads, byte-preserving multipart construction, connector upload, structured/text URL extraction, authentication
failure detection, existing-app refresh, plugin install/enable/detail/connect branches, analytics, model-context attachment
upserts, external opening, modified-click disposition, and user-facing failure states. Its focused owner suite exercises the
real read-file and upload pipeline through the resulting context attachment and opened Google URL.

The same file-flow batch also restores the ChatGPT conversation-files side panel. Its production export now opens the
registered panel definition through the renderer scope rather than expecting an invented `openPanel` host. The owner pages
the account-scoped conversations API with cursor-cycle protection and de-duplication, merges remote library records with
visible message attachments, preserves project/gizmo origination filtering, registers the account-isolated panel, and renders
loading, retry, empty, and file-open states. Focused coverage exercises registration, production opening, two-page query,
duplicate suppression, API/message merging, account propagation, and the compatibility adapter.
