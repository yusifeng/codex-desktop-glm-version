import "@rchunk/rolldown-runtime";
import "@rchunk/app-shared";
import "@rchunk/app-initial";
import "@rchunk/app-primary";
const placements: Record<string, "artifact" | "surface" | undefined> = { csv: undefined, docx: "artifact", ipynb: "surface", pdf: "artifact", pptx: "artifact", tex: "surface", "text-document": "surface", tsv: undefined, xlsx: undefined };
function r(_props: { libraryFileId?: string; onNavigate?(): void; parentDirectoryId?: string }): null { return null; }
function t(kind: string): "artifact" | "surface" | undefined { return placements[kind]; }
function i(): void {}
function n(): void {}
export { i, n, r, t };
