# Superseding final status — 2026-11-02

This audit is a chronological record. Any later paragraph that says the critical
E2E matrix, preserved source inventory, conversation compatibility, exact owners,
or final runtime contract work is still incomplete describes an earlier checkpoint
and is superseded by this section.

The final source boundary has no original `.js/.cjs/.mjs` runtime fallback,
conversation compatibility is 0, exact fallback owners are 0, and all 33 intentional
vendor/generated route dependencies are checked-in TypeScript. The three semantic
hubs have 0 consumed semantic-business aliases. The managed packaged matrix now
starts and stops the reconstructed app and passes settings, conversation history and
add-context, a real Git-worker commit, a real detached worktree, direct IAB navigation
to `https://example.com/`, and a signed-in send/reply marker
`E2E_REPLY_20261102093326`. The runtime-only URL parser, Browser tab state-family
initializer, and local HTTP predicate contracts exposed by that matrix were restored
from the published implementation and covered by focused tests.

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

The Automations editor/detail/side-panel convergence batch removes the remaining static form shells from the three
separately tracked presentation owners. The local editor now owns an immutable controlled draft, schedule validation and
the recovered schedule-fields surface, dirty-state calculation, async save/retry, operation cancellation, discard blocking,
and confirmed deletion; existing tasks are no longer made permanently unsaveable. The cloud detail owner now switches
between detail and edit state, retains cloud location/model/project/schedule/time-zone fields, preserves a failed draft,
and confirms discard and deletion. Side-panel routing now keeps local persisted tasks and suggestions on the local
create/update/delete protocol, preserves the cloud `{automation, teamId}` response contract, and binds cloud update/delete
signals and request serialization instead of wrapping every request as a synthetic team-less cloud item. Stateful tests
exercise save, discard, confirmation, local mutation selection, cloud team identity, and cloud mutation serialization.
The complete Automations family, typecheck, source-build, semantic override, test-index, and 1,888-chunk renderer build pass.
This closes the three named Automations presentation owners; it does not by itself resolve unrelated Settings/Home owners
or the remaining aggregate-hub migration inventory.

The schedule draft/fields fidelity pass restores behavior that was still hidden behind the earlier common-case form.
`exact_schedule` classification, invalid weekday/hourly rejection, future one-time candidate selection, timezone-aware
UNTIL parsing, and mode-switch baselines now follow the published owner. Update serialization preserves DTSTART and unknown
RRULE extensions, patches hourly interval and UNTIL in place, avoids rewriting unchanged schedules, and projects timing mode
for standard versus custom/hourly schedules. The fields surface now covers one-time, condition-watch, period presets,
weekly/monthly, structured custom RRULE editing, future-time filtering, end-repeat, and shared-preview states through the
recovered frequency controls. Focused contracts exercise the exact/custom/timezone/preservation and UI branches. This
narrows the Automations scheduling gap but leaves separately tracked editor-dialog and cloud-detail presentation work.

The Automations scheduling-infrastructure follow-up replaces the former thin frequency compatibility shell with a
source-owned implementation of the published export ABI, standard/cloud schedule modes, quarter-hour time choices,
weekday selection invariants, hourly/weekly/monthly/custom controls, and timezone-correct date bounds. It also corrects
`automation-dialog.n` from a fabricated whole-dialog export to the published live model/reasoning selector, including
reasoning-effort correction when the selected model changes. The side-panel path now accepts the production
`automation|suggestion|site` protocol, uses cloud detail export `t`, and projects loading, retryable error, missing, and
suggestion states. The complete automation test family, focused infrastructure/page/registration suites, typecheck,
route source-build, 2,417 semantic overrides, and the 1,912-script index pass. The current strict hub counts are
app-shared 372/3,185, app-initial 1,499/8,204, and app-primary 169/917 consumed, with zero unreviewed exports and zero
invalid consumers. This closes a concrete scheduling/public-ABI gap; it is not evidence that the three aggregate hubs or
all remaining presentation owners are fully migrated.

The Automations detail/editor follow-up restores the confirmation boundary between delete requests and the real local/cloud
mutations, including source-qualified targets, cancel/confirm state, and pending-state projection across rerenders. Run history
is newest-first and retains last-run timestamps, unread presentation, safe conversation actions, and mutation pending states.
The editor now owns a controlled draft, unsaved-change detection, discard confirmation, and edit-mode delete. Release-source
comparison also corrected two public-export mapping errors hidden by earlier shape tests: cloud detail export `t` is the
detail/editor composition while `n` is only its initializer, and automation editor exports `o/i/r` are the action bar, detail
shell, and automation detail rather than compatibility identities. The 44-assertion page suite now exercises confirmed local
and cloud deletion through stateful rerenders; the complete automation test family, typecheck, strict hub gate, 2,417 semantic
override assertions, the 1,912-script index, and 1,888/1,888 renderer build/verification pass. This closes the principal
Automations detail/editor runtime gap but does not prove the remaining Settings/Home presentation gaps or the three aggregate
hubs are fully migrated.

The settings plan/query follow-up removes the remaining synthetic defaults for Usage, Analytics, Profile, and Trusted
Contact navigation. Usage visibility and loading now come from the live usage-plan hook and credit query; Analytics and the
enterprise label apply the published plan predicates and experiment gates; Profile consumes its live visibility/loading
contract; Trusted Contact executes the account-scoped enabled query and preserves loading/error redirect behavior. The same
batch repairs two runtime contracts hidden by the former navigation fallback: the trusted-contact query factory now accepts
the published `(userId, accountId)` ABI and sends account headers for the actual account, while Code Review options include
the real `/wham/analytics/daily-code-review-metrics` query function and auth gating. A 24-assertion focused suite covers these
states and request shapes; the existing 229 Usage/Profile/Trusted Contact assertions, typecheck, strict public-ABI gate,
1,912-script index, and 1,888/1,888 renderer build/verify pass. Other settings sections still retain separately documented
feature-specific presentation gaps, so this is not a whole-project completion claim.

The settings eligibility follow-up restores the published static-disabled matrix and combines per-section eligibility with
surface and remote-host constraints instead of allowing an override to bypass them. Account/Voice capabilities, Appshots,
notifications/parental authorization, Import experiment/remote mode, Codex Micro availability, and Debug gating now consume
live public ABIs with pending/error redirect semantics. The settings application cluster grows from 44 to 61 assertions.
That first eligibility pass left plan/query-heavy Usage, Analytics, Profile, and Trusted Contact rules incomplete; the
follow-up above supersedes that limitation.

The current Codex Home announcement batch removes a synthetic recap candidate and restores the published global-disable,
focused-source, and ordered gift/voice/import/worktree/history/replay gates. Product Beacon candidates now precede vanilla
promos, honor suppression and post-onboarding metadata, and retain composer-text/voice actions. Fast Mode no longer depends
on a test-only override: its production candidate reads the model query/settings, service-tier policy, persisted seen state,
personalized estimate, and real tier mutation. Focused coverage increased from 12 to 18 assertions; typecheck and strict
public-ABI gates pass. Special Beacon modal classification and the full release visual composition remain follow-up work.

The in-progress Automations/settings live-state batch removes two more synthetic runtime assumptions. The Automations page
now consumes the published local/cloud capability, signed-in account, local/cloud task query, and run-history ABIs instead of
rendering an empty production presentation; history is joined by automation id and retry/mark-all-read actions are live.
Settings navigation now reads the published ChatGPT/Codex/local/work surface signals, host-aware plugin visibility, and local
default route rather than hard-coding a Codex build flavor. Focused Automations and settings suites, typecheck, strict hub
gates, the renderer build, and 1,888/1,888 verification pass. The follow-up reconnects the published local
`automation-create|update|delete|run-now` mutation factory and request builders, plus the cloud create/update/delete mutation
signals and request serializer. Creation/edit save, run-now, pause/resume, and delete are no longer inert production controls.
The next follow-up restores run-history archive/unarchive, per-run read state, conversation navigation, inbox invalidation,
and failure-isolated bulk archive behavior. It also corrects the Habitat migration owner's published ABI (`n` query signal,
`r` consent visibility signal, `t` lazy initializer), consumes the live migration query, and opens consent for the signed-in
account/user. Complete release detail/editor composition remains outstanding, so this is evidence of concrete runtime
restoration rather than a completion claim.

The latest public-ABI correction distinguishes TypeScript-only namespace members from runtime hub consumers and rejects
every named or namespace consumer that is absent from the hub's actual export table. It found several reconstructed modules
using a minified local binding rather than the published alias. The Codex Home announcement, Home Beacon, sidebar onboarding,
worktrees/hooks/general/plugin settings paths now use their real public aliases, while phantom automations/settings injection
contracts were removed. Strict counts are app-shared 370/3,185, app-initial 1,481/8,204, and app-primary 168/917, with zero
unreviewed exports and zero invalid consumers. Both the manifest gate and the renderer build now enforce this invariant before
packaged assets are written. This establishes a runtime ABI gate; it does not claim that the remaining static presentation
fallbacks are semantically complete.

The latest hub audit fixed a second consumer-accounting bug: namespace
destructuring could cross an earlier object boundary and attribute app-shared
or app-initial aliases to app-primary. Corrected named/namespace/cast counts are
375/3,185, 1,483/8,204, and 177/917 respectively, with zero unreviewed exports.
This stricter count is lower because false consumers were removed, not because
runtime coverage regressed. The app-primary browser-comment registry is also
now source-owned as one coupled unit (tab URL state, context and handler registration,
readiness, timeout/abort, and submit), shared by the hub's internal callers and
the detached annotation consumer through the existing source-annotation
registry chunk.

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

The subsequent announcement/migration batch replaces seven additional app-primary contracts. The responsive Home Banner
presentation is now source-owned alongside announcement state, while GPT-to-plugin visit/dismiss state is account/user scoped
and shared by the content and banner owners instead of being duplicated across rebuilt chunks. Current strict hub counts are
app-shared 375/3,185, app-initial 1,484/8,204, and app-primary 170/917 consumed; all 12,306 exports remain classified and none
are unreviewed. Renderer verification passes 1,888/1,888 with intentional dependency migrations enumerated per chunk. These
figures measure aggregate-hub consumption, not a linear percentage of implementation effort, and must not be presented as
proof of full decompilation.

The following settings-lifecycle batch replaces three renderer shells whose controls existed but whose mutations lived in
ordinary function-local variables and therefore could not survive a React render. ChatGPT project settings now owns a
controlled name/instructions/memory draft, permission and Work-chat validation, dirty-close interception, save failure
preservation, and confirmed asynchronous deletion. AppGen site settings now owns a project-scoped baseline, normalized build
environment draft, save validation/error recovery, discard interception, and confirmed deletion. Personal Vault now separates
environment-variable and network-secret creation and retains a failed asynchronous delete inside its confirmation dialog.
Stateful hook tests exercise rerenders and failure paths. This closes these three presentation owners only; it does not reduce
the remaining conversation-route fallback or preserved inventories by itself.

The next conversation-presentation batch replaces the `conversation-beacon-surfaces` and `conversation-followup-shelf`
shells. Conversation beacons now consume the live conversation/message state families, apply page-context and competing-modal
suppression, maintain a single open presentation, close stale or unmounted presentations without fabricating a dismissal,
wire regenerate/share overrides, and preserve dismiss/action/unsupported lifecycle reporting. Follow-up suggestions now require
the canonical finished assistant message and eligibility metadata, wait for bottom-of-thread admission, issue the cancellable
13-second request, reject mismatched/invalid/duplicate responses, log visible/clicked suggestions, submit the published chosen-
suggestion metadata, and clear a successfully used result. Stateful tests execute the candidate and network/submit paths. This
restores two conversation React owners; it is not evidence that all remaining conversation-route chunks are migrated.

The following conversation transcript and command-lifecycle batch restores live server conversation projection, turn rendering,
timestamp/pending/error paths, Business Agent disclosures and starters, and the interactive user-message navigation rail. The
command catalog is now deterministically recovered as 311 checked-in descriptors instead of eight handwritten fallbacks, and
the delete-task confirmation uses the production request client with duplicate-submit protection, toast feedback, and focus
restoration. Structural route-root drafts are now zero and the source-build gate reports zero compatibility modules and zero
structural drafts. Remote-conversation fidelity, review-side-panel fidelity, remaining preserved owners, and the final E2E
matrix are still open; these results therefore do not establish whole-project completion.

The next remote-conversation and review-layout batch fixes a production composition error where the contribution-only thread
shell was treated as a page wrapper and could discard the remote thread body. The page now renders its body beside the shell
contribution, uses the production composer when available, and presents structured cloud turns, attachments, pull requests,
reviews, diffs, previews, archived mode, and hotkey layout. Review source controls and notices now occupy the side-panel header
slots, while the diff body receives the real expanded-action portal target. Focused stateful tests cover these lifecycles, but
the complete remote event reducer and every release Review workflow remain part of the outstanding fidelity work.

The subsequent Git/PR Review convergence batch closes that specifically identified Review-workflow gap. The PR review owner
now renders legal file diffs and owns file selection, search, display controls, loading/error/stale-revision/empty states, and
refresh retry; the thread side panel supplies its live file and revision data instead of a metadata-only request. The Review
slash command retains the complete release behavior: guidelines and inline-comment protocol, repository-rule attribution,
branch discovery and de-duplication, merge-base resolution, permission projection, inline versus detached delivery, submission
locking, license/error retry, navigation, and command registration. The focused Git/PR/Review family, typecheck, 1,888 renderer
build and verification, 2,247 app-code coverage, zero semantic tail, strict hub/route/index gates, and whole-tree build check
pass. This removes the known Review publication gap; it does not by itself prove the remaining preserved inventory or the final
real-app E2E matrix complete.

The 2026-11-02 shared-root and critical-E2E batch replaces 62 of 105 direct exact-main consumers of the preserved shared
namespace with named TypeScript contracts. It also repairs three runtime-only alias/initializer regressions and makes the
renderer build resolve lazy `@rchunk` preload strings while rejecting any leaked build alias. A freshly packed signed-in app
passed all six read-only route checkpoints and a real prompt/assistant-reply marker through `npm run e2e:critical`; the eight
previous local lazy-asset 404s are gone. This establishes the current critical runnable path, not whole-project completion:
43 direct shared aliases remain, along with the preserved source inventories and remaining conversation-route convergence.
