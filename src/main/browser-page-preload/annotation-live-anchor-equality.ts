function sameFramePath(left: any[], right: any[]): boolean { return left.length === right.length && left.every((value, index) => value === right[index]); }

function areAnnotationLiveAnchorsEqual(left: any, right: any): boolean {
  if (left.anchor.kind === `element` && right.anchor.kind === `element` && left.liveElement?.isConnected && right.liveElement?.isConnected) return left.liveElement === right.liveElement;
  if (left.anchor.kind !== right.anchor.kind) return false;
  if (left.anchor.kind === `virtual`) return left.anchor.pageUrl === right.anchor.pageUrl && left.anchor.surfaceId === right.anchor.surfaceId && left.anchor.targetId === right.anchor.targetId;
  if (left.anchor.pageUrl !== right.anchor.pageUrl || left.anchor.frameUrl !== right.anchor.frameUrl || left.anchor.framePath.length !== right.anchor.framePath.length || !sameFramePath(left.anchor.framePath, right.anchor.framePath)) return false;
  if (left.anchor.kind === `element`) return left.anchor.selector === right.anchor.selector && left.anchor.elementPath === right.anchor.elementPath;
  return left.anchor.rect.x === right.anchor.rect.x && left.anchor.rect.y === right.anchor.rect.y && left.anchor.rect.width === right.anchor.rect.width && left.anchor.rect.height === right.anchor.rect.height;
}

export { areAnnotationLiveAnchorsEqual };
if (typeof module !== `undefined`) module.exports = { areAnnotationLiveAnchorsEqual };
