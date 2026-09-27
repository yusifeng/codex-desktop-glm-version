import "@rchunk/rolldown-runtime";
import {
  J9t as getFileExtension,
  Y9t as initializeGeneratedImages,
} from "@rchunk/app-initial";

export interface GeneratedImageItem extends Record<string, unknown> {
  failure?: { limitId?: string; type?: string };
  src?: string | null;
  status?: string;
  steeringStatus?: unknown;
  type: string;
}

export interface GeneratedImageVisibility {
  completedImages: GeneratedImageItem[];
  hasPendingItems: boolean;
  pendingPlaceholderCount: number;
}

function getGeneratedImageVisibility({
  items,
  interruptedByThisClient,
  isTurnInProgress,
}: {
  items: GeneratedImageItem[];
  interruptedByThisClient: boolean;
  isTurnInProgress: boolean;
}): GeneratedImageVisibility {
  const completedImages: GeneratedImageItem[] = [];
  let pendingCount = 0;
  let steeringDepth = 0;
  for (const item of items) {
    if (item.type === "user-message" && item.steeringStatus != null) {
      pendingCount = 0;
      steeringDepth += 1;
      continue;
    }
    if (item.type === "steered") {
      if (steeringDepth > 0) steeringDepth -= 1;
      else pendingCount = 0;
      continue;
    }
    if (item.type !== "generated-image") continue;
    if (item.src != null) {
      completedImages.push(item);
      continue;
    }
    if (
      isTurnInProgress &&
      (item.status === "in_progress" || item.status === "inProgress")
    ) {
      pendingCount += 1;
    }
  }
  return {
    completedImages,
    hasPendingItems: pendingCount > 0,
    pendingPlaceholderCount: interruptedByThisClient ? 0 : pendingCount,
  };
}

function hasPresentationOutput(paths: string[]): boolean {
  return paths.some((path) => getFileExtension(path) === "pptx");
}

function buildGeneratedImageOutput({
  completedImages,
  endResourcePaths,
  pendingPlaceholderCount,
}: {
  completedImages: GeneratedImageItem[];
  endResourcePaths: string[];
  pendingPlaceholderCount: number;
}): { images: GeneratedImageItem[]; pendingImageCount: number } | null {
  const images = hasPresentationOutput(endResourcePaths) ? [] : completedImages;
  return images.length === 0 && pendingPlaceholderCount === 0
    ? null
    : { images, pendingImageCount: pendingPlaceholderCount };
}

function hasDisplayableGeneratedImage(items: GeneratedImageItem[]): boolean {
  return items.some(
    (item) =>
      item.type === "generated-image" &&
      (item.failure?.type !== "usageLimitExceeded" || item.failure.limitId !== "image_gen"),
  );
}

function initializeGeneratedImageOutputVisibility(): void {
  initializeGeneratedImages();
}

export {
  hasDisplayableGeneratedImage as a,
  hasPresentationOutput as i,
  buildGeneratedImageOutput as n,
  initializeGeneratedImageOutputVisibility as r,
  getGeneratedImageVisibility as t,
};
