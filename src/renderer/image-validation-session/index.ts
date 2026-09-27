import "@rchunk/rolldown-runtime";
import "@rchunk/app-shared";
import "@rchunk/app-initial";
export interface ImageGenerationAttachment { asset_pointer?: string | null; generation_id?: string; generation_type: string; height?: number; id: string; kind: string; message_id?: string | null; output_blocked?: boolean; url: string; width?: number }
export interface ImageValidationSession { attachments: readonly ImageGenerationAttachment[] }
export interface GeneratedImage { chatGptGenerationId?: string; chatGptMessageId?: string; height?: number; id: string; previewSrc?: string; src: string | null; status: "completed"; type: "generated-image"; width?: number }
function eligible(session: ImageValidationSession): ImageGenerationAttachment[] { return session.attachments.filter(attachment => attachment.kind === "media_generation" && attachment.generation_type === "image_gen" && !attachment.output_blocked); }
function generatedImagesFromSession(session: ImageValidationSession): GeneratedImage[] { return eligible(session).map(attachment => ({ type: "generated-image", id: attachment.id, chatGptGenerationId: attachment.generation_id, chatGptMessageId: attachment.message_id ?? undefined, src: attachment.asset_pointer ?? null, width: attachment.width, height: attachment.height, status: "completed" })); }
function resolveValidatedImages(session: ImageValidationSession, images: readonly GeneratedImage[]): GeneratedImage[] { const attachments = eligible(session); return images.flatMap(image => { const match = attachments.find(attachment => attachment.id === image.id) ?? attachments.find(attachment => attachment.asset_pointer != null && attachment.asset_pointer === image.src); if (!match) return []; const base = typeof window === "undefined" ? "https://desktop.invalid/" : window.location.href; const src = new URL(match.url, base).href; return [{ ...image, src, previewSrc: src, height: image.height ?? match.height, width: image.width ?? match.width }]; }); }
const imageValidationSessionSignal = { key: "image-validation-session", initialValue: null } as const;
function initializeImageValidationActions(): void {}
function initializeImageValidationSession(): void {}
export { initializeImageValidationActions as a, generatedImagesFromSession as i, initializeImageValidationSession as n, resolveValidatedImages as r, imageValidationSessionSignal as t };
