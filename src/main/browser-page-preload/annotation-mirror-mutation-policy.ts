function isAnnotationMirrorMutation(record: any, deps: { isElement: (value: any) => boolean; hasMarker: (value: any) => boolean }): boolean {
  if (record?.type !== `childList`) return false;
  const nodes = [...Array.from(record.addedNodes ?? []), ...Array.from(record.removedNodes ?? [])];
  return nodes.length > 0 && nodes.every((node) => deps.isElement(node) && deps.hasMarker(node));
}
export { isAnnotationMirrorMutation };
if (typeof module !== `undefined`) module.exports = { isAnnotationMirrorMutation };
