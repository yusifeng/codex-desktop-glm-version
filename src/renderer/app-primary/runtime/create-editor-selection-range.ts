/**
 * Project a an editor selection into a native DOM Range.
 *
 * The generated app-primary hub keeps its compatibility export, while this
 * typed helper documents the renderer boundary for consumers that need a
 * concrete selection range.
 */
export interface EditorSelectionView {
  dom: { ownerDocument?: Document | null };
  domAtPos(position: number): { node: Node; offset: number };
}

export interface EditorSelection {
  from: number;
  to: number;
}

export function createEditorSelectionRange(view: EditorSelectionView, selection: EditorSelection): Range {
  const range = (view.dom.ownerDocument ?? document).createRange();
  const start = view.domAtPos(selection.from);
  const end = view.domAtPos(selection.to);
  range.setStart(start.node, start.offset);
  range.setEnd(end.node, end.offset);
  return range;
}
