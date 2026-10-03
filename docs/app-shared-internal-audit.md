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
The executable contract is `scripts/audit-app-shared-consumption.mjs`: every
consumed export must have a declaration, no declaration may contain `any`, and
namespace consumption is rejected. The current result is 343 consumed exports,
0 missing, 0 `any`, and 0 direct namespace uses.

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
checks the full 1,874-chunk graph, and the renderer classification report keeps
the preserved asset families explicit.

## Re-audit procedure

```sh
node scripts/audit-app-shared-consumption.mjs
node scripts/verify-renderer.mjs
```

These checks are the acceptance gates for extending any hub. A new semantic
module must first add its declaration and then reduce the preserved inventory;
identity stubs or fabricated exports are not accepted.
