import "@rchunk/rolldown-runtime";
import "@rchunk/app-shared";
import "@rchunk/app-initial";

interface DiffComment { id?: string; path?: string | null; text?: string; [key: string]: unknown }
interface DiffCommentService { getComments?(conversationId: string): DiffComment[]; getModelComments?(conversationId: string): DiffComment[]; setComments?(conversationId: string, comments: DiffComment[]): void }
function commentIdentity(comment: DiffComment): string { return comment.id ?? `${comment.path ?? ""}:${comment.text ?? ""}`; }
function mergeUnique(stored: readonly DiffComment[], generated: readonly DiffComment[]): DiffComment[] { const identities = new Set(stored.map(commentIdentity)); const merged = [...stored]; for (const comment of generated) if (!identities.has(commentIdentity(comment))) { identities.add(commentIdentity(comment)); merged.push(comment); } return merged; }
function n(conversationId: string, service: DiffCommentService = {}) { const comments = service.getComments?.(conversationId) ?? []; const modelComments = mergeUnique([], service.getModelComments?.(conversationId) ?? []); return { comments, modelComments, setComments(next: DiffComment[]) { service.setComments?.(conversationId, next); } }; }
function t(): void {}
export { n, t };
