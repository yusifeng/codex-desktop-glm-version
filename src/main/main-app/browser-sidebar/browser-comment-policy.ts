// @ts-nocheck

const SCREENSHOT_CROP_PADDING_PX = 32;
const COMPACT_SCREENSHOT_CROP_PADDING_PX = 16;
const SCREENSHOT_MAX_DIMENSION = 1280;
const SCREENSHOT_CROPPED_MAX_DIMENSION = 1024;
const COMPACT_SCREENSHOT_MAX_DIMENSION = 768;

/** Owns pure Browser comment, screenshot, provenance, and input projection policies. */
export function createBrowserCommentPolicy({
  anchorsEqual,
  browserRuntimeMessageChannel,
  isDesignChange,
  markerSize,
  nativeImage,
  now = () => new Date(),
  projectCaptureRect,
}: {
  anchorsEqual(left: any, right: any): boolean;
  browserRuntimeMessageChannel: string;
  isDesignChange(value: unknown): boolean;
  markerSize: number;
  nativeImage: { createFromDataURL(value: string): any };
  now?: () => Date;
  projectCaptureRect(
    imageSize: any,
    viewportRect: any,
    viewportSize: any,
    padding: number,
  ): any;
}) {
  function resizeImageToFit(image: any, maximumDimension: number): any {
    const { width, height } = image.getSize();
    const largestDimension = Math.max(width, height);
    if (largestDimension <= maximumDimension) return image;
    const scale = maximumDimension / largestDimension;
    return image.resize({
      width: Math.max(1, Math.round(width * scale)),
      height: Math.max(1, Math.round(height * scale)),
    });
  }

  function unionScreenshotRegion(rect: any, markerPoint: any): any {
    const markerRect =
      markerPoint == null
        ? null
        : {
            x: markerPoint.x - markerSize / 2,
            y: markerPoint.y - markerSize / 2,
            width: markerSize,
            height: markerSize,
          };
    if (rect == null) return markerRect;
    if (markerRect == null) return rect;
    const x = Math.min(rect.x, markerRect.x);
    const y = Math.min(rect.y, markerRect.y);
    const right = Math.max(
      rect.x + rect.width,
      markerRect.x + markerRect.width,
    );
    const bottom = Math.max(
      rect.y + rect.height,
      markerRect.y + markerRect.height,
    );
    return { x, y, width: right - x, height: bottom - y };
  }

  function cropImageToViewportRegion(
    image: any,
    viewportRect: any,
    viewportSize: any,
    padding: number,
  ): any {
    const cropRect = projectCaptureRect(
      image.getSize(),
      viewportRect,
      viewportSize,
      padding,
    );
    return cropRect == null ? image : image.crop(cropRect);
  }

  function cropPreviouslyCroppedImage(
    image: any,
    sourceViewportRect: any,
    targetViewportRect: any,
    viewportSize: any,
    sourcePadding: number,
  ): any {
    if (
      viewportSize == null ||
      viewportSize.width <= 0 ||
      viewportSize.height <= 0
    )
      return image;
    const sourceLeft = Math.max(0, sourceViewportRect.x - sourcePadding);
    const sourceTop = Math.max(0, sourceViewportRect.y - sourcePadding);
    const sourceRight = Math.min(
      viewportSize.width,
      sourceViewportRect.x + sourceViewportRect.width + sourcePadding,
    );
    const sourceBottom = Math.min(
      viewportSize.height,
      sourceViewportRect.y + sourceViewportRect.height + sourcePadding,
    );
    const targetLeft = Math.max(
      0,
      targetViewportRect.x - COMPACT_SCREENSHOT_CROP_PADDING_PX,
    );
    const targetTop = Math.max(
      0,
      targetViewportRect.y - COMPACT_SCREENSHOT_CROP_PADDING_PX,
    );
    const targetRight = Math.min(
      viewportSize.width,
      targetViewportRect.x +
        targetViewportRect.width +
        COMPACT_SCREENSHOT_CROP_PADDING_PX,
    );
    const targetBottom = Math.min(
      viewportSize.height,
      targetViewportRect.y +
        targetViewportRect.height +
        COMPACT_SCREENSHOT_CROP_PADDING_PX,
    );
    const sourceWidth = sourceRight - sourceLeft;
    const sourceHeight = sourceBottom - sourceTop;
    if (sourceWidth <= 0 || sourceHeight <= 0) return image;
    const imageSize = image.getSize();
    const scaleX = imageSize.width / sourceWidth;
    const scaleY = imageSize.height / sourceHeight;
    const x = Math.max(0, Math.floor((targetLeft - sourceLeft) * scaleX));
    const y = Math.max(0, Math.floor((targetTop - sourceTop) * scaleY));
    const right = Math.min(
      imageSize.width,
      Math.ceil((targetRight - sourceLeft) * scaleX),
    );
    const bottom = Math.min(
      imageSize.height,
      Math.ceil((targetBottom - sourceTop) * scaleY),
    );
    const width = right - x;
    const height = bottom - y;
    return width <= 0 || height <= 0
      ? image
      : image.crop({ x, y, width, height });
  }

  function cropAnnotationScreenshot(
    image: any,
    {
      annotation,
      screenshotCropRect,
      shouldUseCompactScreenshot,
    }: {
      annotation: any;
      screenshotCropRect: any;
      shouldUseCompactScreenshot: boolean;
    },
  ): any {
    const viewportSize = annotation.viewportSize;
    const canCrop =
      screenshotCropRect != null &&
      viewportSize != null &&
      viewportSize.width > 0 &&
      viewportSize.height > 0;
    return resizeImageToFit(
      canCrop
        ? cropImageToViewportRegion(
            image,
            screenshotCropRect,
            viewportSize,
            shouldUseCompactScreenshot
              ? COMPACT_SCREENSHOT_CROP_PADDING_PX
              : SCREENSHOT_CROP_PADDING_PX,
          )
        : image,
      shouldUseCompactScreenshot
        ? COMPACT_SCREENSHOT_MAX_DIMENSION
        : canCrop
          ? SCREENSHOT_CROPPED_MAX_DIMENSION
          : SCREENSHOT_MAX_DIMENSION,
    );
  }

  function createScreenshotRecord(
    image: any,
    isCompact: boolean,
    cropViewportRect: any,
    annotationViewportRect: any,
    markerViewportPoint: any,
  ): any {
    const { width, height } = image.getSize();
    return {
      annotationViewportRect: annotationViewportRect ?? undefined,
      ...(cropViewportRect == null
        ? {}
        : {
            cropPaddingPx: isCompact
              ? COMPACT_SCREENSHOT_CROP_PADDING_PX
              : SCREENSHOT_CROP_PADDING_PX,
            cropViewportRect,
          }),
      dataUrl: image.toDataURL(),
      ...(isCompact ? { isCompact: true } : {}),
      markerViewportPoint,
      width,
      height,
    };
  }

  function compactExistingScreenshot(
    image: any,
    annotation: any,
    cropRect: any,
  ): any {
    const screenshot = annotation.screenshot;
    return screenshot?.cropViewportRect == null
      ? cropAnnotationScreenshot(image, {
          annotation,
          screenshotCropRect: cropRect,
          shouldUseCompactScreenshot: true,
        })
      : resizeImageToFit(
          cropPreviouslyCroppedImage(
            image,
            screenshot.cropViewportRect,
            cropRect,
            annotation.viewportSize,
            screenshot.cropPaddingPx ?? SCREENSHOT_CROP_PADDING_PX,
          ),
          COMPACT_SCREENSHOT_MAX_DIMENSION,
        );
  }

  function compactCommentScreenshots(comments: any[]): any[] {
    let changed = false;
    const compacted = comments.map((comment) => {
      if (
        comment.screenshot == null ||
        comment.screenshot.isCompact === true ||
        (comment.additionalAnchors?.length ?? 0) > 0
      ) {
        return comment;
      }
      changed = true;
      if (comment.anchor.kind === `virtual`) {
        const image = resizeImageToFit(
          nativeImage.createFromDataURL(comment.screenshot.dataUrl),
          COMPACT_SCREENSHOT_MAX_DIMENSION,
        );
        return {
          ...comment,
          screenshot: {
            ...comment.screenshot,
            dataUrl: image.toDataURL(),
            ...image.getSize(),
            isCompact: true,
          },
        };
      }
      const annotationViewportRect =
        comment.screenshot.annotationViewportRect ??
        comment.screenshot.cropViewportRect ??
        comment.anchor.rect;
      const markerViewportPoint =
        comment.screenshot.markerViewportPoint ?? comment.markerViewportPoint;
      const cropViewportRect =
        unionScreenshotRegion(annotationViewportRect, markerViewportPoint) ??
        comment.anchor.rect;
      return {
        ...comment,
        screenshot: createScreenshotRecord(
          compactExistingScreenshot(
            nativeImage.createFromDataURL(comment.screenshot.dataUrl),
            comment,
            cropViewportRect,
          ),
          true,
          cropViewportRect,
          comment.screenshot.annotationViewportRect ?? comment.anchor.rect,
          markerViewportPoint,
        ),
      };
    });
    return changed ? compacted : comments;
  }

  function createSavedComment({
    anchorState,
    body,
    pageInitialComment,
    commentId,
    attachedImages,
    designChange,
    screenshot,
  }: any): any {
    return {
      id: commentId,
      createdAt: now().toISOString(),
      anchor: anchorState.anchor,
      additionalAnchors: anchorState.additionalAnchors?.length
        ? anchorState.additionalAnchors
        : undefined,
      color: `blue`,
      ...(anchorState.anchor.kind === `element` ||
      anchorState.anchor.kind === `virtual`
        ? { markerViewportPoint: anchorState.viewportPoint }
        : {}),
      attachedImages,
      ...(body == null || body.length === 0 ? {} : { body }),
      pageInitialComment,
      ...(designChange == null ? {} : { designChange }),
      ...(screenshot == null ? {} : { screenshot }),
      themeVariant: anchorState.themeVariant,
      viewportSize: anchorState.viewportSize,
    };
  }

  function anchorStateFromComment(comment: any, fallback: any): any {
    return {
      anchor: comment.anchor,
      viewportRect:
        comment.screenshot?.annotationViewportRect ?? comment.anchor.rect,
      viewportPoint: comment.markerViewportPoint ?? fallback.viewportPoint,
      viewportSize: comment.viewportSize,
      themeVariant: comment.themeVariant,
    };
  }

  function removeAnchorSelection(
    anchorState: any,
    selectedIndex: number,
  ): any | null {
    if (anchorState.anchor.kind === `text`) return null;
    const [anchor, ...additionalAnchors] = [
      anchorState.anchor,
      ...(anchorState.additionalAnchors ?? []),
    ].filter((_anchor, index) => index !== selectedIndex);
    return anchor == null
      ? null
      : {
          ...anchorState,
          anchor,
          additionalAnchors:
            additionalAnchors.length === 0 ? undefined : additionalAnchors,
          cardViewportRect:
            selectedIndex === 0 ? undefined : anchorState.cardViewportRect,
        };
  }

  const keepPrimaryAnchorOnly = (anchorState: any) => ({
    ...anchorState,
    additionalAnchors: undefined,
  });

  function textInputFromKeyEvent(event: any): string | null {
    return event.type !== `keyDown` ||
      event.isComposing ||
      event.control === true ||
      event.meta === true ||
      (event.alt === true && event.key.charCodeAt(0) <= 127) ||
      event.key.length !== 1
      ? null
      : event.key;
  }

  function keyboardKeyCode(key: string): string {
    switch (key) {
      case ` `:
        return `Space`;
      case `ArrowDown`:
        return `Down`;
      case `ArrowLeft`:
        return `Left`;
      case `ArrowRight`:
        return `Right`;
      case `ArrowUp`:
        return `Up`;
      case `Escape`:
        return `Esc`;
      default:
        return key;
    }
  }

  function keyboardEventFromInput(event: any): any | null {
    if (
      event.isComposing ||
      (event.type !== `keyDown` && event.type !== `keyUp`) ||
      (event.type === `keyDown` && event.key === `Shift`) ||
      (event.type === `keyUp` && event.key !== `Shift`)
    ) {
      return null;
    }
    const modifiers: string[] = [];
    if (event.shift) modifiers.push(`shift`);
    if (event.control) modifiers.push(`control`);
    if (event.alt) modifiers.push(`alt`);
    if (event.meta) modifiers.push(`meta`);
    if (event.isAutoRepeat) modifiers.push(`isautorepeat`);
    return { type: event.type, keyCode: keyboardKeyCode(event.key), modifiers };
  }

  const queueDesignChange = (designChange: any, comment: string) => ({
    ...designChange,
    ...(comment.length === 0 ? {} : { comment }),
    status: `queued`,
    updatedAt: now().toISOString(),
  });
  const upsertComment = (comments: any[], comment: any) =>
    comments.some((candidate) => candidate.id === comment.id)
      ? comments.map((candidate) =>
          candidate.id === comment.id ? comment : candidate,
        )
      : [...comments, comment];
  const removeDesignChange = ({
    designChange: _designChange,
    ...comment
  }: any) => comment;
  const removeCommentBody = ({ body: _body, ...comment }: any) => comment;

  function provenanceScore(provenance: any): number {
    let score = 0;
    if (provenance.selectorText != null) score += 1;
    if (provenance.sourceUrl != null) score += 1;
    if (provenance.sourceLine != null) score += 1;
    if (provenance.sourceColumn != null) score += 1;
    return score;
  }

  function mergeProvenance(
    properties: any[],
    ...provenanceSets: any[][]
  ): any[] {
    const bestByProperty = new Map();
    for (const provenanceSet of provenanceSets) {
      for (const provenance of provenanceSet ?? []) {
        const current = bestByProperty.get(provenance.property);
        if (
          current == null ||
          provenanceScore(provenance) >= provenanceScore(current)
        ) {
          bestByProperty.set(provenance.property, provenance);
        }
      }
    }
    return properties.flatMap((property) => {
      const provenance = bestByProperty.get(property.property);
      return provenance == null ? [] : [provenance];
    });
  }

  const provenanceComplete = (properties: any[], provenance: any[]) =>
    mergeProvenance(properties, provenance).length === properties.length &&
    provenance.every((entry) => provenanceScore(entry) > 0);
  const provenanceEquals = (left: any[], right: any[]) =>
    left.length === right.length &&
    left.every((entry, index) => {
      const other = right[index];
      return (
        entry.property === other.property &&
        entry.selectorText === other.selectorText &&
        entry.sourceUrl === other.sourceUrl &&
        entry.sourceLine === other.sourceLine &&
        entry.sourceColumn === other.sourceColumn
      );
    });

  const declarationsEqual = (left: any[], right: any[]) =>
    left.length === right.length &&
    left.every((entry, index) => {
      const other = right[index];
      return (
        entry.property === other.property &&
        entry.previousValue === other.previousValue &&
        entry.value === other.value
      );
    });
  const textChangesEqual = (left: any, right: any) =>
    left == null || right == null
      ? left == null && right == null
      : left.previousValue === right.previousValue &&
        left.value === right.value;
  const sameDesignChangeIdentity = (left: any, right: any) =>
    left != null &&
    left.id === right.id &&
    left.createdAt === right.createdAt &&
    left.status === right.status &&
    left.draftAttribute === right.draftAttribute &&
    left.selector === right.selector &&
    left.targetLabel === right.targetLabel &&
    anchorsEqual(left.anchor, right.anchor) &&
    left.markerViewportPoint?.x === right.markerViewportPoint?.x &&
    left.markerViewportPoint?.y === right.markerViewportPoint?.y &&
    left.viewportSize?.width === right.viewportSize?.width &&
    left.viewportSize?.height === right.viewportSize?.height &&
    declarationsEqual(left.declarations, right.declarations) &&
    textChangesEqual(left.text, right.text);

  function matchingCssProperty(
    property: string,
    properties: any[] | undefined,
  ): any {
    return properties?.findLast(
      (candidate) =>
        cssPropertyAliases(property).includes(candidate.name) &&
        candidate.disabled !== true &&
        candidate.implicit !== true,
    );
  }

  function cssPropertyAliases(property: string): string[] {
    switch (property) {
      case `padding-top`:
      case `padding-right`:
      case `padding-bottom`:
      case `padding-left`:
        return [property, `padding`];
      case `margin-top`:
      case `margin-right`:
      case `margin-bottom`:
      case `margin-left`:
        return [property, `margin`];
      case `row-gap`:
      case `column-gap`:
        return [property, `gap`];
      default:
        return [property];
    }
  }

  const sourceUrlForRule = (entry: any) =>
    entry.rule.media?.findLast((item: any) => item.sourceURL != null)
      ?.sourceURL ??
    entry.rule.containerQueries?.findLast((item: any) => item.sourceURL != null)
      ?.sourceURL ??
    entry.rule.supports?.findLast((item: any) => item.sourceURL != null)
      ?.sourceURL;

  function provenanceForDeclaration(declaration: any, matchedStyles: any): any {
    const inlineProperty = matchingCssProperty(
      declaration.property,
      matchedStyles.inlineStyle?.cssProperties,
    );
    if (inlineProperty != null) {
      return {
        property: declaration.property,
        selectorText: `element.style`,
        ...(inlineProperty.range == null
          ? {}
          : {
              sourceLine: inlineProperty.range.startLine + 1,
              sourceColumn: inlineProperty.range.startColumn + 1,
            }),
      };
    }
    let provenance = { property: declaration.property };
    for (const matchedRule of matchedStyles.matchedCSSRules ?? []) {
      const property = matchingCssProperty(
        declaration.property,
        matchedRule.rule.style?.cssProperties,
      );
      if (property != null) {
        provenance = {
          property: declaration.property,
          selectorText: matchedRule.rule.selectorList?.text,
          sourceUrl: sourceUrlForRule(matchedRule),
          ...(property.range == null
            ? {}
            : {
                sourceLine: property.range.startLine + 1,
                sourceColumn: property.range.startColumn + 1,
              }),
        };
      }
    }
    return provenance;
  }

  const enrichDesignChangeProvenance = (
    designChange: any,
    matchedStyles: any,
  ) => ({
    ...designChange,
    provenance: designChange.declarations.map((declaration: any) =>
      provenanceForDeclaration(declaration, matchedStyles),
    ),
  });
  const escapeAttributeSelector = (value: string) =>
    value.replace(/\\/g, `\\\\`).replace(/"/g, `\\"`);
  const isVirtualDesignChangeForAnchor = (designChange: any, anchor: any) =>
    designChange.anchor.kind === `virtual` &&
    anchor.kind === `virtual` &&
    anchorsEqual(designChange.anchor, anchor) &&
    isDesignChange(designChange);

  function sendPendingCommentModeRequestToRuntime(
    page: any,
    request: any,
  ): void {
    const webContents = page.view.webContents;
    if (webContents == null || webContents.isDestroyed()) return;
    switch (request.kind) {
      case `comment`:
        webContents.send(browserRuntimeMessageChannel, {
          type: `browser-sidebar-runtime-create-comment-at-point`,
          viewportPoint: request.viewportPoint,
        });
        return;
      case `design`:
        webContents.send(browserRuntimeMessageChannel, {
          type: `browser-sidebar-runtime-open-design-editor-at-point`,
          viewportPoint: request.viewportPoint,
        });
        return;
      case `text`:
        webContents.send(browserRuntimeMessageChannel, {
          type: `browser-sidebar-runtime-create-comment-from-selection`,
          ...(request.fallbackViewportPoint == null
            ? {}
            : { fallbackViewportPoint: request.fallbackViewportPoint }),
        });
        return;
    }
  }

  return {
    anchorStateFromComment,
    compactCommentScreenshots,
    createSavedComment,
    createScreenshotRecord,
    cropAnnotationScreenshot,
    enrichDesignChangeProvenance,
    escapeAttributeSelector,
    isVirtualDesignChangeForAnchor,
    keepPrimaryAnchorOnly,
    keyboardEventFromInput,
    mergeProvenance,
    provenanceComplete,
    provenanceEquals,
    queueDesignChange,
    removeAnchorSelection,
    removeCommentBody,
    removeDesignChange,
    resizeImageToFit,
    sameDesignChangeIdentity,
    sendPendingCommentModeRequestToRuntime,
    screenshotMaxDimension: SCREENSHOT_MAX_DIMENSION,
    textInputFromKeyEvent,
    unionScreenshotRegion,
    upsertComment,
  };
}
