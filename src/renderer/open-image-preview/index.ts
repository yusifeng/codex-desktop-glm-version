import "@rchunk/rolldown-runtime";
import "@rchunk/app-shared";
import "@rchunk/app-initial";
import "@rchunk/app-primary";
interface ImagePreviewTarget { alt?: string; id?: string; sourceUrl?: string; src: string }
interface ImagePreviewService { open(input: { image: ImagePreviewTarget; images: ImagePreviewTarget[]; index: number }): void }
function openChatGptSearchImagePreview(image: ImagePreviewTarget, images: ImagePreviewTarget[] = [image], service?: ImagePreviewService): { image: ImagePreviewTarget; images: ImagePreviewTarget[]; index: number } { const index = Math.max(0, images.findIndex(candidate => candidate === image || candidate.id != null && candidate.id === image.id)); const input = { image, images, index }; service?.open(input); return input; }
export { openChatGptSearchImagePreview };
