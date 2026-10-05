/** Locate a serialized selection marker after inserting a marker node. */
export interface MarkerDocument {
  type: { schema: { text(value: string): unknown } };
  replace(position: number, end: number, node: unknown): MarkerDocument;
}

export interface MarkdownSerializer {
  serialize(document: MarkerDocument): string;
}

export type ResolveMarkerPosition = (document: MarkerDocument, position: number, direction: number) => number | null;

export function insertSelectionMarker(
  document: MarkerDocument,
  serializer: MarkdownSerializer,
  marker: string,
  position: number,
  direction: number,
  resolvePosition: ResolveMarkerPosition,
): number {
  const resolved = resolvePosition(document, position, direction);
  if (resolved == null) throw new Error("Unable to place selection marker.");
  const markerNode = { type: "text", value: document.type.schema.text(marker) };
  const serialized = serializer.serialize(document.replace(resolved, resolved, markerNode));
  const offset = serialized.indexOf(marker);
  if (offset === -1) throw new Error("Failed to locate selection marker in markdown.");
  return offset;
}
