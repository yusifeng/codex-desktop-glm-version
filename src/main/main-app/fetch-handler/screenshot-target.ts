// @ts-nocheck

function toRectangle(rectangle: Record<string, number>) {
  return { height: rectangle.height, width: rectangle.width, x: rectangle.x, y: rectangle.y };
}

/** Creates the viewport-to-display projection used by screenshot presentation requests. */
export function createScreenshotTargetResolver(dependencies: Record<string, any>) {
  const { fromWebContents, getDisplayMatching } = dependencies;
  return function computeScreenshotTarget(options: Record<string, any>) {
    const { backgroundColor, cornerRadius, presentationStyle, primaryTextColor, viewportFrame, webContents } = options;
    if (!(viewportFrame.width > 0 && viewportFrame.height > 0) || !(cornerRadius >= 0)) return undefined;
    const window = fromWebContents(webContents);
    if (window == null || window.isDestroyed()) return undefined;
    const zoomFactor = webContents.getZoomFactor();
    const contentBounds = window.getContentBounds();
    const destinationFrame = {
      x: contentBounds.x + viewportFrame.x * zoomFactor,
      y: contentBounds.y + viewportFrame.y * zoomFactor,
      width: viewportFrame.width * zoomFactor,
      height: viewportFrame.height * zoomFactor,
    };
    const display = getDisplayMatching(destinationFrame);
    return {
      codexDisplay: {
        bounds: toRectangle(display.bounds),
        id: display.id,
        scaleFactor: display.scaleFactor,
        workArea: toRectangle(display.workArea),
      },
      destinationBackgroundColor: backgroundColor,
      destinationCornerRadius: cornerRadius * zoomFactor,
      destinationFrame,
      destinationPrimaryTextColor: primaryTextColor,
      presentationStyle,
    };
  };
}

if (typeof module !== "undefined") module.exports = { createScreenshotTargetResolver };
