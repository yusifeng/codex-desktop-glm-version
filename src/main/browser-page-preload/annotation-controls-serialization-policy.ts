function serializeAnnotationControlsPayload(value: unknown, maxBytes: number): string {
  if (typeof value !== `object` || !value) throw new TypeError(`Invalid annotation controls`);
  const serialized = JSON.stringify({ controls: (value as any).controls, controlsHeading: (value as any).controlsHeading, controlsMode: (value as any).controlsMode }, (_key, item) => {
    if (typeof item === `function` || typeof item === `symbol` || typeof item === `bigint`) throw new TypeError(`Annotation controls must contain only data`);
    return item;
  });
  if (new TextEncoder().encode(serialized).byteLength > maxBytes) throw new RangeError(`Annotation controls exceed the maximum size`);
  return serialized;
}
export { serializeAnnotationControlsPayload };
if (typeof module !== `undefined`) module.exports = { serializeAnnotationControlsPayload };
