import "@rchunk/rolldown-runtime";
import { I3 as getJsxRuntime, type JsxRuntime } from "@rchunk/app-shared";
import "@rchunk/app-initial";
export interface BibliographyReference { id?: string; title?: string; url?: string; [key: string]: unknown }
export interface TurnBibliographyProps { references: readonly BibliographyReference[]; shouldBlockExternalEgress?: boolean }
let runtime: JsxRuntime | undefined; function jsx(): JsxRuntime { runtime ??= getJsxRuntime(); return runtime; }
function TurnBibliography({ references, shouldBlockExternalEgress }: TurnBibliographyProps): unknown { return jsx().jsx("ol", { "aria-label": "Sources", "data-external-egress": shouldBlockExternalEgress ? "restricted" : "allow", children: references.map((reference, index) => jsx().jsx("li", { children: reference.url && !shouldBlockExternalEgress ? jsx().jsx("a", { href: reference.url, rel: "noreferrer", children: reference.title ?? reference.url }) : (reference.title ?? reference.url ?? `Source ${index + 1}`) }, reference.id ?? `${index}`)) }); }
function initializeTurnBibliography(): void { void jsx(); }
export { initializeTurnBibliography as n, TurnBibliography as t };
