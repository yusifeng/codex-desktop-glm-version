import "@rchunk/rolldown-runtime";
import "@rchunk/app-shared";
import "@rchunk/app-initial";

type ArtifactKind = "document" | "presentation" | "site" | "spreadsheet";
interface ArtifactTarget { type: "document-element-selection" | "document-page-point" | "document-page-region" | "presentation-element-selection" | "presentation-region" | "site-element-selection" | "workbook-floating-element" | "workbook-range"; [key: string]: unknown }
interface ArtifactPayload { annotationId: string; artifactKind: ArtifactKind; body: string; label?: string; target: ArtifactTarget }
interface ArtifactComment { localArtifactAnnotationContext?: { annotationId?: string; artifactKind: ArtifactKind; label?: string; path: string }; localArtifactAnnotationMetadata?: { target?: ArtifactTarget }; position: { line: number }; text?: string; [key: string]: unknown }

function isArtifactComment(comment: ArtifactComment): boolean { return comment.localArtifactAnnotationContext != null; }
function t({ line, path, payload, sourcePath, title }: { line: number; path: string; payload: ArtifactPayload; sourcePath?: string; title?: string }): ArtifactComment | undefined {
  if (!["presentation-element-selection", "presentation-region", "workbook-floating-element", "workbook-range"].includes(payload.target.type)) return undefined;
  return { position: { line }, text: payload.body, localArtifactAnnotationContext: { annotationId: payload.annotationId, artifactKind: payload.artifactKind, label: payload.label, path }, localArtifactAnnotationMetadata: { target: payload.target }, sourcePath, title };
}
function n(comments: ArtifactComment[], path: string): ArtifactComment[] { return comments.filter(comment => isArtifactComment(comment) && comment.localArtifactAnnotationContext?.path === path); }
function i(comments: ArtifactComment[]): ArtifactPayload[] {
  return comments.flatMap(comment => {
    const context = comment.localArtifactAnnotationContext;
    const target = comment.localArtifactAnnotationMetadata?.target;
    if (context?.annotationId == null || context.artifactKind === "document" || context.artifactKind === "site" || target == null || !["presentation-element-selection", "presentation-region", "workbook-floating-element", "workbook-range"].includes(target.type)) return [];
    return [{ annotationId: context.annotationId, artifactKind: context.artifactKind, body: comment.text ?? "", label: context.label, target }];
  });
}
function a({ currentComments, path, previousComments }: { currentComments: ArtifactComment[]; path: string; previousComments: ArtifactComment[] }): string[] {
  const current = new Set(n(currentComments, path).flatMap(comment => comment.localArtifactAnnotationContext?.annotationId ?? []));
  return n(previousComments, path).flatMap(comment => { const id = comment.localArtifactAnnotationContext?.annotationId; return id != null && !current.has(id) ? [id] : []; });
}
function s(comments: ArtifactComment[], path: string): ArtifactComment[] { const filtered = comments.filter(comment => !isArtifactComment(comment) || comment.localArtifactAnnotationContext?.path !== path); return filtered.length === comments.length ? comments : filtered; }
function r(comments: ArtifactComment[]): number { return Math.max(0, ...comments.map(comment => comment.position.line)) + 1; }
function o(): void {}
export { a, i, n, o, r, s, t };
