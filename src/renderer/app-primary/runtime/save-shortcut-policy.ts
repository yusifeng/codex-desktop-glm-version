interface SaveKeyboardEvent {
  defaultPrevented: boolean;
  nativeEvent: { key: string; ctrlKey: boolean; metaKey: boolean; altKey: boolean; shiftKey: boolean };
  target: EventTarget | null;
  currentTarget: { contains(target: Node | null): boolean };
  repeat: boolean;
  preventDefault(): void;
  stopPropagation(): void;
}

/** Handle Cmd/Ctrl+S only when the key event belongs to the current editor surface. */
export function handleCmdOrCtrlSave(event: SaveKeyboardEvent, onSave: () => void): void {
  const nativeEvent = event.nativeEvent;
  const isApplePlatform = /Mac|iPhone|iPad|iPod/u.test(globalThis.navigator?.platform ?? "");
  const matchesShortcut = nativeEvent.key.toLowerCase() === "s" &&
    nativeEvent.ctrlKey === !isApplePlatform &&
    nativeEvent.metaKey === isApplePlatform &&
    !nativeEvent.altKey &&
    !nativeEvent.shiftKey;
  if (
    !event.defaultPrevented &&
    matchesShortcut &&
    event.target instanceof Node &&
    event.currentTarget.contains(event.target)
  ) {
    event.preventDefault();
    event.stopPropagation();
    if (!event.repeat) onSave();
  }
}

