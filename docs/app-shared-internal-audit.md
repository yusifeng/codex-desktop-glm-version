# Renderer Hub Internal Audit

This audit covers the three large renderer hubs that remain published asset
inputs. The line and byte counts below are measured from the checked-in `.ts`
assets; the source is intentionally excluded from TypeScript semantic rewriting
(`tsconfig.json`) and is validated by renderer asset/build gates.

| Hub | Lines | Bytes | Classification boundary |
|---|---:|---:|---|
| `app-shared-7b9edc1bfb7f.ts` | 125,789 | 5,155,475 | shared runtime exports, UI/query primitives, and bundled vendor glue |
| `app-initial-51da50e6c6e3.ts` | 6,548 | 11,160,141 | startup aggregator; locale/icon/shiki/vendor registrations dominate |
| `app-primary-d66705000d76.ts` | 120,934 | 3,527,576 | primary application registry and lazy route wiring |

## app-shared

The existing `docs/renderer-app-shared-analysis.md` and
`docs/renderer-app-shared-export-map.json` provide the symbol-level inventory.
The authoritative executable contract is
`scripts/audit-renderer-hub-classification.mjs --strict`. It counts named
imports, namespace member access, namespace destructuring, and typed namespace
casts with the same parser used by the exhaustive manifest. The current result
is 1,817/3,185 consumed exports and 0 unreviewed. The same parser reports
6,376/8,204 for app-initial and 715/917 for app-primary, all with 0 unreviewed.
The 2026-11-02 recheck also rejects cross-object namespace destructuring so an
earlier hub's aliases cannot be attributed to a later hub.
`audit-app-shared-consumption.mjs` complements that gate: release-faithful
`@ts-nocheck` owners are checked against the executable hub ABI, while
handwritten semantic owners must also resolve to non-`any` ambient declarations.
It also rejects direct namespace access. The exhaustive export-classification
gate remains `audit-renderer-hub-manifest.mjs --strict`.

The remaining internal ranges are classified as either shared runtime/UI
primitives (the semanticization boundary for future work) or vendor/interop
glue. No asset is counted as an unclassified application export: unconsumed
symbols remain in the published hub and are covered by the asset provenance
record, while the semantic source owns the consumed contract.

## app-initial

`docs/renderer-classification.md` records the complete import census: this hub
is primarily an aggregator for locale dictionaries, lucide icons, shiki
grammars/themes, and third-party editor/diagram code. The smaller application
startup surface is separately represented by renderer entry and route contracts;
the large data/vendor registrations are preserved as assets rather than copied
into misleading handwritten source.

## app-primary

The primary hub is treated the same way: route registration, RPC bridge wiring,
and application-owned state are semantic boundaries; bundled library facades,
asset registration, and lazy chunk tables are preserved. `verify-renderer.mjs`
checks the full 1,888-chunk graph, and the renderer classification report keeps
the preserved asset families explicit.

The browser-comment context/handler registry is now a concrete example of a
coupled extraction rather than a compatibility facade. Registration, tab
acceptance, tab URL state, readiness listeners, timeout/abort cleanup, and async submission
are owned by `src/renderer/app-primary-browser-comment-runtime/index.ts` and
bundled into the existing source-annotation registry chunk. Both app-primary's
internal registration calls and the detached annotation consumer resolve the
same module instance; `Bs/Gs/Hs/Ks/Rs/Us/Vs` no longer depend on the old hub-owned
maps for runtime behavior.

## Re-audit procedure

```sh
node scripts/audit-app-shared-consumption.mjs
node scripts/audit-renderer-hub-classification.mjs --strict
node scripts/audit-renderer-hub-manifest.mjs --strict
node scripts/verify-renderer.mjs
```

The exhaustive export-category gate is `scripts/audit-renderer-hub-manifest.mjs`.
It reports `consumed`, `semantic`, `preserved-coupled`, and `unreviewed` for
every published export. `--strict` intentionally fails while any export lacks
source-line evidence; no unreviewed export is silently promoted to preserved.

These checks are the acceptance gates for extending any hub. A new semantic
module must first add its declaration and then reduce the preserved inventory;
identity stubs or fabricated exports are not accepted.

## 2026-10-12 Consumer Recheck

The classification manifest reports `UNREVIEWED: 0`. Historical duplicate
records have been removed: 12,134 evidence records now correspond to 12,134
unique hub/alias keys, and the gate rejects future duplicates. Semantic entries
must also map the public alias to the exact internal source symbol and contain
that symbol inside their recorded source range. Representative modules such
as `normalize-suggested-followups`, `is-site-url-match`, and
`create-prefilled-plugin-prompt` have confirmed consumers in the split renderer
surface. A small remainder, including `format-annotation-summary`,
`merge-conflict-state`, `select-mode-descriptor`, `parse-browser-target-id`, and
`is-path-within-roots`, has focused contract coverage but no confirmed consumer
in the current split surface. They remain extracted semantic helpers; adding
synthetic imports would create a false consumer and risk changing UI or
internationalization behavior.
