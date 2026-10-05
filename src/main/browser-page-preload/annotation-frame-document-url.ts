function resolveAnnotationFrameDocumentUrl(frameWindow: { location: { href: string }; frameElement?: { src?: string } | null }, framePath: readonly unknown[] | null | undefined, currentPageUrl: string, isFrameElement: (value: unknown) => boolean): string | null {
  if (framePath == null || framePath.length === 0) return null;
  const href = frameWindow.location.href;
  if (href !== currentPageUrl) return href;
  const frame = frameWindow.frameElement;
  return isFrameElement(frame) && frame?.src !== `` ? frame?.src ?? href : href;
}
export { resolveAnnotationFrameDocumentUrl };
if (typeof module !== `undefined`) module.exports = { resolveAnnotationFrameDocumentUrl };
